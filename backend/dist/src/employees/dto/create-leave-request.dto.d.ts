import { LeaveType } from '@prisma/client';
export declare class CreateLeaveRequestDto {
    leaveType: LeaveType;
    startDate: string;
    endDate: string;
    reason?: string;
}
