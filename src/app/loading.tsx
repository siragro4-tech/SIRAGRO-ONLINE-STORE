export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16" aria-busy="true" aria-label="Loading page content">
      <div className="relative flex items-center justify-center">
        {/* Outer pulsing ring */}
        <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-[#323C4B] animate-spin" />
        {/* Inner icon */}
        <div className="absolute w-8 h-8 rounded-full bg-[#323C4B] flex items-center justify-center text-white text-[10px] font-black">
          S
        </div>
      </div>
      <p className="mt-4 text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
        Loading SIRAGRO...
      </p>
    </div>
  );
}

