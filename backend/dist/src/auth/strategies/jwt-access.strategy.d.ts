import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../common/config/configuration';
import { AccessTokenPayload } from '../types/jwt-payload.interface';
declare const JwtAccessStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtAccessStrategy extends JwtAccessStrategy_base {
    constructor(configService: ConfigService<AppConfig, true>);
    validate(payload: AccessTokenPayload): {
        id: string;
        email: string;
    };
}
export {};
