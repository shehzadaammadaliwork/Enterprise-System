"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const common_1 = require("@nestjs/common");
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get((config_1.ConfigService));
    app.use((0, helmet_1.default)());
    app.use((0, cookie_parser_1.default)());
    app.enableCors({
        origin: configService.get('frontendUrl', { infer: true }),
        credentials: true,
        exposedHeaders: ['x-csrf-token'],
    });
    app.setGlobalPrefix(configService.get('apiPrefix', { infer: true }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const port = configService.get('port', { infer: true });
    await app.listen(port);
    console.log(`Enterprise System API listening on http://localhost:${port}/${configService.get('apiPrefix', { infer: true })}`);
}
bootstrap();
//# sourceMappingURL=main.js.map