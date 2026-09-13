import { CanActivate, ExecutionContext } from '@nestjs/common';
import { MaintenanceModeService } from '../services/maintenance-mode.service';
export declare class MaintenanceModeGuard implements CanActivate {
    private readonly maintenanceModeService;
    constructor(maintenanceModeService: MaintenanceModeService);
    canActivate(context: ExecutionContext): boolean;
}
