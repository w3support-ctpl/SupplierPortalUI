"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, AlertCircle, CheckCircle2, Package, Eye, FileText, ClipboardList,
  RefreshCw, Check, X, ShieldAlert, Award, TrendingUp, HelpCircle
} from "lucide-react";

interface PendingApproval {
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



export default function AdminApprovalsPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<"product" | "price" | "proposal" | "onboarding" | "validate_onboarding">("product");
  const [loading, setLoading] = useState(true);

  // Data States
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [onboardingUsers, setOnboardingUsers] = useState<any[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<{code: string, name: string}[]>([]);

  // Notifications
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [actioningId, setActioningId] = useState<number | null>(null);
  const [selectedSupplierCodes, setSelectedSupplierCodes] = useState<Record<number, string>>({});

  // Profile Preview Modal States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUserId, setPreviewUserId] = useState<number | null>(null);
  const [previewCompany, setPreviewCompany] = useState<any>(null);
  const [previewDelivery, setPreviewDelivery] = useState<any>(null);
  const [previewPayment, setPreviewPayment] = useState<any[]>([]);
  const [previewCompliance, setPreviewCompliance] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  const previewUser = onboardingUsers.find(u => u.UserId === previewUserId);

  const handleOpenPreview = async (userId: number) => {
    setPreviewUserId(userId);
    setIsPreviewOpen(true);
    setLoadingPreview(true);
    setShowRejectInput(false);
    setRejectReasonInput("");
    setPreviewCompany(null);
    setPreviewDelivery(null);
    setPreviewPayment([]);
    setPreviewCompliance(null);
    try {
      const [compRes, deliRes, payRes, compDocRes] = await Promise.all([
        fetch(`/api/getCompanyDetails?userId=${userId}`),
        fetch(`/api/getDeliveryLocations?userId=${userId}`),
        fetch(`/api/getPaymentInfo?userId=${userId}`),
        fetch(`/api/getComplianceDoc?userId=${userId}`)
      ]);
      if (compRes.ok) setPreviewCompany(await compRes.json());
      if (deliRes.ok) setPreviewDelivery(await deliRes.json());
      if (payRes.ok) setPreviewPayment(await payRes.json());
      if (compDocRes.ok) setPreviewCompliance(await compDocRes.json());
    } catch (err) {
      console.error("Error loading preview details:", err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleProfileApproval = async (userId: number, status: "Approved" | "Rejected", supplierCode?: string, supplierName?: string) => {
    setActioningId(userId);
    setErrorMsg("");
    try {
      const endpoint = status === "Approved" ? "/api/approveOnboardingProfile" : "/api/rejectOnboardingProfile";
      const body: any = { userId };
      if (status === "Rejected") {
        body.reason = rejectReasonInput.trim() || undefined;
      } else if (status === "Approved") {
        body.supplierCode = supplierCode;
        body.supplierName = supplierName;
      }
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSuccessMsg(`Supplier profile onboarding has been ${status.toLowerCase()} successfully!`);
        setIsPreviewOpen(false);
        // Local Update
        setOnboardingUsers(prev => prev.filter(user => user.UserId !== userId));
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(data.error || `Failed to ${status.toLowerCase()} supplier profile.`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to communicate update to server.");
    } finally {
      setActioningId(null);
    }
  };

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      try {
        const res = await fetch("/api/getUserDetails");
        const data = await res.json();
        if (res.ok && data.success !== false) {
          const role = data.role || data.Role || "Supplier";
          if (role === "Admin") {
            setIsAdmin(true);
            loadData();
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

  const loadData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [appRes, propRes, onboardingRes, sapRes] = await Promise.all([
        fetch("/api/getAdminPendingApprovals"),
        fetch("/api/getAdminProposals"),
        fetch("/api/getOnboardingUsersList"),
        fetch("/api/getSapSuppliers")
      ]);

      if (appRes.ok && propRes.ok && onboardingRes.ok) {
        const appData = await appRes.json();
        const propData = await propRes.json();
        const onboardingData = await onboardingRes.json();
        setPendingApprovals(appData || []);
        setProposals(propData || []);
        setOnboardingUsers(onboardingData.value || []);
        
        if (sapRes.ok) {
           const sapData = await sapRes.json();
           if (sapData.success && sapData.data) {
              setSupplierOptions(sapData.data.map((item: any) => ({ code: item.Supplier, name: item.SupplierName })));
           }
        }
      } else {
        setErrorMsg("Failed to load approvals, proposals, or onboarding datasets.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error trying to contact backend APIs.");
    } finally {
      setLoading(false);
    }
  };

  const handleProductMappingAction = async (mappingId: number, status: "Approved" | "Rejected") => {
    setActioningId(mappingId);
    setErrorMsg("");
    try {
      const res = await fetch("/api/approveProductMapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappingId, status })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSuccessMsg(`Supplier product mapping status updated to ${status}!`);
        // Local Update
        setPendingApprovals(prev =>
          prev.map(item =>
            item.Mapping_ID === mappingId ? { ...item, Product_Approval_Status: status } : item
          )
        );
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(data.error || "Failed to update mapping status.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to communicate update to server.");
    } finally {
      setActioningId(null);
    }
  };

  const handlePriceAction = async (priceId: number, status: "Price Approved" | "Price Rejected") => {
    setActioningId(priceId);
    setErrorMsg("");
    try {
      const res = await fetch("/api/approveProductPrice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, status })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSuccessMsg(`Price terms status updated to ${status}!`);
        // Local Update
        setPendingApprovals(prev =>
          prev.map(item =>
            item.Price_ID === priceId ? { ...item, Price_Approval_Status: status } : item
          )
        );
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(data.error || "Failed to update price status.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to communicate update to server.");
    } finally {
      setActioningId(null);
    }
  };

  const handleProposalAction = async (proposalId: number, status: "Approved" | "Rejected") => {
    setActioningId(proposalId);
    setErrorMsg("");
    try {
      const res = await fetch("/api/reviewProposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId, status })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        setSuccessMsg(`Custom product proposal status updated to ${status}!`);
        // Local Update
        setProposals(prev =>
          prev.map(item =>
            item.Proposal_ID === proposalId ? { ...item, Status: status } : item
          )
        );
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(data.error || "Failed to submit proposal review.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to communicate update to server.");
    } finally {
      setActioningId(null);
    }
  };

  const handleOnboardingAction = async (userId: number, status: "Approved" | "Rejected") => {
    setActioningId(userId);
    setErrorMsg("");
    try {
      const endpoint = status === "Approved" ? "/api/approveOnboardingUser" : "/api/rejectOnboardingUser";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && (data.success || data.message)) {
        setSuccessMsg(`Onboarding user has been ${status.toLowerCase()} successfully!`);
        // Local Update
        setOnboardingUsers(prev => prev.filter(user => user.UserId !== userId));
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(data.error || `Failed to ${status.toLowerCase()} onboarding user.`);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to communicate update to server.");
    } finally {
      setActioningId(null);
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

  if (isAdmin === false) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="h-16 w-16 bg-rose-50 border border-rose-200 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Access Restricted</h3>
        <p className="text-xs text-slate-500 mt-2 max-w-sm">
          Catalogue approvals are restricted to corporate administrators.
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

  if (loading && pendingApprovals.length === 0 && proposals.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-6 w-6 text-blue-700 animate-spin" />
        <span className="text-xxs font-bold uppercase tracking-widest text-slate-400">Syncing approvals metrics...</span>
      </div>
    );
  }

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

      {/* Tabs list */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex gap-4 text-xs font-bold bg-white p-1 rounded-lg border w-fit flex-wrap">
          <button
            onClick={() => setActiveTab("product")}
            className={`px-4 py-2 rounded transition flex items-center gap-1.5 cursor-pointer ${activeTab === "product" ? "bg-[#0f172a] text-white shadow" : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <Award className="h-4 w-4" /> Product Requested
          </button>


          <button
            onClick={() => setActiveTab("price")}
            className={`px-4 py-2 rounded transition flex items-center gap-1.5 cursor-pointer ${activeTab === "price" ? "bg-[#0f172a] text-white shadow" : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <TrendingUp className="h-4 w-4" /> Price Approvals
          </button>


          <button
            onClick={() => setActiveTab("proposal")}
            className={`px-4 py-2 rounded transition flex items-center gap-1.5 cursor-pointer ${activeTab === "proposal" ? "bg-[#0f172a] text-white shadow" : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <HelpCircle className="h-4 w-4" /> Supplier Proposals
          </button>


          <button
            onClick={() => setActiveTab("onboarding")}
            className={`px-4 py-2 rounded transition flex items-center gap-1.5 cursor-pointer ${activeTab === "onboarding" ? "bg-[#0f172a] text-white shadow" : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <ClipboardList className="h-4 w-4" /> Supplier Onboarding
          </button>
          <button
            onClick={() => setActiveTab("validate_onboarding")}
            className={`px-4 py-2 rounded transition flex items-center gap-1.5 cursor-pointer ${activeTab === "validate_onboarding" ? "bg-[#0f172a] text-white shadow" : "text-slate-500 hover:text-slate-800"
              }`}
          >
            <ClipboardList className="h-4 w-4" /> Validate Supplier Onboarding Details
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

      {/* Product Mapping Approvals Tab */}
      {activeTab === "product" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shadow-lg">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Product capability mapping reviews</h4>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse data-table">
              <thead>
                <tr className="bg-[#0f172a] text-[#f1f5f9] text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Organization SKU</th>
                  <th className="py-3 px-4">Supplier Part Code</th>
                  <th className="py-3 px-4">Packaging &amp; Shape</th>
                  <th className="py-3 px-4 text-center">Datasheet</th>
                  <th className="py-3 px-4">Approval Status</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold bg-slate-50/20">
                      <span>No supplier mappings pending review.</span>
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map((item) => (
                    <tr key={item.Mapping_ID} className="hover:bg-slate-50/30">
                      <td className="py-3.5 px-4 font-bold text-slate-850">
                        <span className="block font-black text-slate-800">{item.Supplier_ID}</span>
                        <span className="text-[10px] text-slate-400">Registered Code</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="block font-bold text-slate-850">{item.Product_ID}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">{item.SAPProductDescription}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-700">{item.Supplier_Product_Code}</td>
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        <span className="block">Pack: {item.Packaging_Details}</span>
                        <span className="text-[10px] block">Shape: {item.Shape}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {item.Technical_Datasheet ? (
                          <a
                            href={item.Technical_Datasheet}
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
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusBadgeClass(item.Product_Approval_Status)}`}>
                          {item.Product_Approval_Status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.Product_Approval_Status === "Submitted" && (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleProductMappingAction(item.Mapping_ID, "Approved")}
                              disabled={actioningId === item.Mapping_ID}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow flex items-center justify-center cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleProductMappingAction(item.Mapping_ID, "Rejected")}
                              disabled={actioningId === item.Mapping_ID}
                              className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition shadow flex items-center justify-center cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Price Approvals Tab */}
      {activeTab === "price" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shadow-lg">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Commercial terms &amp; pricing reviews</h4>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse data-table">
              <thead>
                <tr className="bg-[#0f172a] text-[#f1f5f9] text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Product Material</th>
                  <th className="py-3 px-4">Proposed Price</th>
                  <th className="py-3 px-4">MOQ</th>
                  <th className="py-3 px-4">Lead Time</th>
                  <th className="py-3 px-4">Price Status</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold bg-slate-50/20">
                      <span>No pending commercial terms mappings found.</span>
                    </td>
                  </tr>
                ) : (
                  pendingApprovals.map((item) => (
                    <tr key={item.Price_ID} className="hover:bg-slate-50/30">
                      <td className="py-3.5 px-4 font-bold text-slate-850">
                        <span className="block font-black text-slate-800">{item.Supplier_ID}</span>
                        <span className="text-[10px] text-slate-400">Supplier Code</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="block font-bold text-slate-850">{item.Product_ID}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">{item.SAPProductDescription}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        ₹{item.Unit_Price.toLocaleString()} / {item.Unit}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">{item.MOQ.toLocaleString()} Units</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-500">{item.Lead_Time} Days Lead</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusBadgeClass(item.Price_Approval_Status)}`}>
                          {item.Price_Approval_Status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.Price_Approval_Status === "Pending Price Approval" && (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handlePriceAction(item.Price_ID, "Price Approved")}
                              disabled={actioningId === item.Price_ID}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow flex items-center justify-center cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handlePriceAction(item.Price_ID, "Price Rejected")}
                              disabled={actioningId === item.Price_ID}
                              className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition shadow flex items-center justify-center cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Proposals Tab */}
      {activeTab === "proposal" && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm shadow-lg">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Proposed product specification reviews</h4>
          </div>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse data-table">
              <thead>
                <tr className="bg-[#0f172a] text-[#f1f5f9] text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Proposed Product</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Specs &amp; Description</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4 text-center">Docs</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proposals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-semibold bg-slate-50/20">
                      <span>No custom product proposals pending review.</span>
                    </td>
                  </tr>
                ) : (
                  proposals.map((item) => (
                    <tr key={item.Proposal_ID} className="hover:bg-slate-50/30">
                      <td className="py-3.5 px-4 font-bold text-slate-800">{item.Supplier_ID}</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">{item.Product_Name}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-500">{item.Category}</td>
                      <td className="py-3.5 px-4 max-w-[200px]">
                        <span className="block text-slate-700 font-semibold truncate">{item.Description}</span>
                        <span className="text-[10px] text-slate-400 block truncate">{item.Specifications}</span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">₹{item.Initial_Price.toLocaleString()}</td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex gap-1.5">
                          {item.Image_URL && (
                            <a
                              href={item.Image_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 bg-slate-50 border border-slate-200 rounded text-slate-500 hover:bg-slate-100 cursor-pointer"
                            >
                              <Eye className="h-4.5 w-4.5" />
                            </a>
                          )}
                          {item.Datasheet_URL && (
                            <a
                              href={item.Datasheet_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 bg-slate-50 border border-slate-200 rounded text-indigo-500 hover:bg-slate-100 cursor-pointer"
                            >
                              <FileText className="h-4.5 w-4.5" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${getStatusBadgeClass(item.Status)}`}>
                          {item.Status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {item.Status === "Submitted" && (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleProposalAction(item.Proposal_ID, "Approved")}
                              disabled={actioningId === item.Proposal_ID}
                              title="Approve and Create Product & Mapping"
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow flex items-center justify-center cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleProposalAction(item.Proposal_ID, "Rejected")}
                              disabled={actioningId === item.Proposal_ID}
                              className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition shadow flex items-center justify-center cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Onboarding Approvals Tab */}
      {activeTab === "onboarding" && (
        <div className="space-y-6">
          {/* Section 1: User ID Requests */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Pending User ID Registration Requests</h4>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse data-table">
                <thead>
                  <tr className="bg-[#0f172a] text-[#f1f5f9] text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">PAN Card Number</th>
                    <th className="py-3 px-4">GSTN Number</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {onboardingUsers.filter(u => u.ApprovalStatus === 0).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 font-semibold bg-slate-50/20">
                        <span>No pending onboarding users.</span>
                      </td>
                    </tr>
                  ) : (
                    onboardingUsers.filter(u => u.ApprovalStatus === 0).map((user) => (
                      <tr key={user.UserId} className="hover:bg-slate-50/30">
                        <td className="py-3.5 px-4 font-bold text-slate-850">#{user.UserId}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{user.EmailId}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{user.PanNo}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{user.GstnNo}</td>
                        <td className="py-3.5 px-4 text-slate-500 font-medium">
                          {user.CreatedAt ? new Date(user.CreatedAt).toLocaleDateString() : ""} {user.CreatedAt ? new Date(user.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleOnboardingAction(user.UserId, "Approved")}
                              disabled={actioningId === user.UserId}
                              title="Approve User ID"
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow flex items-center justify-center cursor-pointer"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleOnboardingAction(user.UserId, "Rejected")}
                              disabled={actioningId === user.UserId}
                              title="Reject User ID"
                              className="p-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition shadow flex items-center justify-center cursor-pointer"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Validate Onboarding Details Tab */}
      {activeTab === "validate_onboarding" && (
        <div className="space-y-6">
          {/* Section 2: Onboarding Profile Audits */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Completed Onboarding Profiles Pending Verification</h4>
            </div>

            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left border-collapse data-table">
                <thead>
                  <tr className="bg-[#0f172a] text-[#f1f5f9] text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">User ID</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">PAN Card Number</th>
                    <th className="py-3 px-4">GSTN Number</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Supplier Code</th>
                    <th className="py-3 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {onboardingUsers.filter(u => u.ApprovalStatus === 3).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold bg-slate-50/20">
                        <span>No completed onboarding profiles pending verification.</span>
                      </td>
                    </tr>
                  ) : (
                    onboardingUsers.filter(u => u.ApprovalStatus === 3).map((user) => (
                      <tr key={user.UserId} className="hover:bg-slate-50/30">
                        <td className="py-3.5 px-4 font-bold text-slate-850">#{user.UserId}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">{user.EmailId}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{user.PanNo}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{user.GstnNo}</td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase border bg-amber-50 text-amber-700 border-amber-200">
                            Pending Audit
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={selectedSupplierCodes[user.UserId] || ""}
                            onChange={(e) => setSelectedSupplierCodes(prev => ({ ...prev, [user.UserId]: e.target.value }))}
                            className="border border-slate-200 text-slate-700 rounded px-2 py-1 bg-white focus:outline-none focus:border-blue-500 w-full"
                          >
                            <option value="">Select Code</option>
                            {supplierOptions.map(opt => (
                              <option key={opt.code} value={opt.code}>{opt.code} - {opt.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex justify-end gap-2 items-center">
                            <button
                              onClick={() => {
                                const selName = supplierOptions.find(opt => opt.code === selectedSupplierCodes[user.UserId])?.name || "";
                                handleProfileApproval(user.UserId, "Approved", selectedSupplierCodes[user.UserId], selName);
                              }}
                              disabled={actioningId !== null || !selectedSupplierCodes[user.UserId]}
                              className="btn-primary !py-1 !px-2.5 text-xxs font-bold uppercase flex items-center gap-1 inline-flex cursor-pointer disabled:opacity-50"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button
                              onClick={() => handleOpenPreview(user.UserId)}
                              className="btn-secondary !py-1 !px-2.5 text-xxs font-bold uppercase flex items-center gap-1 inline-flex cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" /> Preview
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Profile Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setIsPreviewOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300" />
          <div className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[85vh] overflow-hidden text-slate-800 animate-scale-up">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide" style={{ fontFamily: "var(--font-headline)" }}>
                  Verify Supplier Profile Details
                </h3>
                <p className="text-xxs text-slate-500 mt-0.5">
                  {[
                    previewUser?.PanNo ? `PAN: ${previewUser.PanNo}` : "",
                    previewUser?.GstnNo ? `GSTIN: ${previewUser.GstnNo}` : ""
                  ].filter(Boolean).join(" | ")}
                </p>
              </div>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loadingPreview ? (
                <div className="py-20 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="h-6 w-6 text-blue-700 animate-spin" />
                  <span className="text-xxs font-bold uppercase tracking-widest text-slate-400">Loading profile datasets...</span>
                </div>
              ) : (
                <div className="space-y-6 text-xs">

                  {/* 1. Company Profile Details */}
                  <div>
                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 mb-3 uppercase tracking-wider text-[10px] text-blue-800 flex items-center gap-1.5" style={{ fontFamily: "var(--font-headline)" }}>
                      <FileText className="h-4 w-4" /> Company Information
                    </h4>
                    {previewCompany ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">Company Name:</span>
                          <span className="text-slate-800 font-semibold">{previewCompany.CompanyName || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">GSTN Number:</span>
                          <span className="text-slate-800 font-semibold">{previewUser?.GstnNo || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">PAN Number:</span>
                          <span className="text-slate-800 font-semibold">{previewUser?.PanNo || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">Contact Number:</span>
                          <span className="text-slate-800 font-semibold">{previewCompany.PhoneNumber || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">Address:</span>
                          <span className="text-slate-800 font-semibold">{previewCompany.StreetAddress || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">City/State/Zip:</span>
                          <span className="text-slate-800 font-semibold">{previewCompany.City || "—"}, {previewCompany.State || "—"} ({previewCompany.PostalCode || "—"})</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No company information submitted.</p>
                    )}
                  </div>

                  {/* 2. Delivery Locations */}
                  <div>
                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 mb-3 uppercase tracking-wider text-[10px] text-blue-800 flex items-center gap-1.5" style={{ fontFamily: "var(--font-headline)" }}>
                      <Package className="h-4 w-4" /> Operational &amp; Delivery Logistics
                    </h4>
                    {previewDelivery ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">Delivery Mode:</span>
                          <span className="text-slate-800 font-semibold">{previewDelivery.DeliveryMode || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">Operating States:</span>
                          <span className="text-slate-800 font-semibold">{previewDelivery.States || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">Preferred Partners:</span>
                          <span className="text-slate-800 font-semibold">{previewDelivery.PreDelPartners || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">Minimum Lead Time:</span>
                          <span className="text-slate-800 font-semibold">{previewDelivery.MinDelLeadTime || "—"} Days</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">Max Delivery Capacity:</span>
                          <span className="text-slate-800 font-semibold">{previewDelivery.MaxDelCapacity || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">Operating Countries:</span>
                          <span className="text-slate-800 font-semibold">{previewDelivery.CountryOrp || "—"}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No operational logistics submitted.</p>
                    )}
                  </div>

                  {/* 3. Payment/Bank Information */}
                  <div>
                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 mb-3 uppercase tracking-wider text-[10px] text-blue-800 flex items-center gap-1.5" style={{ fontFamily: "var(--font-headline)" }}>
                      <ClipboardList className="h-4 w-4" /> Bank Settlement Information
                    </h4>
                    {previewPayment && previewPayment.length > 0 ? (
                      <div className="space-y-3">
                        {previewPayment.map((bank, idx) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-5 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div>
                              <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">Bank Name:</span>
                              <span className="text-slate-800 font-semibold">{bank.BankName || "—"}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">Account Number:</span>
                              <span className="text-slate-800 font-semibold">{bank.AccNumber || "—"}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">Beneficiary Name:</span>
                              <span className="text-slate-800 font-semibold">{bank.AccHoldName || "—"}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">IFSC Code:</span>
                              <span className="text-slate-800 font-semibold">{bank.IfscCode || "—"}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wider mb-0.5">SWIFT Code:</span>
                              <span className="text-slate-800 font-semibold">{bank.SwiftCode || "—"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No bank/payment information submitted.</p>
                    )}
                  </div>

                  {/* 4. Compliance Documents & Uploads */}
                  <div>
                    <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1.5 mb-3 uppercase tracking-wider text-[10px] text-blue-800 flex items-center gap-1.5" style={{ fontFamily: "var(--font-headline)" }}>
                      <FileText className="h-4 w-4" /> Compliance Certificates &amp; Uploads
                    </h4>
                    {previewCompliance ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { label: "Business Registration Certificate", path: previewCompliance.BusinessRegPath, no: previewCompliance.BusinessRegNo, date: previewCompliance.BusinessReg },
                          { label: "GSTIN Certificate", path: previewCompliance.GstinCertiPath, no: previewCompliance.GstinCertiNo, date: previewCompliance.GstinCerti },
                          { label: "PAN Card Document", path: previewCompliance.PanCardPath, no: previewCompliance.PanCardNo, date: previewCompliance.PanCard },
                          { label: "Cancelled Cheque Document", path: previewCompliance.CancelledChequePath, no: previewCompliance.CancelledChequeNo, date: previewCompliance.CancelledCheque },
                          { label: "TAN Certificate", path: previewCompliance.TanCertiPath, no: previewCompliance.TanCertiNo, date: previewCompliance.TanCerti },
                          { label: "ISO Certification", path: previewCompliance.IsoCertiPath, no: previewCompliance.IsoCertiNo, date: previewCompliance.IsoCerti },
                          { label: "GMP Certification", path: previewCompliance.GmpCertiPath, no: previewCompliance.GmpCertiNo, date: previewCompliance.GmpCerti },
                          { label: "FDA Approval", path: previewCompliance.FdaApprovalPath, no: previewCompliance.FdaApprovalNo, date: previewCompliance.FdaApproval },
                          { label: "BIS Approval", path: previewCompliance.BisApprovalPath, no: previewCompliance.BisApprovalNo, date: previewCompliance.BisApproval },
                          { label: "PF Registration", path: previewCompliance.PfRegistrationPath, no: previewCompliance.PfRegistrationNo, date: previewCompliance.PfRegistration },
                          { label: "ESIC Registration", path: previewCompliance.EsicRegistrationPath, no: previewCompliance.EsicRegistrationNo, date: previewCompliance.EsicRegistration },
                          { label: "Declaration of Authenticity", path: previewCompliance.DeclAuthenticityPath, no: previewCompliance.DeclAuthenticityNo, date: previewCompliance.DeclAuthenticity },
                        ].filter(doc => doc.path || doc.no).map((doc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                            <div>
                              <span className="block font-bold text-slate-800">{doc.label}</span>
                              <span className="text-[10px] text-slate-500 font-medium">Ref No: {doc.no || "—"} {doc.date ? `· Exp: ${new Date(doc.date).toLocaleDateString()}` : ""}</span>
                            </div>
                            {doc.path ? (
                              <a
                                href={`/fileUploads/${doc.path}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-blue-700 rounded-lg text-[10px] font-bold uppercase transition flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="h-3.5 w-3.5" /> View
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">No File</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-400 italic">No compliance documents uploaded.</p>
                    )}
                  </div>

                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-150 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {showRejectInput ? (
                <div className="w-full flex flex-col gap-2.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Provide Rejection Reason *</label>
                  <div className="flex gap-2 w-full">
                    <input
                      type="text"
                      placeholder="e.g. GSTIN certificate is illegible or expired"
                      value={rejectReasonInput}
                      onChange={e => setRejectReasonInput(e.target.value)}
                      className="input-field flex-1 text-xs py-2 px-3"
                    />
                    <button
                      onClick={() => handleProfileApproval(previewUserId!, "Rejected")}
                      disabled={actioningId !== null || !rejectReasonInput.trim()}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xxs tracking-wider uppercase rounded-lg shadow transition disabled:opacity-50 cursor-pointer"
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => setShowRejectInput(false)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-350 text-slate-700 font-bold text-xxs tracking-wider uppercase rounded-lg transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Verification Actions</span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRejectInput(true)}
                      disabled={actioningId !== null}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xxs tracking-wider uppercase rounded-lg shadow-md transition cursor-pointer"
                    >
                      Reject Profile
                    </button>
                    <button
                      onClick={() => {
                        const selName = supplierOptions.find(opt => opt.code === selectedSupplierCodes[previewUserId!])?.name || "";
                        handleProfileApproval(previewUserId!, "Approved", selectedSupplierCodes[previewUserId!], selName);
                      }}
                      disabled={actioningId !== null}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xxs tracking-wider uppercase rounded-lg shadow-md transition cursor-pointer"
                    >
                      Approve Profile
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
