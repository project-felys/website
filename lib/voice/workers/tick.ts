let id: ReturnType<typeof setInterval> | null = null;

onmessage = (e) => {
  const { start, stop } = e.data as { start?: number; stop?: true };
  if (start != null) {
    if (id !== null) clearInterval(id);
    id = setInterval(() => postMessage(0), start);
  } else if (stop && id !== null) {
    clearInterval(id);
    id = null;
  }
};
