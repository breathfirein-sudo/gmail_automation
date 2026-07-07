import { google, gmail_v1 } from 'googleapis';
import { getEnv } from '../config/env';
import { logger } from '../config/logger';
import { prisma } from '../lib/prisma';

export interface GmailMessage {
  id: string;
  historyId: string;
  senderEmail: string;
  subject: string;
  body: string;
  receivedAt: Date;
}

export class GmailService {
  private oauth2Client;

  constructor() {
    const env = getEnv();
    this.oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_GMAIL_CLIENT_ID,
      env.GOOGLE_GMAIL_CLIENT_SECRET,
      env.GOOGLE_GMAIL_REDIRECT_URI,
    );
    this.oauth2Client.setCredentials({ refresh_token: env.GOOGLE_GMAIL_REFRESH_TOKEN });
  }

  private getGmailClient(): gmail_v1.Gmail {
    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  async fetchMessagesSinceHistory(historyId: string): Promise<GmailMessage[]> {
    const gmail = this.getGmailClient();
    const messages: GmailMessage[] = [];

    try {
      const historyRes = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: historyId,
        historyTypes: ['messageAdded'],
        labelId: 'INBOX',
      });

      for (const item of historyRes.data.history ?? []) {
        for (const added of item.messagesAdded ?? []) {
          const id = added.message?.id;
          if (!id) continue;
          try {
            const msg = await this.fetchMessage(id);
            if (msg) messages.push(msg);
          } catch (err) {
            logger.warn(`Failed to fetch message ${id}:`, err);
          }
        }
      }
    } catch (err: unknown) {
      if ((err as { code?: number }).code === 404) {
        logger.warn('historyId expired, falling back to recent messages');
        try {
          const currentLatest = await this.getLatestHistoryId();
          await prisma.gmailPollingState.updateMany({
            data: { historyId: currentLatest, lastPolledAt: new Date() }
          });
          logger.info(`Synchronized Gmail historyId to latest: ${currentLatest}`);
        } catch (syncErr) {
          logger.error('Failed to synchronize historyId:', syncErr);
        }
        return this.fetchRecentMessages(20);
      }
      throw err;
    }

    logger.info(`Fetched ${messages.length} new Gmail messages`);
    return messages;
  }

  async fetchMessage(messageId: string): Promise<GmailMessage | null> {
    const gmail = this.getGmailClient();
    const res = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' });
    const message = res.data;
    if (!message.payload) return null;

    const headers = message.payload.headers ?? [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';

    return {
      id: messageId,
      historyId: message.historyId ?? '0',
      senderEmail: this.extractEmail(getHeader('From')),
      subject: getHeader('Subject'),
      body: this.extractBody(message.payload),
      receivedAt: new Date(parseInt(message.internalDate ?? '0', 10)),
    };
  }

  async fetchRecentMessages(maxResults = 10): Promise<GmailMessage[]> {
    const gmail = this.getGmailClient();
    const listRes = await gmail.users.messages.list({ userId: 'me', labelIds: ['INBOX'], maxResults });
    const ids = (listRes.data.messages ?? []).map((m) => m.id!).filter(Boolean);
    const messages: GmailMessage[] = [];
    for (const id of ids) {
      const msg = await this.fetchMessage(id);
      if (msg) messages.push(msg);
    }
    return messages;
  }

  async getLatestHistoryId(): Promise<string> {
    const gmail = this.getGmailClient();
    const profile = await gmail.users.getProfile({ userId: 'me' });
    return profile.data.historyId ?? '1';
  }

  private extractEmail(fromHeader: string): string {
    const match = fromHeader.match(/<(.+?)>/) ?? fromHeader.match(/([^\s]+@[^\s]+)/);
    return (match ? match[1] : fromHeader).toLowerCase();
  }

  private extractBody(payload: gmail_v1.Schema$MessagePart): string {
    if (payload.mimeType === 'text/plain' && payload.body?.data)
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    if (payload.parts) {
      for (const part of payload.parts) {
        const text = this.extractBody(part);
        if (text) return text;
      }
    }
    if (payload.body?.data) return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    return '';
  }
}
