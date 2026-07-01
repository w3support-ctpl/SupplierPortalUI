"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Truck, Search, Package, Loader2, 
  CheckCircle2, AlertCircle, ArrowLeft, Info, Send
} from "lucide-react";

interface POItem {
  PurchaseOrder: string;
  PurchaseOrderItem: string;
  Material: string;
  PurchaseOrderItemText: string;
  SupplierMaterialNumber: string;
  OrderQuantity: string;
  PurchaseOrderQuantityUnit: string;
  BaseUnit: string; // Planned Delivery Date in EJS
  Plant: string; // Plant Code
  PlantName?: string;
}

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

function ASNCreator() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const poFromQuery = searchParams.get("po") || "";

  // Filter input
  const [poNumber, setPoNumber] = useState(poFromQuery);
  const [poItems, setPoItems] = useState<POItem[]>([]);
  
  // Row state maps keyed by PurchaseOrderItem (since items belong to the same PO number)
  const [committedQtys, setCommittedQtys] = useState<{ [itemNo: string]: string }>({});
  const [expectedDates, setExpectedDates] = useState<{ [itemNo: string]: string }>({});
  const [asnNumbers, setAsnNumbers] = useState<{ [itemNo: string]: string }>({});
  const [postingRows, setPostingRows] = useState<{ [itemNo: string]: boolean }>({});
  
  // Page feedback states
  const [fetchingPO, setFetchingPO] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Auto-fetch PO if passed in the URL query parameters
  useEffect(() => {
    if (poFromQuery) {
      handleFetchPO(poFromQuery);
    }
  }, [poFromQuery]);

  const handleFetchPO = async (poDocNum: string) => {
    const docToFetch = poDocNum || poNumber;
    if (!docToFetch.trim()) {
      setErrorMsg("Please enter a valid Purchase Order Number.");
      return;
    }

    setErrorMsg("");
    setSuccessMsg("");
    setFetchingPO(true);
    setPoItems([]);
    setCommittedQtys({});
    setExpectedDates({});
    setAsnNumbers({});
    setPostingRows({});
    
    try {
      // EJS calls: GET /poNumberASN?PurchaseOrder=...
      const res = await fetch(`/api/poNumberASN?PurchaseOrder=${docToFetch.trim()}`);
      
      if (!res.ok) {
        throw new Error("PO details not found");
      }
      
      const data = await res.json();
      const items = data.value || data || [];
      
      if (items.length === 0) {
        setErrorMsg("No items found for the given Purchase Order.");
        return;
      }

      const mappedItems: POItem[] = items.map((item: any) => ({
        PurchaseOrder: item.PurchaseOrder || docToFetch,
        PurchaseOrderItem: item.PurchaseOrderItem || "10",
        Material: item.Material || "N/A",
        PurchaseOrderItemText: item.PurchaseOrderItemText || "Enterprise Material Item",
        SupplierMaterialNumber: item.SupplierMaterialNumber || "N/A",
        OrderQuantity: item.OrderQuantity || "0",
        PurchaseOrderQuantityUnit: item.PurchaseOrderQuantityUnit || "PCS",
        BaseUnit: item.BaseUnit || "—",
        Plant: item.Plant || "N/A",
        PlantName: "Manufacturing Plant"
      }));

      setPoItems(mappedItems);
      
      // Initialize inputs default values
      const initialQtys: { [key: string]: string } = {};
      mappedItems.forEach(item => {
        initialQtys[item.PurchaseOrderItem] = item.OrderQuantity; // default to full order quantity
      });
      setCommittedQtys(initialQtys);

    } catch (err) {
      console.error("Fetch PO items err:", err);
      setErrorMsg("Failed to fetch Purchase Order details from SAP OData gateway.");
      setPoItems([]);
    } finally {
      setFetchingPO(false);
    }
  };

  const handleQtyChange = (itemNo: string, val: string) => {
    setCommittedQtys(prev => ({ ...prev, [itemNo]: val }));
  };

  const handleDateChange = (itemNo: string, val: string) => {
    setExpectedDates(prev => ({ ...prev, [itemNo]: val }));
  };

  const handlePostRow = async (item: POItem) => {
    const itemNo = item.PurchaseOrderItem;
    const committedQty = committedQtys[itemNo] || "";
    
    if (!committedQty.trim()) {
      alert("⚠️ Committed Quantity is required to post Inbound Delivery.");
      return;
    }

    // Set posting state for specific row
    setPostingRows(prev => ({ ...prev, [itemNo]: true }));
    setErrorMsg("");
    setSuccessMsg("");

    try {
      // EJS calls: GET /postInbondDelivery?PurchaseOrder=...&lineItem=...&committedOty=...
      const params = new URLSearchParams({
        PurchaseOrder: item.PurchaseOrder,
        lineItem: itemNo,
        committedOty: committedQty
      });

      const res = await fetch(`/api/postInbondDelivery?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to post delivery for item ${itemNo}`);
      }
      
      const data = await res.json();
      
      // Format as defined in EJS: response.ResponseData && response.ResponseData.d && response.ResponseData.d.DeliveryDocument
      const deliveryDocument = data.ResponseData?.d?.DeliveryDocument || data.ResponseData?.DeliveryDocument;

      if (deliveryDocument) {
        setAsnNumbers(prev => ({ ...prev, [itemNo]: deliveryDocument }));
        alert(`✅ Data has been successfully posted! Delivery Document: ${deliveryDocument}`);
      } else {
        alert("✅ Data posted, but Delivery Document was not found in SAP response.");
      }

    } catch (err) {
      console.error("Post row delivery error:", err);
      alert("⚠️ Error posting data to SAP Server.");
    } finally {
      setPostingRows(prev => ({ ...prev, [itemNo]: false }));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ─── Page Header ─── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/portal/orders")}
          className="p-2 bg-white border border-slate-200 shadow-sm text-slate-500 hover:bg-slate-100 rounded-lg hover:text-slate-800 transition cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider" style={{ fontFamily: "var(--font-headline)" }}>Advance Shipping Notification</h3>
          <p className="text-xxs text-slate-500 mt-0.5">Submit Advance Shipping Notification details to SAP</p>
        </div>
      </div>

      {/* ─── Metrics Grid ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Awaiting ASN</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>
              {poItems.filter(item => !asnNumbers[item.PurchaseOrderItem]).length || (poItems.length > 0 ? poItems.length : "—")}
            </h3>
            <span className="text-[9px] text-slate-400 font-medium">Items requiring shipping logs</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Icon name="local_shipping" className="scale-110" />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>ASN Posted</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>
              {Object.keys(asnNumbers).length}
            </h3>
            <span className="text-[9px] text-slate-500 font-medium">Inbound deliveries posted</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Icon name="check_circle" className="scale-110" />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Fulfillment SLA</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>96.4%</h3>
            <span className="text-[9px] text-slate-500 font-medium">On-time shipping performance</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-700 rounded-xl">
            <Icon name="verified" className="scale-110" />
          </div>
        </div>

        <div className="card p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block" style={{ fontFamily: "var(--font-label)" }}>Fulfillment Plant</span>
            <h3 className="text-lg font-bold text-slate-900 mt-1" style={{ fontFamily: "var(--font-headline)" }}>
              {poItems.length > 0 ? Array.from(new Set(poItems.map(item => item.Plant))).join(", ") : "—"}
            </h3>
            <span className="text-[9px] text-slate-500 font-medium">Destination site codes</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-700 rounded-xl">
            <Icon name="business" className="scale-110" />
          </div>
        </div>
      </div>

      {/* ─── Filter Form Panel ─── */}
      <div className="card p-5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Package className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Purchase Order Filter</span>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <div className="w-72 max-w-full">
            <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Purchase Order Number</label>
            <input
              type="text"
              placeholder="Enter 10-digit PO Number (e.g. 4500019283)"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs py-1.5 px-3 rounded text-slate-800 focus:outline-none focus:border-blue-600 transition"
            />
          </div>
          <button
            type="button"
            disabled={fetchingPO}
            onClick={() => handleFetchPO(poNumber)}
            className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded transition flex items-center justify-center gap-2 disabled:opacity-50 h-9 shrink-0 shadow-sm cursor-pointer"
          >
            {fetchingPO ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking SAP...
              </>
            ) : (
              <>
                <Search className="h-3.5 w-3.5" /> Go
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── Table Workspace ─── */}
      <div className="card p-6 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Purchase Order Items</span>
          </div>
          <span className="text-xxs text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">{poItems.length} records loaded</span>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xxs font-semibold rounded flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xxs font-semibold rounded flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {poItems.length === 0 ? (
          <div className="py-24 text-center text-slate-400 text-xs">
            Enter a Purchase Order Number above and click "Go" to fetch details from SAP.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[450px] overflow-y-auto rounded-lg border border-slate-200">
            <table className="w-full text-left border-collapse text-xxs whitespace-nowrap">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 text-center">Purchase Order No</th>
                  <th className="py-3 px-4 text-center">Line Item No</th>
                  <th className="py-3 px-4">Material Code</th>
                  <th className="py-3 px-4">Material Description</th>
                  <th className="py-3 px-4">Supplier Material Code</th>
                  <th className="py-3 px-4 text-right">Order Qty</th>
                  <th className="py-3 px-4 text-center">Unit</th>
                  <th className="py-3 px-4 text-center w-24">Committed Qty *</th>
                  <th className="py-3 px-4 text-center">Planned Delivery Date</th>
                  <th className="py-3 px-4 text-center w-36">Expected Delivery Date</th>
                  <th className="py-3 px-4 text-center">Plant Code</th>
                  <th className="py-3 px-4">Plant Name</th>
                  <th className="py-3 px-4 text-center">ASN Number</th>
                  <th className="py-3 px-4 text-center">Post</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-semibold">
                {poItems.map((item, idx) => {
                  const itemNo = item.PurchaseOrderItem;
                  const isRowPosting = postingRows[itemNo] || false;
                  const committedVal = committedQtys[itemNo] || "";
                  const expectedDate = expectedDates[itemNo] || "";
                  const asnNumber = asnNumbers[itemNo] || "";

                  return (
                    <tr key={idx} className="hover:bg-amber-100/50 transition-colors duration-250">
                      <td className="py-3 px-4 text-center text-slate-800 font-bold">{item.PurchaseOrder}</td>
                      <td className="py-3 px-4 text-center text-blue-700 font-bold">{itemNo}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.Material}</td>
                      <td className="py-3 px-4 max-w-[160px] truncate text-slate-500" title={item.PurchaseOrderItemText}>
                        {item.PurchaseOrderItemText}
                      </td>
                      <td className="py-3 px-4 text-slate-500">{item.SupplierMaterialNumber}</td>
                      <td className="py-3 px-4 text-right text-slate-800 font-extrabold">{item.OrderQuantity}</td>
                      <td className="py-3 px-4 text-center text-slate-500">{item.PurchaseOrderQuantityUnit}</td>
                      
                      {/* Committed Qty Input */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="text"
                          value={committedVal}
                          onChange={(e) => handleQtyChange(itemNo, e.target.value)}
                          disabled={isRowPosting || !!asnNumber}
                          className="w-20 bg-slate-50 border border-slate-200 text-center py-1 px-1.5 rounded text-slate-900 font-bold focus:outline-none focus:border-blue-600 disabled:opacity-50"
                        />
                      </td>

                      {/* Planned Delivery Date */}
                      <td className="py-3 px-4 text-center text-slate-500 font-medium">{formatDate(item.BaseUnit)}</td>
                      
                      {/* Expected Delivery Date Input */}
                      <td className="py-2 px-3 text-center">
                        <input
                          type="date"
                          value={expectedDate}
                          onChange={(e) => handleDateChange(itemNo, e.target.value)}
                          disabled={isRowPosting || !!asnNumber}
                          className="w-32 bg-slate-50 border border-slate-200 text-center py-1 px-1.5 rounded text-slate-900 font-semibold focus:outline-none focus:border-blue-600 disabled:opacity-50"
                        />
                      </td>

                      <td className="py-3 px-4 text-center text-slate-500 font-bold">{item.Plant}</td>
                      <td className="py-3 px-4 text-slate-500">{item.PlantName}</td>
                      
                      {/* ASN Number Display */}
                      <td className="py-3 px-4 text-center font-extrabold text-emerald-600">
                        {asnNumber ? (
                          <div className="flex items-center justify-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {asnNumber}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal italic">—</span>
                        )}
                      </td>

                      {/* Post Row Action Button */}
                      <td className="py-2 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handlePostRow(item)}
                          disabled={isRowPosting || !!asnNumber}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xxs rounded transition flex items-center justify-center gap-1 shadow-sm disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {isRowPosting ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Send className="h-3 w-3" />
                          )}
                          Post
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}

export default function ASNPage() {
  return (
    <Suspense fallback={
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
        <span className="text-xxs font-bold uppercase tracking-widest">Loading workspace context...</span>
      </div>
    }>
      <ASNCreator />
    </Suspense>
  );
}
