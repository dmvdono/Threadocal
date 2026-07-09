"use client";

import Link from "next/link";
import { useState } from "react";
import { ThreadocalFooter } from "@/components/layout/ThreadocalFooter";
import { BrandCard } from "@/components/marketplace/BrandCard";
import { ThreadocalNav } from "@/components/navigation/ThreadocalNav";
import { featuredBrands } from "@/lib/threadocal";
import { routes } from "@/utils/routes";

const categoryLinks = [
  { label: "▦ All", href: routes.shop },
  { label: "👕 Menswear", href: `${routes.shop}?category=menswear` },
  { label: "👗 Womenswear", href: `${routes.shop}?category=womenswear` },
  { label: "🧸 Kidswear", href: `${routes.shop}?category=kidswear` },
  { label: "❄ Seasonal", href: `${routes.shop}?category=seasonal` },
  { label: "◉ Sportswear", href: `${routes.shop}?category=sportswear` },
  { label: "🏷 Sale", href: `${routes.shop}?category=sale` },
];

export default function Home() {
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState("25");
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  function handleLocationSearch() {
    const query = zip.trim();
    setLocationMessage(
      query
        ? `Searching near ${query}. Distance filtering will activate once brand locations are connected.`
        : "Enter a ZIP code or city to search nearby brands.",
    );
  }

  function handleUseLocation() {
    if (!("geolocation" in navigator)) {
      setLocationMessage("Location is not available in this browser.");
      return;
    }

    setLocationMessage("Requesting your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationMessage(
          `Location saved (${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(
            3,
          )}). Distance filtering will activate once brand locations are connected.`,
        );
      },
      () => {
        setLocationMessage("Location permission was denied or unavailable. You can still search by ZIP code or city.");
      },
    );
  }

  return (
    <main>
      <ThreadocalNav />

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Local fashion. National reach.</p>
          <h1>
            <span>Support local.</span>
            <strong>Wear different.</strong>
          </h1>
          <p className="hero-text">
            Threadocal connects shoppers with independent clothing brands near them.
            Discover unique styles, support small businesses, and find local pickup
            options within your area.
          </p>
        </div>

        <div className="hero-visual">
          <div className="model-card model-one"><span>LOCAL DROP</span></div>
          <div className="model-card model-two"><span>STREETWEAR</span></div>

          <div className="stat-panel">
            <p><strong>1,200+</strong><span>Local Brands</span></p>
            <p><strong>50K+</strong><span>Happy Customers</span></p>
            <p><strong>All 50 States</strong><span>One Local Community</span></p>
          </div>
        </div>

        <div className="find-panel">
          <div className="panel-title">
            <span>⌖</span>
            <div>
              <strong>Find brands near you</strong>
              <small>Search by ZIP code or city to find local clothing brands.</small>
            </div>
          </div>

          <form
            className="location-search"
            onSubmit={(event) => {
              event.preventDefault();
              handleLocationSearch();
            }}
          >
            <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="Enter ZIP code or city" />
            <button>Search →</button>
          </form>

          <button className="panel-btn" onClick={handleUseLocation} type="button"><span>◎</span><div>Use My Location<small>Find brands near you</small></div></button>
          <Link className="panel-btn" href={routes.brands}><span>▰</span><div>Browse All Brands<small>Explore every brand</small></div></Link>
          {locationMessage && <p className="filter-notice">{locationMessage}</p>}
        </div>
      </section>

      <section className="category-strip">
        {categoryLinks.map((item, i) => (
          <Link className={`tab ${i === 0 ? "active" : ""}`} href={item.href} key={item.href}>{item.label}</Link>
        ))}
      </section>

      <section className="brands-section">
        <div className="section-head">
          <div>
            <p className="eyebrow">Featured local brands</p>
            <h2>Independent drops near you</h2>
          </div>
          <Link href={routes.brands}>View all brands →</Link>
        </div>

        <div className="filters-row">
          <label><input type="checkbox" /> Partnered brands only</label>
          <select
            aria-label="Distance radius"
            onChange={(event) => {
              setRadius(event.target.value);
              setLocationMessage("Distance filtering will activate once brand locations are connected.");
            }}
            value={radius}
          >
            <option value="10">10 miles</option>
            <option value="25">25 miles</option>
            <option value="50">50 miles</option>
          </select>
          <span><strong>{featuredBrands.length} brands</strong> · {radius} mile radius selected</span>
        </div>

        <div className="brand-grid">
          {featuredBrands.map((brand) => (
            <BrandCard brand={brand} key={brand.name} />
          ))}
        </div>
      </section>

      <section className="promo-grid">
        <article className="promo bright">
          <small>FOR BRANDS</small>
          <h2>Grow Your Brand</h2>
          <p>Promote your clothing brand to thousands of local shoppers across the country.</p>
          <Link href={routes.brandSubmit}>Join as a Brand →</Link>
        </article>

        <article className="promo dark">
          <small>PROMOTE & SAVE</small>
          <h2>Exclusive Deals</h2>
          <p>Discover brand promotions, discount codes, giveaways, and special offers.</p>
          <Link href={routes.promotions}>View Promotions →</Link>
        </article>

        <article className="promo gift">
          <small>EARN REWARDS</small>
          <h2>Loyalty Perks</h2>
          <p>Create an account to earn rewards, unlock exclusive deals, and track orders.</p>
          <Link href={routes.signup}>Create Account →</Link>
        </article>
      </section>

      <section className="how">
        <div><span>◎</span><strong>Shop Local</strong><small>Support small businesses</small></div>
        <div><span>▱</span><strong>Pickup Nearby</strong><small>Many brands offer local pickup</small></div>
        <div><span>▭</span><strong>Secure Payments</strong><small>$0.50 Threadocal fee concept</small></div>
        <div><span>✩</span><strong>Real Reviews</strong><small>From real customers</small></div>
      </section>

      <section className="owner-section">
        <div>
          <p className="eyebrow">Company side</p>
          <h2>Built for local clothing brands that want visibility.</h2>
          <p>Free signup, customer pickup messages, sales insights, order tracking, promo codes, referral campaigns, loyalty programs, giveaways, and negotiable royalties.</p>
        </div>

        <div className="plan-grid">
          <article><h3>Starter</h3><strong>Free</strong><p>Add your brand profile and get listed in search.</p></article>
          <article className="highlight"><h3>Promote</h3><strong>$29/mo</strong><p>Featured placement, coupons, deal alerts, and referral campaigns.</p></article>
          <article><h3>Growth</h3><strong>Custom</strong><p>Royalties, advanced analytics, and campaign support.</p></article>
        </div>
      </section>

      <ThreadocalFooter />
    </main>
  );
}
