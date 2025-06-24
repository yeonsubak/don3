import type { AccountGroupInsert } from '@/db/drizzle-types';

const DATASET_ACCOUNT_GROUPS_ASSETS: AccountGroupInsert[] = [
  {
    id: 'a3a1eeb2-4095-40c2-b46e-c89c71bf92ee',
    type: 'asset',
    name: 'Cash and Cash Equivalents',
    parentGroupId: null,
  },
  {
    id: '41687ca0-44a5-4da4-92ac-46c9c8f504b1',
    type: 'asset',
    name: 'Savings',
    parentGroupId: null,
  },
  {
    id: '523a77b1-c23a-4de0-b513-cab5f01beb9a',
    type: 'asset',
    name: 'Investments',
    parentGroupId: null,
  },
];

const DATASET_ACCOUNT_GROUPS_LIABILITIES: AccountGroupInsert[] = [
  {
    id: 'b4de09c8-81d0-4b93-958b-df2981207f9f',
    type: 'liability',
    name: 'Credit Cards',
    parentGroupId: null,
  },
  {
    id: 'a3f03caf-b841-4ffc-a97d-7c25dceb9291',
    type: 'liability',
    name: 'Split-bill Payables',
    parentGroupId: null,
  },
  {
    id: '5e68a735-48b9-44f9-bcce-750a4dc8e7b6',
    type: 'liability',
    name: 'Short-term loans',
    parentGroupId: null,
  },
  {
    id: 'dfd41225-18af-405e-adab-a19e97b4ca58',
    type: 'liability',
    name: 'Long-term loans',
    parentGroupId: null,
  },
];

const DATASET_ACCOUNT_GROUPS_EXPENSES: AccountGroupInsert[] = [
  {
    id: '607d24b7-ab8c-4776-9e46-cef8b277c443',
    type: 'expense',
    name: 'Fixed Expenses',
    description:
      'Fixed costs are recurring, predictable expenses such as rent, utilities and debts.',
    parentGroupId: null,
  },
  {
    id: '69ed430e-f978-41cb-910e-be45b8124b58',
    type: 'expense',
    name: 'Variable Expenses',
    description:
      'Costs that change based on usage, such as groceries, fuel, dining out, entertainment, and shopping.',
    parentGroupId: null,
  },
];

const DATASET_ACCOUNT_GROUPS_INCOME: AccountGroupInsert[] = [
  {
    id: '5d41655b-635c-42a3-82ae-7b44a40fb7cd',
    type: 'income',
    name: 'Salary & Wages',
    description:
      'income earned from employment through regular work, including fixed salaries, hourly wages, and additional earnings such as bonuses or overtime.',
    parentGroupId: null,
  },
  {
    id: 'd1682653-6d15-4d15-acc8-01d3da264f0a',
    type: 'income',
    name: 'Business Income',
    description:
      'Earnings from self-employment or a business, including sales revenue, service fees, and profits after deducting expenses.',
    parentGroupId: null,
  },
  {
    id: '95da1c00-11f5-4bad-a543-2f13ce3f74f0',
    type: 'income',
    name: 'Investments & Passive Income',
    description:
      'Money earned without active work, such as dividends from stocks, interest from bonds, rental income, or royalties from intellectual property.',
    parentGroupId: null,
  },
  {
    id: '60d3d9c4-ba5d-4588-bb8d-4a1d8fc63fbf',
    type: 'income',
    name: 'Government & Social Benefits',
    description:
      'Financial support from public programs, including pensions, unemployment benefits, social security, and disability payments.',
    parentGroupId: null,
  },
  {
    id: 'fc2bed98-3e63-48e1-b1e7-49c0df04e742',
    type: 'income',
    name: 'Windfalls & Other Income',
    description:
      'Irregular or unexpected income, such as gifts, inheritances, lottery winnings, tax refunds, or cashback rewards.',
    parentGroupId: null,
  },
];

export const DATASET_ACCOUNT_GROUPS: AccountGroupInsert[] = [
  {
    id: 'f3cddbaf-cd30-4846-9a92-2b6fce7aca7e',
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
