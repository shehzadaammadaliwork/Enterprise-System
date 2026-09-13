import { HttpStatus, Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { ApiKey } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppException } from '../../common/filters/app-exception';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';

const KEY_PREFIX = 'ent_live_';
const PREFIX_DISPLAY_LENGTH = 8; // hex chars of the random portion shown in the list UI

function hashKey(plaintext: string): string {
  return createHash('sha256').update(plaintext).digest('hex');
}

/// keyHash is never returned from any API response — it's not directly
/// usable to authenticate (you'd need the plaintext to reproduce it), but
/// there's no reason to expose it either. Listed explicitly (not a
/// destructure-and-discard) so a future field added to ApiKey doesn't leak
/// by default.
function toPublicKey(key: ApiKey) {
  return {
    id: key.id,
    label: key.label,
    keyPrefix: key.keyPrefix,
    createdByUserId: key.createdByUserId,
    lastUsedAt: key.lastUsedAt,
    expiresAt: key.expiresAt,
    revokedAt: key.revokedAt,
    createdAt: key.createdAt,
  };
}

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  listKeys() {
    return this.prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        label: true,
        keyPrefix: true,
        createdByUserId: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  /// Returns the plaintext key exactly once, alongside the persisted row —
  /// the caller must show it to the user immediately; it can never be
  /// retrieved again (only the sha256 hash is stored).
  async createKey(dto: CreateApiKeyDto, createdByUserId: string) {
    const randomPart = randomBytes(32).toString('hex');
    const plaintextKey = `${KEY_PREFIX}${randomPart}`;
    const keyPrefix = `${KEY_PREFIX}${randomPart.slice(0, PREFIX_DISPLAY_LENGTH)}`;

    const record = await this.prisma.apiKey.create({
      data: {
        label: dto.label,
        keyPrefix,
        keyHash: hashKey(plaintextKey),
        createdByUserId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
    });
    return { ...toPublicKey(record), plaintextKey };
  }

  async revokeKey(id: string) {
    const key = await this.getKeyOrThrow(id);
    if (key.revokedAt) return toPublicKey(key);
    const revoked = await this.prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
    return toPublicKey(revoked);
  }

  /// Looked up by ApiKeyGuard on every API-key-authenticated request —
  /// rejects a missing/revoked/expired key; touches lastUsedAt otherwise.
  async validateKey(plaintextKey: string) {
    const key = await this.prisma.apiKey.findUnique({
      where: { keyHash: hashKey(plaintextKey) },
    });
    if (
      !key ||
      key.revokedAt ||
      (key.expiresAt && key.expiresAt < new Date())
    ) {
      return null;
    }
    void this.prisma.apiKey
      .update({ where: { id: key.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {
        // Best-effort — never fail the request over a lastUsedAt write.
      });
    return key;
  }

  private async getKeyOrThrow(id: string) {
    const key = await this.prisma.apiKey.findUnique({ where: { id } });
    if (!key)
      throw new AppException(
        'API_KEY_NOT_FOUND',
        'API key not found.',
        HttpStatus.NOT_FOUND,
      );
    return key;
  }
}
