import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger } from '@radix-ui/react-popover';
import { CalendarIcon } from 'lucide-react';
import { DateTime } from 'luxon';
import { useState } from 'react';
import type { Form } from '../forms/common';

type DateFieldProps = {
  zForm: Form;
  closeOnSelect?: boolean;
};

export const DateField = ({ closeOnSelect = true, zForm }: DateFieldProps) => {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <FormField
      control={zForm.control}
      name="date"
      render={({ field }) => {
        const handleOnSelect = (selectedDate: Date | undefined) => {
          field.onChange(selectedDate);
          if (closeOnSelect) setOpen(false);
        };

        return (
          <FormItem>
            <FormLabel>Date</FormLabel>
            <FormControl>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    type="button"
                    className={cn(
                      'w-full text-left font-normal',
                      !field.value && 'text-muted-foreground',
                    )}
                  >
                    {field.value ? (
                      <span>{DateTime.fromJSDate(field.value).toFormat('yyyy. L. d')}</span>
                    ) : (
                      <span>Pick a date</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={handleOnSelect} />
                </PopoverContent>
              </Popover>
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
};
