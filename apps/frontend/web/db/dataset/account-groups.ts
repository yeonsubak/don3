import type { AccountGroupInsert } from '../drizzle/types';

export const DATASET_ACCOUNT_GROUPS: AccountGroupInsert[] = [
  {
    id: 1,
    type: 'uncategorized',
    name: 'Uncategorized',
    parentGroupId: null,
    isHidden: true,
  },
  {
    id: 2,
    type: 'asset',
    name: 'Cash and Cash Equivalents',
    parentGroupId: null,
  },
  {
    id: 3,
    type: 'asset',
    name: 'Savings',
    parentGroupId: null,
  },
  {
    id: 4,
    type: 'asset',
    name: 'Investments',
    parentGroupId: null,
  },
  {
    id: 5,
    type: 'liability',
    name: 'Credit Cards',
    parentGroupId: null,
  },
  {
    id: 6,
    type: 'expense',
    name: 'Fixed Expenses',
    description:
      'Fixed costs are recurring, predictable expenses such as rent, utilities and debts.',
    parentGroupId: null,
  },
  {
    id: 7,
    type: 'expense',
    name: 'Variable Expenses',
    description:
      'Costs that change based on usage, such as groceries, fuel, dining out, entertainment, and shopping.',
    parentGroupId: null,
  },
];
