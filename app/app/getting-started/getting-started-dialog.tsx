import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { LOCAL_STORAGE_KEYS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { AccountsOverview } from '../accounts/components/accounts-overview';
import { CompletionStep } from './steps/completion-step';
import { DefaultValueStep } from './steps/default-value-step';
import { Step, type StepProps } from './steps/step';
import { TransactionFormTab } from '@/app/app/transactions/components/drawer/transaction-form-tab';

export function GettingStartedDialog({ children }: Readonly<{ children: React.ReactNode }>) {
  const [open, setOpen] = useState<boolean>(true);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isNextProcessing, setIsNextProcessing] = useState<boolean>(false);
  const defaultValueStepRef = useRef<{ submitForm: () => Promise<void> }>(null);

  const gettingStartedSteps: StepProps[] = [
    {
      order: 1,
      title: 'Default country & currency',
      description: 'Please select the default country and currency for the initial setup.',
      children: <DefaultValueStep ref={currentStep === 0 ? defaultValueStepRef : null} />,
      onNext: async (ref) => {
        if (ref?.submitForm) {
          await ref.submitForm();
        }
      },
    },
    {
      order: 2,
      title: 'Add accounts',
      description: 'Please add accounts that track your incomes and expenses.',
      children: <AccountsOverview className="h-[60vh]" />,
    },
    {
      order: 3,
      title: 'Add your first record',
      description:
        'You can easily add a record of your incomes and expenses by filling out the below fields.',
      children: <TransactionFormTab />,
    },
    {
      order: 4,
      title: 'All done!',
      description: 'You are ready to start using the application.',
      children: <CompletionStep />,
      onNext: async () => {
        localStorage.setItem(LOCAL_STORAGE_KEYS.APP.INITIALIZED, 'true');
      },
    },
  ];

  const totalSteps = gettingStartedSteps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const currentStepData = gettingStartedSteps[currentStep];
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  const handleNext = useCallback(async () => {
    setIsNextProcessing(true);
    if (currentStepData?.onNext) {
      await currentStepData.onNext(defaultValueStepRef.current);
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setOpen(false);
      // Reset for next time
      setTimeout(() => setCurrentStep(0), 300);
    }
    setIsNextProcessing(false);
  }, [currentStep, totalSteps, currentStepData]);

  const handleBack = useCallback(() => {
    if (currentStep > 0 && currentStepData?.onBack) {
      currentStepData.onBack();
    }
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep, currentStepData]);

  const handleClose = useCallback(() => {
    setOpen(false);
    // Reset for next time
    setTimeout(() => setCurrentStep(0), 300);
  }, []);

  // Disable rendering on server side
  if (typeof window === 'undefined') {
    return null;
  }

  const isInitialized = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.INITIALIZED);
  const defaultCountry = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_COUNTRY);
  const defaultCurrency = localStorage.getItem(LOCAL_STORAGE_KEYS.APP.DEFAULT_CURRENCY);

  if (!isInitialized || !defaultCountry || !defaultCurrency) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="flex max-h-fit min-h-[600px] flex-col sm:max-w-[500px]"
          disableClose
        >
          <DialogHeader>
            <DialogTitle className="text-xl">Getting started</DialogTitle>
            {/* <DialogDescription className="text-left">
              This quick guide will help you get started and make the most of our features.
            </DialogDescription> */}
          </DialogHeader>

          <div className="mt-2 space-y-2">
            {/* Progress indicator */}
            <div className="space-y-1">
              <div className="text-muted-foreground flex justify-between text-xs">
                <span>
                  Step {currentStep + 1} of {totalSteps}
                </span>
                <span>{currentStepData?.title}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            {/* Current step content */}
            <div className="flex max-h-[58vh] min-h-[350px] overflow-y-auto md:max-h-[68vh]">
              <Step
                order={currentStepData.order}
                title={currentStepData?.title}
                description={currentStepData?.description}
              >
                {currentStepData.children}
              </Step>
            </div>
          </div>

          <DialogFooter className="mt-auto flex flex-row justify-between border-t pt-4 sm:justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isFirstStep}
              className={cn(
                'flex w-20 flex-row items-center justify-center gap-1',
                isFirstStep ? 'invisible' : '',
              )}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              <span className="pr-1">Back</span>
            </Button>
            <Button
              onClick={handleNext}
              className="flex w-20 flex-row items-center justify-center gap-1"
              disabled={isNextProcessing}
            >
              {isNextProcessing ? (
                <LoaderCircle className={cn('h-4 w-4 animate-spin')} />
              ) : (
                <div className={cn('flex flex-row items-center', isLastStep ? '' : 'pl-2')}>
                  {isLastStep ? 'Finish' : 'Next'}
                  {!isLastStep && <ChevronRight className="ml-1 h-4 w-4" />}
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return <>{children}</>;
}
