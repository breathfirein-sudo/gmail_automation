import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import OpenAI from 'openai';

// Load .env first from backend, then root if not found
const backendEnvPath = path.resolve(__dirname, '../.env');
const backendEnvExamplePath = path.resolve(__dirname, '../.env.example');
const rootEnvPath = path.resolve(__dirname, '../../.env');
const rootEnvExamplePath = path.resolve(__dirname, '../../.env.example');

let envPathUsed = '';

if (fs.existsSync(backendEnvPath)) {
  dotenv.config({ path: backendEnvPath });
  envPathUsed = backendEnvPath;
} else if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
  envPathUsed = rootEnvPath;
} else if (fs.existsSync(backendEnvExamplePath)) {
  dotenv.config({ path: backendEnvExamplePath });
  envPathUsed = backendEnvExamplePath;
} else {
  dotenv.config({ path: rootEnvExamplePath });
  envPathUsed = rootEnvExamplePath;
}

console.log(`\n🔍 Loading environment from: ${envPathUsed}\n`);

interface CheckResult {
  service: string;
  status: 'WORKING' | 'FAILED' | 'MISSING';
  details: string;
}

const results: CheckResult[] = [];

async function checkDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes('replace-with')) {
    results.push({
      service: 'Database (PostgreSQL)',
      status: 'MISSING',
      details: 'DATABASE_URL is not configured.',
    });
    return;
  }

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: url,
      },
    },
  });

  try {
    await prisma.$connect();
    // Test query
    await prisma.$executeRaw`SELECT 1`;
    results.push({
      service: 'Database (PostgreSQL)',
      status: 'WORKING',
      details: 'Successfully connected and executed query.',
    });
  } catch (error: any) {
    results.push({
      service: 'Database (PostgreSQL)',
      status: 'FAILED',
      details: error.message || 'Failed to connect to the database.',
    });
  } finally {
    await prisma.$disconnect();
  }
}

async function checkGmailAPI() {
  const clientId = process.env.GOOGLE_GMAIL_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_GMAIL_REFRESH_TOKEN;
  const redirectUri = process.env.GOOGLE_GMAIL_REDIRECT_URI || 'http://localhost:4000/api/auth/google/callback';

  const missing = [];
  if (!clientId) missing.push('GOOGLE_GMAIL_CLIENT_ID');
  if (!clientSecret) missing.push('GOOGLE_GMAIL_CLIENT_SECRET');
  if (!refreshToken) missing.push('GOOGLE_GMAIL_REFRESH_TOKEN');

  if (missing.length > 0) {
    results.push({
      service: 'Gmail API',
      status: 'MISSING',
      details: `Missing variables: ${missing.join(', ')}`,
    });
    return;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    const profile = await gmail.users.getProfile({ userId: 'me' });
    results.push({
      service: 'Gmail API',
      status: 'WORKING',
      details: `Successfully connected to mailbox: ${profile.data.emailAddress}`,
    });
  } catch (error: any) {
    results.push({
      service: 'Gmail API',
      status: 'FAILED',
      details: error.message || 'OAuth authentication or API request failed.',
    });
  }
}

async function checkGoogleSheetsAPI() {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

  const missing = [];
  if (!clientEmail) missing.push('GOOGLE_SHEETS_CLIENT_EMAIL');
  if (!privateKey) missing.push('GOOGLE_SHEETS_PRIVATE_KEY');
  if (!spreadsheetId) missing.push('GOOGLE_SHEETS_SPREADSHEET_ID');

  if (missing.length > 0) {
    results.push({
      service: 'Google Sheets API',
      status: 'MISSING',
      details: `Missing variables: ${missing.join(', ')}`,
    });
    return;
  }

  try {
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey!.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.get({ spreadsheetId });
    
    results.push({
      service: 'Google Sheets API',
      status: 'WORKING',
      details: `Successfully accessed sheet: "${response.data.properties?.title}"`,
    });
  } catch (error: any) {
    results.push({
      service: 'Google Sheets API',
      status: 'FAILED',
      details: error.message || 'Service Account authentication or API request failed.',
    });
  }
}

async function checkOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  let model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if (!apiKey || apiKey === 'none') {
    results.push({
      service: 'AI Parsing Engine',
      status: 'MISSING',
      details: 'AI Parser is disabled (OPENAI_API_KEY set to "none" or empty). Relying solely on local Regex rules.',
    });
    return;
  }

  const isGemini = apiKey.startsWith('AIzaSy') || apiKey.startsWith('AQ.');
  if (isGemini && (!model || model.startsWith('gpt'))) {
    model = 'gemini-1.5-flash';
  }

  try {
    const openai = new OpenAI({
      apiKey,
      ...(isGemini ? { baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' } : {}),
    });

    const response = await openai.chat.completions.create({
      model: model,
      messages: [{ role: 'user', content: 'Ping' }],
      max_tokens: 5,
    });
    
    results.push({
      service: isGemini ? 'Google Gemini API' : 'OpenAI API',
      status: 'WORKING',
      details: `Successfully connected. Response: "${response.choices[0]?.message?.content?.trim()}"`,
    });
  } catch (error: any) {
    results.push({
      service: isGemini ? 'Google Gemini API' : 'OpenAI API',
      status: 'FAILED',
      details: error.message || 'API request failed.',
    });
  }
}

async function run() {
  await checkDatabase();
  await checkGmailAPI();
  await checkGoogleSheetsAPI();
  await checkOpenAI();

  console.log('========================================================================');
  console.log('📋 API DIAGNOSTIC REPORT');
  console.log('========================================================================');
  
  results.forEach(res => {
    let statusSymbol = '🟢';
    if (res.status === 'FAILED') statusSymbol = '🔴';
    if (res.status === 'MISSING') statusSymbol = '🟡';
    
    console.log(`${statusSymbol} [${res.status}] ${res.service}`);
    console.log(`   Details: ${res.details}`);
    console.log('------------------------------------------------------------------------');
  });
}

run();
