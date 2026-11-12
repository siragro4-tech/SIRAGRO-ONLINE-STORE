import Link from "next/link";

/**
 * Site-wide footer.
 *
 * Contains useful navigation links, contact info,
 * and legal page links.
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: "var(--color-bg-muted)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1 — Brand */}
          <div>
            <h2
              className="text-lg font-bold"
              style={{ color: "var(--color-primary-dark)" }}
            >
              SIRAGRO
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Your local grocery and off-licence store, now online.
              Serving the UB3 area with delivery and collection.
            </p>
          </div>

          {/* Column 2 — Shop */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Shop
            </h3>
            <ul className="mt-3 space-y-2">
              <FooterLink href="/shop">All Products</FooterLink>
              <FooterLink href="/shop?category=fresh-produce">
                Fresh Produce
              </FooterLink>
              <FooterLink href="/shop?category=drinks">Drinks</FooterLink>
              <FooterLink href="/shop?category=dairy">
                Dairy &amp; Eggs
              </FooterLink>
            </ul>
          </div>

          {/* Column 3 — Help */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Help
            </h3>
            <ul className="mt-3 space-y-2">
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/contact">Contact Us</FooterLink>
              <FooterLink href="/delivery-info">Delivery Info</FooterLink>
            </ul>
          </div>

          {/* Column 4 — Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider">
              Legal
            </h3>
            <ul className="mt-3 space-y-2">
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/terms">Terms &amp; Conditions</FooterLink>
              <FooterLink href="/cookies">Cookie Policy</FooterLink>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-10 border-t pt-6 text-center text-sm"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-muted)",
          }}
        >
          <p>&copy; {currentYear} SIRAGRO. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

/** Small helper for consistent footer link styling. */
function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="text-sm transition-colors hover:underline"
        style={{ color: "var(--color-text-muted)" }}
      >
        {children}
      </Link>
    </li>
  );
}

