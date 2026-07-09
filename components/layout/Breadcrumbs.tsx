import Link from "next/link";
import { routes } from "@/utils/routes";

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items?: BreadcrumbItem[];
};

export function Breadcrumbs({ items = [] }: BreadcrumbsProps) {
  const crumbs = [{ label: "Home", href: routes.home }, ...items];

  if (crumbs.length <= 1) {
    return null;
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {crumbs.map((item, index) => {
        const isLast = index === crumbs.length - 1;

        return (
          <span key={`${item.label}-${index}`}>
            {item.href && !isLast ? <Link href={item.href}>{item.label}</Link> : <span>{item.label}</span>}
          </span>
        );
      })}
    </nav>
  );
}
