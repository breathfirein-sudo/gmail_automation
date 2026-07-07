import OpenAI from 'openai';
import { prisma } from '../lib/prisma';
import { getEnv } from '../config/env';
import { GmailMessage } from './gmail.service';
import { logger } from '../config/logger';

const AI_CONFIDENCE_THRESHOLD = 0.7;

export interface ParsedTransaction {
  utr: string;
  amount: number;
  currency: string;
  transactionType: 'CREDIT' | 'DEBIT';
  payerName: string | null;
  payerAccount: string | null;
  payerUpiId: string | null;
  beneficiaryAccount: string | null;
  confidence: number;
  method: 'REGEX' | 'AI';
}

export class EmailParserService {
  private openai: OpenAI | null = null;

  constructor() {
    const env = getEnv();
    const apiKey = env.OPENAI_API_KEY;

    if (!apiKey || apiKey === 'none') {
      logger.info('AI Parser is disabled (OPENAI_API_KEY is not set). Relying solely on Regex.');
      return;
    }

    const isGemini = apiKey.startsWith('AIzaSy') || apiKey.startsWith('AQ.');
    this.openai = new OpenAI({
      apiKey: apiKey,
      ...(isGemini ? { baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' } : {}),
    });
  }

  async parse(message: GmailMessage, bankName: string): Promise<ParsedTransaction | null> {
    const regexResult = await this.parseWithRegex(message, bankName);

    if (regexResult && regexResult.confidence >= AI_CONFIDENCE_THRESHOLD) {
      logger.info(`REGEX parse success (${regexResult.confidence}) — UTR: ${regexResult.utr}`);
      return regexResult;
    }

    if (!this.openai) {
      logger.debug('Skipping AI parser fallback (AI is disabled)');
      return regexResult; // Return regex result even if confidence is below threshold as fallback
    }

    logger.info(`Regex confidence low (${regexResult?.confidence ?? 0}), using AI parser`);
    return this.parseWithAI(message);
  }

  private async parseWithRegex(message: GmailMessage, bankName: string): Promise<ParsedTransaction | null> {
    const bankConfig = await prisma.bankConfig.findUnique({ where: { bankName } });
    if (!bankConfig?.parserPatterns) return null;

    const patterns = bankConfig.parserPatterns as { utr?: string[]; amount?: string[] };
    
    // Clean text by stripping HTML tags and CSS/script blocks
    const cleanBody = message.body
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ');

    const text = `${message.subject}\n${cleanBody}`;

    let utr: string | null = null;
    for (const p of patterns.utr ?? []) {
      const m = text.match(new RegExp(p, 'i'));
      if (m?.[1]) { utr = m[1].replace(/\s/g, '').toUpperCase(); break; }
    }

    let amount: number | null = null;
    for (const p of patterns.amount ?? []) {
      const m = text.match(new RegExp(p, 'i'));
      if (m?.[1]) { amount = parseFloat(m[1].replace(/,/g, '')); break; }
    }

    if (!utr || !amount) return null;

    const lowerText = text.toLowerCase();
    const transactionType: 'CREDIT' | 'DEBIT' = lowerText.includes('credit') ? 'CREDIT' : 'DEBIT';
    const upiMatch = text.match(/([a-z0-9.\-_]+@[a-z]+)/i);

    // Try to extract payer name
    let payerName: string | null = null;
    const senderMatch = text.match(/Sender\s*:\s*([A-Z0-9\s.,&'-]+?)\s*(?:\(|VPA:|Acc:|\n|\r)/i);
    if (senderMatch?.[1]) {
      payerName = senderMatch[1].trim();
    }
    if (payerName) {
      payerName = payerName.replace(/\s+/g, ' ').trim();
      const upperName = payerName.toUpperCase();
      if (upperName.length < 2 || upperName.length > 50 || upperName.includes('GREETINGS') || upperName.includes('CUSTOMER') || upperName.includes('DEAR')) {
        payerName = null;
      }
    }

    return {
      utr, amount, currency: 'INR', transactionType,
      payerName, payerAccount: null,
      payerUpiId: upiMatch?.[1] ?? null,
      beneficiaryAccount: null,
      confidence: 0.85,
      method: 'REGEX',
    };
  }

  private async parseWithAI(message: GmailMessage): Promise<ParsedTransaction | null> {
    if (!this.openai) return null;
    const env = getEnv();
    const isGemini = env.OPENAI_API_KEY.startsWith('AIzaSy') || env.OPENAI_API_KEY.startsWith('AQ.');
    const model = isGemini && (!env.OPENAI_MODEL || env.OPENAI_MODEL.startsWith('gpt'))
      ? 'gemini-1.5-flash'
      : env.OPENAI_MODEL;

    const prompt = `You are a bank transaction email parser. Extract fields from this bank notification email.

Return ONLY valid JSON:
{
  "utr": "12-22 char alphanumeric ref",
  "amount": 1234.56,
  "currency": "INR",
  "transactionType": "CREDIT or DEBIT",
  "payerName": "string or null",
  "payerAccount": "string or null",
  "payerUpiId": "string or null",
  "beneficiaryAccount": "string or null",
  "confidence": 0.95
}

Subject: ${message.subject}
Body: ${message.body.substring(0, 3000)}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0,
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) return null;

      const parsed = JSON.parse(raw);
      if (!parsed.utr || !parsed.amount) { logger.warn('AI parser returned incomplete data'); return null; }

      return {
        utr: String(parsed.utr).toUpperCase().trim(),
        amount: Number(parsed.amount),
        currency: parsed.currency ?? 'INR',
        transactionType: parsed.transactionType === 'DEBIT' ? 'DEBIT' : 'CREDIT',
        payerName: parsed.payerName ?? null,
        payerAccount: parsed.payerAccount ?? null,
        payerUpiId: parsed.payerUpiId ?? null,
        beneficiaryAccount: parsed.beneficiaryAccount ?? null,
        confidence: Number(parsed.confidence ?? 0.7),
        method: 'AI',
      };
    } catch (err) {
      logger.error('OpenAI parsing failed:', err);
      return null;
    }
  }
}
