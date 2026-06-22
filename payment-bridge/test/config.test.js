import { describe, expect, it } from 'vitest';
import { loadConfig } from '../src/config.js';

describe('payment bridge config', () => {
  const baseEnv = {
    DATABASE_URL: 'mysql://user:pass@mysql:3306/new_api',
    NEW_API_BASE_URL: 'http://new-api:3000',
    NEW_API_ADMIN_ACCESS_TOKEN: 'admin-token-123456',
    NEW_API_ADMIN_USER_ID: '1',
    EPUSDT_API_BASE: 'https://epusdt.example.com',
    EPUSDT_PID: '1000',
    EPUSDT_SECRET_KEY: 'epusdt-secret-123456',
    PAYMENT_PUBLIC_BASE_URL: 'https://api.example.com'
  };

  it('defaults to low-value Epusdt recharge amounts', () => {
    const config = loadConfig(baseEnv);

    expect(config.allowedAmounts).toEqual([1, 5, 15, 30, 50, 100]);
  });

  it('defaults to USDT-TRC20 through Epusdt', () => {
    const config = loadConfig(baseEnv);

    expect(config.paymentProvider).toBe('epusdt');
    expect(config.rechargeCurrency).toBe('USDTTRC20');
    expect(config.epusdtApiBase).toBe('https://epusdt.example.com');
    expect(config.epusdtPid).toBe('1000');
    expect(config.epusdtSecretKey).toBe('epusdt-secret-123456');
  });
});
