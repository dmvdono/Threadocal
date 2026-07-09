import Link from "next/link";
import { routes } from "@/utils/routes";

const brandPortalLinks = [
  { href: routes.brandDashboard, label: "Overview" },
  { href: routes.brandProducts, label: "Products" },
  { href: routes.brandInventory, label: "Inventory" },
  { href: routes.brandOrders, label: "Orders" },
  { href: routes.brandCoupons, label: "Coupons" },
  { href: routes.brandAnalytics, label: "Analytics" },
];

export function BrandPortalNav() {
  return (
    <nav className="brand-portal-nav" aria-label="Brand dashboard navigation">
      {brandPortalLinks.map((link) => (
        <Link href={link.href} key={link.href}>
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
