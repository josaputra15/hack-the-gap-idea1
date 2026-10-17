"use client";
import { create } from "zustand";
import { motion, AnimatePresence } from "motion/react";

const useToast = create<{ msg: string; n: number }>(() => ({ msg: "", n: 0 }));
let timer: ReturnType<typeof setTimeout>;
export function toast(msg: string) {
  useToast.setState((s) => ({ msg, n: s.n + 1 }));
  clearTimeout(timer);
  timer = setTimeout(() => useToast.setState({ msg: "" }), 2600);
}

export default function Toaster() {
  const { msg, n } = useToast();
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-24 z-[90] flex justify-center px-4">
      <AnimatePresence>
        {msg && (
          <motion.div key={n} initial={{ opacity: 0, y: 16, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-lg)]">
            {msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
