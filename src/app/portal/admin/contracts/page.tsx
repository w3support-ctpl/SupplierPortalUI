"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, AlertCircle, CheckCircle2, Package, X, Plus, ClipboardCheck,
  Calendar, FileText, DollarSign, User, FileSignature, ShieldAlert
} from "lucide-react";

interface Contract {
  Contract_ID: number;
  Contract_Number: string;
  Contract_Type: string;
  Supplier_ID: string;
  Product_ID: string;
  Validity_From: string;
  Validity_To: string;
  Agreed_Price: number;
  Target_Quantity: number | null;
  Target_Value: number | null;
  SAPProductDescription: string;
  Unit: string;
  CreatedAt: string;
}

export default function AdminContractsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Create Contract Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [drawerError, setDrawerError] = useState("");

  // Form inputs
  const [contractNumber, setContractNumber] = useState("");
  const [contractType, setContractType] = useState("Quantity");
  const [supplierId, setSupplierId] = useState("");
  const [productId, setProductId] = useState("");
  const [validityFrom, setValidityFrom] = useState("");
  const [validityTo, setValidityTo] = useState("");
  const [agreedPrice, setAgreedPrice] = useState("");
  const [targetQuantity, setTargetQuantity] = useState("");
  const [targetValue, setTargetValue] = useState("");

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const res = await fetch("/api/getUserDetails");
        const data = await res.json();
        if (res.ok && data.success !== false) {
          const role = data.role || data.Role || "Supplier";
          if (role === "Admin") {
            setIsAdmin(true);
            loadContracts();
          } else {
            setIsAdmin(false);
            setLoading(false);
          }
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error(err);
        router.push("/login");
      }
    };
    checkAuthAndLoad();
  }, [router]);

  const loadContracts = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/getContracts");
      if (res.ok) {
        const data = await res.json();
        setContracts(data || []);
      } else {
        setErrorMsg("Failed to retrieve contracts registry.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error contacting API server.");
    } finally {
      setLoading(false);
    }
  };

  const openCreateDrawer = () => {
    setContractNumber(`CON-${Date.now().toString().slice(-6)}`);
    setContractType("Quantity");
    setSupplierId("");
    setProductId("");
    setValidityFrom("");
    setValidityTo("");
    setAgreedPrice("");
    setTargetQuantity("");
    setTargetValue("");
    setDrawerError("");
    setDrawerOpen(true);
  };

  const handleSubmitContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setDrawerError("");

    if (!contractNumber.trim()) return setDrawerError("Contract Number is required.");
    if (!supplierId.trim()) return setDrawerError("Supplier ID (PAN) is required.");
    if (!productId.trim()) return setDrawerError("Product SKU is required.");
    if (!validityFrom || !validityTo) return setDrawerError("Validity dates are required.");
    if (isNaN(parseFloat(agreedPrice)) || parseFloat(agreedPrice) <= 0) return setDrawerError("Valid agreed price is required.");
    
    if (contractType === "Quantity" && (!targetQuantity.trim() || isNaN(parseFloat(targetQuantity)))) {
      return setDrawerError("Target quantity is required for Quantity Contracts.");
    }
    if (contractType === "Value" && (!targetValue.trim() || isNaN(parseFloat(targetValue)))) {
      return setDrawerError("Target value is required for Value Contracts.");
    }

    setSubmitting(true);

    const payload = {
      contractNumber: contractNumber.trim(),
      contractType,
      supplierId: supplierId.trim(),
      productId: productId.trim(),
      validityFrom,
      validityTo,
      agreedPrice: agreedPrice.trim(),
      targetQuantity: contractType === "Quantity" ? targetQuantity.trim() : null,
      targetValue: contractType === "Value" ? targetValue.trim() : null
    };

    try {
      const res = await fetch("/api/createContract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSuccessMsg(`Contract ${payload.contractNumber} generated successfully!`);
        setDrawerOpen(false);
        loadContracts();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setDrawerError(data.error || "Failed to create contract registry.");
      }
    } catch (err) {
      console.error(err);
      setDrawerError("An unexpected network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isAdmin === false) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 bg-rose-50 border border-rose-200 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-sm">
          Contract management access is restricted to corporate administrators.
        </p>
        <button
          onClick={() => router.push("/portal/dashboard")}
          className="mt-6 px-4 py-2 bg-slate-900 text-white font-bold text-xxs tracking-wider uppercase rounded-lg shadow-md transition"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  if (loading && contracts.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-6 w-6 text-blue-700 animate-spin" />
        <span className="text-xxs font-bold uppercase tracking-widest text-slate-400">Loading contracts registry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xxs font-bold rounded flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xxs font-bold rounded flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMsg}
        </div>
      )}

      {/* Contract Controls Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
        <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Active Procurement Agreements</h4>
        <button
          onClick={openCreateDrawer}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xxs tracking-wide rounded-lg shadow transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" /> Generate Contract
        </button>
      </div>

      {/* Contracts Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shadow-lg">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse data-table">
            <thead>
              <tr className="bg-[#0f172a] text-[#f1f5f9] text-[10px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Contract ID</th>
                <th className="py-3 px-4">Agreement Type</th>
                <th className="py-3 px-4">Supplier Code</th>
                <th className="py-3 px-4">Product SKU</th>
                <th className="py-3 px-4">Validity Range</th>
                <th className="py-3 px-4">Agreed Price</th>
                <th className="py-3 px-4 text-right">Commitment Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold bg-slate-50/20">
                    <ClipboardCheck className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <span>No active quantity or value contracts found. Click 'Generate Contract' to begin.</span>
                  </td>
                </tr>
              ) : (
                contracts.map((c) => (
                  <tr key={c.Contract_ID} className="hover:bg-slate-50/30">
                    <td className="py-3.5 px-4 font-black text-slate-900">{c.Contract_Number}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                        c.Contract_Type === "Quantity"
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-indigo-50 border-indigo-200 text-indigo-700"
                      }`}>
                        {c.Contract_Type} Contract
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{c.Supplier_ID}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-850">
                      <span className="block font-black text-slate-800">{c.Product_ID}</span>
                      <span className="text-[10px] text-slate-400 font-semibold block truncate max-w-[150px]">{c.SAPProductDescription}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {c.Validity_From ? new Date(c.Validity_From).toLocaleDateString() : ""} - {c.Validity_To ? new Date(c.Validity_To).toLocaleDateString() : ""}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-800">
                      ₹{c.Agreed_Price.toLocaleString()} / {c.Unit || "EA"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-700">
                      {c.Contract_Type === "Quantity" ? (
                        <span>{c.Target_Quantity?.toLocaleString()} {c.Unit || "EA"}</span>
                      ) : (
                        <span className="text-indigo-600">₹{c.Target_Value?.toLocaleString()}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flyout Drawer for Creating Contracts */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />

          <div className="w-full max-w-md bg-white border-l border-slate-200 shadow-2xl text-slate-800 h-full relative z-10 flex flex-col justify-between animate-slide-in">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <FileSignature className="h-4 w-4 text-indigo-500" /> Generate Procurement Contract
                </h3>
                <p className="text-xxs text-slate-500 mt-1">Bind supplier-product price agreement into corporate contracts</p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100 rounded-lg transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitContract} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              
              {drawerError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xxs font-semibold rounded flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{drawerError}</span>
                </div>
              )}

              {/* Contract Number */}
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Contract Code / Number *</label>
                <input
                  type="text"
                  value={contractNumber}
                  onChange={(e) => setContractNumber(e.target.value.toUpperCase().replace(/\s/g, ""))}
                  className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600 font-bold"
                  required
                />
              </div>

              {/* Contract Type */}
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Contract Framework Type</label>
                <select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-2 px-2 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                >
                  <option value="Quantity">Quantity Target Contract</option>
                  <option value="Value">Value Target Contract</option>
                </select>
              </div>

              {/* Supplier ID (PAN) */}
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Supplier Code (PAN Reference) *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. CTPL1"
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value.toUpperCase().replace(/\s/g, ""))}
                    className="w-full bg-slate-50 border border-slate-200 py-2 pl-9 pr-3 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                    required
                  />
                  <User className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Product SKU */}
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Material SKU / Code *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. MAT-100029-X"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value.toUpperCase().replace(/\s/g, ""))}
                    className="w-full bg-slate-50 border border-slate-200 py-2 pl-9 pr-3 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                    required
                  />
                  <Package className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Validity Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Validity From *</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={validityFrom}
                      onChange={(e) => setValidityFrom(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 py-2 pl-9 pr-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                      required
                    />
                    <Calendar className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Validity To *</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={validityTo}
                      onChange={(e) => setValidityTo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 py-2 pl-9 pr-2.5 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                      required
                    />
                    <Calendar className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Agreed Price */}
              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Agreed Contract Price (₹ INR) *</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={agreedPrice}
                    onChange={(e) => setAgreedPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 pl-9 pr-3 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                    required
                  />
                  <DollarSign className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              {/* Target Quantity (Quantity contract only) */}
              {contractType === "Quantity" && (
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Target Quantity Limit *</label>
                  <input
                    type="number"
                    placeholder="e.g. 5000"
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                    required
                  />
                </div>
              )}

              {/* Target Value (Value contract only) */}
              {contractType === "Value" && (
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Target Value Limit (₹ INR) *</label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="e.g. 500000"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 py-2 pl-9 pr-3 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                      required
                    />
                    <DollarSign className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-slate-200 p-6 bg-slate-50 flex gap-3 -mx-6 -mb-6 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-lg transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Generate Contract</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
