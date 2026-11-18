"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Database } from "@/types/database.types";
import {
  quickUpdatePriceAction,
  quickUpdateStockAction,
  toggleProductStatusAction,
  deleteProductAction,
} from "@/app/admin/products/actions";
import { getProductImageUrl } from "@/lib/product-image";

type ProductRow = Database["public"]["Tables"]["products"]["Row"] & {
  category?: Database["public"]["Tables"]["categories"]["Row"] | null;
  images?: Database["public"]["Tables"]["product_images"]["Row"][];
};

type CategoryOption = Database["public"]["Tables"]["categories"]["Row"];

interface ProductListTableProps {
  products: ProductRow[];
  categories: CategoryOption[];
  counts: {
    all: number;
    in_stock: number;
    low_stock: number;
    out_of_stock: number;
    inactive: number;
    age_restricted: number;
  };
  totalMatching: number;
  currentPage: number;
  totalPages: number;
  pageSize: number;
  initialFilter: string;
  initialCategory: string;
  initialSearch: string;
  initialSort: string;
  loadError?: string | null;
}

export function ProductListTable({
  products,
  categories,
  counts,
  totalMatching,
  currentPage,
  totalPages,
  pageSize,
  initialFilter,
  initialCategory,
  initialSearch,
  initialSort,
  loadError = null,
}: ProductListTableProps) {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Optimistic inline stock & price editing
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockInputVal, setStockInputVal] = useState<string>("");
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceInputVal, setPriceInputVal] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function buildUrl(overrides: {
    page?: number;
    filter?: string;
    category?: string;
    search?: string;
    sort?: string;
  }) {
    const params = new URLSearchParams();
    const p = overrides.page ?? currentPage;
    const f = overrides.filter ?? initialFilter;
    const c = overrides.category ?? initialCategory;
    const q = overrides.search !== undefined ? overrides.search : initialSearch;
    const s = overrides.sort ?? initialSort;

    if (p > 1) params.set("page", String(p));
    if (f && f !== "all") params.set("filter", f);
    if (c && c !== "all") params.set("category", c);
    if (q.trim()) params.set("search", q.trim());
    if (s && s !== "newest") params.set("sort", s);

    const qs = params.toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  }

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(buildUrl({ search: searchInput, page: 1 }));
  }

  function startEditingStock(p: ProductRow) {
    setEditingStockId(p.id);
    setStockInputVal(String(p.stock_quantity));
  }

  function handleSaveStock(productId: string) {
    const val = parseInt(stockInputVal, 10);
    if (isNaN(val) || val < 0) {
      setFeedback({
        type: "error",
        text: "Please enter a valid stock quantity (0 or greater).",
      });
      return;
    }

    startTransition(async () => {
      const res = await quickUpdateStockAction(productId, val);
      setEditingStockId(null);
      if (res.success) {
        setFeedback({ type: "success", text: "Inventory stock level updated." });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          text: res.error || "Failed to update stock.",
        });
      }
    });
  }

  function startEditingPrice(p: ProductRow) {
    setEditingPriceId(p.id);
    setPriceInputVal(Number(p.price).toFixed(2));
  }

  function handleSavePrice(productId: string) {
    const val = parseFloat(priceInputVal);
    if (isNaN(val) || val < 0) {
      setFeedback({
        type: "error",
        text: "Please enter a valid GBP price (0.00 or greater).",
      });
      return;
    }

    startTransition(async () => {
      const res = await quickUpdatePriceAction(productId, val);
      setEditingPriceId(null);
      if (res.success) {
        setFeedback({
          type: "success",
          text: res.message || "Product price updated.",
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          text: res.error || "Failed to update price.",
        });
      }
    });
  }

  function handleToggleStatus(p: ProductRow) {
    startTransition(async () => {
      const res = await toggleProductStatusAction(p.id, p.is_available);
      if (res.success) {
        setFeedback({
          type: "success",
          text: `Product "${p.name}" is now ${p.is_available ? "archived (hidden)" : "active in store"}.`,
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          text: res.error || "Could not update product status.",
        });
      }
    });
  }

  function handleDelete(p: ProductRow) {
    if (
      !confirm(
        `Remove or archive "${p.name}"?\n\nIf this product has past customer orders, it will be safely archived (hidden from store) to protect order history.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteProductAction(p.id);
      if (res.success) {
        setFeedback({
          type: "success",
          text: res.message || `Product "${p.name}" updated.`,
        });
        router.refresh();
      } else {
        setFeedback({
          type: "error",
          text: res.error || "Could not delete or archive product.",
        });
      }
    });
  }

  const fromItem = totalMatching === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const toItem = Math.min(currentPage * pageSize, totalMatching);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[#323C4B] sm:text-3xl">
            Product Catalogue
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Search, sort, paginate, edit images, and manage inventory across your full store catalogue.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/import"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-[#323C4B] hover:bg-slate-50 transition-colors shadow-2xs"
          >
            Bulk CSV Import
          </Link>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#323C4B] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#242c37] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add New Product
          </Link>
        </div>
      </div>

      {/* Explicit Load Error Banner */}
      {loadError && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Unable to load products from database:</strong> {loadError}
        </div>
      )}

      {/* Action Feedback */}
      {feedback && (
        <div
          className={`rounded-xl border p-4 text-sm font-semibold ${feedback.type === "success"
            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
            : "bg-red-50 text-red-800 border-red-200"
            }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Server-Side Search, Category, Sort & Tabs */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12 items-center">
          <form onSubmit={handleSearchSubmit} className="lg:col-span-5 flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, brand, or barcode..."
              className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-sm text-slate-900 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#323C4B] px-4 py-2 text-xs font-bold text-white hover:bg-[#242c37]"
            >
              Search
            </button>
          </form>

          <div className="lg:col-span-3">
            <select
              aria-label="Filter by category"
              value={initialCategory}
              onChange={(e) =>
                router.push(buildUrl({ category: e.target.value, page: 1 }))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
            >
              <option value="all">All Aisles &amp; Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-3">
            <select
              aria-label="Sort products"
              value={initialSort}
              onChange={(e) =>
                router.push(buildUrl({ sort: e.target.value, page: 1 }))
              }
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[#323C4B] focus:outline-none focus:ring-1 focus:ring-[#323C4B]"
            >
              <option value="newest">Sort: Newest Added</option>
              <option value="name_asc">Sort: Name (A–Z)</option>
              <option value="price_asc">Sort: Price (Low to High)</option>
              <option value="price_desc">Sort: Price (High to Low)</option>
              <option value="stock_asc">Sort: Lowest Stock First</option>
              <option value="stock_desc">Sort: Highest Stock First</option>
            </select>
          </div>

          <div className="lg:col-span-1 flex justify-end">
            <Link
              href="/admin/products"
              className="text-xs font-bold text-slate-500 hover:text-[#323C4B] hover:underline"
            >
              Reset
            </Link>
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {[
            { id: "all", label: `All (${counts.all})` },
            { id: "in_stock", label: `In Stock (${counts.in_stock})` },
            { id: "low_stock", label: `Low Stock (${counts.low_stock})` },
            { id: "out_of_stock", label: `Out of Stock (${counts.out_of_stock})` },
            { id: "inactive", label: `Archived/Hidden (${counts.inactive})` },
            { id: "age_restricted", label: `Challenge 25 (${counts.age_restricted})` },
          ].map((tab) => (
            <Link
              key={tab.id}
              href={buildUrl({ filter: tab.id, page: 1 })}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${initialFilter === tab.id
                ? "bg-[#323C4B] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3.5">Product</th>
                <th scope="col" className="px-4 py-3.5">Category</th>
                <th scope="col" className="px-4 py-3.5">Price</th>
                <th scope="col" className="px-4 py-3.5">Stock Units</th>
                <th scope="col" className="px-4 py-3.5">Status</th>
                <th scope="col" className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No products matched your search or filters.
                  </td>
                </tr>
              ) : (
                products.map((prod) => {
                  const imgPath = prod.images?.find((i) => i.is_primary)?.storage_path;
                  const displayImg = getProductImageUrl(imgPath);
                  const threshold = prod.low_stock_threshold ?? 10;
                  const isLow =
                    prod.stock_quantity > 0 && prod.stock_quantity <= threshold;
                  const isOut = prod.stock_quantity <= 0;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={displayImg}
                              alt={prod.name}
                              className="h-full w-full object-contain p-1"
                            />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 line-clamp-1">
                              {prod.name}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span>{prod.brand || "SIRAGRO"}</span>
                              {prod.unit && <span>&bull; {prod.unit}</span>}
                              {prod.barcode && (
                                <span className="font-mono text-slate-400">
                                  #{prod.barcode}
                                </span>
                              )}
                            </div>
                            {prod.is_age_restricted && (
                              <span className="mt-0.5 inline-flex items-center rounded-sm bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-800">
                                Challenge 25 ({prod.minimum_age || 18}+)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 text-xs font-medium">
                        {prod.category?.name || "Uncategorised"}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {editingPriceId === prod.id ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-500">£</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={priceInputVal}
                              onChange={(e) => setPriceInputVal(e.target.value)}
                              aria-label={`Price in GBP for ${prod.name}`}
                              className="w-20 rounded border border-slate-300 px-1.5 py-0.5 text-xs font-semibold focus:border-[#323C4B] focus:ring-1 focus:ring-[#323C4B]"
                            />
                            <button
                              type="button"
                              onClick={() => handleSavePrice(prod.id)}
                              className="rounded bg-[#323C4B] px-2 py-0.5 text-xs font-bold text-white hover:bg-[#242c37]"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingPriceId(null)}
                              className="rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-700 hover:bg-slate-300"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div>
                              <span className="font-bold text-slate-900">
                                £{Number(prod.price).toFixed(2)}
                              </span>
                              {prod.compare_at_price &&
                                prod.compare_at_price > prod.price && (
                                  <span className="ml-1.5 text-xs text-slate-400 line-through">
                                    £{Number(prod.compare_at_price).toFixed(2)}
                                  </span>
                                )}
                            </div>
                            <button
                              type="button"
                              onClick={() => startEditingPrice(prod)}
                              className="text-slate-400 hover:text-[#323C4B]"
                              title="Quick edit price"
                              aria-label={`Edit price for ${prod.name}`}
                            >
                              <svg
                                className="h-3.5 w-3.5"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={2}
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                                />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {editingStockId === prod.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={stockInputVal}
                              onChange={(e) => setStockInputVal(e.target.value)}
                              className="w-16 rounded border border-slate-300 px-1.5 py-0.5 text-xs font-semibold focus:border-[#323C4B] focus:ring-1 focus:ring-[#323C4B]"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveStock(prod.id)}
                              className="rounded bg-[#323C4B] px-2 py-0.5 text-xs font-bold text-white hover:bg-[#242c37]"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStockId(null)}
                              className="rounded bg-slate-200 px-1.5 py-0.5 text-xs text-slate-700 hover:bg-slate-300"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${isOut
                                ? "bg-red-100 text-red-800"
                                : isLow
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-emerald-100 text-emerald-800"
                                }`}
                            >
                              {prod.stock_quantity} in stock
                            </span>
                            <button
                              type="button"
                              onClick={() => startEditingStock(prod)}
                              className="text-slate-400 hover:text-[#323C4B]"
                              title="Quick edit stock"
                              aria-label={`Edit stock for ${prod.name}`}
                            >
                              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(prod)}
                          disabled={isPending}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold transition-colors ${prod.is_available
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                            }`}
                          title="Click to toggle store visibility"
                        >
                          {prod.is_available ? "Active" : "Archived"}
                        </button>
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-2">
                        <Link
                          href={`/admin/products/${prod.id}/edit`}
                          className="rounded-lg border border-slate-300 px-2.5 py-1 text-xs font-semibold text-[#323C4B] hover:bg-slate-100 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(prod)}
                          disabled={isPending}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Server-Side Pagination Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-900">{fromItem}</span> to{" "}
            <span className="font-bold text-slate-900">{toItem}</span> of{" "}
            <span className="font-bold text-slate-900">{totalMatching}</span> matching product(s)
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              {currentPage > 1 ? (
                <Link
                  href={buildUrl({ page: currentPage - 1 })}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-[#323C4B] hover:bg-slate-100"
                >
                  &larr; Previous
                </Link>
              ) : (
                <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400">
                  &larr; Previous
                </span>
              )}

              <span className="text-xs font-semibold text-slate-700">
                Page {currentPage} of {totalPages}
              </span>

              {currentPage < totalPages ? (
                <Link
                  href={buildUrl({ page: currentPage + 1 })}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-[#323C4B] hover:bg-slate-100"
                >
                  Next &rarr;
                </Link>
              ) : (
                <span className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-400">
                  Next &rarr;
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
