import { TimeSelector } from '@/components/compositions/time-selector';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { Form } from '../forms/common';

type TimeFieldProps = {
  zForm: Form;
};

export const TimeField = ({ zForm }: TimeFieldProps) => (
  <FormField
    control={zForm.control}
    name="time"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Time</FormLabel>
        <FormControl>
          <TimeSelector field={field} zForm={zForm} />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
);
