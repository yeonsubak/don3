import { useGlobalContext } from '@/app/app/global-context';
import { useIsMobile } from '@/components/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { SheetClose, SheetFooter } from '@/components/ui/sheet';
import { QUERIES } from '@/lib/tanstack-queries';
import { cn } from '@/lib/utils';
import { getAccountsService } from '@/services/helper';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useState, type ComponentProps } from 'react';
import { useAccountDrawerContext } from './drawer-context';

export const ArchiveAlert = () => {
  const { setAccountGroups } = useGlobalContext();
  const { account, setOpen, selectedTab } = useAccountDrawerContext();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const CANCEL_BUTTON_LABEL = 'Cancel';

  const SaveButton = ({ ...props }: ComponentProps<typeof Button>) => (
    <Button type="button" variant="default" disabled={isProcessing} {...props}>
      {isProcessing ? <LoaderCircle className={cn('h-4 w-4 animate-spin')} /> : <span>Save</span>}
    </Button>
  );

  async function handleSubmit() {
    setIsProcessing(true);
    try {
      if (!account) throw new Error('The account object is undefined');

      const accountsService = await getAccountsService();
      await accountsService.archiveAccount(account.id);

      const refreshedAccountGroups = await accountsService.getAllAccountGroups();
      setAccountGroups(refreshedAccountGroups);

      const query = QUERIES.accounts.accountGroupsByCountry(selectedTab, true);
      const newData = await accountsService.getAcountsByCountry(selectedTab, true);
      queryClient.setQueryData(query.queryKey, newData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
      setOpen(false);
    }
  }

  return (
    <>
      <div className={cn('break-keep', isMobile ? 'px-4 py-2' : '')}>
        <p className="mb-1 text-pretty">
          Are you sure you want to archive the account{' '}
          <span className="font-bold">
            {'"'}
            {account?.name}
            {'"'}
          </span>
          ?
        </p>
        <p className="text-pretty">
          Unlike deleting, all transactions and records in the account will remain. You can
          reactivate it at any time from the archive.
        </p>
      </div>
      {isMobile ? (
        <SheetFooter>
          <SaveButton onClick={handleSubmit} />
          <SheetClose asChild>
            <Button variant="outline">{CANCEL_BUTTON_LABEL}</Button>
          </SheetClose>
        </SheetFooter>
      ) : (
        <DialogFooter className="mt-4">
          <SaveButton className="w-20" onClick={handleSubmit} />
          <DialogClose asChild>
            <Button variant="outline">{CANCEL_BUTTON_LABEL}</Button>
          </DialogClose>
        </DialogFooter>
      )}
    </>
  );
};
