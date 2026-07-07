import { google, gmail_v1 } from 'googleapis';
import { getEnv } from '@payment/config/src/env';
import { logger } from '../config/logger';

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
    this.oauth2Client.setCredentials({
      refresh_token: env.GOOGLE_GMAIL_REFRESH_TOKEN,
    });
  }

  private getGmailClient(): gmail_v1.Gmail {
    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /** Fetch Inbox messages since a given historyId */
  async fetchMessagesSinceHistory(historyId: string): Promise<GmailMessage[]> {
    const gmail = this.getGmailClient();
    const messages: GmailMessage[] = [];

    try {
      const historyResponse = await gmail.users.history.list({
        userId: 'me',
        startHistoryId: historyId,
        historyTypes: ['messageAdded'],
        labelId: 'INBOX',
      });

      const historyItems = historyResponse.data.history ?? [];

      for (const item of historyItems) {
        for (const addedMessage of item.messagesAdded ?? []) {
          const messageId = addedMessage.message?.id;
          if (!messageId) continue;

          try {
            const msg = await this.fetchMessage(messageId);
            if (msg) messages.push(msg);
          } catch (err) {
            logger.warn(`Failed to fetch message ${messageId}:`, err);
          }
        }
      }

      logger.info(`Fetched ${messages.length} new messages from Gmail`);
    } catch (err: unknown) {
      // If historyId is too old, Gmail returns 404 — reset to fetch recent
      if ((err as { code?: number }).code === 404) {
        logger.warn('Gmail historyId expired, falling back to recent messages');
        return this.fetchRecentMessages(20);
      }
      throw err;
    }

    return messages;
  }

  /** Fetch a single message and decode its body */
  async fetchMessage(messageId: string): Promise<GmailMessage | null> {
    const gmail = this.getGmailClient();
    const res = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    const message = res.data;
    if (!message.payload) return null;

    const headers = message.payload.headers ?? [];
    const getHeader = (name: string) =>
      headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value ?? '';

    const senderEmail = this.extractEmail(getHeader('From'));
    const subject = getHeader('Subject');
    const receivedAt = new Date(parseInt(message.internalDate ?? '0', 10));
    const body = this.extractBody(message.payload);
    const historyId = message.historyId ?? '0';

    return { id: messageId, historyId, senderEmail, subject, body, receivedAt };
  }

  /** Fetch N most recent inbox messages */
  async fetchRecentMessages(maxResults = 10): Promise<GmailMessage[]> {
    const gmail = this.getGmailClient();
    const listRes = await gmail.users.messages.list({
      userId: 'me',
      labelIds: ['INBOX'],
      maxResults,
    });

    const ids = (listRes.data.messages ?? []).map((m) => m.id!).filter(Boolean);
    const messages: GmailMessage[] = [];

    for (const id of ids) {
      const msg = await this.fetchMessage(id);
      if (msg) messages.push(msg);
    }

    return messages;
  }

  /** Get the latest historyId from Gmail */
  async getLatestHistoryId(): Promise<string> {
    const gmail = this.getGmailClient();
    const profile = await gmail.users.getProfile({ userId: 'me' });
    return profile.data.historyId ?? '1';
  }

  private extractEmail(fromHeader: string): string {
    const match = fromHeader.match(/<(.+?)>/) ?? fromHeader.match(/([^\s]+@[^\s]+)/);
    return match ? match[1].toLowerCase() : fromHeader.toLowerCase();
  }

  private extractBody(payload: gmail_v1.Schema$MessagePart): string {
    if (payload.mimeType === 'text/plain' && payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    if (payload.parts) {
      for (const part of payload.parts) {
        const text = this.extractBody(part);
        if (text) return text;
      }
    }

    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    return '';
  }
}
