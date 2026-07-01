"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, Download, AlertCircle, CheckCircle2, Loader2,
  Table, HelpCircle, ArrowRight, FileText, Check, AlertTriangle
} from "lucide-react";

interface ParsedMapping {
  SAPMaterialSKU: string;
  SupplierProductCode: string;
  UnitPrice: string;
  Currency: string;
  MOQ: string;
  LeadTime: string;
  PackagingDetails: string;
  Shape: string;
  isValid?: boolean;
  error?: string;
}

export default function SupplierBulkUploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedMapping[]>([]);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const downloadTemplate = () => {
    const headers = "SAPMaterialSKU,SupplierProductCode,UnitPrice,Currency,MOQ,LeadTime,PackagingDetails,Shape\n";
    const sampleRow = "5500000047,SL-PIPE-2IN,450.00,INR,50,10,Crate Packaging,Cylindrical\n";
    const blob = new Blob([headers + sampleRow], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Supplier_Product_Mapping_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSV = (text: string): ParsedMapping[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length <= 1) return [];
    
    // Read and trim headers
    const rawHeaders = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ""));
    
    // Normalize headers to map to our expected database properties
    const headerMap: { [key: string]: string } = {
      "sapmaterialsku": "SAPMaterialSKU",
      "sap sku": "SAPMaterialSKU",
      "sapsku": "SAPMaterialSKU",
      "sku": "SAPMaterialSKU",
      "supplierproductcode": "SupplierProductCode",
      "supplier product code": "SupplierProductCode",
      "supplier part code": "SupplierProductCode",
      "supplierpartcode": "SupplierProductCode",
      "unitprice": "UnitPrice",
      "unit price": "UnitPrice",
      "price": "UnitPrice",
      "currency": "Currency",
      "moq": "MOQ",
      "leadtime": "LeadTime",
      "lead time": "LeadTime",
      "lead time (days)": "LeadTime",
      "leadtime(days)": "LeadTime",
      "packagingdetails": "PackagingDetails",
      "packaging details": "PackagingDetails",
      "shape": "Shape"
    };

    const headers = rawHeaders.map(h => headerMap[h.toLowerCase()] || h);
    const results: ParsedMapping[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const row: string[] = [];
      let insideQuote = false;
      let entry = "";
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === "," && !insideQuote) {
          row.push(entry.trim());
          entry = "";
        } else {
          entry += char;
        }
      }
      row.push(entry.trim());

      const obj: any = {};
      headers.forEach((header, index) => {
        let val = row[index] || "";
        val = val.replace(/^["']|["']$/g, "");
        obj[header] = val;
      });

      // Basic row validation
      let isValid = true;
      let error = "";
      if (!obj.SAPMaterialSKU) {
        isValid = false;
        error = "Missing SAP Material SKU";
      } else if (!obj.SupplierProductCode) {
        isValid = false;
        error = "Missing Supplier Product Code";
      } else if (isNaN(parseFloat(obj.UnitPrice)) || parseFloat(obj.UnitPrice) <= 0) {
        isValid = false;
        error = "Invalid Unit Price (must be > 0)";
      } else if (isNaN(parseInt(obj.MOQ)) || parseInt(obj.MOQ) <= 0) {
        isValid = false;
        error = "Invalid MOQ (must be > 0)";
      } else if (isNaN(parseInt(obj.LeadTime)) || parseInt(obj.LeadTime) <= 0) {
        isValid = false;
        error = "Invalid Lead Time (must be > 0)";
      } else if (!obj.PackagingDetails) {
        isValid = false;
        error = "Missing Packaging Details";
      } else if (!obj.Shape) {
        isValid = false;
        error = "Missing Shape Details";
      }

      results.push({
        SAPMaterialSKU: obj.SAPMaterialSKU || "",
        SupplierProductCode: obj.SupplierProductCode || "",
        UnitPrice: obj.UnitPrice || "",
        Currency: obj.Currency || "INR",
        MOQ: obj.MOQ || "",
        LeadTime: obj.LeadTime || "",
        PackagingDetails: obj.PackagingDetails || "",
        Shape: obj.Shape || "",
        isValid,
        error
      });
    }
    return results;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg("");
    setSuccessMsg("");
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "text/csv" && !selectedFile.name.endsWith(".csv")) {
        setErrorMsg("Please upload a valid CSV file.");
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        try {
          const parsed = parseCSV(text);
          if (parsed.length === 0) {
            setErrorMsg("No data rows found in the uploaded file.");
          } else {
            setParsedRows(parsed);
          }
        } catch (err) {
          setErrorMsg("Failed to parse CSV file structure.");
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (parsedRows.length === 0) {
      setErrorMsg("No data to submit. Please select a valid template file.");
      return;
    }

    const invalidRows = parsedRows.filter(r => !r.isValid);
    if (invalidRows.length > 0) {
      setErrorMsg(`Cannot submit. Please resolve the ${invalidRows.length} errors found in the file.`);
      return;
    }

    setUploading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/bulkUploadSupplierMappings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings: parsedRows })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(data.message || `Successfully uploaded ${parsedRows.length} product mappings.`);
        setFile(null);
        setFileName("");
        setParsedRows([]);
        // Differentiate redirect depending on active tab redirection or general status
        setTimeout(() => {
          router.push("/portal/supplier/status?tab=mapping");
        }, 3000);
      } else {
        setErrorMsg(data.error || "Bulk registration failed on the server.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "A network error occurred while submitting.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Alerts */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xxs font-bold rounded-xl flex items-center gap-2.5 shadow-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xxs font-bold rounded-xl flex items-center gap-2.5 shadow-sm">
          <CheckCircle2 className="h-4 w-4 shrink-0 animate-bounce" />
          <span>{successMsg} - Redirecting to mapping status tracker...</span>
        </div>
      )}

      {/* Main Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Control Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6 flex flex-col justify-between h-fit">
          <div className="space-y-4 text-slate-800">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Upload className="h-4 w-4 text-blue-700" />
              Bulk Mapping Upload
            </h3>
            <p className="text-xxs text-slate-500 leading-relaxed font-semibold">
              Map multiple supplier catalog references simultaneously. Download our pre-formatted template, fill in your product codes, standard prices, MOQs, and lead times, then upload the completed CSV here.
            </p>

            <div className="pt-2">
              <button
                onClick={downloadTemplate}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 text-xxs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Download CSV Template
              </button>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6 space-y-4">
            <label className="block">
              <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Select Mapping File</span>
              <div className="border border-slate-200 border-dashed rounded-lg bg-slate-50 hover:bg-slate-100/70 p-6 text-center transition cursor-pointer relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                <span className="text-[11px] font-bold text-slate-600 block truncate">
                  {fileName || "Click or drag CSV here"}
                </span>
                <span className="text-[9px] text-slate-400 font-medium block mt-1">
                  Only .csv files up to 5MB
                </span>
              </div>
            </label>

            <button
              onClick={handleSubmit}
              disabled={uploading || parsedRows.length === 0}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-400 text-white font-bold text-xxs tracking-wider uppercase rounded-lg shadow-md hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Submit Mapping Queue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Preview Grid Workspace */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
            <div>
              <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Table className="h-4 w-4 text-indigo-500" />
                CSV Data Grid Preview
              </h4>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                Parsed rows from your file will show below. Valid items can be submitted immediately.
              </p>
            </div>
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold">
              {parsedRows.length} Row{parsedRows.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex-1 overflow-x-auto mt-4 min-h-[300px]">
            {parsedRows.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 font-semibold py-12">
                <HelpCircle className="h-10 w-10 text-slate-300 mb-2" />
                <span>Upload a CSV file on the left to preview its content.</span>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xxs font-semibold whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">SAP SKU</th>
                    <th className="py-2.5 px-3">Supplier Code</th>
                    <th className="py-2.5 px-3 text-right">Price</th>
                    <th className="py-2.5 px-3 text-center">Curr</th>
                    <th className="py-2.5 px-3 text-right">MOQ</th>
                    <th className="py-2.5 px-3 text-right">Lead Time</th>
                    <th className="py-2.5 px-3">Shape</th>
                    <th className="py-2.5 px-3">Packaging</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className={`hover:bg-slate-50/50 transition ${!row.isValid ? "bg-rose-50/20" : ""}`}>
                      <td className="py-2.5 px-3">
                        {row.isValid ? (
                          <span className="flex items-center gap-1 text-emerald-600">
                            <Check className="h-3.5 w-3.5" /> Valid
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-rose-600" title={row.error}>
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Error
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-900">{row.SAPMaterialSKU}</td>
                      <td className="py-2.5 px-3 text-slate-800">{row.SupplierProductCode}</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">{row.UnitPrice}</td>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-bold">{row.Currency}</td>
                      <td className="py-2.5 px-3 text-right">{row.MOQ}</td>
                      <td className="py-2.5 px-3 text-right">{row.LeadTime} Days</td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-[100px] truncate" title={row.Shape}>{row.Shape}</td>
                      <td className="py-2.5 px-3 text-slate-500 max-w-[120px] truncate" title={row.PackagingDetails}>{row.PackagingDetails}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
