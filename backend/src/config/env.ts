import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  PORT: z.coerce.number().default(4000),
  WEB_ORIGIN: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().min(32),

  DATABASE_URL: z.string(),

  GOOGLE_GMAIL_CLIENT_ID: z.string().min(1),
  GOOGLE_GMAIL_CLIENT_SECRET: z.string().min(1),
  GOOGLE_GMAIL_REDIRECT_URI: z.string().url(),
  GOOGLE_GMAIL_REFRESH_TOKEN: z.string().min(1),

  GOOGLE_SHEETS_CLIENT_EMAIL: z.string().email(),
  GOOGLE_SHEETS_PRIVATE_KEY: z.string().min(1),
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().min(1),

  OPENAI_API_KEY: z.string().default('none'),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),

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
    result.error.issues.forEach((issue) => {
      console.error(`  ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  _env = result.data;
  return _env;
}

export default getEnv;
