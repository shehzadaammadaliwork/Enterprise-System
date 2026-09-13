import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AppConfig } from '../config/configuration';
export declare class RedisService implements OnModuleDestroy {
    private readonly logger;
    readonly client: Redis;
    constructor(configService: ConfigService<AppConfig, true>);
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
    del(...keys: string[]): Promise<void>;
    delByPattern(pattern: string): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
