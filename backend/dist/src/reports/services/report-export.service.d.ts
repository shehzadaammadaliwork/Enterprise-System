export interface ReportTable {
    title: string;
    columns: string[];
    rows: (string | number)[][];
}
export interface ReportDocument {
    title: string;
    subtitle?: string;
    summary?: {
        label: string;
        value: string;
    }[];
    tables: ReportTable[];
}
export declare class ReportExportService {
    generatePdf(doc: ReportDocument): Promise<Buffer>;
    private renderPdfTable;
    generateExcel(doc: ReportDocument): Promise<Buffer>;
}
