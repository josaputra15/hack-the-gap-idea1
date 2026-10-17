import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-[720px] px-5 py-10 md:py-16 [&_h2]:mt-10 [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_p]:text-[17px] [&_p]:leading-[1.75] [&_li]:text-[17px] [&_li]:leading-[1.75] [&_ul]:list-disc [&_ul]:pl-6 [&_a]:text-cobalt [&_a]:underline">
      <Link href="/" className="!no-underline mb-8 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold !text-ink hover:bg-paper">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to the map
      </Link>
      <h1 className="font-display text-5xl font-bold leading-none md:text-6xl">{title}</h1>
      <p className="mt-3 !text-sm text-muted">Last updated: {updated}</p>
      <div className="mt-6">{children}</div>
      <nav aria-label="Legal" className="mt-14 flex gap-4 border-t border-line pt-5 text-sm">
        <Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/accessibility">Accessibility</Link>
      </nav>
    </main>
  );
}

export function Callout({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border-l-4 border-mark bg-[#fffbe8] p-5 [&_p]:m-0">{children}</div>;
}
