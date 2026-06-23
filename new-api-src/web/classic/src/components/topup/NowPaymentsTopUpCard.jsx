/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useMemo, useState } from 'react';
import { Banner, Button, Space, Typography } from '@douyinfe/semi-ui';
import { WalletCards } from 'lucide-react';
import { API } from '../../helpers/api';
import { showError, showSuccess } from '../../helpers';

const { Text, Title } = Typography;

const TOP_UP_AMOUNTS = [1, 5, 15, 30, 50, 100];
const PAYMENT_OPTIONS = [
  {
    currency: 'USDTTRC20',
    label: 'TRC20',
    title: 'USDT-TRC20 Top-up',
    description:
      'Pay with USDT-TRC20. Choose Tron / TRC20 in your wallet or exchange. Credits are added after confirmation.',
    buttonLabel: 'Pay with USDT-TRC20',
  },
  {
    currency: 'USDTBSC',
    label: 'BEP20',
    title: 'USDT-BSC Top-up',
    description:
      'Pay with USDT-BSC (BEP20). Choose BSC / BNB Smart Chain (BEP20) in your wallet or exchange. Credits are added after confirmation.',
    buttonLabel: 'Pay with USDT-BSC',
  },
];

function isSafeHttpInvoiceUrl(value) {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    return false;
  }
  try {
    const url = new URL(trimmed);
    return (
      url.protocol === 'https:' &&
      url.hostname === 'pay.204-168-215-163.sslip.io'
    );
  } catch {
    return false;
  }
}

const NowPaymentsTopUpCard = ({ t, userId }) => {
  const [selectedAmount, setSelectedAmount] = useState(TOP_UP_AMOUNTS[0]);
  const [selectedCurrency, setSelectedCurrency] = useState(PAYMENT_OPTIONS[0].currency);
  const [loading, setLoading] = useState(false);

  const amountOptions = useMemo(
    () =>
      TOP_UP_AMOUNTS.map((amount) => ({
        amount,
        label: `$${amount}`,
      })),
    [],
  );
  const selectedPayment = useMemo(
    () =>
      PAYMENT_OPTIONS.find((option) => option.currency === selectedCurrency) ||
      PAYMENT_OPTIONS[0],
    [selectedCurrency],
  );

  const getFailureMessage = (error) => {
    const serverMessage =
      error?.response?.data?.message ||
      error?.response?.data?.error ||
      error?.response?.data?.data;

    if (typeof serverMessage === 'string' && serverMessage.trim()) {
      return serverMessage;
    }

    return error?.message || t('Unable to create payment invoice.');
  };

  const handlePay = async () => {
    if (!userId) {
      showError(t('Unable to identify the current user. Please refresh and try again.'));
      return;
    }

    setLoading(true);
    try {
      const response = await API.post(
        '/payment/create',
        {
          user_id: userId,
          amount: selectedAmount,
          currency: selectedPayment.currency,
        },
        { skipErrorHandler: true },
      );

      const invoiceUrl = response?.data?.data?.invoice_url;
      const isSuccess =
        response?.data?.success || response?.data?.message === 'success';

      if (!isSuccess) {
        throw new Error(
          response?.data?.message || t('Unable to create payment invoice.'),
        );
      }

      if (!isSafeHttpInvoiceUrl(invoiceUrl)) {
        throw new Error(t('Unable to create payment invoice.'));
      }

      showSuccess(t('Redirecting to payment page...'));
      window.location.href = invoiceUrl;
    } catch (error) {
      showError(getFailureMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='w-full rounded-xl border border-[var(--semi-color-border)] bg-[var(--semi-color-bg-1)] p-4'>
      <Space vertical spacing='medium' style={{ width: '100%' }}>
        <div className='flex items-start gap-3'>
          <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600'>
            <WalletCards size={18} />
          </div>
          <div>
            <Title heading={6} style={{ margin: 0 }}>
              {t(selectedPayment.title)}
            </Title>
            <Text type='tertiary' size='small'>
              {t(selectedPayment.description)}
            </Text>
          </div>
        </div>

        <Space wrap>
          {PAYMENT_OPTIONS.map((option) => {
            const selected = selectedPayment.currency === option.currency;

            return (
              <Button
                key={option.currency}
                type={selected ? 'primary' : 'tertiary'}
                theme={selected ? 'solid' : 'light'}
                onClick={() => setSelectedCurrency(option.currency)}
                className='!rounded-lg'
              >
                {option.label}
              </Button>
            );
          })}
        </Space>

        <Space wrap>
          {amountOptions.map(({ amount, label }) => {
            const selected = selectedAmount === amount;

            return (
              <Button
                key={amount}
                type={selected ? 'primary' : 'tertiary'}
                theme={selected ? 'solid' : 'light'}
                onClick={() => setSelectedAmount(amount)}
                className='!rounded-lg'
              >
                {label}
              </Button>
            );
          })}
        </Space>

        <Banner
          type='info'
          closeIcon={null}
          description={t('Do not close the payment page until the invoice is created.')}
        />

        <Button
          block
          type='primary'
          theme='solid'
          loading={loading}
          onClick={handlePay}
          className='!rounded-lg'
          icon={<WalletCards size={16} />}
        >
          {t(selectedPayment.buttonLabel)}
        </Button>
      </Space>
    </div>
  );
};

export default NowPaymentsTopUpCard;
