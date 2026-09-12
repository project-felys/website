"use client";

import { useEffect, useRef, useState } from "react";
import type { PcmBuffer } from "@/lib/voice/pcmBuffer";

// 峰值缓存每个桶覆盖的帧数。固定分辨率才能增量累加：每列的帧数会随整段变长而变化，
// 但"每 N 帧一个峰值"是稳定不变的，于是老数据只需折叠一次。
const PEAK_BUCKET_FRAMES = 128;

export function WaveformProgress({
  stream,
  cursor,
  total,
  onSeek,
  disabled,
}: {
  stream: PcmBuffer | null;
  cursor: number;
  total: number;
  onSeek: (frames: number) => void;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const peaksRef = useRef({ buckets: [] as number[], peakedFrames: 0 });
  const isDraggingRef = useRef(false);
  const [hoverX, setHoverX] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // 换了流就是另一段音频，峰值缓存必须重来
    peaksRef.current = { buckets: [], peakedFrames: 0 };

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

      const peaks = peaksRef.current;
      // 只把新到的样本折进固定分辨率的峰值桶。列映射（每列覆盖多少帧）会随整段变长而变化，
      // 所以不能按列缓存；但按固定帧数分桶后，老数据永远不用重扫，每次重绘只处理新增的那一段，
      // 代价从"整段长度"降到"新增帧数 + 桶数"。
      while (peaks.peakedFrames < len) {
        const piece = stream.readAt(
          peaks.peakedFrames,
          len - peaks.peakedFrames,
        );
        if (!piece || piece.length === 0) break;
        for (let i = 0; i < piece.length; i++) {
          const bucket = Math.floor(
            (peaks.peakedFrames + i) / PEAK_BUCKET_FRAMES,
          );
          const s = Math.abs(piece[i]);
          if (s > (peaks.buckets[bucket] ?? 0)) peaks.buckets[bucket] = s;
        }
        peaks.peakedFrames += piece.length;
      }

      const colW = 3;
      const cols = Math.max(1, Math.floor(cssW / colW));
      const framesPerCol = len / cols;
      ctx.fillStyle = "#ffc6f4";
      for (let c = 0; c < cols; c++) {
        const firstBucket = Math.floor((c * framesPerCol) / PEAK_BUCKET_FRAMES);
        const lastBucket = Math.max(
          firstBucket,
          Math.floor(((c + 1) * framesPerCol - 1) / PEAK_BUCKET_FRAMES),
        );
        let peak = 0;
        for (let b = firstBucket; b <= lastBucket; b++) {
          const value = peaks.buckets[b] ?? 0;
          if (value > peak) peak = value;
        }
        const barH = Math.max(1, peak * (cssH / 2));
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
    isDraggingRef.current = true;
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
    if (isDraggingRef.current) {
      seekFromEvent(e.clientX);
    }
  };

  const onPointerLeave = () => {
    setHoverX(null);
  };

  const onPointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
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
      className={`relative h-full w-full overflow-hidden  ${disabled ? "opacity-40" : "cursor-pointer"}`}
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
