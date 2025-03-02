'use client';

import { cn } from '@/lib/utils';
import {
  Bank,
  Bus,
  Carrot,
  Gift,
  HighHeel,
  HouseLine,
  Money,
  PhonePlus,
  PiggyBank,
  Umbrella,
} from '@phosphor-icons/react';
import { CalendarSync, CreditCard, ShoppingCart, Wallet } from 'lucide-react';

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
  const IconWrapperCn =
    'flex-none p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200';
  const emojiRegex = /\p{Emoji}/u;

  if (emojiRegex.test(iconValue ?? '')) {
    return (
      <div className={cn(IconWrapperCn, 'flex place-content-center p-1.5')}>
        <p className={cn('text-xl')}>{iconValue}</p>
      </div>
    );
  }

  return (
    <div className={IconWrapperCn}>
      <_Icon iconValue={iconValue} />
    </div>
  );
};

const _Icon = ({ iconValue }: AccountIconProps) => {
  const iconCn = 'w-5 h-5 text-zinc-900 dark:text-zinc-100';

  switch (iconValue) {
    case 'bank': {
      return <Bank className={iconCn} />;
    }
    case 'bus': {
      return <Bus className={iconCn} />;
    }
    case 'calendar-sync': {
      return <CalendarSync className={iconCn} />;
    }
    case 'carrot': {
      return <Carrot className={iconCn} />;
    }
    case 'gift': {
      return <Gift className={iconCn} />;
    }
    case 'high-heel': {
      return <HighHeel className={iconCn} />;
    }
    case 'house-line': {
      return <HouseLine className={iconCn} />;
    }
    case 'phone-plus': {
      return <PhonePlus className={iconCn} />;
    }
    case 'piggy-bank': {
      return <PiggyBank className={iconCn} />;
    }
    case 'umbrella': {
      return <Umbrella className={iconCn} />;
    }
    case 'shopping-cart': {
      return <ShoppingCart className={iconCn} />;
    }
    case 'wallet': {
      return <Wallet className={iconCn} />;
    }
    case 'credit-card': {
      return <CreditCard className={iconCn} />;
    }
    default: {
      return <Money className={iconCn} />;
    }
  }
};
