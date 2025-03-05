import {
  Combobox,
  flattenComboboxItems,
  type ComboboxItem,
} from '@/components/primitives/combobox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { AccountSelectWithRelations } from '@/db/drizzle/types';
import type { AccountComboItem, Form } from '../forms/common';

type AccountFieldProps = {
  label: string;
  fieldName: string;
  accountItems: AccountComboItem[];
  zForm: Form;
};

export const AccountField = ({ label, fieldName, zForm, accountItems }: AccountFieldProps) => {
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
              onSelectFn={(currentValue) => {
                const flat = flattenComboboxItems(
                  accountItems,
                ) as ComboboxItem<AccountSelectWithRelations>[];
                const paidByAccount = flat.find((account) => account.value === currentValue)?.data;
                if (paidByAccount) {
                  zForm.setValue('currencyCode', paidByAccount.currency.code);
                }
              }}
              popoverContentClass="w-fit"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
