import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { Form } from '../forms/common';

type TitleFieldProps = {
  zForm: Form;
};

export const TitleField = ({ zForm }: TitleFieldProps) => (
  <FormField
    control={zForm.control}
    name="title"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Title</FormLabel>
        <FormControl>
          <Input type="text" {...field} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);
