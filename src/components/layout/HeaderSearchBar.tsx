"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Header search bar — client component so it can read/set the query
 * and navigate to /shop?q=... on submit.
 */
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
      className="flex w-full items-center overflow-hidden rounded-lg border-2 border-transparent bg-white shadow-sm transition-all focus-within:border-green-500"
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search for groceries, drinks, essentials…"
        aria-label="Search SIRAGRO products"
        className="flex-1 bg-transparent px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Submit search"
        className="flex h-full items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--color-primary)" }}
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

