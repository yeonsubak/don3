'use client';

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
import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import type { ControllerRenderProps, FieldValue, FieldValues } from 'react-hook-form';
import { useMediaQuery } from 'usehooks-ts';
import type { TailwindClass } from '../common-types';
import { Separator } from '../ui/separator';

export interface ComboboxItem<T = unknown> {
  label: string;
  value: string;
  keywords?: string[];
  data?: T;
  children?: ComboboxItem<T>[];
  recursiveCnt?: number;
}

export interface ComboboxProps {
  items?: ComboboxItem[];
  placeholder?: string;
  searchPlaceholder?: string;
  notFoundPlaceholder?: string;
  searchable?: boolean;
  field?: ControllerRenderProps<FieldValue<FieldValues>>;
  isChevron?: boolean;
  buttonLabelRenderFn?: () => string;
  onSelectFn?: (currentValue: string) => void;
  popoverButtonClass?: TailwindClass;
  popoverContentClass?: TailwindClass;
  popoverContentSide?: 'top' | 'right' | 'bottom' | 'left';
  popoverContentAlign?: 'start' | 'center' | 'end';
  keyRenderFn?: (item: ComboboxItem) => string;
  labelRenderFn?: (itemData: unknown) => string;
}

export function flattenComboboxItems<T>(items: ComboboxItem<T>[]): ComboboxItem<T>[] {
  return items.flatMap((item) =>
    item.children ? [item, ...flattenComboboxItems<T>(item.children)] : [item],
  );
}

export const Combobox = ({
  items,
  placeholder = 'Select',
  searchPlaceholder = 'Search',
  notFoundPlaceholder = 'Not found',
  searchable = true,
  field,
  isChevron = true,
  buttonLabelRenderFn = () => {
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
  keyRenderFn,
  labelRenderFn,
}: ComboboxProps) => {
  const [open, setOpen] = useState(false);
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const Item = ({ children, label, recursiveCnt = 0, value, keywords, data }: ComboboxItem) => {
    if (children && children.length > 0) {
      recursiveCnt += 1;
      return (
        <>
          <CommandGroup heading={label} className="this-is-command-group">
            {children.map((child) => (
              <Item
                key={keyRenderFn ? keyRenderFn(child) : child.value}
                recursiveCnt={recursiveCnt}
                {...child}
              />
            ))}
          </CommandGroup>
          {recursiveCnt === 1 ? <Separator /> : <></>}
        </>
      );
    }

    return (
      <CommandItem
        value={value}
        keywords={keywords ?? [label]}
        onSelect={(currentValue) => {
          if (onSelectFn) {
            onSelectFn(currentValue);
          }

          field?.onChange(currentValue);
          setOpen(false);
        }}
        data={data}
      >
        <Check
          className={cn('mr-2 h-4 w-4', field?.value === value ? 'opacity-100' : 'opacity-0')}
        />
        {labelRenderFn ? labelRenderFn(data) : label}
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
          <span className="overflow-hidden text-ellipsis">{buttonLabelRenderFn()}</span>
          {isChevron ? <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /> : <></>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('z-99 p-0', popoverContentClass ? popoverContentClass : 'w-80')}
        side={popoverContentSide}
        align={popoverContentAlign}
        onOpenAutoFocus={(e) => !isDesktop && e.preventDefault()}
      >
        <Command>
          {searchable ? <CommandInput placeholder={searchPlaceholder} /> : <></>}
          <CommandList>
            <CommandEmpty>{notFoundPlaceholder}</CommandEmpty>
            {items?.map((item) => (
              <Item key={keyRenderFn ? keyRenderFn(item) : item.value} {...item} />
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
