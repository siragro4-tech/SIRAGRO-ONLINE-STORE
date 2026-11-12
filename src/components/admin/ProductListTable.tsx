"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Database } from "@/types/database.types";
import {
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
  initialFilter?: string;
}

export function ProductListTable({
  products,
  categories,
  initialFilter = "all",
}: ProductListTableProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterTab, setFilterTab] = useState(initialFilter);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Optimistic stock edits
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockInputVal, setStockInputVal] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  // Filter products locally for instantaneous filtering
  const filteredProducts = products.filter((p) => {
    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchBrand = p.brand?.toLowerCase().includes(q);
      const matchBarcode = p.barcode?.toLowerCase().includes(q);
      if (!matchName && !matchBrand && !matchBarcode) return false;
    }

    // Category filter
    if (selectedCategory !== "all" && p.category_id !== selectedCategory) {
      return false;
    }

    // Tab filter
    if (filterTab === "low_stock") {
      return p.stock_quantity > 0 && p.stock_quantity <= 10;
    }
    if (filterTab === "out_of_stock") {
      return p.stock_quantity <= 0;
    }
    if (filterTab === "in_stock") {
      return p.stock_quantity > 10;
    }
    if (filterTab === "age_restricted") {
      return p.is_age_restricted;
    }

    return true;
  });

  function startEditingStock(p: ProductRow) {
    setEditingStockId(p.id);
    setStockInputVal(String(p.stock_quantity));
  }

  function handleSaveStock(productId: string) {
    const val = parseInt(stockInputVal, 10);
    if (isNaN(val) || val < 0) {
      setFeedback({ type: "error", text: "Please enter a valid stock quantity (0 or greater)" });
      return;
    }

    startTransition(async () => {
      const res = await quickUpdateStockAction(productId, val);
      setEditingStockId(null);
      if (res.success) {
        setFeedback({ type: "success", text: "Inventory stock level updated." });
      } else {
        setFeedback({ type: "error", text: res.error || "Failed to update stock" });
      }
    });
  }

  function handleToggleStatus(p: ProductRow) {
    startTransition(async () => {
      const res = await toggleProductStatusAction(p.id, p.is_available);
      if (res.success) {
        setFeedback({
          type: "success",
          text: `Product "${p.name}" is now ${p.is_available ? "hidden" : "active in store"}.`,
        });
      } else {
        setFeedback({ type: "error", text: res.error || "Could not update status" });
      }
    });
  }

  function handleDelete(p: ProductRow) {
    if (
      !confirm(
        `Are you sure you want to delete product "${p.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    startTransition(async () => {
      const res = await deleteProductAction(p.id);
      if (res.success) {
        setFeedback({ type: "success", text: `Product "${p.name}" deleted.` });
      } else {
        setFeedback({ type: "error", text: res.error || "Could not delete product" });
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Product Catalogue
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage inventory levels, pricing, off-licence tags, and store availability.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/import"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
          >
            <svg
              className="h-4 w-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
            Bulk CSV Import
          </Link>

          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-xs transition-colors hover:opacity-90"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add New Product
          </Link>
        </div>
      </div>

      {/* Global alert feedback */}
      {feedback && (
        <div
          className={`rounded-lg p-4 text-sm font-medium ${
            feedback.type === "success"
              ? "bg-green-50 text-green-800 border border-green-200"
              : "bg-red-50 text-red-800 border border-red-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* Search, Filter & Tabs bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-xs space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name, brand, barcode..."
              className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>

          {/* Category Dropdown Filter */}
          <div className="w-full sm:w-64">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
            >
              <option value="all">All Aisles &amp; Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tab pills */}
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          {[
            { id: "all", label: `All Products (${products.length})` },
            {
              id: "in_stock",
              label: `In Stock (${products.filter((p) => p.stock_quantity > 10).length})`,
            },
            {
              id: "low_stock",
              label: `Low Stock (${products.filter((p) => p.stock_quantity > 0 && p.stock_quantity <= 10).length})`,
            },
            {
              id: "out_of_stock",
              label: `Out of Stock (${products.filter((p) => p.stock_quantity <= 0).length})`,
            },
            {
              id: "age_restricted",
              label: `Challenge 25 (${products.filter((p) => p.is_age_restricted).length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterTab(tab.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filterTab === tab.id
                  ? "bg-green-700 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
            <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th scope="col" className="px-4 py-3.5">
                  Product
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Category
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Price
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Stock Units
                </th>
                <th scope="col" className="px-4 py-3.5">
                  Status
                </th>
                <th scope="col" className="px-4 py-3.5 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No products matched your search or filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const imgPath = prod.images?.find((i) => i.is_primary)?.storage_path;
                  const displayImg = getProductImageUrl(imgPath);
                  const isLow = prod.stock_quantity > 0 && prod.stock_quantity <= 10;
                  const isOut = prod.stock_quantity <= 0;

                  return (
                    <tr key={prod.id} className="hover:bg-gray-50 transition-colors">
                      {/* Product Name & Image */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={displayImg}
                              alt={prod.name}
                              className="h-full w-full object-contain p-1"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 line-clamp-1">
                              {prod.name}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{prod.brand || "SIRAGRO"}</span>
                              {prod.unit && <span>&bull; {prod.unit}</span>}
                              {prod.barcode && <span className="font-mono text-gray-400">#{prod.barcode}</span>}
                            </div>
                            {prod.is_age_restricted && (
                              <span className="mt-0.5 inline-flex items-center rounded-sm bg-red-100 px-1.5 py-0.2 text-[10px] font-bold text-red-800">
                                Challenge 25 ({prod.minimum_age || 18}+)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3.5 text-gray-600 text-xs font-medium">
                        {prod.category?.name || "Uncategorised"}
                      </td>

                      {/* Price */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className="font-bold text-gray-900">
                          £{prod.price.toFixed(2)}
                        </span>
                        {prod.compare_at_price && prod.compare_at_price > prod.price && (
                          <span className="ml-1.5 text-xs text-gray-400 line-through">
                            £{prod.compare_at_price.toFixed(2)}
                          </span>
                        )}
                      </td>

                      {/* Stock with quick inline editor */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {editingStockId === prod.id ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              value={stockInputVal}
                              onChange={(e) => setStockInputVal(e.target.value)}
                              className="w-16 rounded border border-gray-300 px-1.5 py-0.5 text-xs font-semibold focus:border-green-600 focus:ring-1 focus:ring-green-600"
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveStock(prod.id)}
                              className="rounded bg-green-700 px-2 py-0.5 text-xs font-bold text-white hover:bg-green-800"
                            >
                              ✓
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingStockId(null)}
                              className="rounded bg-gray-200 px-1.5 py-0.5 text-xs text-gray-700 hover:bg-gray-300"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                isOut
                                  ? "bg-red-100 text-red-800"
                                  : isLow
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {prod.stock_quantity} in stock
                            </span>
                            <button
                              type="button"
                              onClick={() => startEditingStock(prod)}
                              className="text-gray-400 hover:text-gray-700"
                              title="Quick edit stock"
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

                      {/* Status */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(prod)}
                          disabled={isPending}
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                            prod.is_available
                              ? "bg-green-100 text-green-800 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                          }`}
                          title="Click to toggle store visibility"
                        >
                          {prod.is_available ? "Active" : "Hidden"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap space-x-2">
                        <Link
                          href={`/admin/products/${prod.id}/edit`}
                          className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(prod)}
                          disabled={isPending}
                          className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

