"use client";

import { useState } from "react";
import Link from "next/link";
import { parseCSV } from "@/lib/csv";
import {
  importProductsCsvAction,
  type ImportResult,
} from "@/app/admin/import/actions";

const SAMPLE_CSV_HEADER =
  "name,slug,category_slug,price,compare_at_price,unit,stock_quantity,is_available,is_age_restricted,minimum_age,barcode,brand,description,image_url";

const SAMPLE_CSV_ROWS = [
  'Royal Gala Apples 6pk,royal-gala-apples-6pk,fresh-produce,1.85,2.10,Pack of 6,50,true,false,18,5012345678901,Farm Fresh,"Crisp and sweet gala apples fresh from British orchards.",https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6',
  'British Whole Milk 2L,british-whole-milk-2l,dairy-eggs,1.75,,2 Litres,35,true,false,18,5012345678902,Dairy Crest,"Fresh pasteurised British whole milk rich in calcium.",https://images.unsplash.com/photo-1550583724-b2692b85b150',
  'Premium Indian Pale Ale 4x440ml,premium-ipa-4x440ml,off-licence-beverages,5.49,6.00,4x440ml Cans,24,true,true,18,5012345678903,Brewers Guild,"Smooth golden IPA with aromatic citrus notes. Challenge 25 applies.",https://images.unsplash.com/photo-1535958636474-b021ee887b13',
  'Pure Basmati Rice 5kg,pure-basmati-rice-5kg,cupboard-groceries,8.99,9.99,5kg Bag,18,true,false,18,5012345678904,Kohinoor,"Finest naturally aged fragrant basmati long grain rice.",',
].join("\n");

