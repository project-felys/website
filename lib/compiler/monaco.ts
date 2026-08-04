import { editor } from "monaco-editor";
import type { Monaco } from "@monaco-editor/react";

export const monacoConfig = (_: editor.IStandaloneCodeEditor, monaco: Monaco) => {
  monaco.languages.register({ id: "felys" });

  monaco.languages.setMonarchTokensProvider("felys", {
    tokenizer: {
      root: [
        [/(elysia|cyrene)/, "pink"],
        [/\/\/[^\n]*/, "comment"],
        [
          /(fn|group|impl|if|else|while|break|continue|loop|return|true|false|not|and|or|for|in)(?!\w)/,
          "keyword",
        ],
        [/[a-zA-Z_][\w_]*(?=\s*\()/, "function.call"],
        [/[a-zA-Z_][\w_]*/, "identifier"],
        [/\d+/, "number"],
        [/"/, "string", "@string"],
      ],
      string: [
        [/[^"]+/, "string"],
        [/"/, "string", "@pop"],
      ],
    },
  });

  monaco.editor.defineTheme("felys-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "pink", foreground: "#ffc6f4" },
      { token: "identifier", foreground: "#9cdcfe" },
      { token: "function.call", foreground: "#dcdcaa" },
    ],
    colors: {
      "editor.background": "#00000000",
      "minimap.background": "#00000000",
      "editorWidget.background": "#00000000",
      "input.background": "#00000000",
      "editorOverviewRuler.background": "#00000000",
    },
  });

  monaco.editor.setTheme("felys-dark");
};
