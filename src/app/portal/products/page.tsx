"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search, Package, ShieldAlert, AlertCircle, CheckCircle2,
  Loader2, Download, RefreshCw, Database, Eye, X, Layers, Info,
  Check, Trash2, CheckCircle, Clock
} from "lucide-react";

interface SapProduct {
  Product: string;
  ProductType: string;
  ProductGroup: string;
  BaseUnit: string;
  GrossWeight: number;
  NetWeight: number;
  IsMarkedForDeletion: boolean;
  ProductOldID: string;
  WeightUnit: string;
}

interface DBProduct {
  SAPMaterialSKU: string;
  SAPProductDescription: string;
  MaterialType: string;
  VendorProductName: string;
  VendorProductDescription: string | null;
  Unit: string;
  Price: number;
  Image: string | null;
  ProductSpecification: string | null;
}

interface ApprovalRequest {
  Id: number;
  SupplierId: string;
  SAPMaterialSKU: string;
  SAPProductDescription: string;
  MaterialType: string;
  VendorProductName: string;
  VendorProductDescription: string | null;
  Unit: string;
  Price: number;
  ProductSpecification: string | null;
  Status: string;
  CreatedAt: string;
}

// Utility function to escape unsafe XML characters
const escapeXml = (unsafe: any) => {
  if (unsafe === null || unsafe === undefined) return "";
  return unsafe.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

export default function AdminProductCataloguePage() {
  const router = useRouter();

  // Auth states
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  // Tab State: 'sap-sync' | 'db-catalogue' | 'approvals'
  const [activeTab, setActiveTab] = useState("sap-sync");

  // Catalogue datasets
  const [sapProducts, setSapProducts] = useState<SapProduct[]>([]);
  const [dbProducts, setDbProducts] = useState<DBProduct[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);

  // Notifications
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // SAP Sync States
  const [sapProduct, setSapProduct] = useState("");
  const [sapProductType, setSapProductType] = useState("");
  const [sapProductGroup, setSapProductGroup] = useState("");
  const [sapSyncing, setSapSyncing] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Client side Search filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterialType, setSelectedMaterialType] = useState("all");

  // Modals & previews
  const [previewSapProduct, setPreviewSapProduct] = useState<SapProduct | null>(null);
  const [previewDbProduct, setPreviewDbProduct] = useState<DBProduct | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Action loaders
  const [savingSku, setSavingSku] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [deletingSku, setDeletingSku] = useState<string | null>(null);

  // Reset page number on filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMaterialType, activeTab]);

  // Load user session
  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const res = await fetch("/api/getUserDetails");
        const data = await res.json();
        if (res.ok && data.success !== false) {
          const userRole = data.role || data.Role || "Supplier";
          if (userRole === "Admin") {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error("Auth verification failed", err);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    checkAuthAndLoad();
  }, [router]);

  // Load respective tab details
  useEffect(() => {
    if (isAdmin !== true) return;

    if (activeTab === "db-catalogue") {
      loadDbCatalogue();
    } else if (activeTab === "approvals") {
      loadApprovals();
    }
  }, [activeTab, isAdmin]);

  const loadDbCatalogue = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/getProductCatalogue");
      if (res.ok) {
        const data = await res.json();
        setDbProducts(data || []);
      } else {
        setErrorMsg("Failed to retrieve Database Product Catalogue.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error loading catalogue.");
    } finally {
      setLoading(false);
    }
  };

  const loadApprovals = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/getProductEditsApprovals");
      if (res.ok) {
        const data = await res.json();
        setApprovals(data || []);
      } else {
        setErrorMsg("Failed to load approval requests.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error loading approvals.");
    } finally {
      setLoading(false);
    }
  };

  // 1. Search SAP S/4HANA OData proxy
  const handleSearchSap = async () => {
    if (!sapProduct.trim() && !sapProductType.trim() && !sapProductGroup.trim()) {
      setErrorMsg("Please specify at least one filter criterion (Product ID, Product Type, or Product Group) to query SAP.");
      return;
    }

    setSapSyncing(true);
    setErrorMsg("");
    setSuccessMsg("");
    setSearchPerformed(true);
    try {
      const queryParams = new URLSearchParams();
      if (sapProduct.trim()) queryParams.append("Product", sapProduct.trim());
      if (sapProductType.trim()) queryParams.append("ProductType", sapProductType.trim());
      if (sapProductGroup.trim()) queryParams.append("ProductGroup", sapProductGroup.trim());

      const res = await fetch(`/api/getSapMaterials?${queryParams.toString()}`);
      if (res.ok) {
        const data: SapProduct[] = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
          setSapProducts([]);
          setSuccessMsg("No data found matching the selected filters.");
          setTimeout(() => setSuccessMsg(""), 5000);
          return;
        }

        setSapProducts(data);
        setSuccessMsg(`Successfully retrieved ${data.length} materials from SAP S/4HANA.`);
        setTimeout(() => setSuccessMsg(""), 5000);

        // Fetch DB Catalogue to check status
        const dbRes = await fetch("/api/getProductCatalogue");
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          setDbProducts(dbData || []);
        }
      } else {
        setErrorMsg("Failed to fetch materials from SAP S/4HANA OData service.");
      }
    } catch (err) {
      console.error("SAP query error:", err);
      setErrorMsg("Network error connecting to the backend SAP OData API.");
    } finally {
      setSapSyncing(false);
    }
  };

  // 2. Save live SAP OData product to local DB
  const handleSaveToDb = async (product: SapProduct) => {
    setSavingSku(product.Product);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/saveOdataProduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Product ${product.Product} successfully saved to local database.`);
        // Reload DB catalog in background
        const dbRes = await fetch("/api/getProductCatalogue");
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          setDbProducts(dbData || []);
        }
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.error || "Failed to save product in database.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error saving product.");
    } finally {
      setSavingSku(null);
    }
  };

  // 3. Admin Delete Product
  const handleDeleteProduct = async (sku: string) => {
    if (!window.confirm(`Are you sure you want to delete SKU ${sku} from the database catalogue?`)) return;
    setDeletingSku(sku);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/deleteProductCatalogue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sapMaterialSku: sku })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Successfully deleted product ${sku} from database.`);
        loadDbCatalogue();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.error || "Failed to delete product.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error trying to delete product.");
    } finally {
      setDeletingSku(null);
    }
  };

  // 4. Admin Approvals
  const handleApproveEdit = async (id: number) => {
    setApprovingId(id);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/approveProductEdit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Supplier edits successfully approved and applied to Product Master!");
        loadApprovals();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.error || "Failed to approve edits.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error approving request.");
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectEdit = async (id: number) => {
    if (!window.confirm("Are you sure you want to reject this request?")) return;
    setRejectingId(id);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/rejectProductEdit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg("Supplier edits rejected.");
        loadApprovals();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setErrorMsg(data.error || "Failed to reject edits.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error rejecting request.");
    } finally {
      setRejectingId(null);
    }
  };

  // Client side filters
  const getFilteredSapProducts = () => {
    return sapProducts.filter(p => {
      const term = searchTerm.toLowerCase();
      return (
        p.Product.toLowerCase().includes(term) ||
        p.ProductType.toLowerCase().includes(term) ||
        p.ProductGroup.toLowerCase().includes(term)
      );
    });
  };

  const getFilteredDbProducts = () => {
    return dbProducts.filter(p => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = (
        p.SAPMaterialSKU.toLowerCase().includes(term) ||
        p.SAPProductDescription.toLowerCase().includes(term) ||
        p.VendorProductName.toLowerCase().includes(term) ||
        (p.VendorProductDescription && p.VendorProductDescription.toLowerCase().includes(term))
      );

      const matchesType = selectedMaterialType === "all" || p.MaterialType === selectedMaterialType;
      return matchesSearch && matchesType;
    });
  };

  const getFilteredApprovals = () => {
    return approvals.filter(p => {
      const term = searchTerm.toLowerCase();
      return (
        p.SAPMaterialSKU.toLowerCase().includes(term) ||
        p.SAPProductDescription.toLowerCase().includes(term) ||
        p.VendorProductName.toLowerCase().includes(term) ||
        p.SupplierId.toLowerCase().includes(term) ||
        p.Status.toLowerCase().includes(term)
      );
    });
  };

  const getActiveDataset = () => {
    if (activeTab === "sap-sync") return getFilteredSapProducts();
    if (activeTab === "db-catalogue") return getFilteredDbProducts();
    return getFilteredApprovals();
  };

  const filteredItems = getActiveDataset();
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Helper stats
  const totalSkuCount = dbProducts.length;
  const uniqueMaterialTypes = Array.from(new Set(dbProducts.map(p => p.MaterialType))).filter(Boolean).length;
  const pendingApprovalsCount = approvals.filter(a => a.Status === 'Pending').length;

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-6 w-6 text-blue-700 animate-spin" />
        <span className="text-xxs font-bold uppercase tracking-widest text-slate-400">Verifying session permissions...</span>
      </div>
    );
  }

  // 1. Enforce admin restriction
  if (isAdmin === false) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 bg-rose-50 border border-rose-200 text-rose-500 rounded-2xl flex items-center justify-center mb-4 shadow-md shadow-rose-100">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-sm leading-relaxed">
          The Admin Product Catalogue is only visible to corporate administrators. Your account does not possess the permissions required to view this directory.
        </p>
        <button
          onClick={() => router.push("/portal/dashboard")}
          className="mt-6 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xxs tracking-wider uppercase rounded-lg shadow-md transition cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header and User Role Display */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 rounded-2xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 bg-white/10 rounded-xl flex items-center justify-center text-indigo-300 border border-white/10 shadow-inner">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-wide uppercase">Product Master Catalogue (Internal Admin)</h2>
            <p className="text-xxs text-slate-300 mt-0.5 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span>Access Level:</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-black border bg-red-500/20 text-red-300 border-red-500/30">
                Administrator
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xxs font-bold rounded-xl flex items-center gap-2 shadow-sm animate-fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xxs font-bold rounded-xl flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMsg}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-10 w-10 bg-amber-50 border border-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Supplier Edits</span>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{pendingApprovalsCount} Requests</h3>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Material Categories</span>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{uniqueMaterialTypes} Types</h3>
          </div>
        </div>


        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
          <div className="h-10 w-10 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Catalogue Items</span>
            <h3 className="text-lg font-black text-slate-800 mt-0.5">{totalSkuCount} SKU</h3>
          </div>
        </div>


      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white p-1.5 rounded-xl shadow-sm gap-1">
        <button
          onClick={() => setActiveTab("sap-sync")}
          className={`flex-1 py-2 text-center text-xxs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${activeTab === "sap-sync" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
        >
          SAP ERP OData Sync
        </button>
        <button
          onClick={() => setActiveTab("db-catalogue")}
          className={`flex-1 py-2 text-center text-xxs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${activeTab === "db-catalogue" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
        >
          Database Catalogue
        </button>
        <button
          onClick={() => setActiveTab("approvals")}
          className={`flex-1 py-2 text-center text-xxs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer relative ${activeTab === "approvals" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
        >
          Supplier Approval Panel
          {pendingApprovalsCount > 0 && (
            <span className="absolute top-1/2 -translate-y-1/2 right-4 h-4 w-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow animate-pulse">
              {pendingApprovalsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: SAP ERP OData Sync */}
      {activeTab === "sap-sync" && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-slate-50/50 px-5 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <h4 className="font-extrabold text-slate-800">SAP S/4HANA OData Core Integration</h4>
              <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Search material catalogue in real-time ERP registries and save to local master DB.</p>
            </div>
            <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
              OData Proxy Connection
            </span>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs">
            <div className="space-y-1.5">
              <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Product Type</label>
              <input
                type="text"
                placeholder="e.g. SERV"
                value={sapProductType}
                onChange={(e) => setSapProductType(e.target.value)}
                className="w-full bg-white border border-slate-200 py-1.5 px-3 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Product Group</label>
              <input
                type="text"
                placeholder="e.g. E001"
                value={sapProductGroup}
                onChange={(e) => setSapProductGroup(e.target.value)}
                className="w-full bg-white border border-slate-200 py-1.5 px-3 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Product ID / Code</label>
              <input
                type="text"
                placeholder="e.g. 11"
                value={sapProduct}
                onChange={(e) => setSapProduct(e.target.value)}
                className="w-full bg-white border border-slate-200 py-1.5 px-3 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm font-semibold"
              />
            </div>
            <div>
              <button
                onClick={handleSearchSap}
                disabled={sapSyncing}
                className="w-full py-1.5 px-4 bg-indigo-700 hover:bg-indigo-650 text-white font-bold text-xxs tracking-wider uppercase rounded-lg shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                {sapSyncing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Searching SAP...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Search SAP</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search filters block */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Filter list below by SKU, description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 py-1.5 pl-9 pr-4 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-semibold"
          />
        </div>

        {activeTab === "db-catalogue" && (
          <div className="flex items-center gap-1.5 text-xs">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedMaterialType}
              onChange={(e) => setSelectedMaterialType(e.target.value)}
              className="bg-slate-50 border border-slate-200 py-1.5 px-2 rounded-lg font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">All Material Types</option>
              {Array.from(new Set(dbProducts.map(p => p.MaterialType))).filter(Boolean).map(mt => (
                <option key={mt} value={mt}>{mt}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main Table view segment */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border-collapse data-table">
            <thead>
              {activeTab === "sap-sync" && (
                <tr className="bg-slate-900 text-slate-100 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-4">SAP Product / SKU</th>
                  <th className="py-3 px-4">Product Type</th>
                  <th className="py-3 px-4">Product Group</th>
                  <th className="py-3 px-4">Base Unit</th>
                  <th className="py-3 px-4 text-right">Gross Weight</th>
                  <th className="py-3 px-4 text-right">Net Weight</th>
                  <th className="py-3 px-4">Weight Unit</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              )}
              {activeTab === "db-catalogue" && (
                <tr className="bg-slate-900 text-slate-100 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">SAP Description</th>
                  <th className="py-3 px-4">Material Type</th>
                  <th className="py-3 px-4">Vendor Product Name</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4 text-right">Standard Price</th>
                  <th className="py-3 px-4">Specifications</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              )}
              {activeTab === "approvals" && (
                <tr className="bg-slate-900 text-slate-100 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">SKU Reference</th>
                  <th className="py-3 px-4">Proposed Product Name</th>
                  <th className="py-3 px-4 text-right">Proposed Price</th>
                  <th className="py-3 px-4">UOM</th>
                  <th className="py-3 px-4">Proposed Specifications</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-16 text-center text-slate-400 font-semibold bg-slate-50/35">
                    <Package className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                    <span>
                      {searchPerformed || activeTab !== "sap-sync"
                        ? "No matching catalogue records found."
                        : "No SAP materials loaded. Search SAP using filters above to sync records."}
                    </span>
                  </td>
                </tr>
              ) : (
                // SAP ERP Sync View
                activeTab === "sap-sync" && (paginatedItems as SapProduct[]).map((p) => {
                  const isAlreadySaved = dbProducts.some(db => db.SAPMaterialSKU === p.Product);
                  return (
                    <tr key={p.Product} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3.5 px-4 font-black text-slate-900 tracking-tight">{p.Product}</td>
                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {p.ProductType || "—"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{p.ProductGroup || "—"}</td>
                      <td className="py-3.5 px-4 uppercase font-extrabold text-slate-650">{p.BaseUnit || "—"}</td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-700">{p.GrossWeight !== undefined ? Number(p.GrossWeight).toFixed(3) : "—"}</td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-700">{p.NetWeight !== undefined ? Number(p.NetWeight).toFixed(3) : "—"}</td>
                      <td className="py-3.5 px-4 uppercase text-slate-500 font-bold">{p.WeightUnit || "—"}</td>
                      <td className="py-3.5 px-4">
                        {p.IsMarkedForDeletion ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-100">
                            Deleted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setPreviewSapProduct(p)}
                            className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="text-[9px] font-bold uppercase">Specs</span>
                          </button>

                          {isAlreadySaved ? (
                            <span className="px-2 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[9px] font-black uppercase border border-emerald-200 flex items-center gap-1">
                              <Check className="h-3 w-3" /> Saved
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSaveToDb(p)}
                              disabled={savingSku === p.Product}
                              className="px-2.5 py-1.5 bg-indigo-700 hover:bg-indigo-650 text-white font-bold text-[9px] uppercase rounded-lg shadow transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {savingSku === p.Product ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Database className="h-3 w-3" />
                              )}
                              <span>Save</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}

              {/* Database master catalogue view */}
              {activeTab === "db-catalogue" && (paginatedItems as DBProduct[]).map((p) => (
                <tr key={p.SAPMaterialSKU} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-black text-slate-900 tracking-tight">{p.SAPMaterialSKU}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 max-w-[155px] truncate" title={p.SAPProductDescription}>{p.SAPProductDescription}</td>
                  <td className="py-3.5 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {p.MaterialType || "—"}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{p.VendorProductName || "—"}</td>
                  <td className="py-3.5 px-4 uppercase text-slate-650 font-black">{p.Unit || "—"}</td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900">₹{Number(p.Price || 0).toFixed(2)}</td>
                  <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-400" title={p.ProductSpecification || ''}>{p.ProductSpecification || "—"}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setPreviewDbProduct(p)}
                        className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-700 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span className="text-[9px] font-bold uppercase">Details</span>
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.SAPMaterialSKU)}
                        disabled={deletingSku === p.SAPMaterialSKU}
                        className="p-1.5 border border-red-200 hover:bg-red-50 text-red-500 hover:text-red-650 rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        {deletingSku === p.SAPMaterialSKU ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {/* Admin Approvals tab view */}
              {activeTab === "approvals" && (paginatedItems as ApprovalRequest[]).map((p) => (
                <tr key={p.Id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded text-[9px] uppercase border">
                      {p.SupplierId}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-black text-slate-900 tracking-tight">{p.SAPMaterialSKU}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-800">{p.VendorProductName}</td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900">₹{Number(p.Price || 0).toFixed(2)}</td>
                  <td className="py-3.5 px-4">{p.Unit}</td>
                  <td className="py-3.5 px-4 max-w-[150px] truncate text-slate-450" title={p.ProductSpecification || ''}>{p.ProductSpecification || "—"}</td>
                  <td className="py-3.5 px-4 text-slate-400 font-bold">{new Date(p.CreatedAt).toLocaleDateString()}</td>
                  <td className="py-3.5 px-4">
                    {p.Status === 'Pending' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock className="h-2.5 w-2.5" /> Pending
                      </span>
                    )}
                    {p.Status === 'Approved' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle className="h-2.5 w-2.5" /> Approved
                      </span>
                    )}
                    {p.Status === 'Rejected' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-200">
                        <X className="h-2.5 w-2.5" /> Rejected
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {p.Status === 'Pending' ? (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleRejectEdit(p.Id)}
                          disabled={rejectingId === p.Id || approvingId === p.Id}
                          className="px-2.5 py-1.5 border border-slate-200 text-rose-600 hover:bg-rose-50 font-black rounded-lg text-[9px] uppercase tracking-wider transition cursor-pointer"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApproveEdit(p.Id)}
                          disabled={approvingId === p.Id || rejectingId === p.Id}
                          className="px-2.5 py-1.5 bg-indigo-700 hover:bg-indigo-650 text-white font-black rounded-lg text-[9px] uppercase tracking-wider transition shadow flex items-center gap-1 cursor-pointer"
                        >
                          {approvingId === p.Id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                          <span>Approve</span>
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Evaluated</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {filteredItems.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <span className="text-xxs text-slate-500 font-bold uppercase tracking-wider">
            Showing {Math.min(startIndex + 1, filteredItems.length)} to {Math.min(endIndex, filteredItems.length)} of {filteredItems.length} entries
          </span>
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-lg text-xxs tracking-wider uppercase transition disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`h-7 w-7 flex items-center justify-center font-black rounded-lg text-xxs transition cursor-pointer ${currentPage === page
                  ? "bg-indigo-700 text-white shadow-md shadow-indigo-700/10"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-lg text-xxs tracking-wider uppercase transition disabled:opacity-50 disabled:hover:bg-transparent cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Live SAP Material Spec Modal (For SAP Sync tab) */}
      {previewSapProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setPreviewSapProduct(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl max-w-md w-full z-10 flex flex-col relative animate-scale-up">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-500" />
                <div>
                  <h4 className="font-extrabold text-slate-800">SAP ERP Product specifications</h4>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">OData Registry Details</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewSapProduct(null)}
                className="p-1 bg-slate-50 border border-slate-200 text-slate-850 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs text-slate-755 font-semibold">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Material Code / SKU</span>
                  <span className="text-base font-black text-slate-900">{previewSapProduct.Product}</span>
                </div>
                <div>
                  {previewSapProduct.IsMarkedForDeletion ? (
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-rose-50 text-rose-700 border border-rose-100">
                      Deleted in ERP
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-100">
                      Active Asset
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Material Type</span>
                  <span className="font-extrabold text-slate-800 mt-0.5 block">{previewSapProduct.ProductType || "—"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Product Group</span>
                  <span className="font-extrabold text-slate-800 mt-0.5 block">{previewSapProduct.ProductGroup || "—"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Base UoM</span>
                  <span className="font-extrabold text-slate-800 mt-0.5 block uppercase">{previewSapProduct.BaseUnit || "—"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Old Material Code</span>
                  <span className="font-extrabold text-slate-800 mt-0.5 block">{previewSapProduct.ProductOldID || "—"}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 grid grid-cols-3 gap-3">
                <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100 text-center">
                  <span className="text-[8px] text-slate-400 font-bold uppercase block">Gross Weight</span>
                  <span className="font-black text-slate-800 mt-0.5 block">{Number(previewSapProduct.GrossWeight || 0).toFixed(3)}</span>
                </div>
                <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100 text-center">
                  <span className="text-[8px] text-slate-400 font-bold uppercase block">Net Weight</span>
                  <span className="font-black text-slate-800 mt-0.5 block">{Number(previewSapProduct.NetWeight || 0).toFixed(3)}</span>
                </div>
                <div className="bg-slate-50/50 p-2 rounded-lg border border-slate-100 text-center">
                  <span className="text-[8px] text-slate-400 font-bold uppercase block">Weight Unit</span>
                  <span className="font-black text-slate-800 mt-0.5 block uppercase">{previewSapProduct.WeightUnit || "KG"}</span>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewSapProduct(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xxs tracking-wider uppercase rounded-xl transition cursor-pointer"
              >
                Close Spec Sheet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Product Catalogue specs detail modal */}
      {previewDbProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setPreviewDbProduct(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl max-w-md w-full z-10 flex flex-col relative animate-scale-up">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-500" />
                <div>
                  <h4 className="font-extrabold text-slate-800">Database Catalogue Details</h4>
                  <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Local Master Repository</p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDbProduct(null)}
                className="p-1 bg-slate-50 border border-slate-200 text-slate-850 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-6 text-xs text-slate-700 font-semibold">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">SAP Material SKU</span>
                  <span className="text-base font-black text-slate-900">{previewDbProduct.SAPMaterialSKU}</span>
                </div>
                <div>
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {previewDbProduct.MaterialType}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">SAP Product Description</span>
                  <span className="font-extrabold text-slate-800 block mt-0.5">{previewDbProduct.SAPProductDescription}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Vendor Product Name</span>
                  <span className="font-extrabold text-slate-800 block mt-0.5">{previewDbProduct.VendorProductName || "—"}</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Vendor Product Description</span>
                  <p className="text-slate-655 leading-relaxed font-medium mt-0.5">{previewDbProduct.VendorProductDescription || "—"}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">UOM (Unit)</span>
                    <span className="font-black text-slate-800 block mt-0.5 uppercase">{previewDbProduct.Unit}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Standard Catalogue Price</span>
                    <span className="font-black text-slate-900 block mt-0.5 text-sm">₹{Number(previewDbProduct.Price || 0).toFixed(2)}</span>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Technical Specifications</span>
                  <p className="text-slate-655 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-1 whitespace-pre-wrap">
                    {previewDbProduct.ProductSpecification || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewDbProduct(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xxs tracking-wider uppercase rounded-xl transition cursor-pointer"
              >
                Close specs
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
