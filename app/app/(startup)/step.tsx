import { cn } from '@/lib/utils';
import React, { type ComponentProps } from 'react';

export type StepProps = {
  order: number;
  title: string;
  description?: string;
  Component: React.ReactNode | (() => React.ReactNode);
  onNext?: () => Promise<void>;
  onBack?: () => Promise<void>;
} & ComponentProps<'div'>;

export const Step = ({ title, description, Component, className }: StepProps) => {
  const renderChildren = typeof Component === 'function' ? Component() : Component;

  return (
    <div
      className={cn(
        'flex max-h-[58vh] grow flex-col space-y-2 overflow-y-auto py-4 md:max-h-[68vh]',
        className,
      )}
    >
      <h3 className="text-lg font-medium">{title}</h3>
      {description && <p className="text-muted-foreground">{description}</p>}
      <div className="space-y-4">{renderChildren}</div>
    </div>
  );
};
