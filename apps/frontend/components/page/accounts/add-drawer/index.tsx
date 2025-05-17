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
import { useAccountDrawerContext } from './drawer-context';
import { ManageAccountCard } from './manage-account-card';

export const AddAccountButton = ({ countryCode }: { countryCode: string }) => {
  const { setOpen, setCountryCode } = useAccountDrawerContext();

  const handleClick = () => {
    setCountryCode(countryCode);
    setOpen(true);
  };

  return (
    <Button variant="outline" size="icon" onClick={handleClick}>
      <Plus size={24} />
    </Button>
  );
};

export const AddAccountDrawer = () => {
  const { open, setOpen } = useAccountDrawerContext();
  const isMobile = useIsMobile();

  const MODAL_TITLE = 'Add an account';
  const MODAL_CANCEL_BUTTON_LABEL = 'Cancel';

  const SaveButton = () => (
    <Button type="submit" variant="default" disableOnProcess>
      Save
    </Button>
  );

  if (isMobile) {
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
  }

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
};
