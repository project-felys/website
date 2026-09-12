export class PcmBuffer {
  private chunks: Float32Array[] = [];
  private chunkEnds: number[] = []; // 各 chunk 的累计结束帧，供 readAt 二分定位
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
    this.chunkEnds.push(this.total);
    this.emit();
  }

  sealFrames(): void {
    if (this.isSealed) return;
    this.isSealed = true;
    this.emit();
  }

  reader(from = 0): PcmReader {
    return new PcmReader(this, from);
  }

  subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  // 取出从 from 开始、最多 maxLen 帧的一段（只返回落在同一个 chunk 内的部分，调用方自己循环）。
  // chunkEnds 是累计结束帧，二分就能定位到目标 chunk —— 之前每次调用都从第一个 chunk 线性
  // 遍历，而调度热路径、波形绘制和 WAV 导出都会反复取，长句下三处都退化成了 O(n²)。
  readAt(from: number, maxLen: number): Float32Array | null {
    if (from < 0 || from >= this.total) return null;

    let low = 0;
    let high = this.chunkEnds.length - 1;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (this.chunkEnds[mid] > from) high = mid;
      else low = mid + 1;
    }

    const chunk = this.chunks[low];
    const start = low === 0 ? 0 : this.chunkEnds[low - 1];
    const skip = from - start;
    const len = Math.min(chunk.length - skip, maxLen);
    return chunk.subarray(skip, skip + len);
  }

  private emit(): void {
    for (const cb of this.listeners) cb();
  }
}

export class PcmReader {
  private pos: number;

  constructor(
    private readonly stream: PcmBuffer,
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
