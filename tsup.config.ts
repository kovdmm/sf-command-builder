import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/sf.ts", "src/executors.ts"],
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    outDir: "dist",
});
