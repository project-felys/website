"use client";

import { useEffect, useRef, useState } from "react";
import type { AudioStream } from "./AudioStream";

export function WaveformProgress({
  stream,
  cursor,
  total,
  onSeek,
  disabled,
  className,
}: {
  stream: AudioStream | null;
  cursor: number;
  total: number;
  onSeek: (frames: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [hoverX, setHoverX] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let raf = 0;

    const draw = () => {
      raf = 0;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      const cssW = container.clientWidth;
      const cssH = container.clientHeight;
      if (canvas.width !== cssW * dpr || canvas.height !== cssH * dpr) {
        canvas.width = Math.max(1, cssW * dpr);
        canvas.height = Math.max(1, cssH * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);

      const mid = cssH / 2;
      const len = stream?.length ?? 0;
      if (!stream || len === 0 || cssW === 0) {
        ctx.fillStyle = "#ffc6f4";
        ctx.fillRect(0, mid - 0.5, cssW, 1);
        return;
      }

      const colW = 2;
      const cols = Math.max(1, Math.floor(cssW / colW));
      const samplesPerCol = len / cols;
      const peaks = new Float32Array(cols);

      let offset = 0;
      while (offset < len) {
        const piece = stream.readAt(offset, len - offset);
        if (!piece || piece.length === 0) break;
        for (let i = 0; i < piece.length; i++) {
          const s = Math.abs(piece[i]);
          const col = Math.floor((offset + i) / samplesPerCol);
          if (col >= 0 && col < cols && s > peaks[col]) peaks[col] = s;
        }
        offset += piece.length;
      }

      ctx.fillStyle = "#ffc6f4";
      for (let c = 0; c < cols; c++) {
        const barH = Math.max(1, peaks[c] * (cssH / 2));
        ctx.fillRect(c * colW, mid - barH, colW - 1, barH * 2);
      }
    };

    const schedule = () => {
      if (raf) return;
      raf = requestAnimationFrame(draw);
    };

    schedule();

    const ro = new ResizeObserver(schedule);
    ro.observe(container);

    const unsub = stream?.subscribe(schedule);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      unsub?.();
    };
  }, [stream]);

  const pct = total > 0 ? Math.min(cursor, total) / total : 0;

  const seekFromEvent = (clientX: number) => {
    const container = containerRef.current;
    if (!container || total === 0) return;
    const rect = container.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(Math.round(frac * total));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    draggingRef.current = true;
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    seekFromEvent(e.clientX);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (disabled) return;
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setHoverX(e.clientX - rect.left);
    }
    if (draggingRef.current) {
      seekFromEvent(e.clientX);
    }
  };

  const onPointerLeave = () => {
    setHoverX(null);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    draggingRef.current = false;
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      className={`relative flex-1 rounded overflow-hidden ${className ?? "h-36"} ${disabled ? "opacity-40" : "cursor-pointer"}`}
      style={{ touchAction: "none" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none"
      />
      {total > 0 && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-pink pointer-events-none"
          style={{ left: `${pct * 100}%` }}
        />
      )}
      {hoverX !== null && (
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-neutral-100/40 pointer-events-none"
          style={{ left: `${hoverX}px` }}
        />
      )}
    </div>
  );
}
