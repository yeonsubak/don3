import { AccountIcon } from '@/components/primitives/account-icon';
import { Badge } from '@/components/ui/badge';
import { ChevronsRight } from 'lucide-react';

export const Transaction = () => {
  return (
    <div className="flex flex-row items-center gap-2">
      <AccountIcon iconValue="gift" />
      <div className="flex grow flex-col">
        <p className="-mb-1 text-xs text-slate-500">10:01</p>
        <p className="text-lg font-medium">기프티콘</p>
        <div className="flex flex-row items-center font-normal">
          <Badge variant={'default'} className="bg-sky-700">
            생활비 통장
          </Badge>
          <ChevronsRight className="h-4 w-5" />
          <Badge variant={'default'} className="bg-rose-700">
            선물
          </Badge>
        </div>
      </div>
      <p className="text-lg font-medium">₩ -30,000</p>
    </div>
  );
};
