"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  ADMIN_UPDATED_EVENT,
  getAdminActivityLog,
  getAdminBrandQueue,
  getAdminOverview,
  getDisputeDecisionStatus,
  getProductModerationStatus,
  markBrandVerified,
  updateBrandApproval,
  updateDisputeDecision,
  updateProductModeration,
} from "@/services/admin";
import { BRAND_PORTAL_UPDATED_EVENT, getBrandProducts } from "@/services/brand-portal";
import { getDemoOrders, ORDERS_UPDATED_EVENT } from "@/services/orders";
import type { AdminActivityLogItem, AdminBrandSubmission } from "@/types/admin";
import type { Order } from "@/types/order";
import type { BrandPortalProduct } from "@/types/product";
import { formatCents } from "@/utils/money";
import { routes } from "@/utils/routes";

type AdminTab = "overview" | "brands" | "disputes" | "products" | "reports";

const adminTabs: { id: AdminTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "brands", label: "Brands" },
  { id: "disputes", label: "Disputes" },
  { id: "products", label: "Products" },
  { id: "reports", label: "Reports" },
];

export function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [brandQueue, setBrandQueue] = useState<AdminBrandSubmission[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<BrandPortalProduct[]>([]);
  const [activityLog, setActivityLog] = useState<AdminActivityLogItem[]>([]);

  function syncAdminData() {
    setBrandQueue(getAdminBrandQueue());
    setOrders(getDemoOrders());
    setProducts(getBrandProducts());
    setActivityLog(getAdminActivityLog());
  }

  useEffect(() => {
    queueMicrotask(syncAdminData);
    window.addEventListener(ADMIN_UPDATED_EVENT, syncAdminData);
    window.addEventListener(ORDERS_UPDATED_EVENT, syncAdminData);
    window.addEventListener(BRAND_PORTAL_UPDATED_EVENT, syncAdminData);
    window.addEventListener("storage", syncAdminData);

    return () => {
      window.removeEventListener(ADMIN_UPDATED_EVENT, syncAdminData);
      window.removeEventListener(ORDERS_UPDATED_EVENT, syncAdminData);
      window.removeEventListener(BRAND_PORTAL_UPDATED_EVENT, syncAdminData);
      window.removeEventListener("storage", syncAdminData);
    };
  }, []);

  const overview = getAdminOverview();
  const disputedOrders = orders.filter((order) => order.status === "disputed");
  const flaggedProducts = products.filter((product) => getProductModerationStatus(product.id) !== "visible");
  const pendingBrands = brandQueue.filter((brand) => brand.status === "pending");

  function handleBrandStatus(brandId: string, status: "approved" | "rejected") {
    updateBrandApproval(brandId, status);
    syncAdminData();
  }

  function handleBrandVerified(brandId: string) {
    markBrandVerified(brandId);
    syncAdminData();
  }

  function handleDisputeStatus(orderId: string, status: "customer" | "brand" | "investigation") {
    updateDisputeDecision(orderId, status);
    syncAdminData();
  }

  function handleProductStatus(productId: string, status: "visible" | "flagged" | "hidden") {
    updateProductModeration(productId, status);
    syncAdminData();
  }

  return (
    <section className="admin-dashboard">
      <nav className="admin-nav" aria-label="Admin navigation">
        {adminTabs.map((tab) => (
          <button
            className={activeTab === tab.id ? "active" : ""}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === "overview" && (
        <div className="admin-section">
          <div className="portal-metrics admin-metrics">
            <article>
              <span>Total demo orders</span>
              <strong>{overview.totalOrders}</strong>
            </article>
            <article>
              <span>Total demo brands</span>
              <strong>{overview.totalBrands}</strong>
            </article>
            <article>
              <span>Total demo products</span>
              <strong>{overview.totalProducts}</strong>
            </article>
            <article>
              <span>Disputed orders</span>
              <strong>{overview.disputedOrders}</strong>
            </article>
            <article>
              <span>Pending approvals</span>
              <strong>{overview.pendingBrandApprovals}</strong>
            </article>
          </div>
          <div className="portal-grid admin-summary-grid">
            <AdminPanel title="Brand approval queue">
              <p>{pendingBrands.length} brands are waiting for admin review.</p>
              <button type="button" onClick={() => setActiveTab("brands")}>
                Review Brands
              </button>
            </AdminPanel>
            <AdminPanel title="Dispute management">
              <p>{disputedOrders.length} disputed demo orders need a decision.</p>
              <button type="button" onClick={() => setActiveTab("disputes")}>
                Review Disputes
              </button>
            </AdminPanel>
            <AdminPanel title="Product moderation">
              <p>{flaggedProducts.length} products are flagged or hidden.</p>
              <button type="button" onClick={() => setActiveTab("products")}>
                Moderate Products
              </button>
            </AdminPanel>
            <AdminPanel title="Activity log">
              <p>{activityLog.length} local admin actions recorded in this browser.</p>
              <button type="button" onClick={() => setActiveTab("reports")}>
                View Reports
              </button>
            </AdminPanel>
          </div>
        </div>
      )}

      {activeTab === "brands" && (
        <div className="admin-list" aria-label="Brand approval queue">
          {brandQueue.map((brand) => (
            <article className="admin-card" key={brand.id}>
              <div>
                <p className="eyebrow">{brand.status}{brand.verified ? " · verified" : ""}</p>
                <h2>{brand.brandName}</h2>
                <p>{brand.description || "No brand description submitted yet."}</p>
                <div className="product-meta">
                  <span>{brand.ownerName}</span>
                  <span>{brand.email}</span>
                  <span>{brand.city}, {brand.state}</span>
                  <span>{brand.pickupAvailable ? "Pickup available" : "Shipping only"}</span>
                </div>
              </div>
              <div className="admin-actions">
                <button type="button" onClick={() => handleBrandStatus(brand.id, "approved")}>
                  Approve
                </button>
                <button type="button" onClick={() => handleBrandStatus(brand.id, "rejected")}>
                  Reject
                </button>
                <button type="button" onClick={() => handleBrandVerified(brand.id)}>
                  Mark Verified
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {activeTab === "disputes" && (
        <div className="admin-list" aria-label="Disputed orders">
          {disputedOrders.length === 0 ? (
            <AdminEmptyState title="No disputed demo orders" body="Create a demo order and report something went wrong to test dispute handling." />
          ) : (
            disputedOrders.map((order) => (
              <article className="admin-card" key={order.id}>
                <div>
                  <p className="eyebrow">Decision: {getDisputeDecisionStatus(order.id).replaceAll("_", " ")}</p>
                  <h2>{order.id}</h2>
                  <p><strong>Reason:</strong> {order.dispute?.reason ?? "No reason provided."}</p>
                  <p><strong>Notes:</strong> {order.dispute?.notes ?? "No notes provided."}</p>
                  <p>Total: {formatCents(order.totalCents)}</p>
                  <Link className="secondary-link" href={`${routes.orders}/${order.id}`}>
                    View order
                  </Link>
                </div>
                <div className="admin-actions">
                  <button type="button" onClick={() => handleDisputeStatus(order.id, "customer")}>
                    Favor Customer
                  </button>
                  <button type="button" onClick={() => handleDisputeStatus(order.id, "brand")}>
                    Favor Brand
                  </button>
                  <button type="button" onClick={() => handleDisputeStatus(order.id, "investigation")}>
                    Needs Investigation
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}

      {activeTab === "products" && (
        <div className="admin-list" aria-label="Product moderation">
          {products.map((product) => {
            const moderationStatus = getProductModerationStatus(product.id);

            return (
              <article className="admin-card" key={product.id}>
                <div>
                  <p className="eyebrow">{moderationStatus}</p>
                  <h2>{product.name}</h2>
                  <p>{product.description}</p>
                  <div className="product-meta">
                    <span>{product.brandName}</span>
                    <span>{product.category}</span>
                    <span>{formatCents(product.salePriceCents ?? product.priceCents)}</span>
                    <span>{product.soldOut ? "Sold out" : "Available"}</span>
                  </div>
                </div>
                <div className="admin-actions">
                  <button type="button" onClick={() => handleProductStatus(product.id, "flagged")}>
                    Flag
                  </button>
                  <button
                    className={moderationStatus === "hidden" ? "muted-action" : "primary-action"}
                    type="button"
                    onClick={() => handleProductStatus(product.id, "hidden")}
                  >
                    Hide
                  </button>
                  <button
                    className={moderationStatus === "hidden" ? "primary-action" : "muted-action"}
                    type="button"
                    onClick={() => handleProductStatus(product.id, "visible")}
                  >
                    Restore
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {activeTab === "reports" && (
        <div className="portal-grid admin-summary-grid">
          <AdminPanel title="Demo reports">
            <ul>
              <li>{pendingBrands.length} pending brand approvals.</li>
              <li>{disputedOrders.length} open disputed orders.</li>
              <li>{flaggedProducts.length} moderated products.</li>
              <li>{activityLog.length} admin actions stored locally.</li>
            </ul>
          </AdminPanel>
          <AdminPanel title="Activity log">
            <div className="admin-activity-log">
              {activityLog.length === 0 ? (
                <p>No admin actions recorded yet.</p>
              ) : (
                activityLog.map((item) => (
                  <p key={item.id}>
                    <strong>{item.action}</strong>
                    <span>{item.target} · {new Date(item.createdAt).toLocaleString()}</span>
                  </p>
                ))
              )}
            </div>
          </AdminPanel>
        </div>
      )}
    </section>
  );
}

function AdminPanel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <article className="portal-panel admin-panel">
      <h2>{title}</h2>
      {children}
    </article>
  );
}

function AdminEmptyState({ title, body }: { title: string; body: string }) {
  return (
    <article className="admin-card">
      <div>
        <h2>{title}</h2>
        <p>{body}</p>
      </div>
    </article>
  );
}
