import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import type { Form } from '../forms/common';

type DescriptionFieldProps = {
  zForm: Form;
};

export const DescriptionField = ({ zForm }: DescriptionFieldProps) => (
  <FormField
    control={zForm.control}
    name="description"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Description</FormLabel>
        <FormControl>
          <Textarea rows={2} {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);
