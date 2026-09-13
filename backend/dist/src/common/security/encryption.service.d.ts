import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
export declare class FieldEncryptionService {
    private readonly key;
    constructor(configService: ConfigService<AppConfig, true>);
    encrypt(plainText: string): string;
    decrypt(cipherText: string): string;
}
