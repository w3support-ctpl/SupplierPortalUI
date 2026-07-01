"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, Loader2, AlertCircle, CheckCircle2,
  Package, FileText, Clipboard, DollarSign, Type, Layers
} from "lucide-react";

export default function ProposeProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Dropdown Categories
  const [categories, setCategories] = useState<{ srno: number; description: string }[]>([]);

  // Form Inputs
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [specifications, setSpecifications] = useState("");
  const [initialPrice, setInitialPrice] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [datasheetFile, setDatasheetFile] = useState<File | null>(null);
  const [datasheetName, setDatasheetName] = useState("");

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await fetch("/api/getProductCategory", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCategories(data || []);
      }
    } catch (err) {
      console.error("Failed to load product categories:", err);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDatasheetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDatasheetFile(file);
      setDatasheetName(file.name);
    }
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!productName.trim()) return setErrorMsg("Product Name is required.");
    if (!description.trim()) return setErrorMsg("Product Description is required.");
    if (!category.trim()) return setErrorMsg("Please select a Product Category.");
    if (!specifications.trim()) return setErrorMsg("Specifications details are required.");
    if (isNaN(parseFloat(initialPrice)) || parseFloat(initialPrice) <= 0) {
      return setErrorMsg("Please provide a valid initial price.");
    }

    setSubmitting(true);

    const formData = new FormData();
    formData.append("productName", productName.trim());
    formData.append("description", description.trim());
    formData.append("category", category.trim());
    formData.append("specifications", specifications.trim());
    formData.append("initialPrice", initialPrice.trim());
    if (imageFile) {
      formData.append("image", imageFile);
    }
    if (datasheetFile) {
      formData.append("datasheet", datasheetFile);
    }

    try {
      const res = await fetch("/api/proposeNewProduct", {
        method: "POST",
        body: formData
      });

      const result = await res.json().catch(() => ({}));
      if (res.ok && result.success) {
        setSuccessMsg("Product proposal submitted successfully!");
        setProductName("");
        setDescription("");
        setCategory("");
        setSpecifications("");
        setInitialPrice("");
        setImageFile(null);
        setImagePreview(null);
        setDatasheetFile(null);
        setDatasheetName("");
      } else {
        setErrorMsg(result.error || "Failed to submit product proposal.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected networking error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
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

      {/* Main Proposal Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm text-slate-800 shadow-lg">
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Clipboard className="h-4 w-4 text-indigo-400" /> Propose New Product Specification
          </h3>
          <p className="text-xxs text-slate-500 mt-1">
            Submit specifications for a procurement item that is not yet listed in the organization master.
          </p>
        </div>

        <form onSubmit={handleSubmitProposal} className="p-6 space-y-5 text-xs">
          
          {/* Product Name */}
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Product Name / Title *</label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. Advanced Corrosion Resistant Carbon Pipe 100mm"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-2 pl-9 pr-3 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                required
              />
              <Type className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Product Category *</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-2 pl-9 pr-3 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                required
              >
                <option value="">-- Select Category --</option>
                {categories.map((c) => (
                  <option key={c.srno} value={c.description}>
                    {c.description}
                  </option>
                ))}
                {categories.length === 0 && (
                  <>
                    <option key="raw" value="Raw Material">Raw Material</option>
                    <option key="pack" value="Packing Material">Packing Material</option>
                    <option key="cons" value="Consumable">Consumable</option>
                  </>
                )}
              </select>
              <Layers className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Initial Price */}
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Proposed Initial Price (INR ₹) *</label>
            <div className="relative">
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={initialPrice}
                onChange={(e) => setInitialPrice(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 py-2 pl-9 pr-3 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600"
                required
              />
              <DollarSign className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Product Description *</label>
            <textarea
              placeholder="Describe what the product is, its grade, brand reference, or intended deployment."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600 resize-none"
              required
            />
          </div>

          {/* Specifications */}
          <div>
            <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">Detailed Technical Specifications *</label>
            <textarea
              placeholder="List thickness, sizing, tolerances, temperature range, chemical composite limits, etc."
              rows={3}
              value={specifications}
              onChange={(e) => setSpecifications(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 py-2 px-3 rounded text-slate-800 text-xs focus:outline-none focus:border-indigo-600 resize-none"
              required
            />
          </div>

          {/* Media Attachments */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Product Visual Image</label>
              <div className="flex items-center gap-3">
                {imagePreview ? (
                  <div className="h-16 w-16 border border-slate-200 rounded-lg overflow-hidden shrink-0 bg-slate-50 relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[9px] font-bold uppercase cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-slate-50 border border-dashed border-slate-200 text-slate-300 rounded-lg flex items-center justify-center shrink-0">
                    <Package className="h-6 w-6" />
                  </div>
                )}
                <label className="flex-1 border border-slate-200 bg-slate-50 hover:bg-slate-100 py-3.5 px-3 rounded-lg text-xxs font-bold text-slate-600 text-center uppercase tracking-wider cursor-pointer transition">
                  Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Datasheet Upload */}
            <div className="space-y-2">
              <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Datasheet Document</label>
              <div className="flex items-center gap-3">
                {datasheetName ? (
                  <div className="flex-1 bg-slate-50 border border-slate-200 px-3 py-3 rounded flex items-center justify-between font-bold text-slate-700">
                    <span className="truncate max-w-[130px] flex items-center gap-1.5"><FileText className="h-4 w-4 text-indigo-400" /> {datasheetName}</span>
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
                  <div className="h-16 w-16 bg-slate-50 border border-dashed border-slate-200 text-slate-300 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="h-6 w-6" />
                  </div>
                )}
                <label className="flex-1 border border-slate-200 bg-slate-50 hover:bg-slate-100 py-3.5 px-3 rounded-lg text-xxs font-bold text-slate-600 text-center uppercase tracking-wider cursor-pointer transition">
                  Choose Datasheet
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleDatasheetChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Form Action */}
          <div className="border-t border-slate-200 pt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/portal/supplier/products")}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-bold uppercase text-xxs tracking-wider rounded-lg hover:bg-slate-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-blue-700 hover:bg-blue-600 text-white font-bold uppercase text-xxs tracking-wider rounded-lg shadow-lg shadow-blue-700/20 hover:shadow-blue-700/30 transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Submitting Proposal...</span>
                </>
              ) : (
                <span>Submit Proposal</span>
              )}
            </button>
          </div>

        </form>
      </div>

    </div>
  );
}
