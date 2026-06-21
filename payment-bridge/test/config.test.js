import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('payment bridge config', () => {
  const baseEnv = {
    DATABASE_URL: 'mysql://user:pass@mysql:3306/new_api',
    NEW_API_BASE_URL: 'http://new-api:3000',
    NEW_API_ADMIN_ACCESS_TOKEN: 'admin-token-123456',
    NEW_API_ADMIN_USER_ID: '1',
    NOWPAYMENTS_API_KEY: 'nowpayments-key-123456',
    NOWPAYMENTS_IPN_SECRET: 'nowpayments-ipn-123456',
    PAYMENT_PUBLIC_BASE_URL: 'https://api.example.com'
  };

  it('defaults to recharge amounts that stay above NOWPayments USDT-TRC20 minimum', () => {
    const config = loadConfig(baseEnv);

    expect(config.allowedAmounts).toEqual([11, 25, 50, 100]);
  });
});
