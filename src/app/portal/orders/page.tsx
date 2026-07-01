"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return (
    <span
      className={`material-symbols-outlined inline-flex items-center justify-center ${className}`}
      style={{
        fontSize: "18px",
        width: "18px",
        height: "18px",
        lineHeight: "1",
        fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24"
      }}
    >
      {name}
    </span>
  );
}

interface PurchaseOrder {
  PO: string;
  PODate: string;
  Item: string;
  Material: string;
  MaterialDesc: string;
  POQuantity: string;
  DeliveredQty: string;
  NetAmount: string;
  GrossAmount: string;
  Supplier: string;
  SupplierName: string;
  Status: string;
  Currency: string;
  PaymentTerms?: string;
  TaxAmount?: string;
  DiscountAmount?: string;
}

interface POItem {
  Item: string;
  Material: string;
  OrdQty: string;
  ExpDelDate: string;
  DeliveredQty: string;
  PendingQty: string;
  UOM: string;
  UnitPrice: string;
  NetPrice: string;
  GrossValue: string;
  DiscAmount: string;
  Prd: string;
}

function statusBadge(status: string) {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("approved") || s.includes("complete") || s.includes("shipped") || s === "05" || s.includes("05"))
    return <span className="badge-success">{status}</span>;
  if (s.includes("pending") || s.includes("process"))
    return <span className="badge-warning">{status}</span>;
  if (s.includes("cancel") || s.includes("overdue") || s.includes("reject"))
    return <span className="badge-error">{status}</span>;
  return <span className="badge-neutral">{status}</span>;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}-${month}-${year}`;
  }
  if (dateStr.includes("-")) {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      return dateStr;
    }
  }
  return dateStr;
}

function OrdersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryPo = searchParams.get("po");

  // Filter States
  const [poNumber, setPoNumber] = useState(queryPo || "");
  const [material, setMaterial] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Data States
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Action Menu Popover State
  const [activeActionIndex, setActiveActionIndex] = useState<number | null>(null);

  // Modal Details States
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [poDetails, setPoDetails] = useState<POItem[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [jwStatusItem, setJwStatusItem] = useState<POItem | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveActionIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (poNumber.trim()) params.append("PO", poNumber.trim());
    if (material.trim()) params.append("Material", material.trim());
    if (status) params.append("Status", status);
    if (dateFrom) params.append("PODateFrom", dateFrom.replace(/-/g, ""));
    if (dateTo) params.append("PODateTo", dateTo.replace(/-/g, ""));

    try {
      const res = await fetch(`/api/orderFilter?${params}`);
      const data = await res.json();
      const list = data.value || data || [];
      setOrders(list.map((item: any) => ({
        PO: item.PO || item.PurchaseOrder || "",
        PODate: item.PODate || item.PurchaseOrderDate || "",
        Item: item.Item || "10",
        Material: item.Material || "",
        MaterialDesc: item.MaterialDesc || item.PurchaseOrderItemText || "Demo Material",
        POQuantity: item.POQuantity || item.OrderQuantity || "0",
        DeliveredQty: item.DeliverdQty || item.DeliveredQty || "0",
        NetAmount: item.NetAmount || "0.00",
        GrossAmount: item.GrossAmount || "0.00",
        Supplier: item.Supplier || "100021",
        SupplierName: item.SupplierName || "Castaliaz Supplier Ltd",
        Status: item.Status || "Approved",
        Currency: item.Currency || "INR",
        PaymentTerms: item.PaymentTerms || "Net 30 Days",
        TaxAmount: item.TaxAmount || "0.00",
        DiscountAmount: item.DiscountAmount || "0.00"
      })));
    } catch {
      setError("Failed to sync Purchase Orders with server API.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryPo) setPoNumber(queryPo);
  }, [queryPo]);

  useEffect(() => {
    fetchOrders();
  }, [queryPo]); // Trigger fetch when query param changes

  const handleOpenPOModal = async (po: PurchaseOrder) => {
    setSelectedPO(po);
    setPoDetails([]);
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/myDeliveryPODetailsFilter?PurchaseOrder=${po.PO}`);
      const data = await res.json();
      const items = data.value || data || [];

      if (items.length > 0) {
        const first = items[0];
        let totalNet = 0;
        let totalGross = 0;
        let totalDiscount = 0;
        items.forEach((item: any) => {
          const np = parseFloat(String(item.NetPrice || item.NetValue || 0).replace(/,/g, ''));
          const gv = parseFloat(String(item.GrossValue || item.GrossAmount || 0).replace(/,/g, ''));
          const da = parseFloat(String(item.DiscAmount || item.Discount || 0).replace(/,/g, ''));
          totalNet += np;
          totalGross += gv;
          totalDiscount += da;
        });
        const totalTax = totalNet * 0.20; // 20% tax

        const rawStatus = first.Status || po.Status || "Approved";
        const mappedStatus = rawStatus === "05" || rawStatus === "02" || rawStatus.toLowerCase().includes("approved") ? "Approved" : rawStatus;

        const rawPayTerms = first.PaymentTerms || po.PaymentTerms || "Net 30 Days";
        const termsMap: { [key: string]: string } = {
          "0001": "Pay immediately without deduction",
          "0002": "Net 30 Days",
          "0003": "Net 45 Days",
          "0004": "Net 60 Days"
        };
        const mappedPayTerms = termsMap[rawPayTerms] || rawPayTerms;

        setSelectedPO({
          ...po,
          PODate: first.CreationDate || po.PODate,
          NetAmount: totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          GrossAmount: totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          TaxAmount: totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          DiscountAmount: totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          Currency: first.DocumentCurrency || po.Currency || "INR",
          Status: mappedStatus,
          PaymentTerms: mappedPayTerms,
        });
      }

      setPoDetails(items.map((item: any) => ({
        Item: item.Item || "10",
        Material: item.Material || "N/A",
        OrdQty: item.OrdQty || "0",
        ExpDelDate: item.ExpDelDate || item.CreationDate || "—",
        DeliveredQty: item.DeliveredQty || "0",
        PendingQty: item.PendingQty || "0",
        UOM: item.UOM || "PCS",
        UnitPrice: item.UnitPrice || "0.00",
        NetPrice: item.NetPrice || "0.00",
        GrossValue: item.GrossValue || "0.00",
        DiscAmount: item.DiscAmount || "0.00",
        Prd: item.Prd || "Approved"
      })));
    } catch {
      setPoDetails([]);
      alert("⚠️ Failed to load PO details from SAP Server.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentOrders = orders.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  return (
    <div className="space-y-5 animate-fade-in-up" style={{ transform: "translateZ(0)" }}>

      {/* ─── Page Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-headline)" }}>Purchase Orders</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and track all your purchase orders</p>
        </div>
        <button onClick={fetchOrders} className="btn-primary">
          <Icon name="sync" className="text-white" />
          Sync PO Data
        </button>
      </div>

      {/* ─── Metrics Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Awaiting delivery</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>
              {orders.filter(po => parseFloat(po.DeliveredQty) < parseFloat(po.POQuantity)).length}
            </h3>
            <span className="text-[9px] text-slate-500 font-medium">Pending shipping action</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Icon name="local_shipping" className="scale-110" />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Fully Delivered</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>
              {orders.filter(po => parseFloat(po.DeliveredQty) >= parseFloat(po.POQuantity) && parseFloat(po.POQuantity) > 0).length}
            </h3>
            <span className="text-[9px] text-slate-500 font-medium">Complete fulfillment logs</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Icon name="check_circle" className="scale-110" />
          </div>
        </div>


        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Total Orders</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>{orders.length}</h3>
            <span className="text-[9px] text-slate-500 font-medium">SAP Document count</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Icon name="shopping_bag" className="scale-110" />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Total Value</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>
              {orders.reduce((acc, po) => acc + (parseFloat(String(po.GrossAmount).replace(/,/g, '')) || 0), 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <span className="text-[9px] text-slate-500 font-medium">Gross ledger amount (INR)</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Icon name="payments" className="scale-110" />
          </div>
        </div>




      </div>

      {/* ─── Filter Card ─── */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Icon name="filter_list" className="text-blue-600" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ fontFamily: "var(--font-label)" }}>
            Search & Filter
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-label)" }}>PO Number</label>
            <div className="relative">
              <Icon name="search" className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="4500…" value={poNumber} onChange={e => setPoNumber(e.target.value)} className="input-field !pl-8" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-label)" }}>Material ID</label>
            <input type="text" placeholder="Material ID" value={material} onChange={e => setMaterial(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-label)" }}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="input-field">
              <option value="">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-label)" }}>Date From</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-label)" }}>Date To</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
          <button onClick={() => { setPoNumber(""); setMaterial(""); setStatus(""); setDateFrom(""); setDateTo(""); }} className="btn-secondary">
            <Icon name="clear" className="text-slate-500" />
            Clear Filters
          </button>
          <button onClick={fetchOrders} className="btn-primary">
            <Icon name="search" className="text-white" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* ─── Table Card ─── */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ fontFamily: "var(--font-label)" }}>Loading orders…</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-2">
            <Icon name="error_outline" className="text-rose-500 mx-auto text-3xl" />
            <p className="text-sm text-rose-500 font-medium">{error}</p>
            <p className="text-xs text-slate-400">Showing sample data for preview</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center">
            <Icon name="inbox" className="text-slate-300 mx-auto text-4xl" />
            <p className="text-sm text-slate-400 mt-2">No orders matched your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-slate-100 rounded-lg">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PO Date</th>
                    <th>PO #</th>
                    <th>Item #</th>
                    <th>Material</th>
                    <th>Material Description</th>
                    <th>PO Quantity</th>
                    <th>Delivered Quantity</th>
                    <th className="text-right">Net Value</th>
                    <th className="text-right">Gross Value</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentOrders.map((po, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td>{formatDate(po.PODate)}</td>
                      <td>
                        <button
                          onClick={() => handleOpenPOModal(po)}
                          className="font-bold text-blue-700 hover:underline hover:text-blue-800"
                          style={{ fontFamily: "var(--font-headline)" }}
                        >
                          {po.PO}
                        </button>
                      </td>
                      <td className="font-semibold text-slate-500">{po.Item}</td>
                      <td className="font-semibold text-slate-800">{po.Material}</td>
                      <td className="text-slate-500 max-w-[200px] truncate">{po.MaterialDesc}</td>
                      <td>{po.POQuantity}</td>
                      <td>{po.DeliveredQty}</td>
                      <td className="text-right font-bold text-slate-700">
                        {po.NetAmount} <span className="text-[9px] font-normal text-slate-400">{po.Currency}</span>
                      </td>
                      <td className="text-right font-bold text-slate-700">
                        {po.GrossAmount} <span className="text-[9px] font-normal text-slate-400">{po.Currency}</span>
                      </td>
                      <td className="text-center relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveActionIndex(activeActionIndex === i ? null : i);
                          }}
                          className="p-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition cursor-pointer"
                        >
                          <Icon name="subdirectory_arrow_right" className="rotate-90 scale-90" />
                        </button>

                        {/* Popover Action Menu */}
                        {activeActionIndex === i && (
                          <div
                            ref={popoverRef}
                            className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-left"
                          >
                            <button
                              onClick={() => {
                                setActiveActionIndex(null);
                                router.push(`/portal/asn?po=${po.PO}`);
                              }}
                              className="w-full px-3 py-2 text-xxs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-700 flex items-center gap-1.5"
                            >
                              <Icon name="local_shipping" className="text-xs" /> View ASN
                            </button>
                            <button
                              onClick={() => {
                                setActiveActionIndex(null);
                                alert(`Acknowledgement sent for PO ${po.PO}`);
                              }}
                              className="w-full px-3 py-2 text-xxs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-700 flex items-center gap-1.5"
                            >
                              <Icon name="thumb_up" className="text-xs" /> Acknowledge
                            </button>
                            <button
                              onClick={() => {
                                setActiveActionIndex(null);
                                alert(`Update Schedule triggered for PO ${po.PO}`);
                              }}
                              className="w-full px-3 py-2 text-xxs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-700 flex items-center gap-1.5"
                            >
                              <Icon name="edit_calendar" className="text-xs" /> Update Schedule
                            </button>
                            <button
                              onClick={() => {
                                setActiveActionIndex(null);
                                alert(`Confirm Schedule triggered for PO ${po.PO}`);
                              }}
                              className="w-full px-3 py-2 text-xxs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-700 flex items-center gap-1.5"
                            >
                              <Icon name="check_circle" className="text-xs" /> Confirm Schedule
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <span className="text-xs text-slate-500" style={{ fontFamily: "var(--font-label)" }}>
                Showing {indexOfFirst + 1}–{Math.min(indexOfLast, orders.length)} of {orders.length} orders
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="chevron_left" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${currentPage === i + 1
                      ? "bg-blue-700 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Icon name="chevron_right" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── PO Details Modal (Overlay aligned to poModal EJS) ─── */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setSelectedPO(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300" />
          <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden animate-scale-up text-slate-800">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50/90 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
                  <Icon name="shopping_bag" className="text-blue-700" />
                  Purchase Order Details
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">SAP Document Reference: #{selectedPO.PO} · Direct ERP Log</p>
              </div>
              <button onClick={() => setSelectedPO(null)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer">
                <Icon name="close" className="text-sm" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">

              {/* Left Column: PO Line Items List */}
              <div className="flex-grow space-y-4 lg:max-w-[calc(100%-320px)]">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Icon name="list_alt" className="text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider" style={{ fontFamily: "var(--font-headline)" }}>
                    Order Line Items
                  </h3>
                </div>

                {loadingDetails ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <div className="w-6 h-6 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xxs font-bold uppercase tracking-wider">Loading PO details…</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[350px] overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                    <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[9px] border-b border-slate-800">
                          <th className="py-2.5 px-3">Item #</th>
                          <th className="py-2.5 px-3">Material</th>
                          <th className="py-2.5 px-3 text-right">Ordered Qty</th>
                          <th className="py-2.5 px-3">Expected Delivery</th>
                          <th className="py-2.5 px-3 text-right">Delivered Qty</th>
                          <th className="py-2.5 px-3 text-right">Pending Qty</th>
                          <th className="py-2.5 px-3">UOM</th>
                          <th className="py-2.5 px-3 text-right">Unit Price</th>
                          <th className="py-2.5 px-3 text-right">Net Value</th>
                          <th className="py-2.5 px-3 text-right">Gross Value</th>
                          <th className="py-2.5 px-3 text-right">Tax (20%)</th>
                          <th className="py-2.5 px-3 text-right">Discount</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3 text-center whitespace-normal min-w-[120px]">Production / JW Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold bg-white">
                        {poDetails.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-2.5 px-3 text-blue-700 font-bold">{item.Item}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{item.Material}</td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-slate-800">{item.OrdQty}</td>
                            <td className="py-2.5 px-3 text-slate-500 font-medium">{formatDate(item.ExpDelDate)}</td>
                            <td className="py-2.5 px-3 text-right">{item.DeliveredQty}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">{item.PendingQty}</td>
                            <td className="py-2.5 px-3 text-slate-500 font-bold">{item.UOM}</td>
                            <td className="py-2.5 px-3 text-right">{item.UnitPrice}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">{item.NetPrice}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">{item.GrossValue}</td>
                            <td className="py-2.5 px-3 text-right text-slate-500">{(parseFloat(String(item.NetPrice || "0").replace(/,/g, "")) * 0.2).toFixed(2)}</td>
                            <td className="py-2.5 px-3 text-right text-rose-600">{item.DiscAmount}</td>
                            <td className="py-2.5 px-3">{statusBadge(item.Prd)}</td>
                            <td className="py-2.5 px-3 text-center">
                              <button 
                                onClick={() => setJwStatusItem(item)} 
                                className="bg-blue-50 text-blue-700 hover:bg-blue-700 hover:text-white px-3 py-1 rounded transition text-[10px] font-bold border border-blue-200 hover:border-blue-700 shadow-sm"
                              >
                                View / Update
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Related Links inside Left column */}
                <div className="pt-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1.5">Associated Links</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xxs font-bold text-blue-700">
                    <a href={`/portal/invoices?po=${selectedPO.PO}`} className="hover:underline flex items-center gap-1 bg-slate-50 hover:bg-blue-50/50 py-1 px-2.5 rounded-lg border border-slate-200/60 transition">
                      <Icon name="receipt_long" className="text-xs" /> View Invoices
                    </a>
                    <a href={`/portal/reports?type=deliveries&ref=${selectedPO.PO}`} className="hover:underline flex items-center gap-1 bg-slate-50 hover:bg-blue-50/50 py-1 px-2.5 rounded-lg border border-slate-200/60 transition">
                      <Icon name="visibility" className="text-xs" /> Goods Receipts
                    </a>
                    <a href={`/portal/reports?type=payments&ref=${selectedPO.PO}`} className="hover:underline flex items-center gap-1 bg-slate-50 hover:bg-blue-50/50 py-1 px-2.5 rounded-lg border border-slate-200/60 transition">
                      <Icon name="payments" className="text-xs" /> Payment Status
                    </a>
                    <a href={`/portal/reports?type=contracts&ref=${selectedPO.PO}`} className="hover:underline flex items-center gap-1 bg-slate-50 hover:bg-blue-50/50 py-1 px-2.5 rounded-lg border border-slate-200/60 transition">
                      <Icon name="description" className="text-xs" /> View Contract
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: PO Summary & Financials Card */}
              <div className="w-full lg:w-72 shrink-0 space-y-4">

                {/* PO Metadata Summary */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm text-xxs">
                  <div className="font-extrabold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200/80">
                    Purchase Order Metadata
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">PO Status</span>
                    <span>{statusBadge(selectedPO.Status)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">PO Date</span>
                    <span className="font-semibold text-slate-700">{formatDate(selectedPO.PODate)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Supplier</span>
                    <span className="font-semibold text-slate-700" title={selectedPO.SupplierName}>{selectedPO.Supplier}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Payment Terms</span>
                    <span className="font-semibold text-slate-600 truncate max-w-[130px]" title={selectedPO.PaymentTerms}>
                      {selectedPO.PaymentTerms}
                    </span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="p-4 bg-slate-900 border border-slate-950 rounded-xl text-white space-y-3.5 shadow-sm text-xxs">
                  <div className="font-extrabold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                    Financial Summary
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Net Amount</span>
                    <span className="font-bold">{selectedPO.NetAmount} {selectedPO.Currency}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Tax Amount</span>
                    <span className="font-semibold text-slate-300">+{selectedPO.TaxAmount} {selectedPO.Currency}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Discounts</span>
                    <span className="font-semibold text-rose-455">-{selectedPO.DiscountAmount} {selectedPO.Currency}</span>
                  </div>

                  <div className="flex justify-between border-t border-slate-800 pt-2.5">
                    <span className="text-slate-400 font-bold text-[10px]">Gross Value</span>
                    <span className="font-extrabold text-xs text-blue-405">{selectedPO.GrossAmount} {selectedPO.Currency}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-150 bg-slate-50/90 flex justify-end gap-3">
              <button onClick={() => setSelectedPO(null)} className="btn-secondary py-1.5">
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedPO(null);
                  router.push(`/portal/asn?po=${selectedPO.PO}`);
                }}
                className="btn-primary py-1.5"
              >
                <Icon name="local_shipping" className="text-white" />
                Create ASN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── JW Status Modal ─── */}
      {jwStatusItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div onClick={() => setJwStatusItem(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300" />
          <div className="w-full max-w-6xl bg-white border border-slate-200 rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh] overflow-hidden animate-scale-up text-slate-800">
            {/* Header */}
            <div className="px-6 py-4 bg-[#1f4e79] text-white flex items-center justify-between shadow-md z-10">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 tracking-wide">
                Record Production / Job Work Status for Purchase Orders
              </h2>
              <div className="flex items-center gap-4">
                <button onClick={() => setJwStatusItem(null)} className="hover:text-slate-300 transition cursor-pointer">
                  <Icon name="close" className="text-[20px]" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[#f4f6f9]">
              <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-6 lg:p-8 w-full max-w-5xl mx-auto">
                {/* Notice Banner */}
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 mb-6 rounded-md shadow-sm flex items-center gap-2 text-sm font-medium">
                  <Icon name="error" className="text-amber-600 shrink-0 text-xl" />
                  We need more details to make it fully functional.
                </div>

                {/* Top Info Grid */}
                <div className="flex flex-wrap items-center justify-between gap-y-4 gap-x-2 text-[11px] font-bold text-slate-900 mb-8 bg-slate-50/50 p-5 rounded-md border border-slate-100">
                  <div>Order Date: <span className="font-normal text-slate-700 ml-1">{formatDate(selectedPO?.PODate || "")}</span></div>
                  <div>PO No. + Item No.: <span className="font-normal text-slate-700 ml-1">{selectedPO?.PO}-{jwStatusItem.Item}</span></div>
                  <div>Material ID + Desc: <span className="font-normal text-slate-700 ml-1">{jwStatusItem.Material} - {selectedPO?.MaterialDesc || "Material Description"}</span></div>
                  <div>Order Quantity: <span className="font-normal text-slate-700 ml-1">{jwStatusItem.OrdQty}</span></div>
                  <div>Quantity UOM: <span className="font-normal text-slate-700 ml-1">{jwStatusItem.UOM}</span></div>
                  <div className="w-full text-center mt-2">Committed Delivery Date: <span className="font-normal text-slate-700 ml-1">{formatDate(jwStatusItem.ExpDelDate)}</span></div>
                </div>

                {/* Table 1 */}
                <div className="mb-10 overflow-x-auto">
                  <h3 className="text-center text-[#1f4e79] text-[11px] font-bold mb-4 tracking-wide">Update the Production and Delivery quantities below for each Purchase Order Item</h3>
                  <table className="w-full text-center border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#1f4e79] text-white border border-[#1f4e79]">
                        <th className="py-2.5 px-3 border border-[#1f4e79] font-bold w-1/6">Qty-Produced</th>
                        <th className="py-2.5 px-3 border border-[#1f4e79] font-bold w-1/6">Qty-WIP</th>
                        <th className="py-2.5 px-3 border border-[#1f4e79] font-bold w-1/6">Qty-Delivery Pending</th>
                        <th className="py-2.5 px-3 border border-[#1f4e79] font-bold w-1/6">Qty-In Transit</th>
                        <th className="py-2.5 px-3 border border-[#1f4e79] font-bold w-1/6">Qty-Delivered</th>
                        <th className="py-2.5 px-3 border border-[#1f4e79] font-bold w-1/12">Update Entry</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Produced Qty" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter WIP Qty" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200 relative">
                           <select className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none bg-white appearance-none cursor-pointer">
                             <option>Enter Delivery Not Initiat</option>
                           </select>
                           <Icon name="unfold_more" className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none scale-75" />
                        </td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter In Transit Qty" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Delivered Qty" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200 text-center"><button className="bg-[#1f4e79] hover:bg-[#163a5a] text-white p-1.5 rounded shadow transition-colors"><Icon name="arrow_downward" className="text-[14px]" /></button></td>
                      </tr>
                      <tr className="border border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Produced Qty" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter WIP Qty" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Delivery Not Initiat" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter In Transit Qty" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Delivery Complete" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200 text-center"><button className="bg-[#1f4e79] hover:bg-[#163a5a] text-white p-1.5 rounded shadow transition-colors"><Icon name="arrow_downward" className="text-[14px]" /></button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Table 2 */}
                <div className="overflow-x-auto">
                  <h3 className="text-center text-[#1f4e79] text-[11px] font-bold mb-4 tracking-wide">Update the Quanties of Material Received & Consumed for each Job-Work Order Item</h3>
                  <table className="w-full text-center border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#1f4e79] text-white border border-[#1f4e79]">
                        <th className="py-2.5 px-3 border border-[#1f4e79] font-bold w-1/6">Material ID & Desc</th>
                        <th className="py-2.5 px-3 border border-[#1f4e79] font-bold w-1/6">Date Received</th>
                        <th className="py-2.5 px-3 border border-[#1f4e79] font-bold w-1/6">Qty Received</th>
                        <th className="py-2.5 px-3 border border-[#1f4e79] font-bold w-1/6">Qty Consumed</th>
                        <th className="py-2.5 px-3 border border-[#1f4e79] font-bold w-1/6">Last Consumption Date</th>
                        <th className="py-2.5 px-3 border border-[#1f4e79] font-bold w-1/6">Qty in Stock</th>
                        <th className="py-2.5 px-3 border border-[#1f4e79] font-bold w-1/12">Update Entry</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Material" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Date Receive" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Received Qty" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Consumed Ql" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Last Consum" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Quantity Left" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200 text-center"><button className="bg-[#1f4e79] hover:bg-[#163a5a] text-white p-1.5 rounded shadow transition-colors"><Icon name="arrow_downward" className="text-[14px]" /></button></td>
                      </tr>
                      <tr className="border border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Material" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Date Receive" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Received Qty" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Consumed Ql" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Last Consum" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200"><input type="text" placeholder="Enter Quantity Left" className="w-full p-2 border border-slate-300 rounded text-slate-700 focus:border-[#1f4e79] focus:ring-1 focus:ring-[#1f4e79] outline-none" /></td>
                        <td className="p-3 border border-slate-200 text-center"><button className="bg-[#1f4e79] hover:bg-[#163a5a] text-white p-1.5 rounded shadow transition-colors"><Icon name="arrow_downward" className="text-[14px]" /></button></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading orders workspace...</div>}>
      <OrdersPageContent />
    </Suspense>
  );
}
