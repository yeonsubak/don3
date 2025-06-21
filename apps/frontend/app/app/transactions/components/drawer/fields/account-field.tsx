import { useGlobalContext } from '@/app/app/global-context';
import {
  Combobox,
  flattenComboboxItems,
  type ComboboxItem,
} from '@/components/primitives/combobox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { AccountSelect, AccountSelectAll, JournalEntryType } from '@/db/drizzle/types';
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
  const { isMultiCountry } = useGlobalContext();

  const journalEntryType: JournalEntryType = useWatch({
    control: zForm.control,
    name: 'journalEntryType',
  });

  return (
    <FormField
      control={zForm.control}
      name={fieldName}
      render={({ field }) => {
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Combobox
                items={accountItems}
                field={field}
                onSelectFn={(currentValue) => {
                  if (journalEntryType === 'transfer') {
                    return;
                  }

                  const flat = flattenComboboxItems(
                    accountItems,
                  ) as ComboboxItem<AccountSelectAll>[];
                  const debitAccount = flat.find((account) => account.value === currentValue)?.data;
                  if (debitAccount) {
                    field.onChange(debitAccount.currency.code);
                  }
                }}
                popoverContentClass="w-fit"
                buttonLabelRenderFn={() => {
                  const items = flattenComboboxItems(
                    accountItems,
                  ) as ComboboxItem<AccountSelectAll>[];
                  const account = items.find((account) => account.value === field.value);
                  if (!account) return 'Select';

                  switch (journalEntryType) {
                    case 'transfer': {
                      const labelWithIcon = `${account.data?.icon} ${account?.label}`;
                      return isMultiCountry
                        ? `${account?.data?.country.emoji} - ${labelWithIcon}`
                        : labelWithIcon;
                    }
                    default: {
                      return `${account.data?.icon} ${account?.label}`;
                    }
                  }
                }}
                labelRenderFn={(itemData: unknown) => {
                  const data = itemData as AccountSelect;
                  return `${data.icon} ${data.name}`;
                }}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
