import * as React from 'react';

import { cn } from '@/lib/utils';

import { cva, type VariantProps } from 'class-variance-authority';

const baseClass = cn(
  'border-input file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex h-9 w-full min-w-0 bg-transparent px-3 py-1 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
  'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
);

const inputVariants = cva(baseClass, {
  variants: {
    variant: {
      default: 'border shadow-xs rounded-md',
      ghost: 'border-b border-black focus-visible:rounded-md aria-invalid:rounded-md',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

function Input({
  className,
  variant,
  type,
  ...props
}: React.ComponentProps<'input'> & VariantProps<typeof inputVariants>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputVariants({ variant, className }))}
      {...props}
    />
  );
}

export { Input };
