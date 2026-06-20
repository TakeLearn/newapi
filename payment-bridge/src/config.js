import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().min(1),
  NEW_API_BASE_URL: z.string().url(),
  NEW_API_ADMIN_ACCESS_TOKEN: z.string().min(16),
  NEW_API_QUOTA_PER_USD: z.coerce.number().int().positive().default(500000),
  NOWPAYMENTS_API_KEY: z.string().min(16),
  NOWPAYMENTS_IPN_SECRET: z.string().min(16),
  NOWPAYMENTS_API_BASE: z.string().url().default('https://api.nowpayments.io/v1'),
  PAYMENT_PUBLIC_BASE_URL: z.string().url(),
  RECHARGE_ALLOWED_AMOUNTS: z.string().default('10,25,50,100'),
  RECHARGE_CURRENCY: z.string().default('USDTTRC20'),
  RECHARGE_CREDIT_MULTIPLIER: z.coerce.number().positive().default(1)
});

export function loadConfig(env = process.env) {
  const parsed = envSchema.parse(env);
  const allowedAmounts = parsed.RECHARGE_ALLOWED_AMOUNTS
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value > 0);

  if (allowedAmounts.length === 0) {
    throw new Error('RECHARGE_ALLOWED_AMOUNTS must contain at least one positive integer');
  }

  return {
    port: parsed.PORT,
    databaseUrl: parsed.DATABASE_URL,
    newApiBaseUrl: parsed.NEW_API_BASE_URL.replace(/\/$/, ''),
    newApiAdminAccessToken: parsed.NEW_API_ADMIN_ACCESS_TOKEN,
    newApiQuotaPerUsd: parsed.NEW_API_QUOTA_PER_USD,
    nowpaymentsApiKey: parsed.NOWPAYMENTS_API_KEY,
    nowpaymentsIpnSecret: parsed.NOWPAYMENTS_IPN_SECRET,
    nowpaymentsApiBase: parsed.NOWPAYMENTS_API_BASE.replace(/\/$/, ''),
    paymentPublicBaseUrl: parsed.PAYMENT_PUBLIC_BASE_URL.replace(/\/$/, ''),
    allowedAmounts,
    rechargeCurrency: parsed.RECHARGE_CURRENCY,
    rechargeCreditMultiplier: parsed.RECHARGE_CREDIT_MULTIPLIER
  };
}