export function CsvImportTool() {
  const [csvContent, setCsvContent] = useState("");
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);

  function downloadSampleCsv() {
    const fullContent = `${SAMPLE_CSV_HEADER}\n${SAMPLE_CSV_ROWS}`;
    const blob = new Blob([fullContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "siragro-products-template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || "";
      setCsvContent(text);
      updatePreview(text);
    };
    reader.readAsText(file);
  }

  function handlePasteChange(text: string) {
    setCsvContent(text);
    updatePreview(text);
  }

  function updatePreview(raw: string) {
    if (!raw.trim()) {
      setPreviewRows([]);
      return;
    }
    const parsed = parseCSV(raw);
    setPreviewRows(parsed.slice(0, 6)); // Preview up to first 6 rows
  }

  async function handleImport() {
    if (!csvContent.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await importProductsCsvAction(csvContent);
      setResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Import failed";
      setResult({
        success: false,
        totalParsed: 0,
        importedCount: 0,
        updatedCount: 0,
        errors: [{ row: 0, name: "System", error: msg }],
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Bulk Product CSV Import
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Rapidly import or bulk update hundreds of supermarket products, inventory counts, and prices.
          </p>
        </div>

        <button
          type="button"
          onClick={downloadSampleCsv}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors shadow-xs"
        >
          <svg
            className="h-4 w-4 text-green-700"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Download CSV Template
        </button>
      </div>

      {/* Guide notice */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5 text-sm text-blue-900">
        <h2 className="font-bold flex items-center gap-2 text-blue-950">
          <svg
            className="h-5 w-5 text-blue-700"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
            />
          </svg>
          How Bulk Import Works
        </h2>
        <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-blue-800">
          <li>
            <strong>Automatic Matching:</strong> If a product with the same <code>slug</code> already exists, its price, stock quantity, and details are updated.
          </li>
          <li>
            <strong>Category Assignment:</strong> Specify <code>category_slug</code> (e.g. <code>fresh-produce</code>, <code>dairy-eggs</code>, <code>off-licence-beverages</code>).
          </li>
          <li>
            <strong>Challenge 25:</strong> Set <code>is_age_restricted</code> to <code>true</code> for alcoholic beverages to automatically trigger ID checks.
          </li>
        </ul>
      </div>

      {/* Upload Interface */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-xs space-y-6">
        {/* Tab switcher */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => setActiveTab("file")}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "file"
                ? "border-green-700 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Upload .CSV File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("paste")}
            className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
              activeTab === "paste"
                ? "border-green-700 text-green-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Paste CSV Text
          </button>
        </div>

        {activeTab === "file" ? (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
              Select CSV File from Computer
            </label>
            <div className="flex justify-center rounded-xl border border-dashed border-gray-300 px-6 py-10 bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
                <div className="mt-4 flex text-sm text-gray-600 justify-center">
                  <label className="relative cursor-pointer rounded-md font-semibold text-green-700 hover:text-green-800 focus-within:outline-none">
                    <span>Click to browse</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleFileSelected}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">UTF-8 Comma-separated values (.csv)</p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-700 mb-2">
              Paste Raw CSV Content
            </label>
            <textarea
              rows={8}
              value={csvContent}
              onChange={(e) => handlePasteChange(e.target.value)}
              placeholder={`${SAMPLE_CSV_HEADER}\n${SAMPLE_CSV_ROWS}`}
              className="w-full rounded-lg border border-gray-300 p-3 font-mono text-xs text-gray-900 focus:border-green-600 focus:ring-1 focus:ring-green-600"
            />
          </div>
        )}

        {/* Live Preview of parsed rows */}
        {previewRows.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Preview ({previewRows.length - 1} rows parsed)
              </h3>
              <span className="text-xs text-gray-500">Showing first 5 data rows</span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-gray-50 text-gray-600 font-semibold">
                  <tr>
                    {previewRows[0].slice(0, 6).map((col, idx) => (
                      <th key={idx} className="px-3 py-2 text-left">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {previewRows.slice(1).map((row, rIdx) => (
                    <tr key={rIdx}>
                      {row.slice(0, 6).map((cell, cIdx) => (
                        <td key={cIdx} className="px-3 py-2 text-gray-700 whitespace-nowrap">
                          {cell || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <Link
            href="/admin/products"
            className="text-xs font-semibold text-gray-600 hover:underline"
          >
            &larr; Back to Products
          </Link>

          <button
            type="button"
            onClick={handleImport}
            disabled={loading || !csvContent.trim()}
            className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8z"
                  />
                </svg>
                Processing Import...
              </>
            ) : (
              "Confirm & Import Products"
            )}
          </button>
        </div>
      </div>

      {/* Outcome / Result Banner */}
      {result && (
        <div
          className={`rounded-xl border p-6 shadow-xs space-y-4 ${
            result.errors.length === 0
              ? "border-green-200 bg-green-50/50"
              : "border-amber-200 bg-amber-50/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-gray-900">
              {result.errors.length === 0 ? "Import Completed Successfully" : "Import Completed with Notices"}
            </h3>
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                result.errors.length === 0
                  ? "bg-green-100 text-green-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {result.importedCount + result.updatedCount} Successful
            </span>
          </div>

          <p className="text-sm text-gray-700">{result.message}</p>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-white p-3 border border-gray-200">
              <div className="text-xs text-gray-500 font-semibold uppercase">Created</div>
              <div className="text-2xl font-black text-green-700">{result.importedCount}</div>
            </div>
            <div className="rounded-lg bg-white p-3 border border-gray-200">
              <div className="text-xs text-gray-500 font-semibold uppercase">Updated</div>
              <div className="text-2xl font-black text-blue-700">{result.updatedCount}</div>
            </div>
            <div className="rounded-lg bg-white p-3 border border-gray-200">
              <div className="text-xs text-gray-500 font-semibold uppercase">Failed</div>
              <div className="text-2xl font-black text-red-700">{result.errors.length}</div>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="mt-4 rounded-lg border border-red-200 bg-white p-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-red-800 mb-2">
                Rows Requiring Attention ({result.errors.length})
              </h4>
              <ul className="divide-y divide-gray-100 text-xs">
                {result.errors.map((err, idx) => (
                  <li key={idx} className="py-2 flex justify-between">
                    <span className="font-semibold text-gray-800">
                      Row {err.row}: {err.name}
                    </span>
                    <span className="text-red-600">{err.error}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="pt-2 flex justify-end">
            <Link
              href="/admin/products"
              className="rounded-lg bg-green-700 px-4 py-2 text-xs font-bold text-white hover:bg-green-800 transition-colors"
            >
              View Updated Products &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

