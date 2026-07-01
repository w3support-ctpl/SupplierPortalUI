"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: "20px", fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
    >
      {name}
    </span>
  );
}

function IconFill({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontSize: "20px", fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
    >
      {name}
    </span>
  );
}

interface KPI { label: string; value: number | string; sub: string; icon: string; iconBg: string; iconColor: string; trend: string; trendColor: string; }

interface BarChartProps {
  title: string;
  data: { label: string; value: number }[];
  gradientId: string;
  fromColor: string;
  toColor: string;
}

function MiniBarChart({ title, data, gradientId, fromColor, toColor }: BarChartProps) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const height = 180;
  const width = 280;
  const paddingBottom = 25;
  const paddingTop = 25;
  const paddingLeft = 35;
  const paddingRight = 15;

  const chartHeight = height - paddingTop - paddingBottom;
  const chartWidth = width - paddingLeft - paddingRight;
  const barWidth = chartWidth / data.length - 12;

  return (
    <div className="card p-4 bg-white border border-slate-100 rounded-xl shadow-sm flex flex-col items-center">
      <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider text-center" style={{ fontFamily: "var(--font-headline)" }}>{title}</h4>
      <div className="w-full flex justify-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[280px] h-[180px]">
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fromColor} stopOpacity={0.95} />
              <stop offset="100%" stopColor={toColor} stopOpacity={0.15} />
            </linearGradient>
          </defs>

          {/* Grid lines & Y Axis Labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = paddingTop + chartHeight * (1 - ratio);
            const val = Math.round(maxValue * ratio);
            return (
              <g key={i} className="opacity-30">
                <line x1={paddingLeft} y1={y} x2={width - paddingRight} y2={y} stroke="#E2E8F0" strokeDasharray="3 3" strokeWidth="1" />
                <text x={paddingLeft - 8} y={y + 4} textAnchor="end" fill="#94A3B8" className="text-[9px] font-semibold">{val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}</text>
              </g>
            );
          })}

          {/* Bars */}
          {data.map((item, i) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = paddingLeft + i * (chartWidth / data.length) + 6;
            const y = paddingTop + chartHeight - barHeight;

            return (
              <g key={i} className="group cursor-pointer">
                {/* Bar Rect */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={`url(#${gradientId})`}
                  rx="4"
                  className="transition-all duration-300 hover:brightness-95"
                />

                {/* Hover value indicator */}
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fill="#1E293B"
                  className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                >
                  {item.value.toLocaleString()}
                </text>

                {/* Bar interior value */}
                {barHeight > 20 && (
                  <text
                    x={x + barWidth / 2}
                    y={y + 14}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    className="text-[9px] font-bold pointer-events-none drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]"
                  >
                    {item.value >= 1000 ? `${(item.value / 1000).toFixed(0)}k` : item.value}
                  </text>
                )}

                {/* X Axis Label */}
                <text
                  x={x + barWidth / 2}
                  y={height - paddingBottom + 16}
                  textAnchor="middle"
                  fill="#64748B"
                  className="text-[9px] font-bold uppercase tracking-wider"
                  style={{ fontFamily: "var(--font-label)" }}
                >
                  {item.label}
                </text>
              </g>
            );
          })}

          {/* Base X Line */}
          <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={width - paddingRight} y2={paddingTop + chartHeight} stroke="#94A3B8" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState({ totalOrders: 0, totalInvoices: 0, totalDeliveries: 0, totalRfqs: 0 });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ username: string; supplierCode: string; role: string } | null>(null);

  useEffect(() => {
    // Fetch user
    fetch("/api/getUserDetails").then(r => r.json()).then(d => {
      if (d.success !== false) setUser({ username: d.username || d.UserName || "User", supplierCode: d.supplierCode || "—", role: d.role || "Supplier" });
    }).catch(() => { });

    // Fetch KPIs
    Promise.all([
      fetch("/api/orderFilter").then(r => r.json()).catch(() => []),
      fetch("/api/myInvoiceFilter").then(r => r.json()).catch(() => []),
      fetch("/api/deliveriesFilter").then(r => r.json()).catch(() => []),
      fetch("/api/incomingRFQSFilter").then(r => r.json()).catch(() => []),
    ]).then(([orders, invoices, deliveries, rfqs]) => {
      const getLength = (res: any) => {
        if (!res) return 0;
        if (Array.isArray(res.value)) return res.value.length;
        if (Array.isArray(res)) return res.length;
        return 0;
      };
      setMetrics({
        totalOrders: getLength(orders),
        totalInvoices: getLength(invoices),
        totalDeliveries: getLength(deliveries),
        totalRfqs: getLength(rfqs),
      });
    }).catch(() => {
      setMetrics({ totalOrders: 28, totalInvoices: 12, totalDeliveries: 19, totalRfqs: 6 });
    }).finally(() => setLoading(false));
  }, []);

  const kpis: KPI[] = [
    { label: "On-Time Delivery Rate (%)", value: "85%", sub: "+2% vs last month", icon: "local_shipping", iconBg: "bg-blue-50", iconColor: "text-blue-700", trend: "trending_up", trendColor: "text-emerald-600" },
    { label: "Average Delivery Time (Days)", value: "3.5", sub: "-0.5 days decrease", icon: "schedule", iconBg: "bg-indigo-50", iconColor: "text-indigo-700", trend: "trending_down", trendColor: "text-emerald-600" },
    { label: "Invoice Accuracy (%)", value: "92%", sub: "+1.2% improvement", icon: "fact_check", iconBg: "bg-emerald-50", iconColor: "text-emerald-700", trend: "trending_up", trendColor: "text-emerald-600" },
    { label: "Total Disputed Invoices", value: "12", sub: "4 pending resolution", icon: "gavel", iconBg: "bg-amber-50", iconColor: "text-amber-700", trend: "pending_actions", trendColor: "text-amber-600" },
    { label: "Rejected Goods", value: "150", sub: "Mainly batch B-12", icon: "do_not_disturb_on", iconBg: "bg-rose-50", iconColor: "text-rose-700", trend: "trending_up", trendColor: "text-rose-600" },
    { label: "Defect Percentage (%)", value: "5%", sub: "Within target limit", icon: "report_problem", iconBg: "bg-orange-50", iconColor: "text-orange-700", trend: "trending_down", trendColor: "text-emerald-600" },
  ];

  const activities = [
    { dot: "bg-emerald-500 ring-emerald-100", text: "Invoice #INV-8822 approved", time: "2 hours ago" },
    { dot: "bg-blue-500 ring-blue-100", text: "New RFQ received for Batch C-44", time: "5 hours ago" },
    { dot: "bg-amber-500 ring-amber-100", text: "Shipment delayed: PO-8811", time: "Yesterday, 4:32 PM" },
    { dot: "bg-indigo-500 ring-indigo-100", text: "PO #4500000123 confirmed", time: "2 days ago" },
    { dot: "bg-emerald-500 ring-emerald-100", text: "ASN #ASN-2204 submitted", time: "3 days ago" },
  ];

  const quickActions = [
    { label: "Submit Invoice", sub: "Upload PDF or manual", icon: "upload_file", href: "/portal/invoices" },
    { label: "Create ASN", sub: "Shipment notification", icon: "local_shipping", href: "/portal/asn" },
    { label: "View RFQs", sub: "3 closing within 48h", icon: "request_quote", href: "/portal/rfqs" },
    { label: "Download Reports", sub: "Export your data", icon: "download", href: "/portal/reports" },
  ];

  const recentOrders = [
    { po: "#PO-4500000123", date: "11 Jun 2026", vendor: "CTPL", amount: "₹42,390", currency: "INR", status: "Shipped", badgeClass: "badge-success" },
    { po: "#PO-4500000119", date: "10 Jun 2026", vendor: "CTPL", amount: "₹12,800", currency: "INR", status: "Processing", badgeClass: "badge-warning" },
    { po: "#PO-4500000115", date: "09 Jun 2026", vendor: "CTPL", amount: "₹1,450", currency: "INR", status: "Confirmed", badgeClass: "badge-info" },
    { po: "#PO-4500000111", date: "08 Jun 2026", vendor: "CTPL", amount: "₹8,900", currency: "INR", status: "Overdue", badgeClass: "badge-error" },
    { po: "#PO-4500000108", date: "07 Jun 2026", vendor: "CTPL", amount: "₹22,100", currency: "INR", status: "Shipped", badgeClass: "badge-success" },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* Warning Banner */}
      <div className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs shadow-sm">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
        <div>
          <span className="font-bold text-amber-950">Notice:</span> This is a sample page. We need more details to make it fully functional.
        </div>
      </div>

      {/* ─── Page Header ─── */}

      <div className="flex items-end justify-between">
        <div>
          <h1
            className="text-2xl font-bold text-slate-900 tracking-tight leading-none"
            style={{ fontFamily: "var(--font-headline)" }}
          >
            Dashboard Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1" style={{ fontFamily: "var(--font-body)" }}>
            Welcome back, <span className="font-semibold text-blue-700">{user?.username ?? "…"}</span>
            {" "}· {user?.role === "Admin" ? "Admin" : "Supplier"} Code: <span className="font-semibold">{user?.supplierCode ?? "—"}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-secondary">
            <Icon name="calendar_today" className="text-slate-500" />
            Last 30 Days
          </button>
          <button className="btn-primary" onClick={() => router.push("/portal/asn")}>
            <Icon name="add" className="text-white" />
            Create ASN
          </button>
        </div>
      </div>

      {/* ─── KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {kpis.map((kpi, i) => (
          <div
            key={i}
            className="card p-4 cursor-pointer hover:-translate-y-0.5 transition-transform"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 rounded-xl ${kpi.iconBg}`}>
                <Icon name={kpi.icon} className={kpi.iconColor} />
              </div>
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${kpi.trendColor}`}>
                <Icon name={kpi.trend} className={`${kpi.trendColor} text-sm`} />
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-label)", height: "30px", lineClamp: 2, overflow: "hidden" }}>
              {kpi.label}
            </p>
            <h3 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-headline)" }}>
              {kpi.value}
            </h3>
            <p className="text-[9px] text-slate-400 mt-1 italic leading-none" style={{ fontFamily: "var(--font-label)" }}>
              {kpi.sub}
            </p>
          </div>
        ))}
      </div>

      {/* ─── Charts Grid (Aligned to EJS) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MiniBarChart
          title="Total Purchase Orders"
          data={[
            { label: "Open", value: 120 },
            { label: "Closed", value: 80 }
          ]}
          gradientId="poGrad"
          fromColor="#21457A"
          toColor="#21457A"
        />
        <MiniBarChart
          title="Total Invoices"
          data={[
            { label: "Subm.", value: 100 },
            { label: "Pend.", value: 30 },
            { label: "Disp.", value: 10 }
          ]}
          gradientId="invGrad"
          fromColor="#4B0082"
          toColor="#4B0082"
        />
        <MiniBarChart
          title="Goods Receipts"
          data={[
            { label: "Comp.", value: 150 },
            { label: "Pend.", value: 20 }
          ]}
          gradientId="grGrad"
          fromColor="#CB0045"
          toColor="#CB0045"
        />
        <MiniBarChart
          title="Payments"
          data={[
            { label: "Due", value: 25000 },
            { label: "Recv.", value: 20000 }
          ]}
          gradientId="payGrad"
          fromColor="#21457A"
          toColor="#21457A"
        />
      </div>

      {/* ─── Main Grid ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Orders Table (2/3) */}
        <div className="lg:col-span-2 card overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm" style={{ fontFamily: "var(--font-headline)" }}>
              Recent Orders
            </h3>
            <button onClick={() => router.push("/portal/orders")} className="text-blue-600 text-xs font-semibold hover:underline flex items-center gap-1">
              View All
              <Icon name="chevron_right" className="text-sm text-blue-600" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Date</th>
                  <th>Vendor</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((row, i) => (
                  <tr key={i} className="zebra-row">
                    <td className="font-semibold text-slate-900" style={{ fontFamily: "var(--font-headline)" }}>{row.po}</td>
                    <td>{row.date}</td>
                    <td className="text-slate-500">{row.vendor}</td>
                    <td className="font-medium text-slate-800">{row.amount} <span className="text-slate-400 text-[10px]">{row.currency}</span></td>
                    <td><span className={row.badgeClass}>{row.status}</span></td>
                    <td className="text-right">
                      <button className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded" onClick={() => router.push("/portal/orders")}>
                        <Icon name="visibility" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between text-xs text-slate-500">
            <span>Showing 5 of {loading ? "…" : metrics.totalOrders} orders</span>
            <button onClick={() => router.push("/portal/orders")} className="flex items-center gap-1 text-blue-600 font-semibold hover:underline">
              See all orders <Icon name="arrow_forward" className="text-sm text-blue-600" />
            </button>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">

          {/* Quick Actions */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
              <Icon name="bolt" className="text-blue-600" />
              Quick Actions
            </h3>
            <div className="space-y-2">
              {quickActions.map((a, i) => (
                <button
                  key={i}
                  onClick={() => router.push(a.href)}
                  className="w-full group flex items-center gap-3.5 p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/60 transition-all text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-slate-50 group-hover:bg-white flex items-center justify-center text-slate-500 group-hover:text-blue-600 shadow-sm transition shrink-0">
                    <Icon name={a.icon} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900" style={{ fontFamily: "var(--font-headline)" }}>{a.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5" style={{ fontFamily: "var(--font-label)" }}>{a.sub}</p>
                  </div>
                  <Icon name="chevron_right" className="ml-auto text-slate-300 group-hover:text-blue-400 transition shrink-0" />
                </button>
              ))}
            </div>
          </div>

          {/* Supplier Health */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-slate-800 text-sm" style={{ fontFamily: "var(--font-headline)" }}>Supplier Health</h3>
              <span className="badge-success">Grade: A+</span>
            </div>
            <div className="space-y-4">
              {[
                { label: "Quality Rate", value: 99.4, color: "bg-indigo-500" },
                { label: "Lead Time Compliance", value: 94.2, color: "bg-blue-500" },
                { label: "Invoicing Accuracy", value: 100, color: "bg-emerald-500" },
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1.5 uppercase tracking-wider" style={{ fontFamily: "var(--font-label)" }}>
                    <span>{item.label}</span>
                    <span className="text-slate-800">{item.value}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className={`${item.color} h-full rounded-full progress-fill`} style={{ width: `${item.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center">
                <IconFill name="military_tech" className="text-indigo-500" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-900" style={{ fontFamily: "var(--font-headline)" }}>Elite Vendor Status</p>
                <p className="text-[10px] text-slate-500" style={{ fontFamily: "var(--font-label)" }}>Unlocked 12 months ago</p>
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="card p-5">
            <h3 className="font-bold text-slate-800 text-sm mb-4" style={{ fontFamily: "var(--font-headline)" }}>Activity Stream</h3>
            <div className="space-y-4">
              {activities.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className="relative mt-1 shrink-0">
                    <div className={`w-2 h-2 rounded-full ring-4 ${a.dot}`} />
                    {i < activities.length - 1 && (
                      <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-px h-full bg-slate-100" />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-xs text-slate-700 font-medium leading-tight" style={{ fontFamily: "var(--font-body)" }}>{a.text}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5" style={{ fontFamily: "var(--font-label)" }}>{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
