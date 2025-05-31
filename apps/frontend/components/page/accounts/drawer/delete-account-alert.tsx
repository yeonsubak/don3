import { useGlobalContext } from '@/app/app/global-context';
import { useIsMobile } from '@/components/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SheetClose, SheetFooter } from '@/components/ui/sheet';
import { QUERIES } from '@/lib/tanstack-queries';
import { cn } from '@/lib/utils';
import { getAccountsService } from '@/services/helper';
import { useQueryClient } from '@tanstack/react-query';
import { LoaderCircle } from 'lucide-react';
import { useMemo, useState, type ComponentProps } from 'react';
import { useAccountDrawerContext } from './drawer-context';

export const DeleteAccountAlert = () => {
  const { setAccountGroups } = useGlobalContext();
  const { account, selectedTab, isProcessing, setIsProcessing, setOpen } =
    useAccountDrawerContext();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  const [confirmText, setConfirmText] = useState<string>('');
  const isDeleteReady = useMemo(() => confirmText === account?.name, [confirmText, account?.name]);

  const CANCEL_BUTTON_LABEL = 'Cancel';

  const DeleteButton = ({ ...props }: ComponentProps<typeof Button>) => (
    <Button
      type="button"
      variant="destructive"
      disabled={!isDeleteReady || isProcessing}
      {...props}
    >
      {isProcessing ? <LoaderCircle className={cn('h-4 w-4 animate-spin')} /> : <span>Delete</span>}
    </Button>
  );

  async function handleSubmit() {
    setIsProcessing(true);
    try {
      if (!account) throw new Error('The account object is undefined');

      const accountsService = await getAccountsService();
      await accountsService.deleteAccount(account.id);

      const refreshedAccountGroups = await accountsService.getAllAccountGroups();
      setAccountGroups(refreshedAccountGroups);

      const query = QUERIES.accounts.accountGroupsByCountry(selectedTab, true);
      const newData = await accountsService.getAcountsByCountry(selectedTab, true);
      queryClient.setQueryData(query.queryKey, newData);
    } catch (err) {
      console.error(err);
    } finally {
      setOpen(false);
    }
  }

  return (
    <>
      <div className={cn('break-keep', isMobile ? 'px-4 py-2' : '')}>
        <p className="mb-2 text-pretty">
          Are you sure you want to delete the account{' '}
          <span className="font-bold">
            {'"'}
            {account?.name}
            {'"'}
          </span>
          ?
        </p>
        <p className="mb-2 text-pretty">
          All transactions and records associated with the account will be{' '}
          <span className="text-destructive font-bold">
            permanently deleted and cannot be restored.
          </span>
        </p>
        <div>
          <p className="mb-3 text-pretty">
            To proceed deleting the account, please enter the name of the account, then click
            {" '"}Delete{"'"} button.
          </p>
          <Input
            type="text"
            placeholder={account?.name}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>
      </div>
      {isMobile ? (
        <SheetFooter>
          <DeleteButton onClick={handleSubmit} />
          <SheetClose asChild>
            <Button variant="outline">{CANCEL_BUTTON_LABEL}</Button>
          </SheetClose>
        </SheetFooter>
      ) : (
        <DialogFooter className="mt-4">
          <DeleteButton className="w-20" onClick={handleSubmit} />
          <DialogClose asChild>
            <Button variant="outline">{CANCEL_BUTTON_LABEL}</Button>
          </DialogClose>
        </DialogFooter>
      )}
    </>
  );
};
