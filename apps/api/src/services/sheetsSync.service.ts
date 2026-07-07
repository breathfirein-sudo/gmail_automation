import { google, sheets_v4 } from 'googleapis';
import { getEnv } from '@payment/config/src/env';
import { prisma } from '@payment/database/src/client';
import { logger } from '../config/logger';

export class SheetsSyncService {
  private auth;
  private readonly HEADER_ROW = [
    'ID', 'UTR', 'Amount', 'Currency', 'Type', 'Bank', 'Payer Name',
    'Payer UPI', 'Status', 'Received At', 'Synced At',
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

  /** Sync a single transaction to Google Sheets (idempotent) */
  async syncTransaction(transactionId: string): Promise<void> {
    const env = getEnv();
    const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;

    const transaction = await prisma.bankTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      logger.warn(`Sheets sync: transaction ${transactionId} not found`);
      return;
    }

    if (transaction.sheetsSynced) {
      logger.debug(`Transaction ${transaction.utr} already synced to Sheets`);
      return;
    }

    const sheets = this.getSheets();

    // Ensure header row exists
    await this.ensureHeaders(sheets, spreadsheetId);

    const row = [
      transaction.id,
      transaction.utr,
      transaction.amount.toString(),
      transaction.currency,
      transaction.transactionType,
      transaction.bankName,
      transaction.payerName ?? '',
      transaction.payerUpiId ?? '',
      transaction.status,
      transaction.receivedAt.toISOString(),
      new Date().toISOString(),
    ];

    const appendResponse = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Transactions!A:K',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [row] },
    });

    const updatedRange = appendResponse.data.updates?.updatedRange ?? '';

    // Parse row index from updated range
    const rowMatch = updatedRange.match(/(\d+)$/);
    const rowIndex = rowMatch ? parseInt(rowMatch[1]) : undefined;

    // Mark as synced in DB
    await prisma.bankTransaction.update({
      where: { id: transactionId },
      data: {
        sheetsSynced: true,
        sheetsSyncedAt: new Date(),
        sheetsRowIndex: rowIndex,
      },
    });

    logger.info(`Synced transaction ${transaction.utr} to Sheets (row ${rowIndex})`);
  }

  private async ensureHeaders(
    sheets: sheets_v4.Sheets,
    spreadsheetId: string,
  ): Promise<void> {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Transactions!A1:K1',
    });

    const firstRow = res.data.values?.[0];
    if (!firstRow || firstRow.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Transactions!A1:K1',
        valueInputOption: 'RAW',
        requestBody: { values: [this.HEADER_ROW] },
      });
      logger.info('Sheets header row created');
    }
  }
}
