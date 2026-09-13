import { IsIn } from 'class-validator';
import { PermissionOverrideState } from '@prisma/client';

export class SetEmployeeOverrideDto {
  @IsIn([PermissionOverrideState.GRANTED, PermissionOverrideState.DENIED])
  state!: PermissionOverrideState;
}
