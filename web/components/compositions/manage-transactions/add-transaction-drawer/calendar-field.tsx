import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { FormControl } from '@/components/ui/form';
import { PopoverContent } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger } from '@radix-ui/react-popover';
import { CalendarIcon } from 'lucide-react';
import { DateTime } from 'luxon';
import { useState } from 'react';
import type { ControllerRenderProps, FieldValue, FieldValues } from 'react-hook-form';

type CalendarFieldProps = {
  field: ControllerRenderProps<FieldValue<FieldValues>>;
  closeOnSelect?: boolean;
};

export const CalendarField = ({ field, closeOnSelect = false }: CalendarFieldProps) => {
  const [open, setOpen] = useState<boolean>(false);

  const handleOnSelect = (selectedDate: Date | undefined) => {
    field.onChange(selectedDate);
    if (closeOnSelect) setOpen(false);
  };

  return (
    <FormControl>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className={cn('w-full text-left font-normal', !field.value && 'text-muted-foreground')}
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
  );
};
