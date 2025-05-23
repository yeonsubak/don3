'use client';

import { useIsMobile } from '@/components/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useTransactionDrawerContext } from './drawer-context';
import { TransactionFormTab } from './transaction-form-tab';

export const AddTransactionDrawer = () => {
  const { open, setOpen } = useTransactionDrawerContext();
  const isMobile = useIsMobile();

  const TRIGGER_BUTTON_LABEL = 'Add';
  const MODAL_TITLE = 'Add a record';
  const MODAL_CANCEL_BUTTON_LABEL = 'Cancel';

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="default" className="w-full text-lg">
            {TRIGGER_BUTTON_LABEL}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" closeBtnOnHeader={false} className="gap-1">
          <SheetHeader>
            <SheetTitle className="text-xl">{MODAL_TITLE}</SheetTitle>
          </SheetHeader>
          <TransactionFormTab
            footer={
              <SheetFooter className="px-0">
                <SaveButton />
                <SheetClose asChild>
                  <Button variant="outline">{MODAL_CANCEL_BUTTON_LABEL}</Button>
                </SheetClose>
              </SheetFooter>
            }
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="px-6 text-lg dark:text-white">
          {TRIGGER_BUTTON_LABEL}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{MODAL_TITLE}</DialogTitle>
          <DialogDescription></DialogDescription>
        </DialogHeader>
        <TransactionFormTab
          footer={
            <DialogFooter>
              <SaveButton />
              <DialogClose asChild>
                <Button variant="outline">{MODAL_CANCEL_BUTTON_LABEL}</Button>
              </DialogClose>
            </DialogFooter>
          }
        ></TransactionFormTab>
      </DialogContent>
    </Dialog>
  );
};

const SaveButton = () => (
  <Button type="submit" variant="default" disableOnProcess>
    Save
  </Button>
);
