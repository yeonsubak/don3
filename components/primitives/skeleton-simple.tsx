import { Skeleton } from '../ui/skeleton';

export const SkeletonSimple = ({ heightInPx }: { heightInPx: number }) => {
  const repitition = Math.floor(heightInPx / 16);

  return (
    <div className="flex w-full flex-col gap-1 overflow-y-hidden" style={{ height: heightInPx }}>
      {Array.from({ length: repitition }, (_, idx) => (
        <Skeleton key={idx} className="h-4 w-full" />
      ))}
    </div>
  );
};
