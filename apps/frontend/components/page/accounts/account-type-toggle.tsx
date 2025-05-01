'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { accounts } from '@/db/drizzle/schema';
import { cn } from '@/lib/utils';
import type { ControllerRenderProps } from 'react-hook-form';

export const AccountTypeToggle = (field: ControllerRenderProps) => {
  return (
    <div>
      <ToggleGroup
        id="account-type"
        type="single"
        className="justify-normal"
        onValueChange={field.onChange}
        {...field}
      >
        {accounts.type.enumValues.map((accountType) => (
          <ToggleGroupItem
            key={accountType}
            value={accountType}
            aria-label={accountType}
            className={cn(
              'w-[4.25rem] cursor-pointer px-4 capitalize disabled:opacity-100 data-[state=on]:text-white',
              accountType === 'debit'
                ? 'data-[state=on]:bg-blue-400'
                : 'data-[state=on]:bg-rose-400',
            )}
          >
            {accountType}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
};
