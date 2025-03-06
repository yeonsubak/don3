import {
  Combobox,
  flattenComboboxItems,
  type ComboboxItem,
} from '@/components/primitives/combobox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { AccountSelectWithRelations, JournalEntryType } from '@/db/drizzle/types';
import { useWatch } from 'react-hook-form';
import type { AccountComboItem, Form } from '../forms/common';
import type { FormFieldName } from '../forms/form-schema';

type AccountFieldProps = {
  label: string;
  fieldName: FormFieldName;
  accountItems: AccountComboItem[];
  zForm: Form;
};

export const AccountField = ({ label, fieldName, zForm, accountItems }: AccountFieldProps) => {
  const journalEntryType: JournalEntryType = useWatch({
    control: zForm.control,
    name: 'journalEntryType',
  });

  const defaultOnSelectFn = (currentValue: string) => {
    if (journalEntryType === 'transfer') {
      return;
    }

    const flat = flattenComboboxItems(accountItems) as ComboboxItem<AccountSelectWithRelations>[];
    const debitAccount = flat.find((account) => account.value === currentValue)?.data;
    if (debitAccount) {
      zForm.setValue('currencyCode', debitAccount.currency.code);
    }
  };

  return (
    <FormField
      control={zForm.control}
      name={fieldName}
      render={({ field }) => {
        const buttonLabelWithFlag = () => {
          const items = flattenComboboxItems(
            accountItems,
          ) as ComboboxItem<AccountSelectWithRelations>[];
          const account = items.find((account) => account.value === field.value);
          return account ? `${account?.data?.country.emoji} ${account?.label}` : 'Select';
        };

        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Combobox
                items={accountItems}
                field={field}
                zForm={zForm}
                onSelectFn={defaultOnSelectFn}
                popoverContentClass="w-fit"
                buttonLabelRenderFn={
                  journalEntryType === 'transfer' ? buttonLabelWithFlag : undefined
                }
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
