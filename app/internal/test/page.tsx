import { Combobox, type ComboboxItem } from '@/components/primitives/combobox';

const items: ComboboxItem[] = [
  {
    label: 'South Korea',
    value: 'South Korea',
    children: [
      {
        label: 'Assets',
        value: 'Assets',
        children: [
          {
            label: 'Calendar',
            value: 'Calendar',
          },
          {
            label: 'Search Emoji',
            value: 'Search Emoji',
          },
          {
            label: 'Calculator',
            value: 'Calculator',
          },
        ],
      },
    ],
  },
  {
    label: 'Poland',
    value: 'Poland',
    children: [
      {
        label: 'Profile',
        value: 'Profile',
      },
      {
        label: 'Billing',
        value: 'Billing',
      },
      {
        label: 'Settings',
        value: 'Settings',
      },
    ],
  },
];

export default function Test() {
  return (
    <div className="w-96">
      <Combobox items={items} />
    </div>
  );
}
