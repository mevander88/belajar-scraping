"use client";

import { useMemo, useRef, useState } from "react";
import type { StreamServer } from "@/lib/types";
import { Icon } from "./icon";

type Props = { servers: StreamServer[]; slug: string; title: string };

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}

export function StreamPlayer({ servers, slug, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const supportedServers = useMemo(() => servers.filter((server) => server.supported), [servers]);
  const initialServer = useMemo(
    () => supportedServers.find((server) => server.default) ?? supportedServers[0],
    [supportedServers],
  );
  const [selectedID, setSelectedID] = useState(initialServer?.id ?? "");
  const autoPlayPendingRef = useRef(Boolean(initialServer));
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(initialServer ? "loading" : "idle");
  const [hasLoaded, setHasLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const streamURL = selectedID ? `/api/stream/${encodeURIComponent(slug)}/${encodeURIComponent(selectedID)}` : "";

  const chooseServer = (server: StreamServer) => {
    if (!server.supported) return;
    setSelectedID(server.id);
    autoPlayPendingRef.current = true;
    setStatus("loading");
    setHasLoaded(false);
    setMessage("");
    setFailed(false);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) { video.pause(); return; }
    try { await video.play(); }
    catch { setMessage("Video belum dapat diputar. Coba lagi atau pilih server lain."); }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await playerRef.current?.requestFullscreen();
    else await document.exitFullscreen();
  };

  const startWhenReady = async (video: HTMLVideoElement) => {
    setStatus("ready");
    setHasLoaded(true);
    if (!autoPlayPendingRef.current) return;
    autoPlayPendingRef.current = false;

    try {
      await video.play();
    } catch {
      video.muted = true;
      setMuted(true);
      try {
        await video.play();
      } catch {
        setMessage("Video siap diputar. Tekan tombol Putar untuk memulai.");
      }
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || event.target instanceof HTMLButtonElement || event.target instanceof HTMLInputElement) return;
    if (event.key === " " || event.key.toLowerCase() === "k") { event.preventDefault(); void togglePlayback(); }
    if (event.key === "ArrowLeft") video.currentTime = Math.max(0, video.currentTime - 10);
    if (event.key === "ArrowRight") video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
    if (event.key.toLowerCase() === "m") { video.muted = !video.muted; setMuted(video.muted); }
    if (event.key.toLowerCase() === "f") void toggleFullscreen();
  };

  if (!supportedServers.length) {
    return <div className="grid aspect-video place-items-center rounded-xl border border-border bg-black px-6 text-center text-foreground"><p>Video streaming belum tersedia.</p></div>;
  }

  return (
    <section aria-label={`Pemutar ${title}`}>
      <div className="mb-3 flex flex-col gap-2 rounded-xl border border-border bg-surface p-3 sm:p-4 md:flex-row md:items-center md:justify-between md:gap-4">
        <div>
          <p className="kicker">Kualitas dan server</p>
          <p className="mt-1 text-xs text-secondary md:text-sm">Pilih alternatif jika video gagal dimuat.</p>
        </div>
        <div className="w-full md:max-w-sm">
          <label htmlFor="stream-server" className="sr-only">Pilih kualitas dan server video</label>
          <select
            id="stream-server"
            value={selectedID}
            onChange={(event) => {
              const server = supportedServers.find((item) => item.id === event.target.value);
              if (server) chooseServer(server);
            }}
            className="min-h-11 w-full cursor-pointer rounded-lg border border-border bg-elevated px-3 py-2 text-sm font-semibold text-foreground outline-none transition-colors hover:bg-hover focus:border-focus disabled:cursor-not-allowed disabled:opacity-60"
          >
            {!selectedID && <option value="">Pilih server yang tersedia</option>}
            {supportedServers.map((server) => (
              <option key={server.id} value={server.id}>
                {server.quality} · {server.provider}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div ref={playerRef} tabIndex={0} onKeyDown={handleKeyDown} aria-busy={status === "loading" && !hasLoaded} className="group relative aspect-video overflow-hidden rounded-xl border border-border bg-black text-white focus-visible:outline-offset-4">
        {streamURL && !failed ? (
          <video
            key={streamURL}
            ref={videoRef}
            className="h-full w-full"
            preload="metadata"
            playsInline
            muted={muted}
            src={streamURL}
            aria-label={title}
            onLoadStart={() => setStatus("loading")}
            onCanPlay={(event) => { void startWhenReady(event.currentTarget); }}
            onPlaying={() => { setPlaying(true); setStatus("ready"); setHasLoaded(true); setMessage(""); }}
            onPause={() => setPlaying(false)}
            onWaiting={() => setStatus("loading")}
            onStalled={() => setStatus("loading")}
            onSeeking={() => setStatus("loading")}
            onSeeked={(event) => { if (event.currentTarget.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) setStatus("ready"); }}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onDurationChange={(event) => setDuration(event.currentTarget.duration)}
            onVolumeChange={(event) => { setMuted(event.currentTarget.muted); setVolume(event.currentTarget.volume); }}
            onError={() => { autoPlayPendingRef.current = false; setFailed(true); setHasLoaded(false); setStatus("error"); setMessage(supportedServers.length > 1 ? "Berkas video tidak dapat diputar. Coba server lain." : "Berkas video tidak dapat diputar. Coba lagi."); }}
          />
        ) : (
          <div className="grid h-full place-items-center px-6 text-center">
            <div>
              <p className="text-lg font-semibold">Video belum dapat diputar</p>
              {message && <p className="mt-2 max-w-lg text-sm text-white/70">{message}</p>}
              {failed && <div className="mt-4 flex flex-wrap justify-center gap-3">
                <button type="button" onClick={() => { const server = supportedServers.find((item) => item.id === selectedID); if (server) chooseServer(server); }} className="button-secondary inline-flex items-center gap-2"><Icon name="refresh" className="size-4" />Coba lagi</button>
                {supportedServers.length > 1 && <button type="button" onClick={() => document.getElementById("stream-server")?.focus()} className="text-link min-h-11 px-2">Pilih server lain</button>}
              </div>}
            </div>
          </div>
        )}

        {streamURL && !failed && status === "loading" && !hasLoaded && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black" role="status" aria-live="polite">
            <div className="absolute inset-0 animate-pulse bg-elevated/60" aria-hidden="true" />
            <div className="relative flex flex-col items-center gap-3 px-6 text-center">
              <span className="size-10 animate-spin rounded-full border-2 border-white/25 border-t-focus" aria-hidden="true" />
              <p className="text-sm font-semibold md:text-base">Menyiapkan video…</p>
            </div>
          </div>
        )}

        {streamURL && !failed && status === "loading" && hasLoaded && <p className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-2 rounded-md bg-black/85 px-3 py-2 text-xs font-semibold" role="status" aria-live="polite"><span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-focus" aria-hidden="true" />Memuat lanjutan video…</p>}

        {streamURL && !failed && hasLoaded && (
          <div className="absolute inset-x-0 bottom-0 bg-black/85 p-3 md:p-4">
            <label className="sr-only" htmlFor="video-progress">Posisi video</label>
            <input id="video-progress" type="range" min={0} max={Number.isFinite(duration) && duration > 0 ? duration : 0} step="0.1" value={Math.min(currentTime, Number.isFinite(duration) && duration > 0 ? duration : 0)} disabled={!Number.isFinite(duration) || duration <= 0} onChange={(event) => { if (videoRef.current) videoRef.current.currentTime = Number(event.target.value); }} className="w-full accent-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-50" />
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm font-semibold">
              <button type="button" onClick={() => void togglePlayback()} className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md border border-white/40 px-3 hover:bg-white/10" aria-label={playing ? "Jeda" : "Putar"}><Icon name={playing ? "pause" : "play"} className="size-4" /><span className="hidden sm:inline">{playing ? "Jeda" : "Putar"}</span></button>
              <span className="mr-auto tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
              <button type="button" onClick={() => { const video = videoRef.current; if (video) { video.muted = !video.muted; setMuted(video.muted); } }} className="inline-flex min-h-11 items-center gap-2 px-2" aria-label={muted ? "Aktifkan suara" : "Bisukan"}><Icon name={muted ? "volume-off" : "volume"} className="size-5" /><span className="hidden lg:inline">{muted ? "Suara" : "Bisukan"}</span></button>
              <label className="sr-only" htmlFor="video-volume">Volume</label>
              <input id="video-volume" type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(event) => { const value = Number(event.target.value); if (videoRef.current) { videoRef.current.volume = value; videoRef.current.muted = value === 0; } }} className="hidden w-24 accent-[var(--primary)] sm:block" />
              <button type="button" onClick={() => void toggleFullscreen()} aria-label="Layar penuh" className="inline-flex min-h-11 items-center gap-2 rounded-md border border-white/40 px-3 hover:bg-white/10"><Icon name="maximize" className="size-4" /><span className="hidden sm:inline">Layar penuh</span></button>
            </div>
          </div>
        )}
      </div>
      {message && !failed && <p className="mt-3 text-sm font-semibold text-warning" role="status">{message}</p>}
      <details className="mt-3 text-sm text-muted"><summary className="w-fit cursor-pointer py-1 hover:text-secondary">Pintasan keyboard</summary><p className="mt-1 leading-6">Spasi atau K untuk putar/jeda, panah untuk maju/mundur, M untuk suara, dan F untuk layar penuh.</p></details>
    </section>
  );
}
