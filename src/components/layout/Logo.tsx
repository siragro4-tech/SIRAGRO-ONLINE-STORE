/**
 * SIRAGRO logo mark.
 *
 * A simple, original SVG leaf-basket icon representing
 * a local grocery store. This is a placeholder —
 * replace with your actual brand logo when ready.
 */
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      {/* Basket shape */}
      <path
        d="M6 14h20l-2.5 12a2 2 0 0 1-2 1.6H10.5a2 2 0 0 1-2-1.6L6 14Z"
        fill="var(--color-primary)"
        opacity={0.9}
      />
      {/* Basket handle */}
      <path
        d="M11 14V9a5 5 0 0 1 10 0v5"
        stroke="var(--color-primary-dark)"
        strokeWidth={2}
        strokeLinecap="round"
        fill="none"
      />
      {/* Leaf accent */}
      <path
        d="M16 4c2-2 5-2 6 0s-1 5-4 6c-1.5.5-2-1-2-3s0-3 0-3Z"
        fill="var(--color-accent)"
        opacity={0.85}
      />
    </svg>
  );
}

