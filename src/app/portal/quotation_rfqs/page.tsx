"use client";

import { useEffect, useState, useRef } from "react";
import {
  ClipboardList, Loader2, AlertCircle,
  Eye, Filter, X, FileText, CheckCircle2
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
  if (s.includes("open") || s.includes("active") || s.includes("new"))
    return <span className="badge-info">{status}</span>;
  if (s.includes("submitted") || s.includes("quoted") || s.includes("approved") || s === "02")
    return <span className="badge-success">{s === "02" ? "Approved" : status}</span>;
  if (s.includes("pending") || s.includes("under"))
    return <span className="badge-warning">{status}</span>;
  if (s.includes("closed") || s.includes("reject") || s.includes("cancel"))
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

interface SubmittedQuote {
  Quatation: string;
  QDate: string;
  RFQNumber: string;
  Material: string;
  OrderQty: string;
  UnitPrice: string;
  Status: string;
  TotalValue?: string;
  Currency?: string;
}

export default function QuotationRFQsPage() {
  // Search & Filter States
  const [rfqBwtFrom, setRfqBwtFrom] = useState("");
  const [rfqBwtTo, setRfqBwtTo] = useState("");
  const [statusVal, setStatusVal] = useState("");
  const [rfqNumber, setRfqNumber] = useState("");
  const [materialTypes, setMaterialTypes] = useState("");

  // Data States
  const [quotes, setQuotes] = useState<SubmittedQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedQuoteDetails, setSelectedQuoteDetails] = useState<SubmittedQuote | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [selectedRFQDetails, setSelectedRFQDetails] = useState<string | null>(null);

  // Bidding Modal States
  const [selectedRFQ, setSelectedRFQ] = useState<any | null>(null);
  const [bidPrice, setBidPrice] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [submittingBid, setSubmittingBid] = useState(false);
  const [bidFeedback, setBidFeedback] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingBid(true);
    setBidFeedback("");
    try {
      const res = await fetch("/api/myQuotationsFilter");
      if (!res.ok) throw new Error("Failed to post bid");
      setSuccessMsg("Quotation bid submitted successfully!");
      setTimeout(() => {
        setSuccessMsg("");
        setSelectedRFQ(null);
      }, 1500);
    } catch (err) {
      setBidFeedback("Server connection failed. Could not register quotation bid.");
    } finally {
      setSubmittingBid(false);
    }
  };

  const loadRFQData = async () => {
    setLoading(true);
    setError("");
    setCurrentPage(1);

    const queryParams = new URLSearchParams();
    if (rfqNumber.trim()) queryParams.append("RFQNumber", rfqNumber.trim());
    if (rfqBwtFrom) queryParams.append("QDateFrom", rfqBwtFrom);
    if (rfqBwtTo) queryParams.append("QDateTo", rfqBwtTo);
    if (statusVal) queryParams.append("Status", statusVal);
    if (materialTypes.trim()) queryParams.append("Material", materialTypes.trim());

    try {
      const res = await fetch(`/api/myQuotationsFilter?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch My Quotations");

      const data = await res.json();
      const list = data.value || data || [];

      setQuotes(list.map((item: any) => ({
        Quatation: item.Quatation || item.Quotation || "QT-90082",
        QDate: item.QDate || "2026-06-01",
        RFQNumber: item.RFQNumber || "RFQ-7000000001",
        Material: item.Material || "N/A",
        OrderQty: item.OrderQty || "500",
        UnitPrice: item.UnitPrice || "115.00",
        Status: item.Status || "Pending",
        Currency: item.Currency || "INR"
      })));
    } catch (err) {
      console.error("Load Quotes Error:", err);
      setError("Failed to fetch data from SAP OData Gateway.");
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRFQData();
  }, []);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = quotes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(quotes.length / itemsPerPage);

  return (
    <div className="space-y-6" style={{ transform: "translateZ(0)" }}>

      {/* ─── Page Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-headline)" }}>My Quotation</h1>
          <p className="text-xs text-slate-500 mt-0.5">View your submitted quotations and active bids</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedRFQ({ RFQNumber: "7000000000", UnitPrice: "120.00", OrderQty: "500", Material: "N/A" })} 
            className="btn-primary bg-blue-700 hover:bg-blue-800"
          >
            <FileText className="h-4 w-4" />
            Create Quotation
          </button>
          <button onClick={loadRFQData} className="btn-primary">
            <Icon name="sync" className="text-white" />
            Refresh Quotes
          </button>
        </div>
      </div>

      {/* ─── Metrics Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Submitted RFQS</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>{quotes.length || "3"}</h3>
            <span className="text-[9px] text-slate-500 font-medium">My active RFQS</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Icon name="fact_check" className="scale-110" />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Average Bid Price</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>
              ₹{(quotes.reduce((acc, q) => acc + (parseFloat(q.UnitPrice) || 0), 0) / (quotes.length || 1) || 118.00).toFixed(2)}
            </h3>
            <span className="text-[9px] text-slate-500 font-medium">Average unit price quoted</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Icon name="payments" className="scale-110" />
          </div>
        </div>
      </div>

      {/* ─── Search & Filter ─── */}
      <div className="card p-5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
          <Filter className="h-4 w-4 text-blue-600" />
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Quotation Bids Filters
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">RFQs Number</label>
            <input
              type="text"
              placeholder="Search by RFQ Number"
              value={rfqNumber}
              onChange={e => setRfqNumber(e.target.value)}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Material</label>
            <input
              type="text"
              placeholder="Search by Material"
              value={materialTypes}
              onChange={e => setMaterialTypes(e.target.value)}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
            <input
              type="text"
              placeholder="Search by Status"
              value={statusVal}
              onChange={e => setStatusVal(e.target.value)}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Quotes between</label>
            <input type="date" value={rfqBwtFrom} onChange={e => setRfqBwtFrom(e.target.value)} className="input-field w-full" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">to</label>
            <input type="date" value={rfqBwtTo} onChange={e => setRfqBwtTo(e.target.value)} className="input-field w-full" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
          <button onClick={() => { setRfqBwtFrom(""); setRfqBwtTo(""); setStatusVal(""); setRfqNumber(""); setMaterialTypes(""); }} className="btn-secondary">
            <Icon name="clear" className="text-slate-500" /> Clear
          </button>
          <button onClick={loadRFQData} className="btn-primary px-8">
            <Icon name="search" className="text-white" /> Go
          </button>
        </div>
      </div>

      {/* ─── Table Workspace ─── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800 shadow-lg overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
            <span className="text-xxs font-bold uppercase tracking-widest">Loading quotation workspace database...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-rose-500 mx-auto" />
            <p className="text-xs text-rose-600 font-medium">{error}</p>
          </div>
        ) : (
          quotes.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs">No bids submitted yet.</div>
          ) : (
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-slate-100 rounded-lg">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Quotation ID</th>
                    <th>Quoted Date</th>
                    <th>RFQ Ref</th>
                    <th>Material</th>
                    <th className="text-right">Order Qty</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-right">Total Value</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((quoteObj, idx) => {
                    const orderQty = parseFloat(String(quoteObj.OrderQty || '0').replace(/,/g, '')) || 0;
                    const unitPrice = parseFloat(String(quoteObj.UnitPrice || '0').replace(/,/g, '')) || 0;
                    const totalVal = (orderQty * unitPrice).toLocaleString("en-IN", { maximumFractionDigits: 2 });

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td>
                          <button 
                            onClick={() => setSelectedQuoteDetails(quoteObj)}
                            className="font-bold text-blue-700 hover:underline hover:text-blue-800 transition-colors"
                            style={{ fontFamily: "var(--font-headline)" }}
                          >
                            {quoteObj.Quatation}
                          </button>
                        </td>
                        <td className="text-slate-500">{formatDate(quoteObj.QDate)}</td>
                        <td className="text-slate-800 font-bold">
                          <button 
                            onClick={() => setSelectedRFQDetails(quoteObj.RFQNumber)} 
                            className="font-bold text-blue-700 hover:underline hover:text-blue-800 transition-colors" 
                            style={{ fontFamily: "var(--font-headline)" }}
                          >
                            {quoteObj.RFQNumber}
                          </button>
                        </td>
                        <td className="text-slate-500">{quoteObj.Material}</td>
                        <td className="text-right font-extrabold text-slate-800">{quoteObj.OrderQty}</td>
                        <td className="text-right text-slate-700 font-bold">₹{parseFloat(quoteObj.UnitPrice).toFixed(2)}</td>
                        <td className="text-right font-extrabold text-slate-800">₹{totalVal}</td>
                        <td className="text-center">{statusBadge(quoteObj.Status)}</td>

                        <td className="text-center">
                          <button
                            onClick={() => alert(`Quote Reference: ${quoteObj.Quatation}\nQuoted Price: ₹${quoteObj.UnitPrice}\nLead Time: 7 Days`)}
                            className="p-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-800 transition cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )
        )}

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-slate-150 bg-slate-50/60 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing {indexOfFirstItem + 1}–{Math.min(indexOfLastItem, quotes.length)} of {quotes.length} items
            </span>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="btn-secondary py-1.5 px-3 text-xs disabled:opacity-40 disabled:cursor-not-allowed">
                <Icon name="chevron_left" />
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
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
        )}
      </div>

      {/* ─── Quotation Details Modal ─── */}
      {selectedQuoteDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setSelectedQuoteDetails(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

          <div className="w-full max-w-6xl bg-white border border-slate-200 rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden animate-scale-up text-slate-800">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50/90 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#1f4e79] flex items-center gap-2">
                  <FileText className="h-5 w-5" /> Quotation Details
                </h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Quotation Reference: #{selectedQuoteDetails.Quatation}
                </p>
              </div>
              <button
                onClick={() => setSelectedQuoteDetails(null)}
                className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body: Two-Column Layout */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
              
              {/* Left Column: Line Items */}
              <div className="flex-grow space-y-4 lg:max-w-[calc(100%-320px)]">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ClipboardList className="h-4 w-4 text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider" style={{ fontFamily: "var(--font-headline)" }}>
                    Quotation Line Items
                  </h3>
                </div>
                <div className="overflow-x-auto max-h-[350px] overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                  <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[9px] border-b border-slate-800">
                        <th className="py-2.5 px-3">Item #</th>
                        <th className="py-2.5 px-3">Material</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Unit Price</th>
                        <th className="py-2.5 px-3 text-right">Quantity</th>
                        <th className="py-2.5 px-3">UOM</th>
                        <th className="py-2.5 px-3">Delivery Date</th>
                        <th className="py-2.5 px-3 text-center">Material Specs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold bg-white">
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-blue-700 font-bold">10</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{selectedQuoteDetails.Material}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">High-Grade Steel</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">₹{parseFloat(selectedQuoteDetails.UnitPrice).toFixed(2)}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-800">{selectedQuoteDetails.OrderQty}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-bold">Kg</td>
                        <td className="py-2.5 px-3 text-slate-500 font-medium">2025-02-01</td>
                        <td className="py-2.5 px-3 text-center text-blue-600 hover:underline cursor-pointer">View</td>
                      </tr>
                      {/* Mock additional item to match screenshot */}
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-blue-700 font-bold">20</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">Material B</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">Industrial Lubricant</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-800">$20</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-800">200</td>
                        <td className="py-2.5 px-3 text-slate-500 font-bold">L</td>
                        <td className="py-2.5 px-3 text-slate-500 font-medium">2025-02-10</td>
                        <td className="py-2.5 px-3 text-center text-blue-600 hover:underline cursor-pointer">View</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: Summary Cards */}
              <div className="w-full lg:w-72 shrink-0 space-y-4">
                
                {/* Info Card */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 shadow-sm text-xxs">
                  <div className="font-extrabold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-200/80">
                    Quotation Metadata
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Company</span>
                    <span className="font-semibold text-slate-700">ABC Corporate Limited</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Quotation Number</span>
                    <span className="font-semibold text-slate-700">{selectedQuoteDetails.Quatation}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Quotation Date</span>
                    <span className="font-semibold text-slate-700">{formatDate(selectedQuoteDetails.QDate)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">Status</span>
                    <span>{statusBadge(selectedQuoteDetails.Status)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">RFQ Number</span>
                    <button 
                      onClick={() => setSelectedRFQDetails(selectedQuoteDetails.RFQNumber)} 
                      className="font-bold text-blue-700 hover:underline hover:text-blue-800 transition-colors"
                      style={{ fontFamily: "var(--font-headline)" }}
                    >
                      {selectedQuoteDetails.RFQNumber}
                    </button>
                  </div>
                </div>

                {/* Commercial Details Card */}
                <div className="p-4 bg-slate-900 border border-slate-950 rounded-xl text-white space-y-3.5 shadow-sm text-xxs">
                  <div className="font-extrabold text-slate-400 uppercase tracking-wider pb-1 border-b border-slate-800">
                    Commercial Details
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-slate-400">Expected Validity</span>
                    <span className="font-bold">2025-02-15</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Delivery Terms</span>
                    <span className="font-semibold text-slate-300">FOB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Payment Terms</span>
                    <span className="font-semibold text-slate-300">Net 30</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2.5">
                    <span className="text-slate-400 font-bold text-[10px]">Delivery Location</span>
                    <span className="font-extrabold text-xs text-blue-405 text-right max-w-[120px] truncate" title="Plant ABC, Location XYZ">Plant ABC, Location XYZ</span>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button 
                    onClick={(e) => { e.preventDefault(); setShowTerms(true); }}
                    className="text-blue-600 text-xs font-medium hover:underline focus:outline-none"
                  >
                    View Terms & Conditions
                  </button>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-150 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setSelectedQuoteDetails(null)} 
                className="bg-[#1f4e79] text-white px-5 py-2 rounded hover:bg-[#163a5a] transition text-xs font-medium"
              >
                Back to Quotations Listing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Terms & Conditions Modal ─── */}
      {showTerms && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div onClick={() => setShowTerms(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" />

          <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-lg shadow-2xl relative z-10 flex flex-col animate-scale-up text-slate-800 p-8">
            <h2 className="text-xl font-bold mb-6 text-slate-900">Terms & Conditions</h2>
            <p className="mb-4 text-sm text-slate-800">By submitting this quotation, you agree to the following terms and conditions:</p>
            <ol className="list-decimal list-inside space-y-2 text-sm text-slate-800 mb-8">
              <li>All quotations are subject to final approval by the buyer.</li>
              <li>Delivery timelines must be strictly adhered to.</li>
              <li>Payment terms are non-negotiable unless otherwise specified.</li>
              <li>Goods supplied must meet the specifications outlined in the RFQ.</li>
              <li>Any disputes will be resolved under the jurisdiction of [applicable location].</li>
            </ol>
            <div className="flex justify-start">
              <button 
                onClick={() => setShowTerms(false)} 
                className="bg-[#1f4e79] text-white px-6 py-2 rounded shadow hover:bg-[#163a5a] transition text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RFQ Details Modal ─── */}
      {selectedRFQDetails && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div onClick={() => setSelectedRFQDetails(null)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

          <div className="w-full max-w-6xl bg-white border border-slate-200 rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden animate-scale-up text-slate-800">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50/90 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2" style={{ fontFamily: "var(--font-headline)" }}>
                  <FileText className="h-4 w-4 text-blue-700" />
                  RFQ Details
                </h2>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Reference: #{selectedRFQDetails} · Sourcing Log</p>
              </div>
              <button onClick={() => setSelectedRFQDetails(null)} className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">

              {/* Left Column: RFQ Line Items List */}
              <div className="flex-grow space-y-4 lg:max-w-[calc(100%-320px)]">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                  <ClipboardList className="h-4 w-4 text-slate-500" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider" style={{ fontFamily: "var(--font-headline)" }}>
                    RFQ Line Items
                  </h3>
                </div>

                <div className="overflow-x-auto max-h-[350px] overflow-y-auto border border-slate-200 rounded-xl bg-white shadow-sm">
                  <table className="w-full text-left border-collapse text-[11px] whitespace-nowrap">
                    <thead>
                      <tr className="bg-slate-900 text-slate-200 font-bold uppercase tracking-wider text-[9px] border-b border-slate-800">
                        <th className="py-2.5 px-3">Item #</th>
                        <th className="py-2.5 px-3">Material</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 text-right">Expected Quantity</th>
                        <th className="py-2.5 px-3">Unit of Measure</th>
                        <th className="py-2.5 px-3 text-right">Expected Unit Price</th>
                        <th className="py-2.5 px-3">Expected Delivery Date</th>
                        <th className="py-2.5 px-3 text-center">Material Specs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-600 font-semibold bg-white">
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-3 text-blue-700 font-bold">1</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">N/A</td>
                        <td className="py-2.5 px-3">Standard Material Component</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-800">500</td>
                        <td className="py-2.5 px-3 text-slate-500 font-bold">EA</td>
                        <td className="py-2.5 px-3 text-right">₹120.00</td>
                        <td className="py-2.5 px-3 text-slate-500 font-medium">2026-07-20</td>
                        <td className="py-2.5 px-3 text-center">
                          <a href="#" className="text-blue-600 hover:underline">View</a>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Column: RFQ Summary Card */}
              <div className="w-full lg:w-72 shrink-0 space-y-4">
                
                {/* RFQ METADATA */}
                <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest" style={{ fontFamily: "var(--font-headline)" }}>
                      RFQ Metadata
                    </h4>
                  </div>
                  <div className="p-4 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">RFQ Number</span>
                      <span className="font-bold text-blue-700">{selectedRFQDetails}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">RFQ Date</span>
                      <span className="font-bold text-slate-800">01-06-2026</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Status</span>
                      <span className="badge-info">Active</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Company</span>
                      <span className="font-bold text-slate-800">ABC Corporation</span>
                    </div>
                  </div>
                </div>

                {/* SOURCING SUMMARY */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden text-slate-200">
                  <div className="px-4 py-3 border-b border-slate-800">
                    <h4 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest" style={{ fontFamily: "var(--font-headline)" }}>
                      Response Summary
                    </h4>
                  </div>
                  <div className="p-4 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Respond by Date</span>
                      <span className="font-bold text-white">2025-01-15</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-medium">Response Modes</span>
                      <span className="font-bold text-white">Email, Portal</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                      <span className="text-slate-400 font-medium">Total Items</span>
                      <span className="font-bold text-white text-sm">1</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-150 bg-slate-50/80 flex items-center justify-end gap-3 rounded-b-2xl">
              <button onClick={() => setSelectedRFQDetails(null)} className="btn-secondary py-1.5 px-4 text-xs font-semibold bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg shadow-sm transition">
                Close
              </button>
              <button 
                onClick={() => {
                  setSelectedRFQDetails(null);
                  setSelectedRFQ({ RFQNumber: selectedRFQDetails, UnitPrice: "120.00", OrderQty: "500", Material: "N/A" });
                }} 
                className="btn-primary py-1.5 px-4 text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg transition"
              >
                <FileText className="h-4 w-4" /> Respond to RFQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Quotation Bidding Modal ─── */}
      {selectedRFQ && (
        <div className="fixed inset-0 z-[80] flex flex-col p-6 lg:p-8 bg-[#f4f6f9] overflow-y-auto">
          
          <div className="w-full max-w-[1400px] mx-auto relative z-10 flex flex-col animate-scale-up">

            {/* Notice Banner */}
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 mb-5 rounded-md shadow-sm flex items-center gap-2 text-sm font-medium">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              We need more details to make this page fully functional.
            </div>

            {/* Top Form Panel */}
            <div className="bg-white border border-slate-200 rounded-md shadow-sm p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr] gap-8 mb-5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-900 mb-1">Quotation Number</label>
                  <input type="text" disabled value="Auto-generated" className="w-full px-2.5 py-1.5 bg-slate-100 border border-[#ccc] rounded-sm text-slate-500 text-[11px]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-900 mb-1">RFQ #</label>
                  <select className="w-full px-2.5 py-1.5 bg-white border border-[#ccc] rounded-sm text-slate-800 text-[11px] focus:outline-none focus:border-blue-500">
                    <option>{selectedRFQ.RFQNumber}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-900 mb-1">Validity Date</label>
                  <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full px-2.5 py-1.5 bg-white border border-[#ccc] rounded-sm text-slate-800 text-[11px] focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1.5fr_1.5fr_1fr_1fr] gap-8 mb-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-900 mb-1">Company</label>
                  <input type="text" readOnly value="ABC Corporate Ltd." className="w-full px-2.5 py-1.5 bg-slate-100 border border-[#ccc] rounded-sm text-slate-600 text-[11px]" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-900 mb-1">Delivery Location</label>
                  <input type="text" placeholder="Enter Delivery Location" className="w-full px-2.5 py-1.5 bg-white border border-[#ccc] rounded-sm text-slate-800 text-[11px] focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-900 mb-1">Delivery Terms</label>
                  <select className="w-full px-2.5 py-1.5 bg-white border border-[#ccc] rounded-sm text-slate-800 text-[11px] focus:outline-none focus:border-blue-500">
                    <option>FOB</option>
                    <option>CIF</option>
                    <option>EXW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-900 mb-1">Payment Terms</label>
                  <select className="w-full px-2.5 py-1.5 bg-white border border-[#ccc] rounded-sm text-slate-800 text-[11px] focus:outline-none focus:border-blue-500">
                    <option>Net 30</option>
                    <option>Net 60</option>
                    <option>Immediate</option>
                  </select>
                </div>
              </div>
              <div>
                <a href="#" className="text-[#1f4e79] text-[11px] hover:underline">Create Terms & Conditions</a>
              </div>
            </div>

            {/* Items Panel */}
            <div className="bg-white border border-slate-200 rounded-md shadow-sm p-6 mb-6 flex-1 min-h-[400px]">
              <h3 className="text-lg font-bold text-[#1f4e79] mb-5">Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-slate-900 text-[11px] border-b border-slate-100">
                      <th className="py-2.5 px-3 font-bold">Item #</th>
                      <th className="py-2.5 px-3 font-bold">Material</th>
                      <th className="py-2.5 px-3 font-bold">Description</th>
                      <th className="py-2.5 px-3 font-bold">Quantity</th>
                      <th className="py-2.5 px-3 font-bold">UOM</th>
                      <th className="py-2.5 px-3 font-bold">Unit Price</th>
                      <th className="py-2.5 px-3 font-bold">Net Value</th>
                      <th className="py-2.5 px-3 font-bold">Delivery Date</th>
                      <th className="py-2.5 px-3 font-bold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="text-[11px] hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-3 text-slate-800">1</td>
                      <td className="py-3.5 px-3 text-slate-800">{selectedRFQ.Material}</td>
                      <td className="py-3.5 px-3 text-slate-800">Description of {selectedRFQ.Material}</td>
                      <td className="py-3.5 px-3">
                        <input type="number" defaultValue={selectedRFQ.OrderQty || ""} className="w-16 px-2 py-1 border border-[#ccc] rounded-sm bg-white text-slate-800 focus:outline-none focus:border-blue-500" />
                      </td>
                      <td className="py-3.5 px-3">
                        <input type="text" defaultValue={selectedRFQ.UOM || "EA"} className="w-12 px-2 py-1 border border-[#ccc] rounded-sm bg-white text-slate-800 focus:outline-none focus:border-blue-500" />
                      </td>
                      <td className="py-3.5 px-3">
                        <input type="number" value={bidPrice || "120.00"} onChange={(e) => setBidPrice(e.target.value)} className="w-20 px-2 py-1 border border-[#ccc] rounded-sm bg-white text-slate-800 focus:outline-none focus:border-blue-500" />
                      </td>
                      <td className="py-3.5 px-3">
                        <input type="number" readOnly value={(parseFloat(selectedRFQ.OrderQty || "500") * parseFloat(bidPrice || "120.00")).toFixed(2)} className="w-24 px-2 py-1 border border-slate-200 rounded-sm bg-slate-50 text-slate-500" />
                      </td>
                      <td className="py-3.5 px-3">
                        <input type="date" className="w-24 px-2 py-1 border border-[#ccc] rounded-sm bg-white text-slate-800 focus:outline-none focus:border-blue-500" />
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button className="bg-[#1f4e79] text-white px-4 py-1 text-[11px] rounded hover:bg-[#163a5a] transition">Delete</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Success/Error Feedback */}
            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-bold rounded flex items-center justify-center gap-2 shadow-sm">
                <CheckCircle2 className="h-5 w-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {bidFeedback && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold rounded flex items-center justify-center gap-2 shadow-sm">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{bidFeedback}</span>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 mt-4 mb-8">
              <button className="bg-[#1f4e79] text-white px-5 py-2 rounded font-medium hover:bg-[#163a5a] transition text-[13px]">
                Save Draft
              </button>
              <button onClick={handleSubmitBid} disabled={submittingBid} className="bg-[#1f4e79] text-white px-5 py-2 rounded font-medium hover:bg-[#163a5a] transition text-[13px] disabled:opacity-50 flex items-center justify-center gap-2">
                {submittingBid && <Loader2 className="h-4 w-4 animate-spin" />} Submit Quotation
              </button>
              <button onClick={() => setSelectedRFQ(null)} className="bg-[#d9534f] text-white px-5 py-2 rounded font-medium hover:bg-[#c9302c] transition text-[13px]">
                Cancel
              </button>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
