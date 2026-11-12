"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Database } from "@/types/database.types";
import {
  createProductAction,
  updateProductAction,
} from "@/app/admin/products/actions";
import { getProductImageUrl } from "@/lib/product-image";

type ProductRow = Database["public"]["Tables"]["products"]["Row"] & {
  category?: Database["public"]["Tables"]["categories"]["Row"] | null;
  images?: Database["public"]["Tables"]["product_images"]["Row"][];
};

type CategoryOption = Database["public"]["Tables"]["categories"]["Row"];

interface ProductFormProps {
  initialProduct?: ProductRow | null;
  categories: CategoryOption[];
}

export function ProductForm({ initialProduct, categories }: ProductFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialProduct);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form field states
  const [name, setName] = useState(initialProduct?.name || "");
  const [slug, setSlug] = useState(initialProduct?.slug || "");
  const [categoryId, setCategoryId] = useState(initialProduct?.category_id || "");
  const [brand, setBrand] = useState(initialProduct?.brand || "");
  const [price, setPrice] = useState(initialProduct?.price !== undefined ? String(initialProduct.price) : "");
  const [compareAtPrice, setCompareAtPrice] = useState(
    initialProduct?.compare_at_price ? String(initialProduct.compare_at_price) : ""
  );
  const [unit, setUnit] = useState(initialProduct?.unit || "");
  const [stockQuantity, setStockQuantity] = useState(
    initialProduct?.stock_quantity !== undefined ? String(initialProduct.stock_quantity) : "10"
  );
  const [barcode, setBarcode] = useState(initialProduct?.barcode || "");
  const [weightKg, setWeightKg] = useState(
    initialProduct?.weight_kg ? String(initialProduct.weight_kg) : ""
  );
  const [isAvailable, setIsAvailable] = useState(initialProduct?.is_available ?? true);
  const [isAgeRestricted, setIsAgeRestricted] = useState(initialProduct?.is_age_restricted ?? false);
  const [minimumAge, setMinimumAge] = useState(
    initialProduct?.minimum_age ? String(initialProduct.minimum_age) : "18"
  );
  const [description, setDescription] = useState(initialProduct?.description || "");
  const [seoTitle, setSeoTitle] = useState(initialProduct?.seo_title || "");
  const [seoDescription, setSeoDescription] = useState(initialProduct?.seo_description || "");

  // Image states
  const existingPrimaryImage = initialProduct?.images?.find((img) => img.is_primary)?.storage_path;
  const [imageUrl, setImageUrl] = useState(existingPrimaryImage || "");
  const [previewUrl, setPreviewUrl] = useState(
    existingPrimaryImage ? getProductImageUrl(existingPrimaryImage) : ""
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  function handleNameChange(val: string) {
    setName(val);
    if (!isEditing) {
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
      setSlug(generatedSlug);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  }

  function handleUrlChange(url: string) {
    setImageUrl(url);
    if (!selectedFile) {
      setPreviewUrl(url ? getProductImageUrl(url) : "");
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("slug", slug);
    formData.append("category_id", categoryId);
    formData.append("brand", brand);
    formData.append("price", price);
    formData.append("compare_at_price", compareAtPrice);
    formData.append("unit", unit);
    formData.append("stock_quantity", stockQuantity);
    formData.append("barcode", barcode);
    formData.append("weight_kg", weightKg);
    formData.append("is_available", isAvailable ? "true" : "false");
    formData.append("is_age_restricted", isAgeRestricted ? "true" : "false");
    formData.append("minimum_age", minimumAge);
    formData.append("description", description);
    formData.append("seo_title", seoTitle);
    formData.append("seo_description", seoDescription);
    formData.append("image_url", imageUrl);

    if (selectedFile) {
      formData.append("image_file", selectedFile);
    }

    try {
      const res = isEditing && initialProduct
        ? await updateProductAction(initialProduct.id, formData)
        : await createProductAction(formData);

      if (!res.success) {
        setErrorMessage(res.error || "Failed to save product");
        setLoading(false);
        return;
      }

      setSuccessMessage(res.message || "Product saved successfully");
      setTimeout(() => {
        router.push("/admin/products");
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setErrorMessage(msg);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl">
      {/* Top action header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {isEditing ? `Edit Product: ${initialProduct?.name}` : "Add New Supermarket Product"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Fill in product specifications, pricing, stock levels, and Challenge 25 age restrictions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {loading ? "Saving..." : isEditing ? "Update Product" : "Publish Product"}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          {errorMessage}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-800">
          {successMessage}
        </div>
      )}

      {/* Basic Information Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-5">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
          1. General Information
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Crisp Red Gala Apples 6pk, British Whole Milk 2L"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              URL Slug *
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="e.g. crisp-red-gala-apples-6pk"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Aisle / Category *
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
            >
              <option value="">-- Select Supermarket Category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Brand / Producer
            </label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Farm Fresh, SIRAGRO, Cravendale"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Barcode / EAN
            </label>
            <input
              type="text"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              placeholder="e.g. 5012345678901"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed ingredients, flavour notes, serving suggestions or storage guidance..."
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>
        </div>
      </div>

      {/* Pricing & Inventory Section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-5">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
          2. Pricing &amp; Inventory Management
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Selling Price (£) *
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500 font-bold">
                £
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1.99"
                className="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm font-semibold text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              RRP / Compare At Price (£)
            </label>
            <div className="relative mt-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm text-gray-500 font-bold">
                £
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={compareAtPrice}
                onChange={(e) => setCompareAtPrice(e.target.value)}
                placeholder="2.49 (optional discount)"
                className="block w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Pack Size / Unit *
            </label>
            <input
              type="text"
              required
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. 1kg, 500g, 2L, Pack of 6"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Stock Quantity *
            </label>
            <input
              type="number"
              min="0"
              required
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              placeholder="e.g. 50"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              Weight (kg)
            </label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="e.g. 0.650"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-900">
                Active &amp; Available in Store
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Challenge 25 & Regulatory Section */}
      <div className="rounded-xl border border-red-200 bg-red-50/30 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-red-100 pb-3">
          <div className="flex items-center gap-2 text-red-800">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z"
              />
            </svg>
            <h2 className="text-base font-bold text-gray-900">
              3. Licensing &amp; Challenge 25 Age Restriction
            </h2>
          </div>
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-800">
            Licensing Act 2003
          </span>
        </div>

        <div className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isAgeRestricted}
              onChange={(e) => setIsAgeRestricted(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <div>
              <span className="text-sm font-bold text-gray-900">
                This is an age-restricted off-licence or restricted product (e.g. Alcohol, Tobacco)
              </span>
              <p className="text-xs text-gray-600">
                When checked, the website automatically flags this item for Challenge 25. The checkout
                will require customer age declaration, and the delivery manifest will instruct the
                courier to verify physical photo ID before handover.
              </p>
            </div>
          </label>

          {isAgeRestricted && (
            <div className="pt-2 pl-7 flex items-center gap-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-700">
                Minimum Legal Age:
              </label>
              <select
                value={minimumAge}
                onChange={(e) => setMinimumAge(e.target.value)}
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 focus:border-red-600 focus:ring-1 focus:ring-red-600"
              >
                <option value="18">18+ (Alcohol, Spirits, Beer, Wine)</option>
                <option value="16">16+ (Lottery / Energy Drinks)</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Image Upload & Media */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-5">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
          4. Product Image
        </h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                Upload Image File
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
              />
              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG or WebP. Auto-uploaded to Supabase Storage bucket <code>product-images</code>.
              </p>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-3 text-xs text-gray-400 font-semibold uppercase">Or Image URL</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
                External Image URL
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/images/apple.jpg"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
              />
            </div>
          </div>

          {/* Live Preview */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 p-4 bg-gray-50/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">
              Image Preview
            </span>
            <div className="relative h-40 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white flex items-center justify-center shadow-xs">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt={name || "Product preview"}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <div className="text-center p-3 text-gray-400 text-xs">
                  No image selected
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SEO / Meta fields (Optional) */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-5">
        <h2 className="text-base font-semibold text-gray-900 border-b border-gray-100 pb-3">
          5. Search Engine Optimization (SEO)
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              SEO Title
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              placeholder="e.g. Crisp Red Gala Apples 6pk | SIRAGRO Groceries"
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700">
              SEO Meta Description
            </label>
            <textarea
              rows={2}
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              placeholder="Order online with same-day local home delivery near Hayes UB3..."
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>
        </div>
      </div>

      {/* Bottom Save Bar */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
        <Link
          href="/admin/products"
          className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--color-primary)" }}
        >
          {loading ? "Saving Product..." : isEditing ? "Save Changes" : "Create Product"}
        </button>
      </div>
    </form>
  );
}

