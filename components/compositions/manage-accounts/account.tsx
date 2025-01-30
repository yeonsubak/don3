import { AccountIcon } from '@/components/primitives/account-icon';
import type { AccountSelect } from '@/db/drizzle/types';

type AccountProps = {
  account: AccountSelect;
};

export const Account = ({ account }: AccountProps) => {
  return (
    <div className="flex flex-row items-center gap-2">
      <AccountIcon iconValue={account.icon} />
      <p className="grow text-base">{account.name}</p>
      <div>
        <p className="font-semibold text-sky-600">$560.00</p>
        <p className="text-xs font-semibold">≈₩817,250</p>
      </div>
    </div>
  );
};
