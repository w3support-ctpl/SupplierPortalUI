"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Receipt, Search, Filter, Loader2, AlertCircle,
  CheckCircle2, Info, X, FileText, ShoppingBag, Eye
} from "lucide-react";

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

function statusBadge(status: string) {
  const s = (status ?? "").toLowerCase();
  if (s === "cleared" || s.includes("paid") || s.includes("approve"))
    return <span className="badge-success">{status || "Cleared"}</span>;
  if (s === "open" || s.includes("process") || s.includes("pending"))
    return <span className="badge-warning">{status || "Open"}</span>;
  if (s.includes("overdue") || s.includes("reject") || s.includes("cancel"))
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

interface Invoice {
  AccountingDocument: string;
  InvoiceDate: string;
  InvStatus: string;
  GrossAmount: string;
  NetAmount: string;
  Tax: string;
  Discounts: string;
  PaymentTerms: string;
  NetDueDate: string;
  PaymentRecived: string;
  PurchasingDocument: string;
  FiscalYear: string;
  Currency: string;
}

interface InvoiceItem {
  LineItem: string;
  Material: string;
  Quantity: string;
  UOM: string;
  UnitPrice: string;
  NetValue: string;
  Tax: string;
  GrossAmount: string;
  Discounts: string;
}

// PO Modal Types (matches poModal EJS)
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

export default function InvoicesPage() {
  const router = useRouter();

  // Search & Filter States (EJS fields)
  const [invoiceBetween, setInvoiceBetween] = useState("");
  const [toDate, setToDate] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("");
  const [materialDesc, setMaterialDesc] = useState("");
  const [poNumber, setPoNumber] = useState("");

  // Data States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Active Action Menu Popover Row
  const [activeActionIndex, setActiveActionIndex] = useState<number | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Invoice Details Modal States
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // PO Details Modal States (triggered when PO Reference is clicked)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [poDetails, setPoDetails] = useState<POItem[]>([]);
  const [loadingPODetails, setLoadingPODetails] = useState(false);

  // Close popover on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setActiveActionIndex(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchInvoices = async () => {
    setLoading(true);
    setError("");
    setCurrentPage(1);

    const params = new URLSearchParams();
    if (poNumber.trim()) params.append("PurchasingDocument", poNumber.trim());
    if (invoiceBetween) params.append("InvoiceDateFrom", invoiceBetween);
    if (toDate) params.append("InvoiceDateTo", toDate);
    if (invoiceStatus) params.append("InvStatus", invoiceStatus);
    if (materialDesc.trim()) params.append("Material", materialDesc.trim());

    // Auto calculate default FiscalYear
    if (invoiceBetween) {
      const yearVal = invoiceBetween.split("-")[0];
      params.append("FiscalYearyyGlob1", yearVal);
    } else if (!poNumber.trim()) {
      // Only default to current year if we are not searching for a specific PO
      params.append("FiscalYearyyGlob1", new Date().getFullYear().toString());
    }

    try {
      // API call matching: /myInvoiceFilter?PurchasingDocument=...&InvoiceDateFrom=...
      const res = await fetch(`/api/myInvoiceFilter?${params.toString()}`);
      if (!res.ok) {
        throw new Error("HTTP error fetching invoices");
      }

      const data = await res.json();
      const list = data.value || data || [];

      const mapped: Invoice[] = list.map((item: any) => ({
        AccountingDocument: item.AccountingDocument || "",
        InvoiceDate: item.InvoiceDate || "2026-06-01",
        InvStatus: item.InvStatus || item.Status || "Open",
        GrossAmount: item.GrossAmount || item.InvoiceAmount || "0.00",
        NetAmount: item.NetAmount || "0.00",
        Tax: item.Tax || "0.00",
        Discounts: item.Discounts || "0.00",
        PaymentTerms: item.PaymentTerms || "Net 30 Days",
        NetDueDate: item.NetDueDate || "2026-07-01",
        PaymentRecived: item.PaymentRecived || item.PaymentReceived || "0.00",
        PurchasingDocument: item.PurchasingDocument || "",
        FiscalYear: item.FiscalYear || "",
        Currency: item.Currency || "INR"
      }));

      setInvoices(mapped);

    } catch (err) {
      console.error("Fetch invoices error:", err);
      setError("Failed to fetch invoices from SAP Gateway service.");
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleOpenDetails = async (inv: Invoice) => {
    setSelectedInvoice(inv);
    setInvoiceItems([]);
    setLoadingItems(true);

    try {
      // EJS triggers: /invoiceDetailsFilter?AccountingDocument=...&FiscalYear=...
      const res = await fetch(`/api/invoiceDetailsFilter?AccountingDocument=${inv.AccountingDocument}&FiscalYear=${inv.FiscalYear}`);
      if (!res.ok) throw new Error("Failed to fetch invoice details");

      const data = await res.json();
      const items = data._item || (data.value ? data.value : [data]);

      const mappedItems: InvoiceItem[] = items.map((item: any) => ({
        LineItem: item.LineItem || item.AccountingDocumentItem || "1",
        Material: item.Material || "N/A",
        Quantity: item.Quantity || "0",
        UOM: item.UOM || item.QuantityUnit || "PC",
        UnitPrice: item.UnitPrice || "0.00",
        NetValue: item.NetValue || item.Amount || "0.00",
        Tax: item.Tax || "0.00",
        GrossAmount: item.GrossAmount || item.GrossValue || "0.00",
        Discounts: item.Discounts || "0.00"
      }));

      setInvoiceItems(mappedItems);

    } catch (err) {
      console.error("Fetch invoice details error:", err);
      setInvoiceItems([]);
      alert("⚠️ Failed to load invoice details from SAP Server.");
    } finally {
      setLoadingItems(false);
    }
  };

  const handleOpenPO = async (poNum: string) => {
    if (!poNum) return;

    // Create a temporary mock PO reference for header information
    const dummyPO: PurchaseOrder = {
      PO: poNum,
      PODate: "2026-06-01",
      Item: "10",
      Material: "M-901",
      MaterialDesc: "Heavy Duty Cardboard Boxes",
      POQuantity: "150",
      DeliveredQty: "150",
      NetAmount: "18,000.00",
      GrossAmount: "21,600.00",
      Supplier: "100021",
      SupplierName: "Castaliaz Supplier Ltd",
      Status: "Approved",
      Currency: "INR",
      PaymentTerms: "Net 30 Days",
      TaxAmount: "3,600.00",
      DiscountAmount: "0.00"
    };

    setSelectedPO(dummyPO);
    setPoDetails([]);
    setLoadingPODetails(true);

    try {
      const res = await fetch(`/api/myDeliveryPODetailsFilter?PurchaseOrder=${poNum}`);
      if (!res.ok) throw new Error("Failed to fetch PO details");

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

        const rawStatus = first.Status || "Approved";
        const mappedStatus = rawStatus === "05" || rawStatus === "02" || rawStatus.toLowerCase().includes("approved") ? "Approved" : rawStatus;

        const rawPayTerms = first.PaymentTerms || "Net 30 Days";
        const termsMap: { [key: string]: string } = {
          "0001": "Pay immediately without deduction",
          "0002": "Net 30 Days",
          "0003": "Net 45 Days",
          "0004": "Net 60 Days"
        };
        const mappedPayTerms = termsMap[rawPayTerms] || rawPayTerms;

        setSelectedPO(prev => prev ? {
          ...prev,
          PO: first.PurchaseOrder || poNum,
          PODate: first.CreationDate || prev.PODate,
          NetAmount: totalNet.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          GrossAmount: totalGross.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          TaxAmount: totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          DiscountAmount: totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          Currency: first.DocumentCurrency || prev.Currency || "INR",
          Status: mappedStatus,
          PaymentTerms: mappedPayTerms,
        } : null);
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

    } catch (err) {
      console.error("Fetch PO modal error:", err);
      setPoDetails([]);
      alert("⚠️ Failed to load PO details from SAP Server.");
    } finally {
      setLoadingPODetails(false);
    }
  };

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentInvoices = invoices.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(invoices.length / itemsPerPage);

  return (
    <div className="space-y-6">

      {/* ─── Page Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-headline)" }}>My Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track invoice settlements and billing status</p>
        </div>
        <button onClick={fetchInvoices} className="btn-primary">
          <Icon name="sync" className="text-white" />
          Refresh Invoices
        </button>
      </div>

      {/* ─── Metrics Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Open pending</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>
              {invoices.filter(inv => {
                const s = inv.InvStatus.toLowerCase();
                return s === "open" || s.includes("process") || s.includes("pending");
              }).length}
            </h3>
            <span className="text-[9px] text-slate-500 font-medium">Unsettled outstanding</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Icon name="schedule" className="scale-110" />
          </div>
        </div>


        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Pending Amount</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>
              {invoices.reduce((acc, inv) => {
                const s = inv.InvStatus.toLowerCase();
                const isOpen = s === "open" || s.includes("process") || s.includes("pending");
                return acc + (isOpen ? (parseFloat(inv.GrossAmount.replace(/,/g, '')) || 0) : 0);
              }, 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </h3>
            <span className="text-[9px] text-slate-500 font-medium">Outstanding sum (INR)</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Icon name="payments" className="scale-110" />
          </div>
        </div>


        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Cleared Paid</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>
              {invoices.filter(inv => {
                const s = inv.InvStatus.toLowerCase();
                return s === "cleared" || s.includes("paid") || s.includes("approve");
              }).length}
            </h3>
            <span className="text-[9px] text-slate-500 font-medium">Settled transactions</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Icon name="check_circle" className="scale-110" />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Total Invoices</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>{invoices.length}</h3>
            <span className="text-[9px] text-slate-500 font-medium">Billed ledger logs</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Icon name="receipt" className="scale-110" />
          </div>
        </div>






      </div>

      {/* ─── Filter Form (Aligned to myInvoice.ejs) ─── */}
      <div className="card p-5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Filter className="h-4 w-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider" style={{ fontFamily: "var(--font-label)" }}>
            Invoice Filters
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">PO Number</label>
            <input type="text" placeholder="Search by PO Number" value={poNumber} onChange={e => setPoNumber(e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Material</label>
            <input type="text" placeholder="Search by Material" value={materialDesc} onChange={e => setMaterialDesc(e.target.value)} className="input-field w-full" />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Invoice Status</label>
            <select value={invoiceStatus} onChange={e => setInvoiceStatus(e.target.value)} className="input-field w-full">
              <option value="">-- Select Status --</option>
              <option value="Open">Open</option>
              <option value="Cleared">Cleared</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Invoices between</label>
            <input type="date" value={invoiceBetween} onChange={e => setInvoiceBetween(e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="input-field w-full" />
          </div>



        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
          <button onClick={() => { setInvoiceBetween(""); setToDate(""); setInvoiceStatus(""); setMaterialDesc(""); setPoNumber(""); }} className="btn-secondary">
            <Icon name="clear" className="text-slate-500" />
            Clear
          </button>
          <button onClick={fetchInvoices} className="btn-primary px-8">
            <Icon name="search" className="text-white" />
            Go
          </button>
        </div>
      </div>

      {/* ─── Invoices Grid/Table ─── */}
      <div className="card overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ fontFamily: "var(--font-label)" }}>Loading Invoices…</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
            <p className="text-sm text-rose-600 font-medium">{error}</p>
            <p className="text-xs text-slate-400">Displaying cache / sample preview logs</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No invoices found matching the search criteria.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-slate-200 rounded-xl shadow-inner bg-white">
              <table className="w-full text-left border-collapse text-xxs whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-900 text-slate-100 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <th className="py-3 px-4">Invoice Number</th>
                    <th className="py-3 px-4">Invoice Date</th>
                    <th className="py-3 px-4">Invoice Status</th>
                    <th className="py-3 px-4 text-right">Gross Amount</th>
                    <th className="py-3 px-4 text-right">Net Amount</th>
                    <th className="py-3 px-4 text-right">Tax</th>
                    <th className="py-3 px-4 text-right">Discounts</th>
                    <th className="py-3 px-4">Payment Terms</th>
                    <th className="py-3 px-4">Payment Due Date</th>
                    <th className="py-3 px-4 text-right">Payment Received</th>
                    <th className="py-3 px-4">PO Number</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold text-slate-700 bg-white">
                  {currentInvoices.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-blue-50/45 odd:bg-slate-50/30 transition-colors duration-150">
                      {/* Invoice Link */}
                      <td className="py-3.5 px-4 font-bold">
                        <button
                          onClick={() => handleOpenDetails(inv)}
                          className="text-blue-800 font-extrabold hover:underline text-left"
                          style={{ fontFamily: "var(--font-headline)" }}
                        >
                          {inv.AccountingDocument}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{formatDate(inv.InvoiceDate)}</td>
                      <td className="py-3.5 px-4">{statusBadge(inv.InvStatus)}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-800">{inv.GrossAmount} <span className="text-[9px] font-normal text-slate-400">{inv.Currency}</span></td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-800">{inv.NetAmount} <span className="text-[9px] font-normal text-slate-400">{inv.Currency}</span></td>
                      <td className="py-3.5 px-4 text-right text-slate-500">{inv.Tax} <span className="text-[9px] font-normal text-slate-400">{inv.Currency}</span></td>
                      <td className="py-3.5 px-4 text-right text-slate-500">{inv.Discounts} <span className="text-[9px] font-normal text-slate-400">{inv.Currency}</span></td>
                      <td className="py-3.5 px-4 text-slate-500">{inv.PaymentTerms}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">{formatDate(inv.NetDueDate)}</td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-800">{inv.PaymentRecived} <span className="text-[9px] font-normal text-slate-400">{inv.Currency}</span></td>

                      {/* PO Link */}
                      <td className="py-3.5 px-4 font-bold">
                        <button
                          onClick={() => handleOpenPO(inv.PurchasingDocument)}
                          className="text-blue-800 font-extrabold hover:underline"
                        >
                          {inv.PurchasingDocument}
                        </button>
                      </td>

                      {/* Row popover menu */}
                      <td className="py-3.5 px-4 text-center relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveActionIndex(activeActionIndex === idx ? null : idx);
                          }}
                          className="p-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition cursor-pointer"
                        >
                          <Icon name="more_vert" className="scale-110 font-bold" />
                        </button>

                        {activeActionIndex === idx && (
                          <div
                            ref={popoverRef}
                            className="absolute right-0 mt-1 w-32 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 text-left font-bold"
                          >
                            <button
                              onClick={() => {
                                setActiveActionIndex(null);
                                alert(`Invoice ${inv.AccountingDocument} Approved successfully.`);
                              }}
                              className="w-full px-3 py-2 text-xxs text-slate-700 hover:bg-slate-50 hover:text-blue-700 flex items-center gap-1.5"
                            >
                              <Icon name="check_circle" className="text-xs" /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setActiveActionIndex(null);
                                alert(`Invoice ${inv.AccountingDocument} Rejected.`);
                              }}
                              className="w-full px-3 py-2 text-xxs text-slate-700 hover:bg-slate-50 hover:text-blue-700 flex items-center gap-1.5"
                            >
                              <Icon name="cancel" className="text-xs" /> Reject
                            </button>
                            <button
                              onClick={() => {
                                setActiveActionIndex(null);
                                handleOpenDetails(inv);
                              }}
                              className="w-full px-3 py-2 text-xxs text-slate-700 hover:bg-slate-50 hover:text-blue-700 flex items-center gap-1.5"
                            >
                              <Eye className="h-3 w-3" /> View Details
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
                Showing {indexOfFirst + 1}–{Math.min(indexOfLast, invoices.length)} of {invoices.length} invoices
              </span>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed">
                  <Icon name="chevron_left" />
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
                  <button key={i} onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${currentPage === i + 1 ? "bg-blue-700 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}>
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                  className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed">
                  <Icon name="chevron_right" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── Invoice Details Modal (invoiceModal Overlay) ─── */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setSelectedInvoice(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300" />
          <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden animate-scale-up text-slate-800">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50/90 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
                  <Receipt className="h-4.5 w-4.5 text-blue-700" />
                  Invoice Billing Ledger
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Accounting Document: #{selectedInvoice.AccountingDocument} · Fiscal Year {selectedInvoice.FiscalYear}</p>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">

              {/* Left Column: Line Items Table (Wider) */}
              <div className="flex-1 space-y-4 lg:max-w-[calc(100%-320px)]">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <Icon name="list_alt" className="text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider" style={{ fontFamily: "var(--font-headline)" }}>
                    Billed Line Items
                  </h3>
                </div>

                {loadingItems ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="h-6 w-6 text-blue-700 animate-spin" />
                    <span className="text-xxs font-bold uppercase tracking-wider">Loading items…</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[350px] overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                    <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
                      <thead>
                        <tr className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[9px] border-b border-slate-800">
                          <th className="py-2.5 px-3 text-center">Item #</th>
                          <th className="py-2.5 px-3">Material</th>
                          <th className="py-2.5 px-3 text-right">Quantity</th>
                          <th className="py-2.5 px-3 text-center">UOM</th>
                          <th className="py-2.5 px-3 text-right">Unit Price</th>
                          <th className="py-2.5 px-3 text-right">Net Value</th>
                          <th className="py-2.5 px-3 text-right">Tax</th>
                          <th className="py-2.5 px-3 text-right">Gross Value</th>
                          <th className="py-2.5 px-3 text-right">Discounts</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-slate-600 bg-white">
                        {invoiceItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                            <td className="py-2.5 px-3 text-center text-blue-700 font-bold">{item.LineItem}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800">{item.Material}</td>
                            <td className="py-2.5 px-3 text-right font-extrabold text-slate-800">{item.Quantity}</td>
                            <td className="py-2.5 px-3 text-center text-slate-500 font-bold">{item.UOM}</td>
                            <td className="py-2.5 px-3 text-right font-medium">{item.UnitPrice}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">{item.NetValue}</td>
                            <td className="py-2.5 px-3 text-right text-slate-500">{item.Tax}</td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-800">{item.GrossAmount}</td>
                            <td className="py-2.5 px-3 text-right text-rose-600 font-medium">{item.Discounts}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Related Links inside Left column */}
                <div className="pt-2">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1.5">Related Inquiries</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xxs font-bold text-blue-700">
                    <a href={`/portal/invoices?po=${selectedInvoice.PurchasingDocument}`} className="hover:underline flex items-center gap-1 bg-slate-50 hover:bg-blue-50/50 py-1 px-2.5 rounded-lg border border-slate-200/60 transition">
                      <Eye className="h-3 w-3" /> View Invoices
                    </a>
                    <a href={`/portal/reports?type=deliveries&ref=${selectedInvoice.PurchasingDocument}`} className="hover:underline flex items-center gap-1 bg-slate-50 hover:bg-blue-50/50 py-1 px-2.5 rounded-lg border border-slate-200/60 transition">
                      <Eye className="h-3 w-3" /> Goods Receipts
                    </a>
                    <a href={`/portal/reports?type=payments&ref=${selectedInvoice.PurchasingDocument}`} className="hover:underline flex items-center gap-1 bg-slate-50 hover:bg-blue-50/50 py-1 px-2.5 rounded-lg border border-slate-200/60 transition">
                      <Icon name="payments" className="text-[11px]" /> Payment Status
                    </a>
                    <a href={`/portal/reports?type=contracts&ref=${selectedInvoice.PurchasingDocument}`} className="hover:underline flex items-center gap-1 bg-slate-50 hover:bg-blue-50/50 py-1 px-2.5 rounded-lg border border-slate-200/60 transition">
                      <Icon name="description" className="text-[11px]" /> Contract Details
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: Metadata Summary Card (Narrower) */}
              <div className="w-full lg:w-72 shrink-0 space-y-4">

                {/* Status & References Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm text-xxs">
                  <div className="font-extrabold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200/80">
                    Document Metadata
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Billing Status</span>
                    <span>{statusBadge(selectedInvoice.InvStatus)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">PO Document</span>
                    <button
                      onClick={() => {
                        setSelectedInvoice(null);
                        handleOpenPO(selectedInvoice.PurchasingDocument);
                      }}
                      className="font-extrabold text-blue-700 hover:underline hover:text-blue-800 text-left"
                    >
                      {selectedInvoice.PurchasingDocument || "N/A"}
                    </button>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Billing Date</span>
                    <span className="font-semibold text-slate-700">{formatDate(selectedInvoice.InvoiceDate)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Due Date</span>
                    <span className="font-semibold text-slate-700">{formatDate(selectedInvoice.NetDueDate)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Payment Terms</span>
                    <span className="font-semibold text-slate-600 truncate max-w-[130px]" title={selectedInvoice.PaymentTerms}>
                      {selectedInvoice.PaymentTerms}
                    </span>
                  </div>
                </div>

                {/* Pricing / Financial Ledger Card */}
                <div className="p-4 bg-slate-900 border border-slate-950 rounded-xl text-white space-y-3.5 shadow-sm text-xxs">
                  <div className="font-extrabold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                    Financial Summary
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Net Value</span>
                    <span className="font-bold">{selectedInvoice.NetAmount} {selectedInvoice.Currency}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Tax Total</span>
                    <span className="font-semibold text-slate-300">+{selectedInvoice.Tax} {selectedInvoice.Currency}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Discounts</span>
                    <span className="font-semibold text-rose-400">-{selectedInvoice.Discounts} {selectedInvoice.Currency}</span>
                  </div>

                  <div className="flex justify-between border-t border-slate-800 pt-2.5">
                    <span className="text-slate-400 font-bold text-[10px]">Gross Amount</span>
                    <span className="font-extrabold text-xs text-blue-400">{selectedInvoice.GrossAmount} {selectedInvoice.Currency}</span>
                  </div>

                  <div className="flex justify-between border-t border-slate-800/65 pt-2 text-[10px]">
                    <span className="text-slate-400">Received Pay</span>
                    <span className="font-bold text-emerald-450">{selectedInvoice.PaymentRecived} {selectedInvoice.Currency}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-150 bg-slate-50/90 flex justify-end">
              <button onClick={() => setSelectedInvoice(null)} className="btn-secondary py-1.5">
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── PO Details Modal (poModal Overlay) ─── */}
      {selectedPO && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setSelectedPO(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300" />
          <div className="w-full max-w-5xl bg-white border border-slate-200 rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden animate-scale-up text-slate-800">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50/90 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
                  <ShoppingBag className="h-4.5 w-4.5 text-blue-700" />
                  Purchase Order Details
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">SAP Document Reference: #{selectedPO.PO} · Direct ERP Log</p>
              </div>
              <button onClick={() => setSelectedPO(null)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer">
                <X className="h-4 w-4" />
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

                {loadingPODetails ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <Loader2 className="h-6 w-6 text-blue-700 animate-spin" />
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
                      <FileText className="h-3 w-3" /> View Invoices
                    </a>
                    <a href={`/portal/reports?type=deliveries&ref=${selectedPO.PO}`} className="hover:underline flex items-center gap-1 bg-slate-50 hover:bg-blue-50/50 py-1 px-2.5 rounded-lg border border-slate-200/60 transition">
                      <Eye className="h-3 w-3" /> Goods Receipts
                    </a>
                    <a href={`/portal/reports?type=payments&ref=${selectedPO.PO}`} className="hover:underline flex items-center gap-1 bg-slate-50 hover:bg-blue-50/50 py-1 px-2.5 rounded-lg border border-slate-200/60 transition">
                      <Icon name="payments" className="text-[11px]" /> Payment Status
                    </a>
                    <a href={`/portal/reports?type=contracts&ref=${selectedPO.PO}`} className="hover:underline flex items-center gap-1 bg-slate-50 hover:bg-blue-50/50 py-1 px-2.5 rounded-lg border border-slate-200/60 transition">
                      <Icon name="description" className="text-[11px]" /> View Contract
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
                Create ASN
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
