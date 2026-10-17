"use client";
import { useState } from "react";

export default function ClearData() {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => { try { localStorage.removeItem("pinwire-user"); } catch {} setDone(true); }}
      className="mt-2 min-h-11 rounded-full border border-line bg-surface px-5 font-semibold hover:bg-paper"
    >
      {done ? "Your data on this device was deleted" : "Delete my data on this device"}
    </button>
  );
}
