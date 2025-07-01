'use client';

import { useIsInit } from '@/components/hooks/use-is-init';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, LoaderCircle } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import {
  useCallback,
  useState,
  type ComponentProps,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { Step, type StepProps } from './step';

type StepDialogProps = {
  steps: StepProps[] | (() => StepProps[]);
  currentStep: number;
  setCurrentStep: Dispatch<SetStateAction<number>>;
  dialogContentProps?: ComponentProps<typeof DialogContent>;
  stepClassName?: string;
  enableNext?: boolean;
};

export const StepDialog = ({
  steps: _steps,
  currentStep,
  setCurrentStep,
  dialogContentProps,
  stepClassName,
  enableNext,
}: StepDialogProps) => {
  const { setIsInt } = useIsInit();
  const [open, setOpen] = useState<boolean>(true);
  const [isNextProcessing, setIsNextProcessing] = useState<boolean>(false);

  const router = useRouter();
  const pathname = usePathname();

  const steps = typeof _steps === 'function' ? _steps() : _steps;

  const totalSteps = steps.length;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === totalSteps - 1;
  const currentStepData = steps[currentStep];
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  const handleClose = useCallback(() => {
    setIsInt(true);
    router.push(pathname);
    router.refresh();
    setOpen(false);
  }, [pathname, router, setIsInt]);

  const handleNext = useCallback(async () => {
    setIsNextProcessing(true);
    if (currentStepData?.onNext) {
      await currentStepData.onNext();
    }
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
    setIsNextProcessing(false);
  }, [currentStepData, currentStep, totalSteps, setCurrentStep, handleClose]);

  const handleBack = useCallback(() => {
    if (currentStep > 0 && currentStepData?.onBack) {
      currentStepData.onBack();
    }
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep, currentStepData, setCurrentStep]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn('flex max-h-fit flex-col sm:max-w-[500px]', dialogContentProps?.className)}
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
          <Step
            order={currentStepData.order}
            title={currentStepData?.title}
            description={currentStepData?.description}
            Component={currentStepData.Component}
            className={stepClassName}
          />
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
            disabled={isNextProcessing || (typeof enableNext === 'undefined' ? false : !enableNext)}
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
};
