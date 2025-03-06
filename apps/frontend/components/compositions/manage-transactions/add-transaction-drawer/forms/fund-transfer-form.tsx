import { useGlobalContext } from '@/app/app/global-context';
import { TransactionService } from '@/app/services/transaction-service';
import { QUERIES } from '@/components/tanstack-queries';
import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueries } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AccountField } from '../fields/account-field';
import { TransferAmountCurrencyField } from '../fields/amount-currency-field';
import { DateField } from '../fields/date-field';
import { DescriptionField } from '../fields/description-field';
import { TimeField } from '../fields/time-field';
import { TitleField } from '../fields/title-field';
import { mapAccounts, type AccountComboItem, type TxFormProps } from './common';
import { fundTransferTxForm, type FundTransferTxForm } from './form-schema';

export const FundTransferForm = ({ footer, onSuccess }: TxFormProps) => {
  const { countriesInUse, isMultiCountry } = useGlobalContext();

  const curDate = DateTime.now();
  const form = useForm<FundTransferTxForm>({
    resolver: zodResolver(fundTransferTxForm),
    defaultValues: {
      date: curDate.toJSDate(),
      time: { hour: curDate.get('hour'), minute: curDate.get('minute') },
      journalEntryType: 'transfer',
      currencyCode: countriesInUse?.at(0)?.defaultCurrency?.code ?? 'USD',
      amount: '',
      fxRate: '',
      fxAmount: '',
      title: '',
      description: '',
      debitAccountId: -1,
      creditAccountId: -1,
      isFx: false,
    },
  });

  const {
    data: { assetGroupsByCountry, liabilityGroupsByCountry },
    isError,
    error,
  } = useQueries({
    queries: [
      QUERIES.accounts.getAccountGroupsByCountry('asset'),
      QUERIES.accounts.getAccountGroupsByCountry('liability'),
    ],
    combine: (results) => ({
      data: {
        assetGroupsByCountry: results[0].data,
        liabilityGroupsByCountry: results[1].data,
      },
      isPending: results.some((result) => result.isPending),
      isError: results.some((result) => result.isError),
      error: results.map((result) => result.error),
    }),
  });

  const [accounts, setAccounts] = useState<AccountComboItem[]>([]);
  const tCountry = useTranslations('countryCode');
  useEffect(() => {
    if (!assetGroupsByCountry || !liabilityGroupsByCountry) return;

    const accounts = structuredClone(assetGroupsByCountry);
    Object.entries(liabilityGroupsByCountry).forEach(([countryCode, groups]) => {
      accounts[countryCode].push(...groups);
    });

    let mapped = mapAccounts(accounts);
    if (isMultiCountry) {
      mapped.forEach((e) => {
        const country = countriesInUse.find((c) => c.code === e.value);
        e.label = `${country?.emoji} ${tCountry(e.label)}`;
      });
    } else {
      mapped = Object.values(mapped)
        .flatMap((e) => e.children)
        .filter((e) => !!e);
    }

    setAccounts(mapped);
  }, [assetGroupsByCountry, liabilityGroupsByCountry, countriesInUse, isMultiCountry, tCountry]);

  if (isError) {
    return error.map((e) => <p key={e?.name}>Error: ${e?.message}</p>);
  }

  const onSubmit = async (form: FundTransferTxForm) => {
    const transactionService = await TransactionService.getInstance<TransactionService>();
    const insertedEntry = await transactionService.insertTransaction(form);
    if (!insertedEntry) throw new Error('Error ocurred while on inserting the transaction.');

    await onSuccess([insertedEntry]);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-2 px-4">
        <div className="grid grid-cols-2 grid-rows-1 gap-3">
          <DateField zForm={form} />
          <TimeField zForm={form} />
        </div>
        <div className="grid grid-cols-2 grid-rows-1 gap-3">
          <AccountField
            label="From"
            fieldName="debitAccountId"
            accountItems={accounts}
            zForm={form}
          />
          <AccountField
            label="To"
            fieldName="creditAccountId"
            accountItems={accounts}
            zForm={form}
          />
        </div>
        <TransferAmountCurrencyField
          currencyFieldName="currencyCode"
          amountFieldName="amount"
          fxRateFieldName="fxRate"
          fxAmountFieldName="fxAmount"
          isFxFieldName="isFx"
          zForm={form}
        />
        <TitleField zForm={form} />
        <DescriptionField zForm={form} />
        {footer}
      </form>
    </Form>
  );
};
