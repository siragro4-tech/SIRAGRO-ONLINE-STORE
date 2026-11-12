"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HeaderSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex w-full items-center overflow-hidden rounded-lg bg-white shadow-sm border border-slate-300 focus-within:border-white focus-within:ring-2 focus-within:ring-white"
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search groceries, drinks, fresh fruit, vegetables, frozen foods…"
        aria-label="Search SIRAGRO products"
        className="flex-1 bg-transparent px-4 py-2.5 text-sm text-[#323C4B] placeholder:text-slate-400 focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Submit search"
        className="flex h-full items-center gap-1.5 px-5 py-2.5 text-sm font-bold bg-[#323C4B] text-white hover:bg-[#242c37] transition-colors"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <span className="hidden sm:inline">Search</span>
      </button>
    </form>
  );
}
