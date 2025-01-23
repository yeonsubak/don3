import { cn } from '@/lib/utils';
import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import { Input } from '../ui/input';

type TimeInputProps = {
  format: '12h' | '24h';
  time: { hour: string; minute: string };
  setTime: Dispatch<SetStateAction<{ hour: string; minute: string }>>;
};

export const TimeInput = ({ format, time, setTime }: TimeInputProps) => {
  const onValueChange =
    (type: 'hour' | 'minute') =>
    ({ target }: ChangeEvent<HTMLInputElement>) => {
      const value = target.value.trim();
      const numericValue = parseInt(value, 10);

      const constraints = {
        hour: { max: 24, min: 0 },
        minute: { max: 59, min: 0 },
      };

      const { max, min } = constraints[type];

      if (isNaN(numericValue) || numericValue < min) {
        setTime((prev) => ({ ...prev, [type]: '' }));
        return;
      }

      if (numericValue > max) return;

      const normalizedValue = value.length > 2 ? value.replace(/^0+/, '') : value;
      setTime((prev) => ({ ...prev, [type]: normalizedValue.padStart(2, '0') }));
    };

  const headerCn = 'text-xs';
  const containerCn = 'flex basis-6/13 flex-col gap-2';
  const timeCn = 'grow text-5xl';
  const inputCn = 'h-12 border-0 text-center text-5xl shadow-none';

  return (
    <div className="flex h-full w-48 flex-row text-center">
      <div className={containerCn}>
        <p className={headerCn}>Hour</p>
        <Input
          type="number"
          placeholder="00"
          maxLength={2}
          max={format === '12h' ? 12 : 24}
          min={0}
          className={inputCn}
          value={time?.hour}
          inputMode="numeric"
          onChange={onValueChange('hour')}
        />
      </div>
      <div className={cn(containerCn, 'basis-1/13 gap-[0.2rem]')}>
        <p className={headerCn}> </p>
        <p className={timeCn}>:</p>
      </div>
      <div className={containerCn}>
        <p className={headerCn}>Minute</p>
        <Input
          type="number"
          placeholder="00"
          maxLength={2}
          max={format === '12h' ? 12 : 24}
          min={0}
          className={inputCn}
          value={time?.minute}
          inputMode="numeric"
          onChange={onValueChange('minute')}
        />
      </div>
    </div>
  );
};
