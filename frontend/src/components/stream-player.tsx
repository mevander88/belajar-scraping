"use client";

import { useState } from "react";
import type { Stream } from "@/lib/types";

export function StreamPlayer({ streams, title }: { streams: Stream[]; title: string }) {
  const [selected, setSelected] = useState(0);
  if (!streams.length) return <div className="grid aspect-video place-items-center bg-ink px-6 text-center text-paper"><p>Video streaming belum tersedia.</p></div>;
  const stream = streams[selected];
  return (
    <div>
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="eyebrow text-muted">Pilih server video</p>
        <div className="flex flex-wrap gap-2" aria-label="Pilih server video">{streams.map((item, index) => <button key={`${item.url}-${index}`} type="button" onClick={() => setSelected(index)} aria-pressed={selected === index} className={`min-h-11 border px-4 py-2 text-sm font-bold ${selected === index ? "border-ink bg-ink text-paper" : "border-rule hover:border-ink"}`}>{item.provider || `Server ${index + 1}`}</button>)}</div>
      </div>
      <div className="aspect-video overflow-hidden bg-ink"><iframe key={stream.url} src={stream.url} title={`${title} — ${stream.provider || `Server ${selected + 1}`}`} className="h-full w-full" allowFullScreen referrerPolicy="no-referrer" /></div>
      <p className="mt-3 text-sm text-muted">Jika video tidak tampil, coba server lain yang tersedia.</p>
    </div>
  );
}
