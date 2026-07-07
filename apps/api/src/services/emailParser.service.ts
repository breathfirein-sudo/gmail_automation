import OpenAI from 'openai';
import { prisma } from '@payment/database/src/client';
import { getEnv } from '@payment/config/src/env';
import { ParsedTransaction, AI_CONFIDENCE_THRESHOLD } from '@payment/shared';
import { GmailMessage } from './gmail.service';
import { logger } from '../config/logger';

export class EmailParserService {
  private openai: OpenAI;

  constructor() {
    const env = getEnv();
    this.openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  async parse(message: GmailMessage, bankName: string): Promise<ParsedTransaction | null> {
    // ── 1. Try deterministic regex parser first ───────────────────────────
    const regexResult = await this.parseWithRegex(message, bankName);

    if (regexResult && regexResult.confidence >= AI_CONFIDENCE_THRESHOLD) {
      logger.info(`Parsed via REGEX (confidence: ${regexResult.confidence}) — UTR: ${regexResult.utr}`);
      return regexResult;
    }

    // ── 2. Fall back to OpenAI ─────────────────────────────────────────
    logger.info(`Regex confidence too low (${regexResult?.confidence ?? 0}), using AI parser`);
    const aiResult = await this.parseWithAI(message);
    return aiResult;
  }

  private async parseWithRegex(
    message: GmailMessage,
    bankName: string,
  ): Promise<ParsedTransaction | null> {
    const bankConfig = await prisma.bankConfig.findUnique({ where: { bankName } });
    if (!bankConfig?.parserPatterns) return null;

    const patterns = bankConfig.parserPatterns as {
      utr?: string[];
      amount?: string[];
    };

    const text = `${message.subject}\n${message.body}`;

    // Extract UTR
    let utr: string | null = null;
    for (const pattern of patterns.utr ?? []) {
      const match = text.match(new RegExp(pattern, 'i'));
      if (match?.[1]) {
        utr = match[1].replace(/\s/g, '').toUpperCase();
        break;
      }
    }

    // Extract amount
    let amount: number | null = null;
    for (const pattern of patterns.amount ?? []) {
      const match = text.match(new RegExp(pattern, 'i'));
      if (match?.[1]) {
        amount = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }

    if (!utr || !amount) return null;

    // Determine transaction type
    const lowerText = text.toLowerCase();
    const transactionType = lowerText.includes('credit') ? 'CREDIT' : 'DEBIT';

    // Extract payer UPI
    const upiMatch = text.match(/([a-z0-9.\-_]+@[a-z]+)/i);
    const payerUpiId = upiMatch?.[1] ?? null;

    const confidence = utr && amount ? 0.85 : 0.4;

    return {
      utr,
      amount,
      currency: 'INR',
      transactionType,
      payerName: null,
      payerAccount: null,
      payerUpiId,
      beneficiaryAccount: null,
      confidence,
      method: 'REGEX',
    };
  }

  private async parseWithAI(message: GmailMessage): Promise<ParsedTransaction | null> {
    const env = getEnv();

    const prompt = `You are a bank transaction email parser. Extract the following fields from this bank notification email.

Return ONLY valid JSON in this exact format:
{
  "utr": "transaction reference number (12-22 alphanumeric chars)",
  "amount": 1234.56,
  "currency": "INR",
  "transactionType": "CREDIT or DEBIT",
  "payerName": "payer name or null",
  "payerAccount": "payer account number or null",
  "payerUpiId": "payer UPI ID or null",
  "beneficiaryAccount": "beneficiary account or null",
  "confidence": 0.95
}

Email Subject: ${message.subject}
Email Body:
${message.body.substring(0, 3000)}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: env.OPENAI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0,
      });

      const raw = response.choices[0]?.message?.content;
      if (!raw) return null;

      const parsed = JSON.parse(raw);

      if (!parsed.utr || !parsed.amount) {
        logger.warn('AI parser returned incomplete data');
        return null;
      }

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
