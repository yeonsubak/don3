import {
  Combobox,
  flattenComboboxItems,
  type ComboboxItem,
  type ComboboxProps,
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
} & { keyRenderFn?: ComboboxProps['keyRenderFn'] };

export const AccountField = ({
  label,
  fieldName,
  zForm,
  accountItems,
  keyRenderFn,
}: AccountFieldProps) => {
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
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Combobox
              items={accountItems}
              field={field}
              zForm={zForm}
              onSelectFn={defaultOnSelectFn}
              popoverContentClass="w-fit"
              keyRenderFn={keyRenderFn}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
