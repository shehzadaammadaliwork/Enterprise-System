import { DashboardService } from '../services/dashboard.service';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    getSummary(user: AuthenticatedUser): Promise<{
        personal: {
            attendanceToday: {
                checkInAt: Date | null;
                checkOutAt: Date | null;
            } | null;
            pendingLeaveRequests: number;
            approvedLeaveDaysThisYear: number;
            upcomingEvents: import("../../calendar/services/calendar-events.service").CalendarEventView[];
            unreadNotificationsCount: number;
        };
        hr: {
            headcount: number;
            presentToday: number;
            pendingLeaveRequests: number;
        } | null;
        sales: {
            revenueThisMonth: number;
            openDealCount: number;
            openPipelineValue: number;
        } | null;
        finance: {
            outstandingInvoicesCount: number;
            outstandingInvoicesTotal: number;
            cashPosition: number;
        } | null;
    }>;
}
