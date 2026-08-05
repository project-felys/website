import { AudioStream, AudioStreamReader } from "./AudioStream";

const SAMPLE_RATE = 24000;
export const PLAYER_SAMPLE_RATE = SAMPLE_RATE; // 供消费方换算时间：秒 = 帧 / PLAYER_SAMPLE_RATE
const SCHEDULE_AHEAD_SEC = 0.3; // 提前排队多少秒的音频
const MAX_PIECE = Math.floor(0.1 * SAMPLE_RATE); // 每个切片最大帧数
const TICK_INTERVAL_MS = 25; // 调度心跳间隔（由 Web Worker 驱动，不受后台标签页节流影响）

export type PlayerStatus = "idle" | "playing" | "paused" | "buffering";

export class PlayerEngine {
  private ctx: AudioContext | null = null;
  private audio: AudioStream | null = null;
  private reader: AudioStreamReader | null = null;
  private pos = 0; // 逻辑播放位置（seek/pause/underrun 的冻结点）
  private sources: AudioBufferSourceNode[] = [];
  private nextStart = 0; // 下一个切片应开始的 ctx 时间
  private runStartCtxTime = 0; // 当前连续段的起始 ctx 时间
  private runStartFrame = 0; // 当前连续段的起始帧
  private state: PlayerStatus = "idle";
  private timer: Worker | null = null;
  private unsub: (() => void) | null = null;
  private listeners = new Set<() => void>();

  get status(): PlayerStatus {
    return this.state;
  }

  get cursor(): number {
    return this.pos;
  }

  get total(): number {
    return this.audio?.length ?? 0;
  }

  subscribe = (cb: () => void): (() => void) => {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  };

  attach = (audio: AudioStream): void => {
    this.halt();
    this.unsub?.();

    this.audio = audio;
    this.resetCursor();

    // 订阅流：新帧到达时立即续播/排队，并刷新 total
    this.unsub = audio.subscribe(() => {
      if (this.state === "buffering") {
        this.play();
      } else if (this.state === "playing") {
        this.schedule();
      }
      this.emit();
    });

    this.setStatus("idle");
  };

  play = (): void => {
    if (this.state === "playing") return;
    const c = this.getCtx();
    const audio = this.audio;
    if (!audio) return;
    void c.resume();

    let from = Math.max(0, Math.min(this.pos, audio.length));
    if (from >= audio.length) from = 0; // 已到末尾 → 从头播放

    this.reader = audio.reader(from);
    this.restartSegment(from);
    this.pos = from;
    this.setStatus("playing");
    this.startTick();
  };

  pause = (): void => {
    if (this.state !== "playing") return;
    this.syncCursor();
    this.halt();
    this.setStatus("paused");
  };

  move = (pos: number): void => {
    const audio = this.audio;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(pos, audio.length));
    this.pos = clamped;
    this.reader = audio.reader(clamped);
    this.emit();
    // 播放中：立即从新位置续播
    if (this.state === "playing") {
      const c = this.ctx;
      if (!c) return;
      this.restartSegment(clamped);
      this.schedule();
    }
    // paused / buffering / idle：仅重定位，不自动开始
  };

  reset = (): void => {
    this.halt();
    this.resetCursor();
    this.setStatus("idle");
  };

  destroy = (): void => {
    this.timer?.terminate();
    this.timer = null;
    this.stopAllSources();
    this.unsub?.();
    this.unsub = null;
    this.audio = null;
    this.reader = null;
    void this.ctx?.close();
    this.ctx = null;
  };

  private emit = (): void => {
    for (const cb of this.listeners) cb();
  };

  private setStatus = (s: PlayerStatus): void => {
    this.state = s;
    this.emit();
  };

  private getCtx = (): AudioContext => {
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    }
    return this.ctx;
  };

  private stopAllSources = (): void => {
    for (const src of this.sources) {
      try {
        src.stop();
      } catch {
        // 已结束
      }
      try {
        src.disconnect();
      } catch {
        // 已断开
      }
    }
    this.sources = [];
  };

  // 用专用 Web Worker 的 setInterval 驱动调度心跳：标签页切到后台时
  // requestAnimationFrame 会被冻结，但专用 Worker 的定时器不受影响，
  // 从而保证后台也能持续把音频排队进 Web Audio 时间线。
  private startTick = (): void => {
    if (!this.timer) {
      this.timer = new Worker(
        new URL("@/lib/voice/workers/tick.ts", import.meta.url),
      );
      this.timer.onmessage = () => this.tick();
    }
    this.timer.postMessage({ start: TICK_INTERVAL_MS });
  };

  private stopTick = (): void => {
    this.timer?.postMessage({ stop: true });
  };

  // 停止已调度的音频并停止调度心跳（pause / reset / underrun / 收尾复用）
  private halt = (): void => {
    this.stopAllSources();
    this.stopTick();
  };

  // 把游标与段状态归零到起点（attach / reset 复用）
  private resetCursor = (): void => {
    if (this.audio) this.reader = this.audio.reader(0);
    this.pos = 0;
    this.runStartFrame = 0;
    this.runStartCtxTime = 0;
    this.nextStart = 0;
  };

  // 由当前 ctx 时间推算已播帧数，并同步 pos / cursor
  private syncCursor = (): void => {
    const c = this.ctx;
    const reader = this.reader;
    const elapsed = c ? c.currentTime - this.runStartCtxTime : 0;
    const played = Math.min(
      reader ? reader.position : 0,
      Math.max(0, Math.floor(this.runStartFrame + elapsed * SAMPLE_RATE)),
    );
    this.pos = played;
    this.emit();
  };

  // lookahead 调度：把尚未排队的帧尽量提前排进时间线
  private schedule = (): void => {
    const c = this.ctx;
    const reader = this.reader;
    if (!c || !reader) return;
    while (reader.available > 0) {
      if (this.nextStart - c.currentTime >= SCHEDULE_AHEAD_SEC) break;
      const piece = reader.read(MAX_PIECE);
      if (!piece || piece.length === 0) break;
      const buffer = c.createBuffer(1, piece.length, SAMPLE_RATE);
      buffer.getChannelData(0).set(piece);
      const src = c.createBufferSource();
      src.buffer = buffer;
      src.connect(c.destination);
      const startAt = Math.max(this.nextStart, c.currentTime);
      src.start(startAt);
      this.sources.push(src);
      this.nextStart = startAt + piece.length / SAMPLE_RATE;
    }
  };

  // 从新位置开启一段连续播放（play / moveCursor 播放中复用）
  private restartSegment = (from: number): void => {
    const c = this.ctx;
    if (!c) return;
    this.stopAllSources();
    this.runStartFrame = from;
    this.runStartCtxTime = c.currentTime;
    this.nextStart = c.currentTime;
  };

  private tick = (): void => {
    const c = this.ctx;
    const reader = this.reader;
    const audio = this.audio;
    if (!c || !reader || !audio) return;

    this.syncCursor();
    this.schedule();

    // 所有已调度音频都播完
    if (c.currentTime >= this.nextStart) {
      if (reader.available === 0) {
        if (audio.sealed) {
          this.pos = audio.length;
          this.setStatus("idle");
          this.halt();
          return; // 不再请求下一帧
        }
        // underrun：没有更多数据可排，但流未结束 → 停在原地等（由 audio 的 push 唤醒）
        this.pos = reader.position;
        this.setStatus("buffering");
        this.halt();
        return;
      }
      // 有数据但受 SCHEDULE_AHEAD_SEC 限制未排完 → 继续下一帧
    }
  };
}
