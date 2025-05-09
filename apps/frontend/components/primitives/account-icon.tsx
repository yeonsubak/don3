'use client';

import { cn } from '@/lib/utils';
import { DynamicIcon, type IconName } from 'lucide-react/dynamic';

type AccountIconProps = {
  iconValue: IconName | string | null;
};

export const AccountIcon = ({ iconValue }: AccountIconProps) => {
  const IconWrapperCn =
    'flex-none p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200';
  const emojiRegex = /\p{Emoji}/u;

  if (emojiRegex.test(iconValue ?? '')) {
    return (
      <div className={cn(IconWrapperCn, 'emoji flex place-content-center p-1.5')}>
        <p className={cn('text-xl')}>{iconValue}</p>
      </div>
    );
  }

  return (
    <div className={IconWrapperCn}>
      <DynamicIcon
        name={(iconValue as IconName | null) ?? 'banknote'}
        className="h-5 w-5 text-zinc-900 dark:text-zinc-100"
      />
    </div>
  );
};
