"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ThreadocalSearch } from "@/components/navigation/ThreadocalSearch";
import { mainNavItems } from "@/lib/threadocal";
import { APP_NAME } from "@/lib/constants";
import { CART_UPDATED_EVENT, getCartItemCount } from "@/services/cart";
import { CUSTOMER_UPDATED_EVENT, getFavoriteBrandSlugs, getFavoriteProductIds } from "@/services/customer";
import { routes } from "@/utils/routes";

export function ThreadocalNav() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [openMenu, setOpenMenu] = useState<"brands" | "account" | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const brandsMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function syncCartCount() {
      setCartCount(getCartItemCount());
    }

    syncCartCount();
    window.addEventListener(CART_UPDATED_EVENT, syncCartCount);
    window.addEventListener("storage", syncCartCount);

    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, syncCartCount);
      window.removeEventListener("storage", syncCartCount);
    };
  }, []);

  useEffect(() => {
    function syncSavedCount() {
      setSavedCount(getFavoriteProductIds().length + getFavoriteBrandSlugs().length);
    }

    syncSavedCount();
    window.addEventListener(CUSTOMER_UPDATED_EVENT, syncSavedCount);
    window.addEventListener("storage", syncSavedCount);

    return () => {
      window.removeEventListener(CUSTOMER_UPDATED_EVENT, syncSavedCount);
      window.removeEventListener("storage", syncSavedCount);
    };
  }, []);

  function isActivePath(href: string) {
    if (href === routes.home) {
      return pathname === routes.home;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function openDropdown(menu: "brands" | "account") {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }

    setOpenMenu(menu);
  }

  function closeDropdown() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
    }

    closeTimer.current = setTimeout(() => setOpenMenu(null), 220);
  }

  function closeOnBlur(currentTarget: EventTarget & HTMLDivElement, relatedTarget: EventTarget | null) {
    if (relatedTarget instanceof Node && currentTarget.contains(relatedTarget)) {
      return;
    }

    setOpenMenu(null);
  }

  return (
    <header className="threadbar">
      <Link className="brand" href={routes.home}>
        <Image src="/threadocal-logo.png" alt="Threadocal logo" width={50} height={50} priority />
        <span>{APP_NAME.toUpperCase()}</span>
      </Link>

      <nav className="main-nav" aria-label="Main navigation">
        {mainNavItems.map((item) => (
          item.href === routes.brands ? (
            <div
              className={`nav-menu ${openMenu === "brands" ? "open" : ""}`}
              key={item.href}
              onBlur={(event) => closeOnBlur(event.currentTarget, event.relatedTarget)}
              onFocus={() => openDropdown("brands")}
              onMouseEnter={() => openDropdown("brands")}
              onMouseLeave={closeDropdown}
              ref={brandsMenuRef}
            >
              <button
                aria-expanded={openMenu === "brands"}
                aria-haspopup="menu"
                className={`nav-dropdown-trigger ${isActivePath(item.href) ? "active" : ""}`}
                onClick={() => setOpenMenu(openMenu === "brands" ? null : "brands")}
                type="button"
              >
                {item.label}
              </button>
              <div className="nav-dropdown" role="menu">
                <Link href={routes.brands} onClick={() => setOpenMenu(null)} role="menuitem">Browse Brands</Link>
                <Link href={routes.brandSubmit} onClick={() => setOpenMenu(null)} role="menuitem">Join as a Brand</Link>
                <Link href={routes.brandDashboard} onClick={() => setOpenMenu(null)} role="menuitem">Brand Dashboard</Link>
              </div>
            </div>
          ) : (
            <Link className={isActivePath(item.href) ? "active" : ""} href={item.href} key={item.href}>
              {item.label}
            </Link>
          )
        ))}
      </nav>

      <div className="top-search">
        <ThreadocalSearch />
      </div>

      <div className="nav-actions">
        <Link className="signup" href={routes.signup}>
          Sign Up
        </Link>
        <Link className="login" href={routes.login}>
          Log In
        </Link>
        <Link className="nav-icon-link" href={`${routes.account}#favorites`} aria-label="Saved items">
          ♡<b>{savedCount}</b>
        </Link>
        <div
          className={`account-menu ${openMenu === "account" ? "open" : ""}`}
          onBlur={(event) => closeOnBlur(event.currentTarget, event.relatedTarget)}
          onFocus={() => openDropdown("account")}
          onMouseEnter={() => openDropdown("account")}
          onMouseLeave={closeDropdown}
          ref={accountMenuRef}
        >
          <button
            aria-expanded={openMenu === "account"}
            aria-haspopup="menu"
            className={`nav-icon-link ${isActivePath(routes.account) ? "active" : ""}`}
            onClick={() => setOpenMenu(openMenu === "account" ? null : "account")}
            aria-label="Customer account"
            type="button"
          >
            ☺
          </button>
          <div className="nav-dropdown account-dropdown" role="menu">
            <Link href={routes.account} onClick={() => setOpenMenu(null)} role="menuitem">My Account</Link>
            <Link href={`${routes.account}#orders`} onClick={() => setOpenMenu(null)} role="menuitem">Orders</Link>
            <Link href={`${routes.account}#favorites`} onClick={() => setOpenMenu(null)} role="menuitem">Favorites</Link>
            <Link href={`${routes.account}#following`} onClick={() => setOpenMenu(null)} role="menuitem">Following Brands</Link>
            <Link href={`${routes.account}#addresses`} onClick={() => setOpenMenu(null)} role="menuitem">Addresses</Link>
            <Link href={`${routes.account}#notifications`} onClick={() => setOpenMenu(null)} role="menuitem">Notifications</Link>
            <Link href={`${routes.account}#settings`} onClick={() => setOpenMenu(null)} role="menuitem">Settings</Link>
          </div>
        </div>
        <Link className="nav-icon-link" href={routes.cart} aria-label="Shopping cart">
          🛒<b>{cartCount}</b>
        </Link>
      </div>
    </header>
  );
}
