import express from 'express';
import { z } from 'zod';
import { createEpusdtTransaction, isValidEpusdtSignature } from './epusdt.js';
import { addUserQuota } from './newApiClient.js';
import {
  attachInvoice,
  claimCreditOnce,
  createPendingOrder,
  findOrderForIpn,
  isFinalPaidStatus,
  markCredited,
  markIpnObserved,
  releaseCreditClaim
} from './orders.js';

const createInvoiceSchema = z.object({
  user_id: z.coerce.number().int().positive(),
  amount: z.coerce.number().int().positive()
});

function normalizeEpusdtCallback(body) {
  const network = String(body.block_network || body.network || '').toUpperCase();
  const token = String(body.token || body.currency || 'USDT').toUpperCase();
  const tronNetworks = new Set(['TRC20', 'TRON']);
  const payCurrency = token === 'USDT' && tronNetworks.has(network) ? 'USDTTRC20' : `${token}${network}`;

  return {
    order_id: body.order_id,
    payment_id: body.trade_id || body.transaction_id || body.txid || null,
    payment_status: body.status,
    pay_currency: payCurrency,
    actually_paid: body.amount,
    raw: body
  };
}

export function createServer({ config, pool }) {
  const app = express();

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ success: true, service: 'payment-bridge' });
  });

  app.post('/payment/create', async (req, res) => {
    try {
      const input = createInvoiceSchema.parse(req.body);
      const order = await createPendingOrder(pool, config, {
        userId: input.user_id,
        amountUsd: input.amount
      });
      const invoice = await createEpusdtTransaction({ config, order });
      await attachInvoice(pool, order.id, invoice);

      res.json({
        success: true,
        data: {
          order_id: order.id,
          amount: order.amountUsd,
          currency: order.currency,
          invoice_url: invoice.invoice_url,
          payment_provider: 'epusdt',
          provider_invoice_id: invoice.id || invoice.invoice_id || null
        }
      });
    } catch (error) {
      res.status(400).json({ success: false, message: 'payment creation failed' });
    }
  });

  app.post('/payment/ipn', async (req, res) => {
    try {
      const signature = req.body.signature;

      if (!isValidEpusdtSignature(req.body, signature, config.epusdtSecretKey)) {
        res.status(401).json({ success: false, message: 'invalid signature' });
        return;
      }

      const ipn = normalizeEpusdtCallback(req.body);
      const order = await findOrderForIpn(pool, ipn);
      if (!order) {
        res.status(404).json({ success: false, message: 'order not found' });
        return;
      }

      await markIpnObserved(pool, order.id, ipn);

      if (!isFinalPaidStatus(ipn.payment_status)) {
        res.json({ success: true, data: { credited: false, status: ipn.payment_status } });
        return;
      }

      const paidCurrency = String(ipn.pay_currency || '').toUpperCase();
      const expectedCurrency = String(order.currency || config.rechargeCurrency).toUpperCase();
      if (paidCurrency !== expectedCurrency) {
        res.status(400).json({ success: false, message: 'currency mismatch' });
        return;
      }

      const actuallyPaid = Number(ipn.actually_paid || 0);
      if (!Number.isFinite(actuallyPaid)) {
        res.status(400).json({ success: false, message: 'invalid paid amount' });
        return;
      }

      if (actuallyPaid + 1e-8 < Number(order.amount_usd)) {
        res.status(400).json({ success: false, message: 'underpaid order' });
        return;
      }

      const shouldCredit = await claimCreditOnce(pool, order.id);
      if (shouldCredit) {
        try {
          await addUserQuota({
            config,
            userId: Number(order.user_id),
            quota: Number(order.quota_to_add)
          });
        } catch (error) {
          await releaseCreditClaim(pool, order.id);
          throw error;
        }
        const markedCredited = await markCredited(pool, order.id);
        if (!markedCredited) {
          throw new Error('failed to persist credited order state');
        }
      }

      res.json({ success: true, data: { credited: shouldCredit } });
    } catch (error) {
      res.status(502).json({ success: false, message: 'crediting failed' });
    }
  });

  return app;
}
