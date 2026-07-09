import Link from "next/link";
import type { ReactNode } from "react";
import type { StarterCard } from "@/types/threadocal";
import { accountNavItems } from "@/lib/threadocal";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/layout/Breadcrumbs";
import { ThreadocalFooter } from "@/components/layout/ThreadocalFooter";
import { ThreadocalNav } from "@/components/navigation/ThreadocalNav";

type ThreadocalPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children?: ReactNode;
  cards?: StarterCard[];
  breadcrumbs?: BreadcrumbItem[];
};

export function ThreadocalPage({
  eyebrow,
  title,
  intro,
  children,
  cards = [],
  breadcrumbs = [],
}: ThreadocalPageProps) {
  return (
    <main>
      <ThreadocalNav />
      <Breadcrumbs items={breadcrumbs} />
      <section className="starter-hero">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </section>

      {children}

      {cards.length > 0 && (
        <section className="starter-grid" aria-label={`${title} highlights`}>
          {cards.map((card) => (
            <article className="starter-card" key={card.title}>
              <h2>{card.title}</h2>
              <p>{card.body}</p>
            </article>
          ))}
        </section>
      )}

      <section className="quick-links" aria-label="Account links">
        {accountNavItems.map((item) => (
          <Link href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </section>

      <ThreadocalFooter />
    </main>
  );
}
