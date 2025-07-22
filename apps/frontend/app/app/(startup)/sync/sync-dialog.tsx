import type { Session } from '@/lib/better-auth/auth-client';
import { useState } from 'react';
import type { StepProps } from '../step';
import { StepDialog } from '../step-dialog';
import { StepAuthPasskey } from './steps/step-auth-passkey';
import { StepSync } from './steps/step-sync';

export const SyncDialog = ({ session }: { session: Session }) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [enableNext, setEnableNext] = useState<boolean>(false);

  const steps: StepProps[] = [
    {
      order: 1,
      title: 'Authenticate via Passkey',
      description:
        'Once you tap the button below, the Passkey prompt will appear. Follow the instructions to complete authentication using your existing Passkey.',
      Component: <StepAuthPasskey session={session} setEnableNext={setEnableNext} />,
    },
    {
      order: 2,
      title: 'Sync Database',
      Component: <StepSync />,
    },
  ];

  return (
    <StepDialog
      steps={steps}
      currentStep={currentStep}
      setCurrentStep={setCurrentStep}
      enableNext={enableNext}
    />
  );
};
