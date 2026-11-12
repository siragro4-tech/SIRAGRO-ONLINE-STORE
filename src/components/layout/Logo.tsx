import Image from "next/image";

/**
 * SIRAGRO logo — renders the actual circular badge logo.
 * On dark backgrounds (header/footer) the black badge shows clearly
 * within a white circular container.
 */
interface LogoProps {
  /** Size of the logo circle in pixels (square). Default 56. */
  size?: number;
  /** Set to true when logo sits on a dark background — adds white ring. */
  dark?: boolean;
  className?: string;
}

export function Logo({ size = 56, dark = false, className }: LogoProps) {
  return (
    <div
      className={`flex-shrink-0 overflow-hidden rounded-full ${
        dark ? "ring-2 ring-white/20" : ""
      } ${className ?? ""}`}
      style={{
        width: size,
        height: size,
        backgroundColor: "#ffffff",
        boxShadow: dark ? "0 0 0 2px rgba(255,255,255,0.15)" : undefined,
      }}
    >
      <Image
        src="/images/siragro-logo.jpg"
        alt="SIRAGRO Supermarket & Off-Licence"
        width={size}
        height={size}
        className="h-full w-full object-cover"
        priority
      />
    </div>
  );
}
