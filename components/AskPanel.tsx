"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNav } from "@/lib/store";
import { DEMO_ASKS, type Pulse } from "@/lib/pulse";
import { useDialog } from "./useDialog";
import { PulseView } from "./Pulse";

export default function AskPanel() {
  const ask = useNav((s) => s.ask);
  const go = useNav((s) => s.go);
  const open = !!ask;
  const close = () => go({ ask: undefined });
  const ref = useDialog<HTMLDivElement>(open, close);
  const [draft, setDraft] = useState(ask ?? "");
  const [box, setBox] = useState<{ q: string; pulse: Pulse } | null>(null);
  const [error, setError] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => { if (ask) setDraft(ask); }, [ask]);

  useEffect(() => {
    if (!open) return;
    ref.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, [open, ref]);

  useEffect(() => {
    if (!ask) return;
    let cancel = false;
    setError(false);
    fetch(`/api/pulse?q=${encodeURIComponent(ask)}`)
      .then(async (r) => { if (!r.ok) throw new Error(); return r.json() as Promise<Pulse>; })
      .then((p) => { if (!cancel) setBox({ q: ask, pulse: p }); })
      .catch(() => { if (!cancel) setError(true); });
    return () => { cancel = true; };
  }, [ask]);

  const pulse = ask && box?.q === ask ? box.pulse : null;
  const loading = !!ask && !error && !pulse;

  const submit = (value: string) => {
    const next = value.trim();
    if (!next || next === ask) return;
    go({ ask: next });
  };

  return (
    <AnimatePresence>
      {open && ask && (
        <motion.div
          ref={ref}
          data-dialog
          role="dialog"
          aria-modal="true"
          aria-labelledby="ask-title"
          initial={reduced ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: 24 }}
          transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 30 }}
          className="fixed inset-0 z-[70] flex flex-col overflow-hidden bg-paper"
        >
          <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col overflow-y-auto px-5 py-6 md:px-8 md:py-10">
            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={close} className="inline-flex h-11 items-center gap-2 rounded-full border border-line bg-surface px-4 text-sm font-semibold hover:bg-paper">
                <ArrowLeft className="size-4" aria-hidden="true" />Back
              </button>
            </div>
            <h2 id="ask-title" className="mt-6 font-display text-4xl font-bold md:text-5xl">What people say</h2>
            <form
              className="mt-5"
              onSubmit={(e) => { e.preventDefault(); submit(draft); }}
            >
              <label htmlFor="ask-q" className="sr-only">Ask what people are saying</label>
              <div className="relative">
                <Sparkles className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-cobalt" aria-hidden="true" />
                <input
                  id="ask-q"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value.slice(0, 200))}
                  placeholder="Ask what people are saying…"
                  className="h-14 w-full rounded-full border border-line bg-surface pl-12 pr-4 text-lg placeholder:text-muted focus:border-ink focus:outline-none"
                />
              </div>
            </form>
            <div className="mt-3 flex flex-wrap gap-2">
              {DEMO_ASKS.map((q) => (
                <button key={q} type="button" onClick={() => submit(q)} className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-left text-sm font-semibold hover:bg-paper">
                  {q}
                </button>
              ))}
            </div>

            <div className="mt-8">
              {error ? (
                <p className="rounded-3xl border border-line bg-surface p-6 text-sm">This snapshot didn’t load. Try another question.</p>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${ask}-${loading ? "loading" : "ready"}`}
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.28 }}
                  >
                    <PulseView pulse={pulse} loading={loading} query={ask} onAsk={submit} />
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
