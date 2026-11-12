import Link from "next/link";

export default function NotFound() {
  const popularAisles = [
    { name: "Fresh Produce", slug: "fresh-produce", emoji: "🥦" },
    { name: "Dairy & Eggs", slug: "dairy-eggs", emoji: "🥛" },
    { name: "Bakery", slug: "bakery", emoji: "🍞" },
    { name: "Drinks & Off-Licence", slug: "drinks-off-licence", emoji: "🍷" },
  ];

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
      {/* 404 Badge */}
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#323C4B] text-white shadow-xl mb-6">
        <span className="text-3xl font-black">404</span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-black text-[#323C4B] tracking-tight">
        Aisle Not Found
      </h1>
      <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-md mx-auto leading-relaxed">
        We couldn&apos;t find the grocery page or item you were looking for. It may have been moved or is currently out of stock.
      </p>

      {/* Action Buttons */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-sm">
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[#323C4B] hover:bg-[#242c37] px-6 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:scale-105 active:scale-95"
        >
          Return to Storefront
        </Link>
        <Link
          href="/shop"
          className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border-2 border-[#323C4B] bg-white hover:bg-slate-50 px-6 py-3 text-sm font-bold text-[#323C4B] shadow-sm transition-all"
        >
          Browse All Groceries
        </Link>
      </div>

      {/* Quick Aisle Shortcuts */}
      <div className="mt-12 pt-8 border-t border-slate-200 w-full max-w-lg">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">
          Or jump straight to an aisle:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {popularAisles.map((aisle) => (
            <Link
              key={aisle.slug}
              href={`/category/${aisle.slug}`}
              className="flex flex-col items-center gap-1 p-3 rounded-xl border border-slate-200 bg-white hover:border-[#323C4B] hover:shadow-sm transition-all text-xs font-bold text-slate-800"
            >
              <span className="text-xl">{aisle.emoji}</span>
              <span>{aisle.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
