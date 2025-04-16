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
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Plus } from '@phosphor-icons/react';
import { useMediaQuery } from 'usehooks-ts';
import { ManageAccountCard } from '../manage-account-card';
import { useAccountDrawerContext } from './drawer-context';

export const AddAccountDrawer = () => {
  const { open, setOpen } = useAccountDrawerContext();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const MODAL_TITLE = 'Add an account';
  const MODAL_CANCEL_BUTTON_LABEL = 'Cancel';

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[540px]">
          <DialogHeader>
            <DialogTitle>{MODAL_TITLE}</DialogTitle>
            <DialogDescription></DialogDescription>
          </DialogHeader>
          <ManageAccountCard
            footer={
              <DialogFooter className="mt-4">
                <SaveButton />
                <DialogClose asChild>
                  <Button variant="outline">{MODAL_CANCEL_BUTTON_LABEL}</Button>
                </DialogClose>
              </DialogFooter>
            }
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" closeBtnOnHeader={false} className="gap-1">
        <SheetHeader>
          <SheetTitle className="text-xl">{MODAL_TITLE}</SheetTitle>
        </SheetHeader>
        <ManageAccountCard
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
};

const SaveButton = () => (
  <Button type="submit" variant="default" disableOnProcess>
    Save
  </Button>
);

export const AddAccountButton = () => {
  const { setOpen } = useAccountDrawerContext();

  return (
    <Button variant="outline" size="icon" onClick={() => setOpen(true)}>
      <Plus size={24} />
    </Button>
  );
};
