"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportExportService = void 0;
const common_1 = require("@nestjs/common");
const pdfkit_1 = __importDefault(require("pdfkit"));
const exceljs_1 = __importDefault(require("exceljs"));
let ReportExportService = class ReportExportService {
    async generatePdf(doc) {
        return new Promise((resolve, reject) => {
            const pdf = new pdfkit_1.default({ margin: 50, size: 'A4' });
            const chunks = [];
            pdf.on('data', (chunk) => chunks.push(chunk));
            pdf.on('end', () => resolve(Buffer.concat(chunks)));
            pdf.on('error', reject);
            pdf.fontSize(18).fillColor('#000000').text(doc.title);
            if (doc.subtitle) {
                pdf.moveDown(0.3).fontSize(10).fillColor('#666666').text(doc.subtitle);
            }
            pdf.fillColor('#000000').moveDown();
            if (doc.summary?.length) {
                pdf.fontSize(11);
                for (const item of doc.summary) {
                    pdf.text(`${item.label}: ${item.value}`);
                }
                pdf.moveDown();
            }
            for (const table of doc.tables) {
                this.renderPdfTable(pdf, table);
                pdf.moveDown();
            }
            pdf.end();
        });
    }
    renderPdfTable(pdf, table) {
        pdf.fontSize(13).text(table.title);
        pdf.moveDown(0.3);
        const startX = pdf.page.margins.left;
        const usableWidth = pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
        const colWidth = usableWidth / table.columns.length;
        const drawRow = (cells, bold) => {
            if (pdf.y > pdf.page.height - pdf.page.margins.bottom - 30) {
                pdf.addPage();
            }
            const y = pdf.y;
            pdf.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9);
            cells.forEach((cell, i) => {
                pdf.text(String(cell), startX + i * colWidth, y, {
                    width: colWidth - 4,
                });
            });
            pdf.y = Math.max(pdf.y, y + 14);
        };
        if (table.rows.length === 0) {
            pdf.fontSize(9).fillColor('#666666').text('No data for this range.');
            pdf.fillColor('#000000');
            return;
        }
        drawRow(table.columns, true);
        for (const row of table.rows)
            drawRow(row, false);
    }
    async generateExcel(doc) {
        const workbook = new exceljs_1.default.Workbook();
        workbook.creator = 'Enterprise System';
        workbook.created = new Date();
        if (doc.summary?.length) {
            const summarySheet = workbook.addWorksheet('Summary');
            summarySheet.columns = [
                { header: 'Metric', key: 'label', width: 30 },
                { header: 'Value', key: 'value', width: 20 },
            ];
            summarySheet.addRows(doc.summary);
            summarySheet.getRow(1).font = { bold: true };
        }
        for (const table of doc.tables) {
            const sheet = workbook.addWorksheet(table.title.slice(0, 31));
            sheet.columns = table.columns.map((col) => ({ header: col, width: 22 }));
            sheet.addRows(table.rows);
            sheet.getRow(1).font = { bold: true };
        }
        const buffer = await workbook.xlsx.writeBuffer();
        return Buffer.from(buffer);
    }
};
exports.ReportExportService = ReportExportService;
exports.ReportExportService = ReportExportService = __decorate([
    (0, common_1.Injectable)()
], ReportExportService);
//# sourceMappingURL=report-export.service.js.map