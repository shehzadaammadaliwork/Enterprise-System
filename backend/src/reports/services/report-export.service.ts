import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

export interface ReportTable {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface ReportDocument {
  title: string;
  subtitle?: string;
  summary?: { label: string; value: string }[];
  tables: ReportTable[];
}

/// Renders the one shared ReportDocument shape (title + summary stats + any
/// number of tables) to either a PDF or an .xlsx buffer. Every Module 17
/// report (sales performance, HR, finance) builds this same shape and reuses
/// this service rather than each hand-rolling its own pdfkit/exceljs layout.
@Injectable()
export class ReportExportService {
  async generatePdf(doc: ReportDocument): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const pdf = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];
      pdf.on('data', (chunk: Buffer) => chunks.push(chunk));
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

  private renderPdfTable(pdf: PDFKit.PDFDocument, table: ReportTable): void {
    pdf.fontSize(13).text(table.title);
    pdf.moveDown(0.3);

    const startX = pdf.page.margins.left;
    const usableWidth =
      pdf.page.width - pdf.page.margins.left - pdf.page.margins.right;
    const colWidth = usableWidth / table.columns.length;

    const drawRow = (cells: (string | number)[], bold: boolean) => {
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
    for (const row of table.rows) drawRow(row, false);
  }

  async generateExcel(doc: ReportDocument): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
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
      // Sheet names are capped at 31 characters by the xlsx format itself.
      const sheet = workbook.addWorksheet(table.title.slice(0, 31));
      sheet.columns = table.columns.map((col) => ({ header: col, width: 22 }));
      sheet.addRows(table.rows);
      sheet.getRow(1).font = { bold: true };
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
