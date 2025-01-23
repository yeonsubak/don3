import * as Primitive from '@/components/ui/breadcrumb';

type Breadcrumb = {
  href: string;
  name: string;
  idx: number;
  length: number;
};

const BreadcrumbItem = ({ href, name, idx, length }: Breadcrumb) => (
  <>
    <Primitive.BreadcrumbItem>
      {idx < length - 1 ? (
        <Primitive.BreadcrumbLink href={href} className="capitalize">
          {name}
        </Primitive.BreadcrumbLink>
      ) : (
        <Primitive.BreadcrumbPage className="capitalize">{name}</Primitive.BreadcrumbPage>
      )}
    </Primitive.BreadcrumbItem>
    {idx < length - 1 ? <Primitive.BreadcrumbSeparator /> : <></>}
  </>
);

export const Breadcrumb = ({ pathname, className }: { pathname: string; className?: string }) => {
  const paths = pathname.split('/');
  const breadcrumbs: Breadcrumb[] = [];
  paths.reduce((acc, cur, idx) => {
    const path = acc + '/' + cur;
    breadcrumbs.push({
      href: path,
      name: cur.replaceAll('-', ' '),
      idx,
      length: paths.length,
    });
    return path;
  });

  return (
    <Primitive.Breadcrumb className={className}>
      <Primitive.BreadcrumbList>
        {breadcrumbs.map((e) => (
          <BreadcrumbItem key={e.href} {...e} />
        ))}
      </Primitive.BreadcrumbList>
    </Primitive.Breadcrumb>
  );
};
