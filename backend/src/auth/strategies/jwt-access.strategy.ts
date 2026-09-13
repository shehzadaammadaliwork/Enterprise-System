import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../common/config/configuration';
import { AccessTokenPayload } from '../types/jwt-payload.interface';

/// Registered under the default 'jwt' passport strategy name, used by
/// JwtAuthGuard (AuthGuard('jwt')) which is installed globally.
@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService<AppConfig, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt', { infer: true }).accessSecret,
    });
  }

  validate(payload: AccessTokenPayload) {
    return { id: payload.sub, email: payload.email };
  }
}
