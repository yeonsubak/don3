'use client';

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
import { useMediaQuery } from 'usehooks-ts';
import { useTransactionDrawerContext } from './drawer-context';
import { TransactionFormTab } from './transaction-form-tab';

export const AddTransactionDrawer = () => {
  const { open, setOpen } = useTransactionDrawerContext();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="default" className="px-6 text-lg">
            Add
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Add transaction</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <TransactionFormTab
            footer={
              <DialogFooter>
                <LocalButton />
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
              </DialogFooter>
            }
          ></TransactionFormTab>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="default" className="w-full text-lg">
          Add
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" closeBtnOnHeader={false} className="gap-1">
        <SheetHeader>
          <SheetTitle className="text-xl">Add record</SheetTitle>
        </SheetHeader>
        <TransactionFormTab
          footer={
            <SheetFooter className="px-0">
              <LocalButton />
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
            </SheetFooter>
          }
        />
      </SheetContent>
    </Sheet>
  );
};

const LocalButton = () => (
  <Button type="submit" variant="default" disableOnProcess>
    Save
  </Button>
);
