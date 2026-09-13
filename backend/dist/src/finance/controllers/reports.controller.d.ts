import { ReportsService } from '../services/reports.service';
import { FinanceReportQueryDto } from '../dto/finance-report-query.dto';
export declare class ReportsController {
    private readonly reportsService;
    constructor(reportsService: ReportsService);
    profitAndLoss(query: FinanceReportQueryDto): Promise<{
        dateFrom: string;
        dateTo: string;
        income: number;
        expenses: number;
        netProfit: number;
        byCategory: {
            type: import("@prisma/client").$Enums.TransactionType;
            category: string;
            total: number;
        }[];
    }>;
    cashFlow(query: FinanceReportQueryDto): Promise<{
        dateFrom: string;
        dateTo: string;
        openingBalance: number;
        totalInflow: number;
        totalOutflow: number;
        closingBalance: number;
    }>;
}
