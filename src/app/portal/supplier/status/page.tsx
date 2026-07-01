"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2, AlertCircle, CheckCircle2, Package, Eye, FileText, ClipboardList, RefreshCw, DollarSign, ShieldAlert
} from "lucide-react";

interface Mapping {
  Mapping_ID: number;
  Supplier_ID: string;
  Product_ID: string;
  Supplier_Product_Code: string;
  Product_Approval_Status: string;
  Packaging_Details: string;
  Technical_Datasheet: string | null;
  Shape: string;
  Price_ID: number;
  Unit_Price: number;
  Currency: string;
  MOQ: number;
  Lead_Time: number;
  Price_Approval_Status: string;
  SAPProductDescription: string;
  MaterialType: string;
  Unit: string;
  Image: string | null;
  ProductSpecification: string;
}

interface Proposal {
  Proposal_ID: number;
  Supplier_ID: string;
  Product_Name: string;
  Description: string;
  Category: string;
  Specifications: string;
  Image_URL: string | null;
  Datasheet_URL: string | null;
  Initial_Price: number;
  Status: string;
  CreatedAt: string;
}

export default function SupplierStatusPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabQuery = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<"product-approval" | "price-approval" | "proposals">("product-approval");
  const [loading, setLoading] = useState(true);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (tabQuery === "price") {
      setActiveTab("price-approval");
    } else if (tabQuery === "mapping") {
      setActiveTab("product-approval");
    } else if (tabQuery === "proposals") {
      setActiveTab("proposals");
    }
  }, [tabQuery]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [mapRes, propRes] = await Promise.all([
        fetch("/api/getSupplierMappings"),
        fetch("/api/getSupplierProposals")
      ]);

      if (mapRes.ok && propRes.ok) {
        const mapData = await mapRes.json();
        const propData = await propRes.json();
        setMappings(mapData || []);
        setProposals(propData || []);
      } else if (mapRes.status === 401 || propRes.status === 401) {
        router.push("/login");
      } else {
        setErrorMsg("Failed to retrieve mapping and proposal statuses.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error connecting to backend server.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    const s = status?.toLowerCase() || "";
    if (s.includes("approved")) return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s.includes("reject")) return "bg-rose-50 text-rose-700 border-rose-200";
    if (s.includes("review")) return "bg-amber-50 text-amber-700 border-amber-200";
    if (s.includes("pending") || s.includes("submit")) return "bg-blue-50 text-blue-700 border-blue-200";
    return "bg-slate-50 text-slate-500 border-slate-200";
  };

  return (
    <div className="space-y-6">
      
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xxs font-bold rounded flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xxs font-bold rounded flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMsg}
        </div>
      )}

      {/* Tabs Row */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex gap-4 text-xs font-bold bg-white p-1 rounded-lg border w-fit">
          <button
            onClick={() => {
              setActiveTab("product-approval");
              router.replace("/portal/supplier/status?tab=mapping");
            }}
            className={`px-4 py-2 rounded transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "product-approval" ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ClipboardList className="h-4 w-4" /> Approval Status ({mappings.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("price-approval");
              router.replace("/portal/supplier/status?tab=price");
            }}
            className={`px-4 py-2 rounded transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "price-approval" ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <DollarSign className="h-4 w-4" /> Price Approval ({mappings.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("proposals");
              router.replace("/portal/supplier/status?tab=proposals");
            }}
            className={`px-4 py-2 rounded transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "proposals" ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Package className="h-4 w-4" /> Proposed Products ({proposals.length})
          </button>
        </div>

        <button
          onClick={loadData}
          title="Refresh Data"
          className="p-2 border border-slate-200 hover:bg-slate-100 rounded-lg transition text-slate-500 bg-white cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 bg-white border border-slate-200 rounded-xl">
          <Loader2 className="h-6 w-6 text-indigo-500 animate-spin" />
          <span className="text-xxs font-bold uppercase tracking-widest text-slate-400">Syncing status metrics...</span>
        </div>
      ) : activeTab === "product-approval" ? (
        
        // Mapped Products Approval Table
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shadow-lg">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Product Mapping Compliance Status</h4>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse data-table">
              <thead>
                <tr className="bg-[#0f172a] text-[#f1f5f9] text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Organization SKU</th>
                  <th className="py-3 px-4">Your Part Code</th>
                  <th className="py-3 px-4">Specs & Geometry</th>
                  <th className="py-3 px-4">Packaging Details</th>
                  <th className="py-3 px-4 text-center">Compliance Status</th>
                  <th className="py-3 px-4 text-center">Datasheet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mappings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold bg-slate-50/20">
                      <span>No mapped products registered yet. Go to 'Available Products' to map.</span>
                    </td>
                  </tr>
                ) : (
                  mappings.map((m) => (
                    <tr key={m.Mapping_ID} className="hover:bg-slate-50/30">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <span className="block text-slate-900 font-black">{m.Product_ID}</span>
                        <span className="text-slate-500 text-[10px] font-semibold">{m.SAPProductDescription}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">{m.Supplier_Product_Code}</td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <span className="block font-bold">{m.Shape}</span>
                        <span className="text-[10px] text-slate-400 block truncate max-w-[150px]">{m.ProductSpecification}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {m.Packaging_Details}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusBadgeClass(m.Product_Approval_Status)}`}>
                          {m.Product_Approval_Status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {m.Technical_Datasheet ? (
                          <a
                            href={m.Technical_Datasheet}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 bg-slate-50 border border-slate-200 rounded text-indigo-500 hover:bg-slate-100 hover:text-indigo-600 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="h-4.5 w-4.5" />
                          </a>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      ) : activeTab === "price-approval" ? (

        // Price Approvals Table
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shadow-lg">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Commercial Price &amp; MOQ Status</h4>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse data-table">
              <thead>
                <tr className="bg-[#0f172a] text-[#f1f5f9] text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Organization SKU</th>
                  <th className="py-3 px-4">Your Part Code</th>
                  <th className="py-3 px-4 text-right">Standard Unit Price</th>
                  <th className="py-3 px-4 text-right">Min Order Qty (MOQ)</th>
                  <th className="py-3 px-4 text-center">Lead Time</th>
                  <th className="py-3 px-4 text-center">Commercial Price Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mappings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold bg-slate-50/20">
                      <span>No mapped products registered yet. Go to 'Available Products' to map.</span>
                    </td>
                  </tr>
                ) : (
                  mappings.map((m) => (
                    <tr key={m.Mapping_ID} className="hover:bg-slate-50/30">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <span className="block text-slate-900 font-black">{m.Product_ID}</span>
                        <span className="text-slate-500 text-[10px] font-semibold">{m.SAPProductDescription}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">{m.Supplier_Product_Code}</td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        {m.Currency} {m.Unit_Price.toLocaleString()} / {m.Unit}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-700">
                        {m.MOQ.toLocaleString()} {m.Unit}s
                      </td>
                      <td className="py-3.5 px-4 text-center text-slate-500 font-semibold">
                        {m.Lead_Time} Days
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusBadgeClass(m.Price_Approval_Status)}`}>
                          {m.Price_Approval_Status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      ) : (

        // Proposed Products Table
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shadow-lg">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Proposals List</h4>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse data-table">
              <thead>
                <tr className="bg-[#0f172a] text-[#f1f5f9] text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Proposed Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Target Price</th>
                  <th className="py-3 px-4">Specs Summary</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Docs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proposals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold bg-slate-50/20">
                      <span>No custom product proposals submitted yet.</span>
                    </td>
                  </tr>
                ) : (
                  proposals.map((p) => (
                    <tr key={p.Proposal_ID} className="hover:bg-slate-50/30">
                      <td className="py-3.5 px-4 font-semibold text-slate-500">
                        {p.CreatedAt ? new Date(p.CreatedAt).toLocaleDateString() : "—"}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        <span className="block font-bold text-slate-900 leading-tight">{p.Product_Name}</span>
                        <span className="text-slate-400 font-medium text-[10px] block truncate max-w-[200px]">{p.Description}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-500">{p.Category}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">₹{p.Initial_Price.toLocaleString()}</td>
                      <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-500 font-medium">{p.Specifications}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusBadgeClass(p.Status)}`}>
                          {p.Status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex gap-1.5">
                          {p.Image_URL && (
                            <a
                              href={p.Image_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 bg-slate-50 border border-slate-200 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
                              title="View Image"
                            >
                              <Eye className="h-4.5 w-4.5" />
                            </a>
                          )}
                          {p.Datasheet_URL && (
                            <a
                              href={p.Datasheet_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 bg-slate-50 border border-slate-200 rounded text-indigo-500 hover:bg-slate-100 cursor-pointer"
                              title="View Datasheet"
                            >
                              <FileText className="h-4.5 w-4.5" />
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
