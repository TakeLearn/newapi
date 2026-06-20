import express from 'express';

export function createServer() {
  const app = express();

  app.get('/health', (_req, res) => {
    res.json({ success: true, service: 'payment-bridge' });
  });

  return app;
}
