"use client";

export function ScopeTag({ local }: { local: boolean }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold leading-none ${local ? "bg-[#ffe25c] text-ink" : "bg-cobalt text-white"}`}>
      {local ? "Local" : "International"}
    </span>
  );
}

export function Flag({ code, className = "" }: { code: string; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/flags/${code}.svg`} alt="" className={`object-cover ${className}`} />;
}
