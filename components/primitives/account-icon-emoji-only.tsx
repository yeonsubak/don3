'use client';

import { cn } from '@/lib/utils';
import type { ComponentProps } from 'react';

type AccountIconProps = {
  iconValue: string | null;
};

export const AccountIconEmojiOnly = ({
  iconValue,
  className,
}: AccountIconProps & ComponentProps<'div'>) => {
  const emojiRegex = /\p{Emoji}/u;

  const isEmoji = emojiRegex.test(iconValue ?? '');

  return (
    <div
      className={cn(
        'flex flex-none place-content-center rounded-lg border border-zinc-200 bg-zinc-100 p-1.5 dark:bg-zinc-800',
        className,
      )}
    >
      <p className={cn('text-xl', isEmoji ? 'emoji' : '')}>{iconValue}</p>
    </div>
  );
};
