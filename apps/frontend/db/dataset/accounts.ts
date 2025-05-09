import type { AccountInsert } from '../drizzle/types';
import type { IconName } from 'lucide-react/dynamic';

const a: IconName = 'house';

const DATASET_ACCOUNTS_EXPENSE: (countryId: number, currencyId: number) => AccountInsert[] = (
  countryId,
  currencyId,
) => [
  {
    name: 'Housing Costs',
    type: 'credit',
    accountGroupId: 6,
    currencyId: currencyId,
    countryId: countryId,
    icon: '🏠',
  },
  {
    name: 'Telecommunication',
    type: 'credit',
    accountGroupId: 6,
    currencyId: currencyId,
    countryId: countryId,
    icon: '📱',
  },
  {
    name: 'Insurance Preminums',
    type: 'credit',
    accountGroupId: 6,
    currencyId: currencyId,
    countryId: countryId,
    icon: '🛡️',
  },
  {
    name: 'Subscriptions',
    type: 'credit',
    accountGroupId: 6,
    currencyId: currencyId,
    countryId: countryId,
    icon: '📺',
  },
  {
    name: 'Groceries',
    type: 'credit',
    accountGroupId: 7,
    currencyId: currencyId,
    countryId: countryId,
    icon: '🛒',
  },
  {
    name: 'Transportations',
    type: 'credit',
    accountGroupId: 7,
    currencyId: currencyId,
    countryId: countryId,
    icon: '🚌',
  },
  {
    name: 'Gift',
    type: 'credit',
    accountGroupId: 7,
    currencyId: currencyId,
    countryId: countryId,
    icon: '🎁',
  },
  {
    name: 'Fashion & Beauty',
    type: 'credit',
    accountGroupId: 7,
    currencyId: currencyId,
    countryId: countryId,
    icon: '👠',
  },
];

const DATASET_ACCOUNTS_INCOME: (countryId: number, currencyId: number) => AccountInsert[] = (
  countryId,
  currencyId,
) => [
  {
    name: 'Regular salary',
    type: 'credit',
    accountGroupId: 8,
    currencyId: currencyId,
    countryId: countryId,
    icon: '💼',
  },
  {
    name: 'Overtime pay',
    type: 'credit',
    accountGroupId: 8,
    currencyId: currencyId,
    countryId: countryId,
    icon: '⏰',
  },
  {
    name: 'Bonuses',
    type: 'credit',
    accountGroupId: 8,
    currencyId: currencyId,
    countryId: countryId,
    icon: '🥳',
  },
  {
    name: 'Freelance income',
    type: 'credit',
    accountGroupId: 9,
    currencyId: currencyId,
    countryId: countryId,
    icon: '💻',
  },
  {
    name: 'Investment profits & dividends',
    type: 'credit',
    accountGroupId: 10,
    currencyId: currencyId,
    countryId: countryId,
    icon: '🚀',
  },
  {
    name: 'Real estate',
    type: 'credit',
    accountGroupId: 10,
    currencyId: currencyId,
    countryId: countryId,
    icon: '🏘️',
  },
  {
    name: 'Government pension',
    type: 'credit',
    accountGroupId: 11,
    currencyId: currencyId,
    countryId: countryId,
    icon: '🧓',
  },
  {
    name: 'Subsidies',
    type: 'credit',
    accountGroupId: 11,
    currencyId: currencyId,
    countryId: countryId,
    icon: '🏛️',
  },
  {
    name: 'Cashback rewards',
    type: 'credit',
    accountGroupId: 12,
    currencyId: currencyId,
    countryId: countryId,
    icon: '💰',
  },
];

export const DATASET_ACCOUNTS: (countryId: number, currencyId: number) => AccountInsert[] = (
  countryId,
  currencyId,
) => [
  ...DATASET_ACCOUNTS_INCOME(countryId, currencyId),
  ...DATASET_ACCOUNTS_EXPENSE(countryId, currencyId),
];
