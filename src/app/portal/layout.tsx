"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

// ─── Icon helper (Material Symbols via CSS class) ───
function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined inline-flex items-center justify-center ${className}`}
      style={{
        fontSize: "20px",
        width: "20px",
        height: "20px",
        lineHeight: "1",
        fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
      }}
    >
      {name}
    </span>
  );
}

const navItems = [
  { label: "Dashboard", href: "/portal/dashboard", icon: "dashboard" },
  { label: "Incoming RFQs", href: "/portal/rfqs", icon: "request_quote" },
  { label: "My Quotation", href: "/portal/quotation_rfqs", icon: "description" },
  { label: "My Orders", href: "/portal/orders", icon: "shopping_cart" },
  { label: "My Deliveries", href: "/portal/my_deliveries", icon: "inventory_2" },
  { label: "Advance Shipping", href: "/portal/asn", icon: "local_shipping" },
  { label: "My Invoices", href: "/portal/invoices", icon: "receipt_long" },
  { label: "My Messages", href: "/portal/messages", icon: "mail" },
  { label: "My Reports", href: "/portal/reports", icon: "bar_chart" },
  { label: "My Contracts", href: "/portal/my_contracts", icon: "contract" },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; role: string; supplierCode: string } | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [globalSearch, setGlobalSearch] = useState("");

  const handleGlobalSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && globalSearch.trim()) {
      router.push(`/portal/orders?po=${globalSearch.trim()}`);
    }
  };

  /* ─── Screen Resize Listener for Responsiveness ─── */
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024; // Use 1024px for smoother tablet and desktop breakpoint transition
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* ─── Auto-close sidebar on route change on mobile ─── */
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  /* ─── Auth Check ─── */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/getUserDetails");
        const data = await res.json();
        if (res.ok && data.success !== false) {
          setUser({
            username: data.username || data.UserName || "supplier_user",
            role: data.role || "Supplier",
            supplierCode: data.supplierCode || "—",
          });
        } else {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      } finally {
        setCheckingAuth(false);
      }
    })();
  }, [router]);

  /* ─── Logout ─── */
  const handleLogout = async () => {
    try { await fetch("/api/logout", { method: "POST" }); } catch { /* noop */ }
    router.push("/login");
  };

  /* ─── Header title from pathname ─── */
  const pageTitle =
    pathname === "/portal/dashboard" ? "Analytical Dashboard" :
      pathname.startsWith("/portal/orders") ? "Purchase Orders Workspace" :
        pathname.startsWith("/portal/my_deliveries") ? "My Deliveries" :
          pathname.startsWith("/portal/asn") ? "Advance Shipping Notification" :
            pathname.startsWith("/portal/invoices") ? "Invoice & Accounts Settlement" :
            pathname.startsWith("/portal/rfqs") ? "Request for Quotation" :
              pathname.startsWith("/portal/messages") ? "Internal Communications" :
                pathname.startsWith("/portal/reports") ? "Operational Reports" :
                  pathname.startsWith("/portal/company") ? "Company & User Management" :
                    pathname.startsWith("/portal/products") ? "Product Catalogue Management" :
                      pathname.startsWith("/portal/admin/approvals") ? "Catalogue Approvals Workspace" :
                        pathname.startsWith("/portal/admin/contracts") ? "Contract Management Hub" :
                          pathname.startsWith("/portal/supplier/products") ? "Available Material Catalogue" :
                            pathname.startsWith("/portal/supplier/propose") ? "Propose New Procurement Product" :
                              pathname.startsWith("/portal/supplier/status") ? "My Catalog Mappings & Status" :
                                "Supplier Portal";

  /* ─── Loading spinner ─── */
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest" style={{ fontFamily: "var(--font-label)" }}>
          Verifying session…
        </span>
      </div>
    );
  }

  return (
    <>
      {/* ─── Material Symbols font ─── */}
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />

      <div className="min-h-screen flex bg-slate-100 overflow-hidden">

        {/* ══════════════ SIDEBAR ══════════════ */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 transition-opacity duration-300"
          />
        )}
        <aside
          className={`
            h-screen fixed left-0 top-0 z-40 flex flex-col
            bg-[#0F172A] border-r border-slate-800 shadow-xl
            transition-all duration-300
            ${isMobile
              ? `w-64 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`
              : (sidebarOpen ? "w-64" : "w-16")
            }
          `}
        >
          {/* Brand Header */}
          <div className="h-16 flex items-center gap-3 px-4 border-b border-slate-800 bg-[#0a0f1e] shrink-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-8 h-8 rounded-lg bg-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg shadow-blue-900/40 hover:bg-blue-600 transition-colors focus:outline-none cursor-pointer"
              title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              S
            </button>
            {sidebarOpen && (
              <div className="overflow-hidden flex-1 text-left">
                <p className="text-white font-bold text-xs tracking-wide leading-tight" style={{ fontFamily: "var(--font-headline)" }}>
                  SUPPLIER PORTAL
                </p>
                <p className="text-[9px] text-indigo-400 font-semibold tracking-widest uppercase" style={{ fontFamily: "var(--font-label)" }}>
                  Enterprise Edition
                </p>
              </div>
            )}
          </div>

          {/* Nav Links */}
          <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
            <Suspense fallback={<div className="text-slate-500 text-[9px] font-bold p-3">Loading menu...</div>}>
              <SidebarLinks user={user} sidebarOpen={sidebarOpen} pathname={pathname} />
            </Suspense>
          </nav>

          {/* User Footer */}
          <div className="p-3 border-t border-slate-800 bg-[#0a0f1e] shrink-0">
            {sidebarOpen && (
              <div className="flex items-center gap-3 px-2 py-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-700/30 border border-blue-700/50 flex items-center justify-center text-blue-300 font-bold text-xs shrink-0">
                  {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-[11px] font-bold text-slate-200 leading-none truncate" style={{ fontFamily: "var(--font-headline)" }}>
                    {user?.username}
                  </p>
                  <p className="text-[9px] text-slate-500 mt-0.5" style={{ fontFamily: "var(--font-label)" }}>
                    {user?.supplierCode}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-150"
              style={{ fontFamily: "var(--font-headline)" }}
            >
              <Icon name="logout" className="shrink-0 text-rose-400" />
              {sidebarOpen && <span>Sign Out</span>}
            </button>
            {sidebarOpen && (
              <div className="text-center text-[9px] text-slate-500 font-semibold tracking-wide border-t border-slate-800/45 pt-2 mt-2">
                © Powered by Castaliaz Technologies
              </div>
            )}
          </div>
        </aside>

        {/* ══════════════ MAIN AREA ══════════════ */}
        <div
          className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
          style={{ marginLeft: isMobile ? "0" : (sidebarOpen ? "16rem" : "4rem") }}
        >
          {/* ─── Top Header Bar ─── */}
          <header className="h-16 shrink-0 bg-white border-b border-slate-200 shadow-sm flex items-center justify-between px-6 z-20 sticky top-0">
            <div className="flex items-center gap-4">
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 focus:outline-none transition shrink-0"
                >
                  <Icon name="menu" />
                </button>
              )}
              <h2
                className="text-sm font-bold text-slate-900 uppercase tracking-wide"
                style={{ fontFamily: "var(--font-headline)" }}
              >
                {pageTitle}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Search bar removed per user request */}

              {/* Notification bell removed per user request */}

              {/* Profile dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                >
                  <div className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-[10px]">
                    {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-[11px] font-bold text-slate-800 leading-none" style={{ fontFamily: "var(--font-headline)" }}>
                      {user?.username}
                    </p>
                    <span className="text-[9px] text-slate-500 block mt-0.5" style={{ fontFamily: "var(--font-label)" }}>
                      {user?.role}
                    </span>
                  </div>
                  <Icon name="expand_more" className="text-slate-400 text-sm" />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-50 animate-fade-in">
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-xs font-bold text-slate-800" style={{ fontFamily: "var(--font-headline)" }}>
                        {user?.username}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5" style={{ fontFamily: "var(--font-label)" }}>
                        {user?.role === "Admin" ? "Admin Code:" : "Supplier Code:"} {user?.supplierCode}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    >
                      <Icon name="logout" className="text-rose-500" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* ─── Page Content ─── */}
          <main className="flex-1 overflow-y-auto p-6 bg-slate-100 flex flex-col justify-between">
            <div className="flex-1">
              {children}
            </div>
            <footer className="mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              © Powered by Castaliaz Technologies
            </footer>
          </main>
        </div>
      </div>
    </>
  );
}

function SidebarLinks({ user, sidebarOpen, pathname }: { user: any; sidebarOpen: boolean; pathname: string }) {
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const tab = searchParams.get("tab");

  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            title={!sidebarOpen ? item.label : undefined}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150
              ${isActive
                ? "bg-blue-700 text-white shadow-md shadow-blue-900/20"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
              }
            `}
            style={{ fontFamily: "var(--font-headline)" }}
          >
            <Icon name={item.icon} className={`shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
            {sidebarOpen && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}

      {/* Admin-only section */}
      {user?.role === "Admin" && sidebarOpen && (
        <>
          <div className="pt-4 mt-4 border-t border-slate-800 space-y-1">
            <p className="px-3 mb-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest" style={{ fontFamily: "var(--font-label)" }}>
              Administration
            </p>
            <Link
              href="/portal/company"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${pathname.startsWith("/portal/company")
                ? "bg-blue-700 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              style={{ fontFamily: "var(--font-headline)" }}
            >
              <Icon name="manage_accounts" className="shrink-0 text-amber-400" />
              <span>Company &amp; Users</span>
            </Link>
            <Link
              href="/portal/admin/approvals"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${pathname.startsWith("/portal/admin/approvals")
                ? "bg-blue-700 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              style={{ fontFamily: "var(--font-headline)" }}
            >
              <Icon name="fact_check" className="shrink-0 text-orange-400" />
              <span>Pending Approvals</span>
            </Link>
          </div>

          <div className="pt-4 mt-4 border-t border-slate-800 space-y-1">
            <p className="px-3 mb-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest" style={{ fontFamily: "var(--font-label)" }}>
              Organization Catalogue
            </p>
            <Link
              href="/portal/products"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${pathname === "/portal/products"
                ? "bg-blue-700 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              style={{ fontFamily: "var(--font-headline)" }}
            >
              <Icon name="inventory" className="shrink-0 text-indigo-400" />
              <span>Product Master</span>
            </Link>

            {/* <Link
              href="/portal/admin/contracts"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${pathname.startsWith("/portal/admin/contracts")
                ? "bg-blue-700 text-white"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              style={{ fontFamily: "var(--font-headline)" }}
            >
              <Icon name="description" className="shrink-0 text-teal-400" />
              <span>Contract Management</span>
            </Link> */}

          </div>
        </>
      )}
      {user?.role === "Admin" && !sidebarOpen && (
        <div className="pt-4 mt-4 border-t border-slate-800 space-y-1">
          <Link
            href="/portal/company"
            title="Company & Users"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-150 ${pathname.startsWith("/portal/company")
              ? "bg-blue-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
          >
            <Icon name="manage_accounts" className="shrink-0 text-amber-400" />
          </Link>
          <Link
            href="/portal/admin/approvals"
            title="Pending Approvals"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-150 ${pathname.startsWith("/portal/admin/approvals")
              ? "bg-blue-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
          >
            <Icon name="fact_check" className="shrink-0 text-orange-400" />
          </Link>
          <Link
            href="/portal/products"
            title="Product Master"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-150 ${pathname === "/portal/products"
              ? "bg-blue-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
          >
            <Icon name="inventory" className="shrink-0 text-indigo-400" />
          </Link>

          {/* <Link
            href="/portal/admin/contracts"
            title="Contract Management"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-150 ${pathname.startsWith("/portal/admin/contracts")
              ? "bg-blue-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
          >
            <Icon name="description" className="shrink-0 text-teal-400" />
          </Link> */}

        </div>
      )}

      {/* Supplier-only section */}
      {user?.role !== "Admin" && sidebarOpen && (
        <div className="pt-4 mt-4 border-t border-slate-800 space-y-1">
          <p className="px-3 mb-2 text-[9px] font-bold text-slate-500 uppercase tracking-widest" style={{ fontFamily: "var(--font-label)" }}>
            Supplier Catalogue
          </p>
          <Link
            href="/portal/supplier/products"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${pathname === "/portal/supplier/products" && !action
              ? "bg-blue-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            style={{ fontFamily: "var(--font-headline)" }}
          >
            <Icon name="storefront" className="shrink-0 text-sky-400" />
            <span>Available Products</span>
          </Link>
          <Link
            href="/portal/supplier/products?action=register"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${pathname === "/portal/supplier/products" && action === "register"
              ? "bg-blue-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            style={{ fontFamily: "var(--font-headline)" }}
          >
            <Icon name="app_registration" className="shrink-0 text-amber-400" />
            <span>Register Existing Product</span>
          </Link>
          <Link
            href="/portal/supplier/upload"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${pathname === "/portal/supplier/upload"
              ? "bg-blue-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            style={{ fontFamily: "var(--font-headline)" }}
          >
            <Icon name="upload" className="shrink-0 text-blue-400" />
            <span>Product Upload</span>
          </Link>
          <Link
            href="/portal/supplier/propose"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${pathname.startsWith("/portal/supplier/propose")
              ? "bg-blue-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            style={{ fontFamily: "var(--font-headline)" }}
          >
            <Icon name="add_to_photos" className="shrink-0 text-indigo-400" />
            <span>Propose New Product</span>
          </Link>
          <Link
            href="/portal/supplier/status?tab=price"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${pathname.startsWith("/portal/supplier/status") && tab === "price"
              ? "bg-blue-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            style={{ fontFamily: "var(--font-headline)" }}
          >
            <Icon name="payments" className="shrink-0 text-amber-500" />
            <span>Price Approval</span>
          </Link>
          <Link
            href="/portal/supplier/status?tab=mapping"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 ${pathname.startsWith("/portal/supplier/status") && (tab === "mapping" || !tab)
              ? "bg-blue-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            style={{ fontFamily: "var(--font-headline)" }}
          >
            <Icon name="assignment_turned_in" className="shrink-0 text-emerald-400" />
            <span>Approval Status</span>
          </Link>
        </div>
      )}
      {user?.role !== "Admin" && !sidebarOpen && (
        <div className="pt-4 mt-4 border-t border-slate-800 space-y-1">
          <Link
            href="/portal/supplier/products"
            title="Available Products"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-150 ${pathname === "/portal/supplier/products" && !action
              ? "bg-blue-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
          >
            <Icon name="storefront" className="shrink-0 text-sky-400" />
          </Link>
          <Link
            href="/portal/supplier/products?action=register"
            title="Register Existing Product"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-150 ${pathname === "/portal/supplier/products" && action === "register"
              ? "bg-blue-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
          >
            <Icon name="app_registration" className="shrink-0 text-amber-400" />
          </Link>
          <Link
            href="/portal/supplier/upload"
            title="Product Upload"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-150 ${pathname === "/portal/supplier/upload"
              ? "bg-blue-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
          >
            <Icon name="upload" className="shrink-0 text-blue-400" />
          </Link>
          <Link
            href="/portal/supplier/propose"
            title="Propose New Product"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-150 ${pathname.startsWith("/portal/supplier/propose")
              ? "bg-blue-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
          >
            <Icon name="add_to_photos" className="shrink-0 text-indigo-400" />
          </Link>
          <Link
            href="/portal/supplier/status?tab=price"
            title="Price Approval"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-150 ${pathname.startsWith("/portal/supplier/status") && tab === "price"
              ? "bg-blue-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
          >
            <Icon name="payments" className="shrink-0 text-amber-500" />
          </Link>
          <Link
            href="/portal/supplier/status?tab=mapping"
            title="Approval Status"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all duration-150 ${pathname.startsWith("/portal/supplier/status") && (tab === "mapping" || !tab)
              ? "bg-blue-700 text-white"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
          >
            <Icon name="assignment_turned_in" className="shrink-0 text-emerald-400" />
          </Link>
        </div>
      )}
    </>
  );
}
