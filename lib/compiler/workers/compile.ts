import init, { compile } from "@/wasm/pkg";
const wasm = new URL("@/wasm/pkg/wasm_bg.wasm", import.meta.url);

onmessage = async (e) => {
  const { code, o } = e.data;
  try {
    const url = new URL(wasm, self.location.origin);
    await init({ module_or_path: url });
    const binary = compile(code, o);
    postMessage({ binary, outcome: undefined });
  } catch (err) {
    postMessage({
      binary: undefined,
      outcome: { stdout: "", result: String(err), success: false },
    });
  }
};
