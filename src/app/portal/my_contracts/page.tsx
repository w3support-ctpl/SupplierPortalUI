"use client";

import { useEffect, useState } from "react";

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

interface Contract {
  ContractNo: string;
  Title: string;
  Category: string;
  Type: string;
  StartDate: string;
  EndDate: string;
  Item: string;
  Quantity: string;
  UOM: string;
  Status: string;
  RatePerUnit: string;
}

function statusBadge(status: string) {
  const s = status?.toLowerCase() ?? "";
  if (s.includes("active") || s.includes("approved"))
    return <span className="badge-success">{status}</span>;
  if (s.includes("pending") || s.includes("process"))
    return <span className="badge-warning">{status}</span>;
  if (s.includes("expired") || s.includes("cancel") || s.includes("reject"))
    return <span className="badge-error">{status}</span>;
  return <span className="badge-neutral">{status}</span>;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  // Check if it's already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-");
    return `${day}-${month}-${year}`;
  }
  // Check if it's YYYYMMDD
  if (dateStr.length === 8 && /^\d{8}$/.test(dateStr)) {
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}-${month}-${year}`;
  }
  return dateStr;
}

export default function MyContractsPage() {

  // Filter States
  const [category, setCategory] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Data States
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const itemsPerPage = 10;

  const fetchContracts = async () => {
    setLoading(true);
    setError("");
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (category.trim()) params.append("Category", category.trim());
    if (type.trim()) params.append("Type", type.trim());
    if (status.trim()) params.append("Status", status.trim());
    if (dateFrom) params.append("StartDate", dateFrom.replace(/-/g, ""));
    if (dateTo) params.append("EndDate", dateTo.replace(/-/g, ""));

    try {
      const res = await fetch(`/api/myContractsFilter?${params}`);
      
      if (!res.ok) {
        throw new Error("Failed to fetch");
      }
      
      const data = await res.json();
      const list = data.value || data || [];
      
      // If the API returns empty list, maybe we populate some dummy data matching the screenshot for preview if error happens or if empty?
      // Wait, let's just map data as it is. 
      if (list.length === 0) {
        // We will show empty state
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setContracts(list.map((item: any) => ({
        ContractNo: item.Contract || item.ContractNumber || "",
        Title: item.Title || "",
        Category: item.Catagory || item.Category || "",
        Type: item.Type || "",
        StartDate: item.StartDate || "",
        EndDate: item.EndDate || "",
        Item: item.Material || item.Item || "",
        Quantity: item.Quantity || "0",
        UOM: item.UOM || "",
        Status: item.Status || "Active",
        RatePerUnit: item.Unit || item.Rate_Unit || "0.00"
      })));
    } catch {
      // Mock data matching the screenshot if API fails for development fallback
      const mockData: Contract[] = [
        { ContractNo: "CON12345", Title: "Material Supply Contract", Category: "Material", Type: "Rate Contract", StartDate: "2025-01-01", EndDate: "2026-01-01", Item: "Steel Bars", Quantity: "10,000", UOM: "Kg", Status: "Active", RatePerUnit: "$1,000,000" },
        { ContractNo: "CON12346", Title: "IT Services Contract", Category: "Service", Type: "Framework Agreement", StartDate: "2024-07-01", EndDate: "2025-06-30", Item: "Network Maintenance", Quantity: "500", UOM: "Hours", Status: "Expired", RatePerUnit: "$250,000" },
        { ContractNo: "CON12345", Title: "Material Supply Contract", Category: "Material", Type: "Rate Contract", StartDate: "2025-01-01", EndDate: "2026-01-01", Item: "Steel Bars", Quantity: "10,000", UOM: "Kg", Status: "Active", RatePerUnit: "$1,000,000" },
        { ContractNo: "CON12346", Title: "IT Services Contract", Category: "Service", Type: "Framework Agreement", StartDate: "2024-07-01", EndDate: "2025-06-30", Item: "Network Maintenance", Quantity: "500", UOM: "Hours", Status: "Expired", RatePerUnit: "$250,000" },
        { ContractNo: "CON12347", Title: "Office Supplies Contract", Category: "Material", Type: "Fixed Contract", StartDate: "2023-01-01", EndDate: "2024-12-31", Item: "Printer Paper", Quantity: "5,000", UOM: "Reams", Status: "Active", RatePerUnit: "$15,000" },
        { ContractNo: "CON12348", Title: "Machinery Maintenance Contract", Category: "Service", Type: "Rate Contract", StartDate: "2024-06-01", EndDate: "2025-06-01", Item: "Annual Maintenance", Quantity: "12", UOM: "Months", Status: "Active", RatePerUnit: "$120,000" },
        { ContractNo: "CON12349", Title: "Consulting Services Contract", Category: "Service", Type: "Framework Agreement", StartDate: "2023-09-01", EndDate: "2024-09-01", Item: "Strategy Consulting", Quantity: "300", UOM: "Hours", Status: "Expired", RatePerUnit: "$90,000" }
      ];
      setContracts(mockData);
      setError("Failed to sync Contracts with server API. Showing offline preview data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchContracts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentContracts = contracts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(contracts.length / itemsPerPage) || 1;

  return (
    <div className="space-y-5 animate-fade-in-up" style={{ transform: "translateZ(0)" }}>
      {/* ─── Page Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-headline)" }}>My Contracts</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage and view all your contracts</p>
        </div>
      </div>

      {/* ─── Metrics Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Total Contracts</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>{contracts.length}</h3>
            <span className="text-[9px] text-slate-500 font-medium">All contracts count</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Icon name="description" className="scale-110" />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Active Contracts</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>
              {contracts.filter(c => c.Status?.toLowerCase() === "active").length}
            </h3>
            <span className="text-[9px] text-slate-500 font-medium">Currently active</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Icon name="check_circle" className="scale-110" />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Expired Contracts</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>
              {contracts.filter(c => c.Status?.toLowerCase() === "expired").length}
            </h3>
            <span className="text-[9px] text-slate-500 font-medium">No longer valid</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Icon name="warning" className="scale-110" />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Rate Contracts</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>
              {contracts.filter(c => c.Type?.toLowerCase().includes("rate")).length}
            </h3>
            <span className="text-[9px] text-slate-500 font-medium">Rate contract type</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Icon name="request_quote" className="scale-110" />
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
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-label)" }}>Category</label>
            <input type="text" placeholder="Category" value={category} onChange={e => setCategory(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-label)" }}>Type</label>
            <input type="text" placeholder="Type" value={type} onChange={e => setType(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-label)" }}>Status</label>
            <input type="text" placeholder="Status" value={status} onChange={e => setStatus(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-label)" }}>Start Date</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input-field" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1" style={{ fontFamily: "var(--font-label)" }}>End Date</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input-field" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-100">
          <button onClick={() => { setCategory(""); setType(""); setStatus(""); setDateFrom(""); setDateTo(""); }} className="btn-secondary">
            <Icon name="clear" className="text-slate-500" />
            Clear Filters
          </button>
          <button onClick={fetchContracts} className="btn-primary">
            <Icon name="search" className="text-white" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* ─── Table Card ─── */}
      <div className="card overflow-hidden">
        {error && (
          <div className="bg-rose-50 p-3 text-center border-b border-rose-100">
            <p className="text-sm text-rose-600 font-medium">{error}</p>
          </div>
        )}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-blue-700 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ fontFamily: "var(--font-label)" }}>Loading contracts…</span>
          </div>
        ) : contracts.length === 0 ? (
          <div className="py-16 text-center">
            <Icon name="inbox" className="text-slate-300 mx-auto text-4xl" />
            <p className="text-sm text-slate-400 mt-2">No contracts matched your filters.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto max-h-[400px] overflow-y-auto border border-slate-100 rounded-lg">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Contract #</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Item</th>
                    <th>Quantity</th>
                    <th>UOM</th>
                    <th>Status</th>
                    <th className="text-right">Rate/Unit</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentContracts.map((contract, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td>
                        <button 
                          onClick={() => setSelectedContract(contract)}
                          className="font-bold text-blue-700 hover:underline hover:text-blue-800" 
                          style={{ fontFamily: "var(--font-headline)" }}
                        >
                          {contract.ContractNo}
                        </button>
                      </td>
                      <td className="text-slate-500 max-w-[200px] truncate">{contract.Title}</td>
                      <td className="font-semibold text-slate-800">{contract.Category}</td>
                      <td className="font-semibold text-slate-500">{contract.Type}</td>
                      <td>{formatDate(contract.StartDate)}</td>
                      <td>{formatDate(contract.EndDate)}</td>
                      <td className="font-semibold text-slate-800">{contract.Item}</td>
                      <td>{contract.Quantity}</td>
                      <td className="font-semibold text-slate-500">{contract.UOM}</td>
                      <td>{statusBadge(contract.Status)}</td>
                      <td className="text-right font-bold text-slate-700">{contract.RatePerUnit}</td>
                      <td className="text-center relative">
                        <button className="p-1 rounded bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition cursor-pointer">
                          <Icon name="download" className="scale-90" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <span className="text-xs text-slate-500" style={{ fontFamily: "var(--font-label)" }}>
                Showing {indexOfFirst + 1}–{Math.min(indexOfLast, contracts.length)} of {contracts.length} contracts
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
                      ? "bg-[#1f4e79] text-white shadow-sm"
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

      {/* ─── Contract Details Modal ─── */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-[#1f2937] text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <Icon name="description" className="text-blue-400" />
                <h2 className="text-sm font-bold tracking-wide" style={{ fontFamily: "var(--font-headline)" }}>Contract Details</h2>
              </div>
              <button onClick={() => setSelectedContract(null)} className="p-1 hover:bg-slate-700 rounded-full transition-colors">
                <Icon name="close" />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto space-y-6">
              {/* Warning Banner */}
              <div className="bg-amber-50 text-amber-800 p-3 rounded flex items-center gap-2 border border-amber-200">
                <Icon name="info" className="text-amber-600 scale-90" />
                <span className="text-[13px] font-semibold">This is a sample. We need more details to make it fully functional.</span>
              </div>

              {/* Header Information */}
              <div>
                <h3 className="text-xs font-bold text-blue-900 mb-3 border-b-2 border-blue-100 pb-1 uppercase" style={{ fontFamily: "var(--font-headline)" }}>Header Information</h3>
                <div className="grid grid-cols-2 gap-4 text-[13px]">
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contract Number</p>
                    <p className="font-semibold text-slate-900">{selectedContract.ContractNo}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Contract Title</p>
                    <p className="font-semibold text-slate-900">{selectedContract.Title || "Material Supply Contract"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</p>
                    <p className="font-semibold text-slate-900">{selectedContract.Category || "Material"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Type</p>
                    <p className="font-semibold text-slate-900">{selectedContract.Type || "Rate Contract"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Start Date</p>
                    <p className="font-semibold text-slate-900">{formatDate(selectedContract.StartDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">End Date</p>
                    <p className="font-semibold text-slate-900">{formatDate(selectedContract.EndDate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Contract Value</p>
                    <p className="font-semibold text-slate-900">$1,000,000</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</p>
                    <p className="font-semibold text-slate-900">{selectedContract.Status}</p>
                  </div>
                  <div className="col-span-2 mt-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Attachments</p>
                    <button className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                      <Icon name="download" className="scale-75" /> Download Contract
                    </button>
                  </div>
                </div>
              </div>

              {/* Item-Level Information */}
              <div>
                <h3 className="text-xs font-bold text-blue-900 mb-3 border-b-2 border-blue-100 pb-1 uppercase" style={{ fontFamily: "var(--font-headline)" }}>Item-Level Information</h3>
                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1f2937] text-white">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Item #</th>
                        <th className="py-2 px-3 font-semibold">Material</th>
                        <th className="py-2 px-3 font-semibold">Quantity</th>
                        <th className="py-2 px-3 font-semibold">Delivered Quantity</th>
                        <th className="py-2 px-3 font-semibold">Remaining Quantity</th>
                        <th className="py-2 px-3 font-semibold">UOM</th>
                        <th className="py-2 px-3 font-semibold text-right">Unit Price</th>
                        <th className="py-2 px-3 font-semibold text-right">Taxes</th>
                        <th className="py-2 px-3 font-semibold text-right">Discounts</th>
                        <th className="py-2 px-3 font-semibold text-right">Net Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-3">1</td>
                        <td className="py-2 px-3">{selectedContract.Item || "Steel Bars"}</td>
                        <td className="py-2 px-3">{selectedContract.Quantity || "10,000"}</td>
                        <td className="py-2 px-3">7,500</td>
                        <td className="py-2 px-3">2,500</td>
                        <td className="py-2 px-3">{selectedContract.UOM || "Kg"}</td>
                        <td className="py-2 px-3 text-right">${selectedContract.RatePerUnit || "100"}</td>
                        <td className="py-2 px-3 text-right">$1,500</td>
                        <td className="py-2 px-3 text-right">$500</td>
                        <td className="py-2 px-3 text-right font-semibold">$980,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Milestones */}
              <div>
                <h3 className="text-xs font-bold text-blue-900 mb-3 border-b-2 border-blue-100 pb-1 uppercase" style={{ fontFamily: "var(--font-headline)" }}>Milestones</h3>
                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1f2937] text-white">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Milestone</th>
                        <th className="py-2 px-3 font-semibold">Due Date</th>
                        <th className="py-2 px-3 font-semibold">Status</th>
                        <th className="py-2 px-3 font-semibold text-right">Payment Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-3">Delivery Phase 1</td>
                        <td className="py-2 px-3">2025-05-01</td>
                        <td className="py-2 px-3">Completed</td>
                        <td className="py-2 px-3 text-right font-semibold">$500,000</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Amendments/History */}
              <div>
                <h3 className="text-xs font-bold text-blue-900 mb-3 border-b-2 border-blue-100 pb-1 uppercase" style={{ fontFamily: "var(--font-headline)" }}>Amendments/History</h3>
                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1f2937] text-white">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Amendment Date</th>
                        <th className="py-2 px-3 font-semibold">Reason</th>
                        <th className="py-2 px-3 font-semibold">Changed By</th>
                        <th className="py-2 px-3 font-semibold">Summary Of Changes</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-3">2025-01-15</td>
                        <td className="py-2 px-3">Price Revision</td>
                        <td className="py-2 px-3">John Doe</td>
                        <td className="py-2 px-3">Updated unit price from $95 to $100</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Delivery Schedule */}
              <div>
                <h3 className="text-xs font-bold text-blue-900 mb-3 border-b-2 border-blue-100 pb-1 uppercase" style={{ fontFamily: "var(--font-headline)" }}>Delivery Schedule</h3>
                <div className="overflow-x-auto border border-slate-200 rounded">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#1f2937] text-white">
                      <tr>
                        <th className="py-2 px-3 font-semibold">Delivery Date</th>
                        <th className="py-2 px-3 font-semibold">Location</th>
                        <th className="py-2 px-3 font-semibold text-right">Quantity</th>
                        <th className="py-2 px-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-100">
                        <td className="py-2 px-3">2025-03-15</td>
                        <td className="py-2 px-3">Warehouse A</td>
                        <td className="py-2 px-3 text-right">5,000</td>
                        <td className="py-2 px-3">Delivered</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-lg">
              <button onClick={() => setSelectedContract(null)} className="btn-secondary px-6 bg-white border border-slate-300 rounded hover:bg-slate-50 text-sm font-medium py-1.5">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
