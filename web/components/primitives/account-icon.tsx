'use client';

import { cn } from '@/lib/utils';
import { Bank, Gift, Money, PiggyBank } from '@phosphor-icons/react';

type AccountIconProps = {
  iconValue: string | null;
};

const colors = {
  backgroundColor: '#F1F5F9',
  indigo: '#3B0086',
  lightCoral: '#ED9390',
  hotPink: '#F374AE',
};

export const AccountIcon = ({ iconValue }: AccountIconProps) => {
  const IconCn = 'flex-none w-11 h-11 p-2 rounded-2xl bg-slate-100 border shadow-xs';
  const emojiRegex = /\p{Emoji}/u;

  if (emojiRegex.test(iconValue ?? '')) {
    return (
      <div className={cn(IconCn, 'flex place-content-center p-1.5')}>
        <p className={cn('text-xl')}>{iconValue}</p>
      </div>
    );
  }

  switch (iconValue) {
    case 'bank': {
      return <Bank weight="regular" color={colors.indigo} className={IconCn} />;
    }
    case 'gift': {
      return <Gift weight="fill" color={colors.hotPink} className={IconCn} />;
    }
    case 'piggy-bank': {
      return <PiggyBank weight="regular" color={colors.indigo} className={IconCn} />;
    }
    default: {
      return <Money weight="regular" color={colors.indigo} className={IconCn} />;
    }
  }
};
