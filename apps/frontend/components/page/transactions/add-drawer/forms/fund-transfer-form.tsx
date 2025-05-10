import { useGlobalContext } from '@/app/app/global-context';
import { Form } from '@/components/ui/form';
import { QUERIES } from '@/lib/tanstack-queries';
import { getTransactionService } from '@/services/helper';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueries } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTransactionDrawerContext } from '../drawer-context';
import { AccountField } from '../fields/account-field';
import { TransferAmountCurrencyField } from '../fields/amount-currency-field';
import { DateField } from '../fields/date-field';
import { DescriptionField } from '../fields/description-field';
import { TimeField } from '../fields/time-field';
import { TitleField } from '../fields/title-field';
import { mapAccounts, type AccountComboItem, type TxFormProps } from './common';
import { fundTransferTxForm, type FundTransferTxForm } from './form-schema';

export const FundTransferForm = ({ footer, onSuccess }: TxFormProps) => {
  const { countriesInUse, isMultiCountry, defaultCurrency } = useGlobalContext();
  const {
    sharedFormRef: { current: sharedForm },
    setSharedFormRef: setSharedForm,
  } = useTransactionDrawerContext();

  const curDate = DateTime.now();
  const form = useForm<FundTransferTxForm>({
    resolver: zodResolver(fundTransferTxForm),
    defaultValues: {
      date: sharedForm?.date ?? curDate.toJSDate(),
      time: sharedForm?.time ?? { hour: curDate.get('hour'), minute: curDate.get('minute') },
      journalEntryType: 'transfer',
      currencyCode: sharedForm?.currencyCode ?? defaultCurrency?.code ?? 'USD',
      amount: sharedForm?.amount ?? '',
      fxRate: sharedForm?.fxRate ?? '',
      fxAmount: sharedForm?.fxAmount ?? '',
      title: sharedForm?.title ?? '',
      description: sharedForm?.description ?? '',
      debitAccountId: sharedForm?.debitAccountId ?? -1,
      creditAccountId: -1,
      isFx: sharedForm?.isFx ?? false,
    },
  });

  const formWatch = useWatch({ control: form.control }) as FundTransferTxForm;
  useEffect(() => {
    if (!formWatch) return;
    setSharedForm({ ...formWatch });
  }, [formWatch, setSharedForm]);

  const {
    data: { assetGroupsByCountry, liabilityGroupsByCountry },
    isError,
    error,
  } = useQueries({
    queries: [
      QUERIES.accounts.accountGroupsByCountry('asset'),
      QUERIES.accounts.accountGroupsByCountry('liability'),
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

    let mapped: AccountComboItem[] = mapAccounts(accounts);
    if (isMultiCountry) {
      mapped.forEach((e) => {
        const country = countriesInUse.find((c) => c.code === e.value);
        e.label = `${country?.emoji} ${tCountry(e.label)}`;
      });
    } else {
      const flatten = Object.values(mapped)
        .flatMap((e) => e.children)
        .filter((e) => e !== undefined && e !== null) as AccountComboItem[];
      mapped = flatten;
    }

    setAccounts(mapped);
  }, [assetGroupsByCountry, liabilityGroupsByCountry, countriesInUse, isMultiCountry, tCountry]);

  if (isError) {
    return error.map((e) => <p key={e?.name}>Error: ${e?.message}</p>);
  }

  const onSubmit = async (form: FundTransferTxForm) => {
    const transactionService = await getTransactionService();
    if (!transactionService) throw new Error('TransactionService must be initialized first');

    const insertedEntry = await transactionService.insertTransaction(form);
    if (!insertedEntry) throw new Error('Error ocurred while on inserting the transaction.');

    await onSuccess(insertedEntry);
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
