import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_ENV: z.enum(['local', 'staging', 'production']).default('local'),

  // API
  API_PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().url().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),

  // Database
  DATABASE_URL: z.string().url(),

  // Gmail
  GOOGLE_GMAIL_CLIENT_ID: z.string(),
  GOOGLE_GMAIL_CLIENT_SECRET: z.string(),
  GOOGLE_GMAIL_REDIRECT_URI: z.string().url(),
  GOOGLE_GMAIL_REFRESH_TOKEN: z.string(),

  // Google Sheets
  GOOGLE_SHEETS_CLIENT_EMAIL: z.string().email(),
  GOOGLE_SHEETS_PRIVATE_KEY: z.string(),
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string(),

  // OpenAI
  OPENAI_API_KEY: z.string(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

  // Security
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (_env) return _env;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }

  _env = result.data;
  return _env;
}

export default getEnv;
