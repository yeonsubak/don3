import type { AccountGroupInsert } from '../drizzle/types';

const DATASET_ACCOUNT_GROUPS_ASSETS: AccountGroupInsert[] = [
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
];

const DATASET_ACCOUNT_GROUPS_LIABILITIES: AccountGroupInsert[] = [
  {
    id: 5,
    type: 'liability',
    name: 'Credit Cards',
    parentGroupId: null,
  },
];

const DATASET_ACCOUNT_GROUPS_EXPENSES: AccountGroupInsert[] = [
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

const DATASET_ACCOUNT_GROUPS_INCOME: AccountGroupInsert[] = [
  {
    id: 8,
    type: 'income',
    name: 'Salary & Wages',
    description:
      'income earned from employment through regular work, including fixed salaries, hourly wages, and additional earnings such as bonuses or overtime.',
    parentGroupId: null,
  },
  {
    id: 9,
    type: 'income',
    name: 'Business Income',
    description:
      'Earnings from self-employment or a business, including sales revenue, service fees, and profits after deducting expenses.',
    parentGroupId: null,
  },
  {
    id: 10,
    type: 'income',
    name: 'Investments & Passive Income',
    description:
      'Money earned without active work, such as dividends from stocks, interest from bonds, rental income, or royalties from intellectual property.',
    parentGroupId: null,
  },
  {
    id: 11,
    type: 'income',
    name: 'Government & Social Benefits',
    description:
      'Financial support from public programs, including pensions, unemployment benefits, social security, and disability payments.',
    parentGroupId: null,
  },
  {
    id: 12,
    type: 'income',
    name: 'Windfalls & Other Income',
    description:
      'Irregular or unexpected income, such as gifts, inheritances, lottery winnings, tax refunds, or cashback rewards.',
    parentGroupId: null,
  },
];

export const DATASET_ACCOUNT_GROUPS: AccountGroupInsert[] = [
  {
    id: 1,
    type: 'uncategorized',
    name: 'Uncategorized',
    parentGroupId: null,
    isHidden: true,
  },
  ...DATASET_ACCOUNT_GROUPS_ASSETS,
  ...DATASET_ACCOUNT_GROUPS_LIABILITIES,
  ...DATASET_ACCOUNT_GROUPS_EXPENSES,
  ...DATASET_ACCOUNT_GROUPS_INCOME,
];
