"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search, Plus, X, Upload, Loader2, AlertCircle, CheckCircle2,
  Package, Filter, Eye, DollarSign, Clock, Clipboard, FileText, ArrowUpRight,
  Download, FileSpreadsheet, AlertTriangle, Check, ChevronLeft, ChevronRight
} from "lucide-react";

interface Product {
  SAPMaterialSKU: string;
  SAPProductDescription: string;
  MaterialType: string;
  VendorProductName: string;
  VendorProductDescription: string;
  Unit: string;
  Price: number;
  Image: string | null;
  ProductSpecification: string;
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

// Utility function to escape XML
const escapeXml = (unsafe: any) => {
  if (unsafe === null || unsafe === undefined) return "";
  return unsafe.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
};

export default function SupplierProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get("action");
  const isRegister = action === "register";

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [mappedSkuList, setMappedSkuList] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Tab State: 'catalogue' | 'excel-upload' | 'download'
  const [activeTab, setActiveTab] = useState("catalogue");

  // Download catalogue states
  const [downloadProducts, setDownloadProducts] = useState<Product[]>([]);
  const [downloadSearchProductType, setDownloadSearchProductType] = useState("");
  const [downloadSearchProductGroup, setDownloadSearchProductGroup] = useState("");
  const [downloadSearchProductCode, setDownloadSearchProductCode] = useState("");
  const [downloadLoading, setDownloadLoading] = useState(false);

  // Pagination & Selection States
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadFilteredDownloadProducts = async () => {
    setDownloadLoading(true);
    setErrorMsg("");
    setCurrentPage(1); // Reset page to 1 on new search
    setSelectedSkus([]); // Reset selection on new search
    try {
      const params = new URLSearchParams();
      if (downloadSearchProductCode.trim()) params.append("Product", downloadSearchProductCode.trim());
      if (downloadSearchProductType.trim()) params.append("ProductType", downloadSearchProductType.trim());
      if (downloadSearchProductGroup.trim()) params.append("ProductGroup", downloadSearchProductGroup.trim());

      const res = await fetch(`/api/getProductCatalogue?${params.toString()}`);
      if (res.ok) {
        const data: Product[] = await res.json();
        setDownloadProducts(data || []);
      } else {
        setErrorMsg("Failed to query database catalogue with filters.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error trying to filter catalogue database.");
    } finally {
      setDownloadLoading(false);
    }
  };

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterialType, setSelectedMaterialType] = useState("all");

  // Registration Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [drawerError, setDrawerError] = useState("");

  // Form Inputs for standard mapping
  const [supplierProductCode, setSupplierProductCode] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [moq, setMoq] = useState("");
  const [leadTime, setLeadTime] = useState("");
  const [packagingDetails, setPackagingDetails] = useState("");
  const [shape, setShape] = useState("");
  const [datasheetFile, setDatasheetFile] = useState<File | null>(null);
  const [datasheetName, setDatasheetName] = useState("");

  // Preview Modal
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  // Image Slider / Lightbox Modal States
  const [sliderOpen, setSliderOpen] = useState(false);
  const [sliderIndex, setSliderIndex] = useState(0);

  // Supplier file upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [parsingErrors, setParsingErrors] = useState<string[]>([]);
  const [fileUploading, setFileUploading] = useState(false);
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState("");
  const [uploadErrorMsg, setUploadErrorMsg] = useState("");

  useEffect(() => {
    loadProducts();
  }, [action]);



  const loadProducts = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/getProductCatalogue");
      if (res.ok) {
        const data = await res.json();
        setProducts(data || []);
        setDownloadProducts(data || []);
      } else if (res.status === 401) {
        router.push("/login");
        return;
      } else {
        setErrorMsg("Failed to retrieve database catalogue.");
      }

