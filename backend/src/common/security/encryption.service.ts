import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto';
import { AppConfig } from '../config/configuration';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;

/// Field-level encryption for sensitive columns (salary, bank details, TOTP
/// secrets, etc). Ciphertext is stored as `iv:authTag:cipher`, all base64.
/// Any 32-byte key material works — the configured key is SHA-256 hashed to
/// guarantee the correct length regardless of how the env var was generated.
@Injectable()
export class FieldEncryptionService {
  private readonly key: Buffer;

  constructor(configService: ConfigService<AppConfig, true>) {
    const rawKey = configService.get('encryption', { infer: true }).fieldKey;
    this.key = createHash('sha256').update(rawKey).digest();
  }

  encrypt(plainText: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return [
      iv.toString('base64'),
      authTag.toString('base64'),
      encrypted.toString('base64'),
    ].join(':');
  }

  decrypt(cipherText: string): string {
    const [ivB64, authTagB64, dataB64] = cipherText.split(':');
    if (!ivB64 || !authTagB64 || !dataB64) {
      throw new Error('Malformed ciphertext');
    }
    const decipher = createDecipheriv(
      ALGORITHM,
      this.key,
      Buffer.from(ivB64, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataB64, 'base64')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }
}
