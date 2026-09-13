import { Global, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppConfig } from '../config/configuration';
import { RedisService } from './redis.service';

/// Shared BullMQ + Redis wiring. Feature modules register their own queues
/// with `BullModule.registerQueue({ name: '<queue-name>' })` and inject
/// `RedisService` if they need generic caching rather than a job queue.
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const redis = configService.get('redis', { infer: true });
        return {
          connection: {
            host: redis.host,
            port: redis.port,
          },
        };
      },
    }),
  ],
  providers: [RedisService],
  exports: [BullModule, RedisService],
})
export class QueueModule {}
