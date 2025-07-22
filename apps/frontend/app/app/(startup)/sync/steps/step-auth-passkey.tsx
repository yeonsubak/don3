import { PasskeyActivateButton } from '@/components/buttons/passkey-activate-button';
import { type Session } from '@/lib/better-auth/auth-client';
import { QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { type Dispatch, type SetStateAction } from 'react';

export const StepAuthPasskey = ({
  session,
  setEnableNext,
}: {
  session: Session;
  setEnableNext: Dispatch<SetStateAction<boolean>>;
}) => {
  const queryClient = useQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <PasskeyActivateButton
        className="mt-2 w-full text-base"
        session={session}
        queryClient={queryClient}
        postHook={async () => {
          setEnableNext(true);
        }}
      />
    </QueryClientProvider>
  );
};
