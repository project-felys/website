export class AudioStream {
  private chunks: Float32Array[] = [];
  private total = 0;
  private isSealed = false;
  private listeners = new Set<() => void>();

  get length(): number {
    return this.total;
  }

  get sealed(): boolean {
    return this.isSealed;
  }

  pushFrames(frames: Float32Array): void {
    if (this.isSealed || frames.length === 0) return;
    this.chunks.push(frames);
    this.total += frames.length;
    this.emit();
  }

  sealFrames(): void {
    if (this.isSealed) return;
    this.isSealed = true;
    this.emit();
  }

  clear(): void {
    this.chunks = [];
    this.total = 0;
    this.isSealed = false;
    this.emit();
  }

  reader(from = 0): AudioStreamReader {
    return new AudioStreamReader(this, from);
  }

  subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  readAt(from: number, maxLen: number): Float32Array | null {
    if (from >= this.total) return null;
    let skip = from;
    for (const chunk of this.chunks) {
      if (skip < chunk.length) {
        const len = Math.min(chunk.length - skip, maxLen);
        return chunk.subarray(skip, skip + len);
      }
      skip -= chunk.length;
    }
    return null;
  }

  private emit(): void {
    for (const cb of this.listeners) cb();
  }
}

export class AudioStreamReader {
  private pos: number;

  constructor(
    private readonly stream: AudioStream,
    from = 0,
  ) {
    this.pos = Math.max(0, Math.min(from, stream.length));
  }

  get position(): number {
    return this.pos;
  }

  get available(): number {
    return this.stream.length - this.pos;
  }

  read(maxLen: number): Float32Array | null {
    const piece = this.stream.readAt(this.pos, maxLen);
    if (piece) this.pos += piece.length;
    return piece;
  }
}
