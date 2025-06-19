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
import React, { type Dispatch, type ReactElement, type SetStateAction, useState } from 'react';
import type { ControllerRenderProps, FieldValue, FieldValues } from 'react-hook-form';
import type { TailwindClass } from '../common-types';
import { useIsMobile } from '../hooks/use-mobile';
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
  state?: [string, Dispatch<SetStateAction<string>>];
  value?: string;
  extraComponents?: ReactElement[];
}

export function flattenComboboxItems<T>(items: ComboboxItem<T>[]): ComboboxItem<T>[] {
  return items.flatMap((item) =>
    item.children ? [item, ...flattenComboboxItems<T>(item.children)] : [item],
  );
}

const Item = ({
  children,
  label,
  recursiveCnt = 0,
  value,
  keywords,
  data,
  comboboxProps,
  setOpen,
}: ComboboxItem & {
  comboboxProps: Partial<ComboboxProps>;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) => {
  function isSelect() {
    if (comboboxProps.field) return comboboxProps.field.value === value;
    if (comboboxProps.state) return comboboxProps.state[0] === value;
    return comboboxProps.value === value;
  }

  if (children && children.length > 0) {
    recursiveCnt += 1;
    return (
      <>
        <CommandGroup heading={label} className="this-is-command-group">
          {children.map((child) => (
            <Item
              key={comboboxProps.keyRenderFn ? comboboxProps.keyRenderFn(child) : child.value}
              recursiveCnt={recursiveCnt}
              setOpen={setOpen}
              comboboxProps={comboboxProps}
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
        if (comboboxProps.onSelectFn) {
          comboboxProps.onSelectFn(currentValue);
        }

        if (comboboxProps.state) {
          const setValue = comboboxProps.state[1];
          setValue(currentValue);
        }

        comboboxProps.field?.onChange(currentValue);
        setOpen(false);
      }}
      data={data}
    >
      <Check className={cn('mr-2 h-4 w-4', isSelect() ? 'opacity-100' : 'opacity-0')} />
      {comboboxProps.labelRenderFn ? comboboxProps.labelRenderFn(data) : label}
    </CommandItem>
  );
};

const ExtraComponent = ({ children }: { children: ReactElement }) => (
  <CommandItem onSelect={() => {}}>{children}</CommandItem>
);

export const Combobox = (comboboxProps: ComboboxProps) => {
  const {
    items,
    placeholder = 'Select',
    searchPlaceholder = 'Search',
    notFoundPlaceholder = 'Not found',
    searchable = true,
    field,
    isChevron = true,
    value,
    buttonLabelRenderFn = () => {
      if (state && state[0].length > 0) {
        return (
          flattenComboboxItems(items ?? []).find((item) => item.value === state[0])?.label ??
          placeholder
        );
      }

      if (field?.value && field.value.length > 0) {
        return (
          flattenComboboxItems(items ?? []).find((item) => item.value === field.value)?.label ??
          placeholder
        );
      }

      if (value) {
        return (
          flattenComboboxItems(items ?? []).find((item) => item.value === value)?.label ??
          placeholder
        );
      }

      return placeholder;
    },
    popoverButtonClass,
    popoverContentClass,
    popoverContentSide = 'bottom',
    popoverContentAlign = 'center',
    keyRenderFn,
    state,
    extraComponents,
  } = comboboxProps;

  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
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
        onOpenAutoFocus={(e) => isMobile && e.preventDefault()}
        style={
          !popoverContentClass
            ? {
                width: 'var(--radix-popover-trigger-width)',
                maxWidth: 'var(--radix-popover-content-available-height)',
              }
            : undefined
        }
      >
        <Command>
          {searchable && <CommandInput placeholder={searchPlaceholder} />}
          {extraComponents &&
            extraComponents.map((component, idx) => (
              <ExtraComponent key={`${idx}`}>{component}</ExtraComponent>
            ))}
          <CommandList>
            <CommandEmpty>{notFoundPlaceholder}</CommandEmpty>
            {items?.map((item) => (
              <Item
                key={keyRenderFn ? keyRenderFn(item) : item.value}
                setOpen={setOpen}
                comboboxProps={comboboxProps}
                {...item}
              />
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
