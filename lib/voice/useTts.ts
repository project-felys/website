import { useCallback, useEffect, useState } from "react";
import { downloadBlob } from "./audio";
import { TtsClient, TtsSessionConfig } from "./tts";

export function useTts(sessionConfig: TtsSessionConfig) {
  const [canPlay, setCanPlay] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [client] = useState(
    () =>
      new TtsClient(
        {},
        {
          onStateChange: (state) => {
            setCanPlay(state.canPlay);
            setIsPlaying(state.isPlaying);
            setIsGenerating(state.isGenerating);
          },
        },
      ),
  );

  useEffect(() => {
    return () => client.close();
  }, [client]);

  const generate = useCallback(
    (text: string) => {
      client.generate(text, sessionConfig);
    },
    [client, sessionConfig],
  );

  const play = useCallback(() => client.play(), [client]);
  const stop = useCallback(() => client.stop(), [client]);

  const download = useCallback(
    (filename: string) => {
      const wav = client.toWav();
      if (!wav) return;
      downloadBlob(new Blob([wav], { type: "audio/wav" }), filename);
    },
    [client],
  );

  return { canPlay, isPlaying, isGenerating, generate, play, stop, download };
}
