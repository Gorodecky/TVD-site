import { ChevronRight } from 'lucide-react';

type BreadcrumbItem = { label: string; current?: boolean };
type BreadcrumbsProps = { items: BreadcrumbItem[]; className?: string };

export default function Breadcrumbs({ items, className = 'breadcrumbs' }: BreadcrumbsProps) {
  return <div className={className}>{items.flatMap((item, index) => [
    ...(index ? [<ChevronRight size={13} key={`separator-${index}`} />] : []),
    item.current ? <b key={item.label}>{item.label}</b> : <span key={item.label}>{item.label}</span>,
  ])}</div>;
}
