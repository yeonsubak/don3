import { useMemo, useRef } from 'react';

const Skeleton = ({ className }: React.ComponentProps<'div'>) => {
  const ref = useRef<HTMLElement | null>(null);
  const parentElement = useMemo(() => ref.current?.parentElement, [ref]);

  const Span = () => (
    <>
      <span className="inline-flex w-full animate-pulse rounded-md bg-gray-300 leading-none select-none">
        ‌
      </span>
      <br />
    </>
  );

  if (!parentElement) return <></>;

  if (['P', 'SPAN'].includes(parentElement?.tagName ?? '')) return <Span />;

  return (
    <div aria-live="polite" aria-busy="true" className={className}>
      <Span />
    </div>
  );
};

const SVGSkeleton = ({ className }: React.ComponentProps<'div'>) => (
  <svg className={className + ' animate-pulse rounded bg-gray-300'} />
);

export { Skeleton, SVGSkeleton };
