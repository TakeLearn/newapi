import { afterEach, describe, expect, it, vi } from 'vitest';
import { addUserQuota } from '../src/newApiClient.js';

describe('New API credit client', () => {
  const config = {
    newApiBaseUrl: 'https://new-api.example.com',
    newApiAdminAccessToken: 'admin-token-123456'
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends an add_quota user management request', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { id: 123 } })
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(addUserQuota({ config, userId: 123, quota: 5000000 })).resolves.toEqual({
      success: true,
      data: { id: 123 }
    });

    expect(fetchMock).toHaveBeenCalledWith('https://new-api.example.com/api/user/manage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer admin-token-123456'
      },
      body: JSON.stringify({
        id: 123,
        action: 'add_quota',
        mode: 'add',
        value: 5000000
      })
    });
  });

  it('throws when New API rejects the quota add', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({ success: false, message: 'forbidden' })
      })
    );

    await expect(addUserQuota({ config, userId: 123, quota: 5000000 })).rejects.toThrow(
      'New API quota add failed: 403 forbidden'
    );
  });

  it('normalizes a trailing slash base URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true })
    });
    vi.stubGlobal('fetch', fetchMock);

    await addUserQuota({
      config: { ...config, newApiBaseUrl: 'https://new-api.example.com/' },
      userId: 123,
      quota: 5000000
    });

    expect(fetchMock.mock.calls[0][0]).toBe('https://new-api.example.com/api/user/manage');
  });

  it('sanitizes upstream error payloads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: false,
          message: 'bad token',
          authorization: 'Bearer secret-token',
          request: { api_key: 'secret' }
        })
      })
    );

    await expect(addUserQuota({ config, userId: 123, quota: 5000000 })).rejects.toThrow(
      'New API quota add failed: 200 bad token'
    );
  });

  it('uses a generic message for invalid JSON responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 502,
        json: async () => {
          throw new Error('invalid json');
        }
      })
    );

    await expect(addUserQuota({ config, userId: 123, quota: 5000000 })).rejects.toThrow(
      'New API quota add failed: 502 upstream_error'
    );
  });
});