      if (isRegister) {
        const mapRes = await fetch("/api/getSupplierMappings");
        if (mapRes.ok) {
          const mapData = await mapRes.json();
          const mappedSkus = (mapData || []).map((m: any) => m.Product_ID || m.SAPMaterialSKU);
          setMappedSkuList(mappedSkus);
        }
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Network error trying to fetch catalogue.");
    } finally {
      setLoading(false);
    }
  };



  const handleDatasheetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDatasheetFile(file);
      setDatasheetName(file.name);
    }
  };

  const openRegisterDrawer = (product: Product) => {
    setSelectedProduct(product);
    setSupplierProductCode("");
    setUnitPrice(product.Price.toString());
    setCurrency("INR");
    setMoq("100");
    setLeadTime("14");
    setPackagingDetails("");
    setShape("");
    setDatasheetFile(null);
    setDatasheetName("");
    setDrawerError("");
    setDrawerOpen(true);
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setDrawerError("");

    if (!selectedProduct) return;
    if (!supplierProductCode.trim()) return setDrawerError("Supplier Product Code is required.");
    if (isNaN(parseFloat(unitPrice)) || parseFloat(unitPrice) <= 0) return setDrawerError("Please provide a valid price.");
    if (isNaN(parseFloat(moq)) || parseFloat(moq) <= 0) return setDrawerError("Please provide a valid MOQ.");
    if (isNaN(parseInt(leadTime)) || parseInt(leadTime) <= 0) return setDrawerError("Please provide a valid lead time.");
    if (!packagingDetails.trim()) return setDrawerError("Packaging details are required.");
    if (!shape.trim()) return setDrawerError("Shape description is required.");

    setSubmitting(true);

    const formData = new FormData();
    formData.append("productId", selectedProduct.SAPMaterialSKU);
    formData.append("supplierProductCode", supplierProductCode.trim());
    formData.append("unitPrice", unitPrice.trim());
    formData.append("currency", currency);
    formData.append("moq", moq.trim());
    formData.append("leadTime", leadTime.trim());
    formData.append("packagingDetails", packagingDetails.trim());
    formData.append("shape", shape.trim());
    if (datasheetFile) {
      formData.append("datasheet", datasheetFile);
    }

    try {
      const res = await fetch("/api/registerSupplierProduct", {
        method: "POST",
        body: formData
      });

      const result = await res.json().catch(() => ({}));
      if (res.ok && result.success) {
        setSuccessMsg(`Successfully registered mapping for ${selectedProduct.SAPMaterialSKU}!`);
        setDrawerOpen(false);
        loadProducts();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setDrawerError(result.error || "Failed to register supplier mapping.");
      }
    } catch (err) {
      console.error(err);
      setDrawerError("An unexpected network error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Download Master database list in Excel format
  const handleDownloadExcel = (dataset: Product[] = products) => {
    if (dataset.length === 0) {
      alert("No catalogue products available in the database to download.");
      return;
    }

    const headers = [
      "SAPMaterialSKU",
      "SAPProductDescription",
      "MaterialType",
      "VendorProductName",
      "VendorProductDescription",
      "Unit",
      "Price",
      "ProductSpecification"
    ];

    let xml = '<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns:html="http://www.w3.org/TR/REC-html40"><Worksheet ss:Name="Product Catalogue"><Table>';

    xml += '<Row ss:Height="20">';
    headers.forEach(h => {
      xml += `<Cell><Data ss:Type="String">${escapeXml(h)}</Data></Cell>`;
    });
    xml += '</Row>';

    dataset.forEach(item => {
      xml += '<Row>';
      xml += `<Cell><Data ss:Type="String">${escapeXml(item.SAPMaterialSKU)}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${escapeXml(item.SAPProductDescription)}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${escapeXml(item.MaterialType)}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${escapeXml(item.VendorProductName)}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${escapeXml(item.VendorProductDescription || '')}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${escapeXml(item.Unit)}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="Number">${Number(item.Price || 0).toFixed(2)}</Data></Cell>`;
      xml += `<Cell><Data ss:Type="String">${escapeXml(item.ProductSpecification || '')}</Data></Cell>`;
      xml += '</Row>';
    });

    xml += '</Table></Worksheet></Workbook>';

    const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Product_Catalogue_Template_${new Date().toISOString().split("T")[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Parse uploaded Excel changes for preview
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadErrorMsg("");
    setUploadSuccessMsg("");
    setParsedRows([]);
    setParsingErrors([]);

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/parseProductEdits", {
          method: "POST",
          body: formData
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setParsedRows(data.rows || []);
          if (data.errors) {
            setParsingErrors(data.errors);
          }
        } else {
          setUploadErrorMsg(data.error || "Failed to parse file. Verify columns are correct.");
        }
      } catch (err) {
        console.error(err);
        setUploadErrorMsg("Network error parsing file.");
      }
    }
  };

  // 3. Submit bulk edits upload
  const handleUploadSubmit = async () => {
    if (!selectedFile) return;

    setFileUploading(true);
    setUploadErrorMsg("");
    setUploadSuccessMsg("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch("/api/uploadProductEdits", {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUploadSuccessMsg(data.message || "Edits successfully uploaded and submitted for Admin approval.");
        setSelectedFile(null);
        setParsedRows([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => setUploadSuccessMsg(""), 6000);
      } else {
        setUploadErrorMsg(data.error || "Failed to upload edits.");
      }
    } catch (err) {
      console.error(err);
      setUploadErrorMsg("Network error uploading file.");
    } finally {
      setFileUploading(false);
    }
  };

  const handleRemoveUploadedFile = () => {
    setSelectedFile(null);
    setParsedRows([]);
    setParsingErrors([]);
    setUploadErrorMsg("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const filteredProducts = products.filter(p => {
    if (isRegister && mappedSkuList.includes(p.SAPMaterialSKU)) {
      return false;
    }
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      p.SAPMaterialSKU.toLowerCase().includes(term) ||
      p.SAPProductDescription.toLowerCase().includes(term) ||
      p.VendorProductName.toLowerCase().includes(term);

    const matchesMaterialType = selectedMaterialType === "all" || p.MaterialType === selectedMaterialType;
    return matchesSearch && matchesMaterialType;
  });

  const productsWithImages = filteredProducts.filter(p => p.Image);

  const handlePrevImage = () => {
    if (productsWithImages.length === 0) return;
    setSliderIndex((prev) => (prev - 1 + productsWithImages.length) % productsWithImages.length);
  };

  const handleNextImage = () => {
    if (productsWithImages.length === 0) return;
    setSliderIndex((prev) => (prev + 1) % productsWithImages.length);
  };

  useEffect(() => {
    if (!sliderOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        handlePrevImage();
      } else if (e.key === "ArrowRight") {
        handleNextImage();
      } else if (e.key === "Escape") {
        setSliderOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [sliderOpen, productsWithImages.length]);

  const materialTypes = Array.from(new Set(products.map(p => p.MaterialType))).filter(Boolean);

  if (loading && products.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="h-6 w-6 text-blue-700 animate-spin" />
        <span className="text-xxs font-bold uppercase tracking-widest text-slate-400">Loading catalogue...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-5 rounded-2xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black tracking-wide uppercase">Database Product Catalogue</h2>
          <p className="text-[10px] text-slate-300 mt-0.5">Explore standard registered items, download catalogue, request master specifications edits, or register supply prices.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white p-1.5 rounded-xl shadow-sm gap-1">
        <button
          onClick={() => setActiveTab("catalogue")}
          className={`flex-1 py-2 text-center text-xxs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${activeTab === "catalogue" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
        >
          Material Catalogue
        </button>
        <button
          onClick={() => setActiveTab("download")}
          className={`flex-1 py-2 text-center text-xxs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${activeTab === "download" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
        >
          Download Catalogue
        </button>
        <button
          onClick={() => setActiveTab("excel-upload")}
          className={`flex-1 py-2 text-center text-xxs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${activeTab === "excel-upload" ? "bg-slate-900 text-white shadow" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}
        >
          Upload Excel Edits
        </button>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xxs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" /> {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xxs font-bold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {successMsg}
        </div>
      )}

      {/* Tab 1: Catalogue Display */}
      {activeTab === "catalogue" && (
        <>
          {isRegister && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-700 text-xxs font-bold rounded-xl flex items-center gap-2 shadow-sm animate-fade-in">
              <Clipboard className="h-4 w-4 text-blue-500 shrink-0" />
              <span>Select a product below to create a new mapping relationship. Mapped products are hidden.</span>
            </div>
          )}

          {/* Controls Header */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search material SKU, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-1.5 pl-9 pr-4 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={selectedMaterialType}
                onChange={(e) => setSelectedMaterialType(e.target.value)}
                className="bg-slate-50 border border-slate-200 py-1.5 px-2 rounded-lg font-medium text-slate-700 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="all">All Categories</option>
                {materialTypes.map(mt => (
                  <option key={mt} value={mt}>{mt}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 font-semibold bg-white border border-slate-200 rounded-xl">
                <Package className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <span>No catalogue products available.</span>
              </div>
            ) : (
              filteredProducts.map((p) => (
                <div key={p.SAPMaterialSKU} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{p.MaterialType}</span>
                        <h4 className="font-extrabold text-slate-800 leading-snug tracking-tight line-clamp-2" title={p.SAPProductDescription}>
                          {p.SAPProductDescription}
                        </h4>
                      </div>
                      {p.Image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.Image}
                          alt={p.SAPProductDescription}
                          className="h-20 w-20 rounded-lg object-cover border border-slate-100 shrink-0 bg-slate-50 cursor-pointer hover:scale-105 hover:opacity-90 transition-all duration-200"
                          onClick={() => {
                            const idx = productsWithImages.findIndex(item => item.SAPMaterialSKU === p.SAPMaterialSKU);
                            if (idx !== -1) {
                              setSliderIndex(idx);
                              setSliderOpen(true);
                            }
                          }}
                        />
                      ) : (
                        <div className="h-20 w-20 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center shrink-0 text-slate-300">
                          <Package className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xxs font-bold text-slate-500 uppercase tracking-wider">
                      <span>SKU: {p.SAPMaterialSKU}</span>
                      <span>UOM: {p.Unit}</span>
                    </div>
                  </div>
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex gap-2.5">
                    <button
                      onClick={() => setPreviewProduct(p)}
                      className="w-full py-1.5 border border-slate-200 text-slate-600 font-bold text-xxs tracking-wider uppercase rounded-lg hover:bg-slate-100 transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" /> View Specs
                    </button>
                    {/* <button
                      onClick={() => openRegisterDrawer(p)}
                      className="flex-1 py-1.5 bg-blue-700 hover:bg-blue-600 text-white font-bold text-xxs tracking-wider uppercase rounded-lg shadow transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Map Product <ArrowUpRight className="h-3.5 w-3.5" />
                    </button> */}
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Tab 2: Excel Upload Edits */}
      {activeTab === "excel-upload" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-6 flex flex-col justify-between h-fit animate-fade-in">
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-800 flex items-center gap-2">
                <Upload className="h-4 w-4 text-blue-700" />
                Upload Catalogue Modifications
              </h3>
              <p className="text-xxs text-slate-500 leading-relaxed font-semibold">
                Download the master catalogue spreadsheet, make changes to the names, prices, or technical specifications, and re-upload here. Edits append to the Admin's Approval Panel.
              </p>
              <button
                onClick={() => handleDownloadExcel()}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-slate-700 text-xxs font-bold uppercase tracking-wider rounded-lg hover:bg-slate-50 transition cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                Download Spreadsheet
              </button>
            </div>

            <div className="border-t border-slate-100 pt-5 space-y-4 text-xs">
              {uploadErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xxs font-semibold rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{uploadErrorMsg}</span>
                </div>
              )}
              {uploadSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xxs font-semibold rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 animate-bounce" />
                  <span>{uploadSuccessMsg}</span>
                </div>
              )}

              <label className="block">
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Select Edited File</span>
                <div className="border border-slate-200 border-dashed rounded-lg bg-slate-50 hover:bg-slate-100/70 p-6 text-center transition cursor-pointer relative">
                  <input
                    type="file"
                    accept=".xls,.xlsx,.csv"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <FileSpreadsheet className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <span className="text-[11px] font-bold text-slate-600 block truncate">
                    {selectedFile ? selectedFile.name : "Click or drag XLS/CSV here"}
                  </span>
                </div>
              </label>

              {selectedFile && (
                <div className="flex gap-2.5">
                  <button
                    onClick={handleRemoveUploadedFile}
                    className="flex-1 py-2 border border-slate-200 hover:bg-slate-50 font-bold text-xxs tracking-wider uppercase text-slate-500 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUploadSubmit}
                    disabled={fileUploading || parsedRows.length === 0}
                    className="flex-1 py-2 bg-indigo-700 hover:bg-indigo-650 text-white font-bold text-xxs tracking-wider uppercase rounded-lg shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {fileUploading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Submit Edits</span>
                        <Check className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Preview Grid */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col min-h-[380px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clipboard className="h-4 w-4 text-indigo-500" />
                  Proposed Excel Updates Preview
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                  Verify the values you are submitting before forwarding to administration.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto mt-4 text-xxs font-semibold whitespace-nowrap min-h-[250px]">
              {parsingErrors.length > 0 && (
                <div className="p-3 mb-4 bg-amber-50 border border-amber-200 text-amber-700 rounded-lg">
                  <span className="font-bold flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Parsing warnings:</span>
                  <ul className="list-disc list-inside text-[9px] mt-1 space-y-0.5">
                    {parsingErrors.slice(0, 3).map((e, idx) => <li key={idx}>{e}</li>)}
                  </ul>
                </div>
              )}

              {parsedRows.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 font-semibold py-12">
                  <FileSpreadsheet className="h-10 w-10 text-slate-200 mb-2" />
                  <span>No Excel file selected. Upload a file to inspect parsed rows.</span>
                </div>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2.5 px-3">SAP SKU</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Vendor Name</th>
                      <th className="py-2.5 px-3 text-right">Price</th>
                      <th className="py-2.5 px-3">Unit</th>
                      <th className="py-2.5 px-3">Specifications</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition">
                        <td className="py-2.5 px-3 font-mono text-slate-900">{row.SAPMaterialSKU}</td>
                        <td className="py-2.5 px-3 max-w-[120px] truncate">{row.SAPProductDescription}</td>
                        <td className="py-2.5 px-3">{row.MaterialType}</td>
                        <td className="py-2.5 px-3">{row.VendorProductName}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">₹{Number(row.Price || 0).toFixed(2)}</td>
                        <td className="py-2.5 px-3">{row.Unit}</td>
                        <td className="py-2.5 px-3 max-w-[150px] truncate text-slate-400">{row.ProductSpecification}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Download Catalogue with Filters */}
      {activeTab === "download" && (() => {
        const totalRecords = downloadProducts.length;
        const totalPages = Math.ceil(totalRecords / pageSize) || 1;
        const activePage = Math.min(currentPage, totalPages);

        const indexOfLastRecord = activePage * pageSize;
        const indexOfFirstRecord = indexOfLastRecord - pageSize;
        const currentRecords = downloadProducts.slice(indexOfFirstRecord, indexOfLastRecord);

        const pageSkus = currentRecords.map(p => p.SAPMaterialSKU);
        const isAllPageSelected = pageSkus.length > 0 && pageSkus.every(sku => selectedSkus.includes(sku));

        const handleSelectAllOnPage = () => {
          if (isAllPageSelected) {
            setSelectedSkus(prev => prev.filter(sku => !pageSkus.includes(sku)));
          } else {
            setSelectedSkus(prev => {
              const newSelection = [...prev];
              pageSkus.forEach(sku => {
                if (!newSelection.includes(sku)) {
                  newSelection.push(sku);
                }
              });
              return newSelection;
            });
          }
        };

        const handleToggleSelectSku = (sku: string) => {
          setSelectedSkus(prev =>
            prev.includes(sku) ? prev.filter(s => s !== sku) : [...prev, sku]
          );
        };

        return (
          <div className="space-y-6 animate-fade-in">
            {/* Filters Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="bg-slate-50/50 px-5 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-800">Filter Catalogue to Download</h4>
                  <p className="text-[10px] text-slate-405 font-semibold mt-0.5">Filter the SQL database catalogue using SAP Material properties and download the resulting template.</p>
                </div>
                <button
                  onClick={() => {
                    if (selectedSkus.length > 0) {
                      const itemsToDownload = downloadProducts.filter(p => selectedSkus.includes(p.SAPMaterialSKU));
                      handleDownloadExcel(itemsToDownload);
                    } else {
                      handleDownloadExcel(downloadProducts);
                    }
                  }}
                  disabled={downloadProducts.length === 0}
                  className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xxs tracking-wider uppercase rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>
                    {selectedSkus.length > 0
                      ? `Download Selected (${selectedSkus.length})`
                      : "Download Filtered Catalogue"}
                  </span>
                </button>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end text-xs">
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Product Type</label>
                  <input
                    type="text"
                    placeholder="e.g. ROH"
                    value={downloadSearchProductType}
                    onChange={(e) => setDownloadSearchProductType(e.target.value)}
                    className="w-full bg-white border border-slate-200 py-1.5 px-3 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Product Group</label>
                  <input
                    type="text"
                    placeholder="e.g. E001"
                    value={downloadSearchProductGroup}
                    onChange={(e) => setDownloadSearchProductGroup(e.target.value)}
                    className="w-full bg-white border border-slate-200 py-1.5 px-3 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Product ID / Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 5500000047"
                    value={downloadSearchProductCode}
                    onChange={(e) => setDownloadSearchProductCode(e.target.value)}
                    className="w-full bg-white border border-slate-200 py-1.5 px-3 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition shadow-sm font-semibold"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={loadFilteredDownloadProducts}
                    disabled={downloadLoading}
                    className="flex-1 py-1.5 px-3 bg-indigo-700 hover:bg-indigo-650 text-white font-bold text-xxs tracking-wider uppercase rounded-lg shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    {downloadLoading ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <>
                        <Search className="h-3.5 w-3.5" />
                        <span>Search</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setDownloadSearchProductType("");
                      setDownloadSearchProductGroup("");
                      setDownloadSearchProductCode("");
                      setDownloadProducts(products);
                      setCurrentPage(1);
                      setSelectedSkus([]);
                    }}
                    className="py-1.5 px-3 border border-slate-200 hover:bg-slate-100 text-slate-650 font-bold text-xxs tracking-wider uppercase rounded-lg transition cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Data Grid Preview */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left border-collapse data-table">
                  <thead>
                    <tr className="bg-slate-900 text-slate-100 text-[10px] font-black uppercase tracking-wider">
                      <th className="py-3 px-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={isAllPageSelected}
                          onChange={handleSelectAllOnPage}
                          className="rounded border-slate-750 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                        />
                      </th>
                      <th className="py-3 px-4">SAP SKU / Material</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Material Type</th>
                      <th className="py-3 px-4">Vendor Product Name</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4 text-right">Standard Price</th>
                      <th className="py-3 px-4">Specifications</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                    {currentRecords.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center text-slate-400 font-semibold bg-slate-50/35">
                          <Package className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                          <span>No catalogue records found. Try resetting the filters.</span>
                        </td>
                      </tr>
                    ) : (
                      currentRecords.map((p) => (
                        <tr key={p.SAPMaterialSKU} className="hover:bg-slate-50/30 transition-colors">
                          <td className="py-3.5 px-4 w-12 text-center">
                            <input
                              type="checkbox"
                              checked={selectedSkus.includes(p.SAPMaterialSKU)}
                              onChange={() => handleToggleSelectSku(p.SAPMaterialSKU)}
                              className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{p.SAPMaterialSKU}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-800" title={p.SAPProductDescription}>{p.SAPProductDescription}</td>
                          <td className="py-3.5 px-4">
                            <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {p.MaterialType || "—"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-800">{p.VendorProductName || "—"}</td>
                          <td className="py-3.5 px-4 uppercase text-slate-650 font-black">{p.Unit || "—"}</td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-900">₹{Number(p.Price || 0).toFixed(2)}</td>
                          <td className="py-3.5 px-4 max-w-[200px] truncate text-slate-450" title={p.ProductSpecification || ''}>{p.ProductSpecification || "—"}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalRecords > 0 && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-semibold text-slate-700 shadow-sm animate-fade-in">
                <div className="flex items-center gap-2">
                  <span>Show</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white border border-slate-200 py-1 px-2.5 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition shadow-sm"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span>entries</span>
                  {selectedSkus.length > 0 && (
                    <span className="ml-4 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-150 animate-pulse">
                      {selectedSkus.length} items selected
                    </span>
                  )}
                </div>

                <div className="text-xxs font-bold text-slate-500 uppercase tracking-wide">
                  Showing {totalRecords === 0 ? 0 : indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, totalRecords)} of {totalRecords} entries
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={activePage === 1}
                    className="p-1 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                    title="Previous Page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-xxs font-bold transition cursor-pointer ${activePage === page ? "bg-indigo-700 text-white shadow-sm" : "border border-slate-200 hover:bg-slate-100 text-slate-700"}`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={activePage === totalPages}
                    className="p-1 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition cursor-pointer"
                    title="Next Page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })()}


      {/* Drawer */}
      {drawerOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div onClick={() => setDrawerOpen(false)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />

          <div className="w-full max-w-md bg-white border-l border-slate-200 shadow-2xl text-slate-800 h-full relative z-10 flex flex-col justify-between animate-slide-in">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Clipboard className="h-4 w-4 text-indigo-500" /> Map Supplier Product
                </h3>
                <p className="text-xxs text-slate-500 mt-1">
                  Bind inventory specifications to SKU: {selectedProduct.SAPMaterialSKU}
                </p>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitRegistration} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              {drawerError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xxs font-semibold rounded flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{drawerError}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">SAP SKU Reference</label>
                <input
                  type="text"
                  value={selectedProduct.SAPMaterialSKU}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 py-2 px-3 rounded text-slate-400 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Supplier Part Code *</label>
                <input
                  type="text"
                  placeholder="Your internal product ID (e.g. SL-PIPE-100MM)"
                  value={supplierProductCode}
                  onChange={(e) => setSupplierProductCode(e.target.value.trim().toUpperCase())}
                  className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-650"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Your Price *</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-655"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-2 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-655"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Min Order Qty (MOQ) *</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={moq}
                    onChange={(e) => setMoq(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 text-xs focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Lead Time (Days) *</label>
                  <input
                    type="number"
                    placeholder="14"
                    value={leadTime}
                    onChange={(e) => setLeadTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 text-xs focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Product Shape / Geometry *</label>
                <input
                  type="text"
                  placeholder="e.g. Flat Plate"
                  value={shape}
                  onChange={(e) => setShape(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 text-xs focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Packaging Details *</label>
                <textarea
                  placeholder="e.g. Crated wooden box"
                  rows={2}
                  value={packagingDetails}
                  onChange={(e) => setPackagingDetails(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 text-xs focus:outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Technical Datasheet (PDF/Specs)</label>
                <div className="flex items-center gap-3">
                  {datasheetName ? (
                    <div className="flex-1 bg-slate-50 border border-slate-200 px-3 py-2 rounded flex items-center justify-between font-bold text-slate-705">
                      <span className="truncate max-w-[200px] flex items-center gap-1.5"><FileText className="h-4 w-4 text-indigo-400" /> {datasheetName}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setDatasheetFile(null);
                          setDatasheetName("");
                        }}
                        className="text-xxs text-rose-500 hover:text-rose-600 cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="flex-1 border border-slate-200 border-dashed bg-slate-50 hover:bg-slate-100 py-4 px-3 rounded-lg text-xxs font-bold text-slate-500 text-center uppercase tracking-wider cursor-pointer transition">
                      Upload PDF Datasheet
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleDatasheetChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-200 p-6 bg-slate-50 flex gap-3 -mx-6 -mb-6 mt-6 shrink-0">
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-bold rounded-lg transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <span>Submit</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Product specs modal */}
      {previewProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div onClick={() => setPreviewProduct(null)} className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" />

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xl max-w-md w-full z-10 flex flex-col relative animate-scale-up">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="font-extrabold text-slate-800 flex items-center gap-2">
                  <Package className="h-4 w-4 text-indigo-400" /> Specifications details
                </h4>
                <p className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">Asset Reference Details</p>
              </div>
              <button
                onClick={() => setPreviewProduct(null)}
                className="p-1 bg-slate-50 border border-slate-200 text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="flex gap-4">
                {previewProduct.Image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewProduct.Image}
                    alt={previewProduct.SAPProductDescription}
                    className="h-48 w-48 border border-slate-200 rounded-lg object-cover bg-slate-50 cursor-pointer hover:scale-[1.02] hover:opacity-90 transition-all duration-200"
                    onClick={() => {
                      const idx = productsWithImages.findIndex(item => item.SAPMaterialSKU === previewProduct.SAPMaterialSKU);
                      if (idx !== -1) {
                        setSliderIndex(idx);
                        setSliderOpen(true);
                      }
                    }}
                  />
                ) : (
                  <div className="h-48 w-48 bg-slate-50 border border-slate-200 text-slate-300 rounded-lg flex items-center justify-center">
                    <Package className="h-24 w-24" />
                  </div>
                )}
                <div className="space-y-0.5">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">SKU Reference</span>
                  <span className="font-extrabold text-slate-800 text-sm block">{previewProduct.SAPMaterialSKU}</span>
                  <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-indigo-50 text-indigo-700 border border-indigo-100 mt-1">
                    Type: {previewProduct.MaterialType}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Catalogue Description</span>
                  <span className="font-semibold text-slate-800">{previewProduct.SAPProductDescription}</span>
                </div>
                {previewProduct.VendorProductName && (
                  <div>
                    <span className="text-[9px] text-slate-400 font-bold uppercase block">Vendor Name</span>
                    <span className="font-semibold text-slate-800">{previewProduct.VendorProductName}</span>
                  </div>
                )}
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase block">Technical Specifications</span>
                  <p className="text-slate-600 font-semibold leading-relaxed whitespace-pre-wrap">{previewProduct.ProductSpecification || "—"}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setPreviewProduct(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xxs tracking-wider uppercase rounded-xl transition cursor-pointer"
              >
                Close details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Slider / Lightbox Modal */}
      {sliderOpen && productsWithImages.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            onClick={() => setSliderOpen(false)}
            className="absolute inset-0 bg-slate-950/90 backdrop-blur-md transition-opacity duration-300"
          />

          {/* Modal Content */}
          <div className="relative z-10 flex flex-col items-center max-w-4xl w-full px-4 animate-scale-up">
            {/* Close Button */}
            <button
              onClick={() => setSliderOpen(false)}
              className="absolute -top-14 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full transition-all duration-200 cursor-pointer"
              title="Close Slider (Esc)"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Slider Viewport */}
            <div className="relative flex items-center justify-center w-full min-h-[300px]">
              {/* Previous Image Button (<) */}
              <button
                onClick={handlePrevImage}
                className="absolute left-2 sm:left-4 z-20 bg-slate-900/60 hover:bg-slate-900/90 text-white border border-white/10 rounded-full w-12 h-12 flex items-center justify-center text-xl font-black shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer select-none"
                title="Previous Image (Left Arrow)"
              >
                &lt;
              </button>

              {/* Centered Image & Caption */}
              <div className="flex flex-col items-center justify-center max-w-[80vw]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={productsWithImages[sliderIndex].Image || ""}
                  alt={productsWithImages[sliderIndex].SAPProductDescription}
                  className="max-w-full max-h-[65vh] rounded-2xl object-contain shadow-2xl border border-white/10 select-none animate-fade-in"
                />

                {/* Caption Panel */}
                <div className="mt-4 bg-slate-900/80 border border-white/10 rounded-xl px-5 py-3 text-center max-w-md w-full backdrop-blur-sm shadow-xl">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">
                    Product {sliderIndex + 1} of {productsWithImages.length}
                  </span>
                  <span className="font-extrabold text-white text-xs block mt-1 leading-snug">
                    {productsWithImages[sliderIndex].SAPProductDescription}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                    SKU: {productsWithImages[sliderIndex].SAPMaterialSKU} | Category: {productsWithImages[sliderIndex].MaterialType}
                  </span>
                </div>
              </div>

              {/* Next Image Button (>) */}
              <button
                onClick={handleNextImage}
                className="absolute right-2 sm:right-4 z-20 bg-slate-900/60 hover:bg-slate-900/90 text-white border border-white/10 rounded-full w-12 h-12 flex items-center justify-center text-xl font-black shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer select-none"
                title="Next Image (Right Arrow)"
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
