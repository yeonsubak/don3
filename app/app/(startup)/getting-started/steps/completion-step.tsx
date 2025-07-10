import { Check } from 'lucide-react';

export const CompletionStep = () => {
  return (
    <div className="flex grow flex-col space-y-4 py-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
        <Check className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-lg font-medium">All set!</h3>
      <p className="text-muted-foreground text-left">
        {'You are now ready to use the app. Enjoy!'}
      </p>
    </div>
  );
};
