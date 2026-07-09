import Link from "next/link";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { routes } from "@/utils/routes";

export function ThreadocalFooter() {
  return (
    <footer>
      <section className="footer-grid">
        <div>
          <strong>{APP_NAME.toUpperCase()}</strong>
          <p>{APP_TAGLINE}</p>
        </div>
        <nav aria-label="Customer footer navigation">
          <h2>Customer</h2>
          <Link href={routes.account}>My Account</Link>
          <Link href={`${routes.account}#orders`}>Orders</Link>
          <Link href={`${routes.account}#favorites`}>Favorites</Link>
          <Link href={routes.cart}>Cart</Link>
        </nav>
        <nav aria-label="Business footer navigation">
          <h2>Business</h2>
          <Link href={routes.brandDashboard}>Brand Dashboard</Link>
          <Link href={routes.brandProducts}>Products</Link>
          <Link href={routes.brandOrders}>Orders</Link>
          <Link href={routes.brandSubmit}>Become a Brand</Link>
        </nav>
      </section>
    </footer>
  );
}
