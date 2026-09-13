import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/// Admin/HR company-wide announcement (spec: notifications system covers
/// more than 1:1 event-triggered pushes) — gated on notifications:CREATE,
/// the one endpoint in this module that isn't purely self-service.
export class BroadcastNotificationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message!: string;
}
