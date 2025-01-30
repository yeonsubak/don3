'use client';

import { Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import type {
  ControllerRenderProps,
  FieldValue,
  FieldValues,
  UseFormReturn,
} from 'react-hook-form';
import type { TailwindClass } from '../common-types';
import { Separator } from '../ui/separator';

export interface ComboboxItem<T = unknown> {
  label: string;
  value: string;
  keywords?: string[];
  data?: T;
  children?: ComboboxItem<T>[];
}

export type ComboboxProps = {
  items?: ComboboxItem[];
  placeholder?: string;
  searchPlaceholder?: string;
  notFoundPlaceholder?: string;
  searchable?: boolean;
  field?: ControllerRenderProps<FieldValue<FieldValues>>;
  zForm?: UseFormReturn<FieldValue<FieldValues>>;
  isChevron?: boolean;
  buttenLabelRenderFn?: () => string;
  onSelectFn?: (currentValue: string) => void;
  popoverButtonClass?: TailwindClass;
  popoverContentClass?: TailwindClass;
  popoverContentSide?: 'top' | 'right' | 'bottom' | 'left';
  popoverContentAlign?: 'start' | 'center' | 'end';
};

export const flattenComboboxItems = (items: ComboboxItem[]): ComboboxItem[] => {
  return items.flatMap((item) => {
    return item.children ? [item, ...flattenComboboxItems(item.children)] : [item];
  });
};

export const Combobox = ({
  items,
  placeholder = 'Select',
  searchPlaceholder = 'Search',
  notFoundPlaceholder = 'Not found',
  searchable = true,
  field,
  zForm,
  isChevron = true,
  buttenLabelRenderFn = () => {
    if (field?.value && field.value.length > 0) {
      return (
        flattenComboboxItems(items ?? []).find((item) => item.value === field.value)?.label ??
        placeholder
      );
    }

    return placeholder;
  },
  onSelectFn,
  popoverButtonClass,
  popoverContentClass,
  popoverContentSide = 'bottom',
  popoverContentAlign = 'center',
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);

  const Item = (item: ComboboxItem) => {
    if (item.children && item.children.length > 0) {
      return (
        <>
          <CommandGroup heading={item.label}>
            {item.children.map((child) => (
              <Item key={child.value} {...child} />
            ))}
          </CommandGroup>
          <Separator />
        </>
      );
    }

    return (
      <CommandItem
        value={item.value}
        keywords={item.keywords ?? [item.label]}
        onSelect={(currentValue) => {
          if (onSelectFn) {
            onSelectFn(currentValue);
          }

          zForm?.setValue(field!.name, currentValue);
          setOpen(false);
        }}
        data={item.data}
      >
        <Check
          className={cn('mr-2 h-4 w-4', field?.value === item.value ? 'opacity-100' : 'opacity-0')}
        />
        {item.label}
      </CommandItem>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn('justify-between', popoverButtonClass ? popoverButtonClass : 'w-full')}
        >
          <span className="overflow-hidden text-ellipsis">{buttenLabelRenderFn()}</span>
          {isChevron ? <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /> : <></>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('z-[99] p-0', popoverContentClass ? popoverContentClass : 'w-[200px]')}
        side={popoverContentSide}
        align={popoverContentAlign}
      >
        <Command>
          {searchable ? <CommandInput placeholder={searchPlaceholder} /> : <></>}
          <CommandList>
            <CommandEmpty>{notFoundPlaceholder}</CommandEmpty>
            {items?.map((item) => <Item key={item.value} {...item} />)}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
