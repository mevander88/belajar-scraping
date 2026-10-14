"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveStream } from "@/app/episode/actions";
import type { MediaStream, StreamServer } from "@/lib/types";

type Props = { servers: StreamServer[]; slug: string; title: string };

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
}

export function StreamPlayer({ servers, slug, title }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const initialServer = useMemo(
    () => servers.find((server) => server.default && server.supported) ?? servers.find((server) => server.supported),
    [servers],
  );
  const [selectedID, setSelectedID] = useState(initialServer?.id ?? "");
  const [stream, setStream] = useState<MediaStream>();
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [message, setMessage] = useState("");
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const chooseServer = useCallback(async (server: StreamServer) => {
    if (!server.supported) return;
    setSelectedID(server.id);
    setStatus("loading");
    setMessage("");
    setStream(undefined);
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    const result = await resolveStream(slug, server.id);
    if (result.stream) {
      setStream(result.stream);
      setStatus("ready");
    } else {
      setStatus("error");
      setMessage(result.error ?? "Video belum dapat dimuat. Coba server lain.");
    }
  }, [slug]);

  useEffect(() => {
    if (!initialServer) return;
    const task = window.setTimeout(() => void chooseServer(initialServer), 0);
    return () => window.clearTimeout(task);
  }, [chooseServer, initialServer]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream) return;
    video.load();
  }, [stream]);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) await video.play(); else video.pause();
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) await playerRef.current?.requestFullscreen();
    else await document.exitFullscreen();
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

  if (!servers.length) {
    return <div className="grid aspect-video place-items-center bg-ink px-6 text-center text-paper"><p>Video streaming belum tersedia.</p></div>;
  }

  return (
    <section aria-label={`Pemutar ${title}`}>
      <div className="mb-4 flex flex-col gap-3 border-y border-rule py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="eyebrow text-muted">Kualitas dan server</p>
          <p className="mt-1 text-sm text-muted">Pilih alternatif jika video gagal dimuat.</p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Pilih kualitas dan server">
          {servers.map((server) => (
            <button
              key={server.id}
              type="button"
              disabled={!server.supported || status === "loading"}
              onClick={() => void chooseServer(server)}
              aria-pressed={selectedID === server.id}
              title={server.supported ? `${server.quality} melalui ${server.provider}` : "Media langsung belum didukung"}
              className={`min-h-11 border px-3 py-2 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${selectedID === server.id ? "border-ink bg-ink text-paper" : "border-rule hover:border-ink"}`}
            >
              {server.quality} · {server.provider}
            </button>
          ))}
        </div>
      </div>

      <div ref={playerRef} tabIndex={0} onKeyDown={handleKeyDown} className="group relative aspect-video overflow-hidden bg-black text-white focus-visible:outline-offset-4">
        {stream ? (
          <video
            ref={videoRef}
            className="h-full w-full"
            preload="metadata"
            playsInline
            src={stream.url}
            aria-label={title}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            onDurationChange={(event) => setDuration(event.currentTarget.duration)}
            onVolumeChange={(event) => { setMuted(event.currentTarget.muted); setVolume(event.currentTarget.volume); }}
            onError={() => { setStream(undefined); setStatus("error"); setMessage("Berkas video tidak dapat diputar. Coba server lain."); }}
          />
        ) : (
          <div className="grid h-full place-items-center px-6 text-center">
            <div>
              <p className="font-display text-2xl">{status === "loading" ? "Menyiapkan video…" : "Video belum dapat diputar"}</p>
              {message && <p className="mt-2 max-w-lg text-sm text-white/70">{message}</p>}
            </div>
          </div>
        )}

        {stream && (
          <div className="absolute inset-x-0 bottom-0 bg-black/85 p-3 md:p-4">
            <label className="sr-only" htmlFor="video-progress">Posisi video</label>
            <input id="video-progress" type="range" min={0} max={duration || 0} step="0.1" value={Math.min(currentTime, duration || 0)} onChange={(event) => { if (videoRef.current) videoRef.current.currentTime = Number(event.target.value); }} className="w-full accent-[var(--accent)]" />
            <div className="mt-2 flex items-center gap-3 text-sm font-semibold">
              <button type="button" onClick={() => void togglePlayback()} className="min-h-11 min-w-11 border border-white/40 px-3" aria-label={playing ? "Jeda" : "Putar"}>{playing ? "Jeda" : "Putar"}</button>
              <span className="tabular-nums">{formatTime(currentTime)} / {formatTime(duration)}</span>
              <button type="button" onClick={() => { const video = videoRef.current; if (video) { video.muted = !video.muted; setMuted(video.muted); } }} className="ml-auto min-h-11 px-2" aria-label={muted ? "Aktifkan suara" : "Bisukan"}>{muted ? "Suara" : "Bisukan"}</button>
              <label className="sr-only" htmlFor="video-volume">Volume</label>
              <input id="video-volume" type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume} onChange={(event) => { const value = Number(event.target.value); if (videoRef.current) { videoRef.current.volume = value; videoRef.current.muted = value === 0; } }} className="hidden w-24 accent-[var(--accent)] sm:block" />
              <button type="button" onClick={() => void toggleFullscreen()} className="min-h-11 border border-white/40 px-3">Layar penuh</button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-3 text-sm text-muted">Pintasan: spasi atau K untuk putar/jeda, panah untuk maju/mundur, M untuk suara, dan F untuk layar penuh.</p>
    </section>
  );
}
