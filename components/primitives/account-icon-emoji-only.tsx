'use client';

import { cn } from '@/lib/utils';

type AccountIconProps = {
  iconValue: string | null;
};

export const AccountIconEmojiOnly = ({ iconValue }: AccountIconProps) => {
  const IconWrapperCn =
    'flex-none p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200';
  const emojiRegex = /\p{Emoji}/u;

  const isEmoji = emojiRegex.test(iconValue ?? '');

  return (
    <div className={cn(IconWrapperCn, 'flex place-content-center p-1.5')}>
      <p className={cn('text-xl', isEmoji ? 'emoji' : '')}>{iconValue}</p>
    </div>
  );
};
