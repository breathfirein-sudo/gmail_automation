import { google, sheets_v4 } from 'googleapis';
import { getEnv } from '../config/env';
import { prisma } from '../lib/prisma';
import { logger } from '../config/logger';

export class SheetsSyncService {
  private auth;
  private readonly HEADERS = [
    'ID', 'UTR', 'Amount', 'Currency', 'Type', 'Bank',
    'Payer Name', 'Payer UPI', 'Status', 'Received At', 'Synced At',
  ];

  constructor() {
    const env = getEnv();
    this.auth = new google.auth.JWT({
      email: env.GOOGLE_SHEETS_CLIENT_EMAIL,
      key: env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  private getSheets(): sheets_v4.Sheets {
    return google.sheets({ version: 'v4', auth: this.auth });
  }

  async syncTransaction(transactionId: string): Promise<void> {
    const env = getEnv();
    const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const transaction = await prisma.bankTransaction.findUnique({ where: { id: transactionId } });
    if (!transaction) { logger.warn(`Sheets sync: transaction ${transactionId} not found`); return; }
    if (transaction.sheetsSynced) { logger.debug(`Already synced: ${transaction.utr}`); return; }

    const sheets = this.getSheets();
    await this.ensureHeaders(sheets, spreadsheetId);

    const row = [
      transaction.id, transaction.utr, transaction.amount.toString(),
      transaction.currency, transaction.transactionType, transaction.bankName,
      transaction.payerName ?? '', transaction.payerUpiId ?? '',
      transaction.status, transaction.receivedAt.toISOString(), new Date().toISOString(),
    ];

    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Transactions!A:K',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    const rowMatch = appendRes.data.updates?.updatedRange?.match(/(\d+)$/);
    const rowIndex = rowMatch ? parseInt(rowMatch[1]) : undefined;

    await prisma.bankTransaction.update({
      where: { id: transactionId },
      data: { sheetsSynced: true, sheetsSyncedAt: new Date(), sheetsRowIndex: rowIndex },
    });

    logger.info(`Synced ${transaction.utr} to Sheets (row ${rowIndex})`);
  }

  private async ensureHeaders(sheets: sheets_v4.Sheets, spreadsheetId: string) {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range: 'Transactions!A1:K1' });
    const firstRow = res.data.values?.[0];
    if (!firstRow || firstRow.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Transactions!A1:K1',
        valueInputOption: 'RAW',
        requestBody: { values: [this.HEADERS] },
      });
      logger.info('Sheets header row created');
    }
  }
}
