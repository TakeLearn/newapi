function buildNewApiUrl(config, path) {
  const baseUrl = config.newApiBaseUrl.endsWith('/')
    ? config.newApiBaseUrl
    : `${config.newApiBaseUrl}/`;
  return new URL(path.replace(/^\//, ''), baseUrl).toString();
}

function safeErrorMessage(payload) {
  if (payload && typeof payload.message === 'string' && payload.message.trim() !== '') {
    return payload.message.trim();
  }

  if (payload && typeof payload.error === 'string' && payload.error.trim() !== '') {
    return payload.error.trim();
  }

  return 'upstream_error';
}

export async function addUserQuota({ config, userId, quota }) {
  const response = await fetch(buildNewApiUrl(config, '/api/user/manage'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: config.newApiAdminAccessToken,
      'New-Api-User': String(config.newApiAdminUserId)
    },
    body: JSON.stringify({
      id: userId,
      action: 'add_quota',
      mode: 'add',
      value: quota
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok || payload.success !== true) {
    throw new Error(`New API quota add failed: ${response.status} ${safeErrorMessage(payload)}`);
  }

  return payload;
}
