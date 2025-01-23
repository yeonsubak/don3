import { cn } from '@/lib/utils';
import { ClockIcon } from 'lucide-react';
import { useState } from 'react';
import type {
  ControllerRenderProps,
  FieldValue,
  FieldValues,
  UseFormReturn,
} from 'react-hook-form';
import { TimeInput } from '../primitives/time-input';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

export type TimeSelectorProps = {
  placeholder?: string;
  field: ControllerRenderProps<FieldValue<FieldValues>>;
  zForm: UseFormReturn<FieldValue<FieldValues>>;
};

type TimeState = { hour: string; minute: string };

export const TimeSelector = ({ field, zForm, placeholder = 'Pick a time' }: TimeSelectorProps) => {
  const [time, setTime] = useState<TimeState>(
    field.value ? { hour: field.value.hour, minute: field.value.minute } : { hour: '', minute: '' },
  );
  const [isValueEmpty, setIsValueEmpty] = useState<boolean>(false);

  const setValue = (open: boolean) => {
    if (!open) {
      zForm.setValue(field.name, time);
      setIsValueEmpty(time.hour.length < 1 || time.minute.length < 1);
    }
  };

  return (
    <Popover onOpenChange={setValue}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          type="button"
          className={cn('w-full text-left font-normal', !field.value && 'text-muted-foreground')}
        >
          {isValueEmpty ? (
            <span>{placeholder}</span>
          ) : (
            <span>{`${String(time.hour).padStart(2, '0')}:${String(time.minute).padStart(2, '0')}`}</span>
          )}
          <ClockIcon className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto" align="end">
        <TimeInput format="24h" time={time} setTime={setTime} />
      </PopoverContent>
    </Popover>
  );
};
