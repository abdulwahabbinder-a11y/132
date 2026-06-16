import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";

function parseArgs() {
  const args = process.argv.slice(2);
  const output = args[args.indexOf("--output") + 1];
  const input = args[args.indexOf("--input") + 1];
  if (!output || !input) {
    throw new Error("Usage: node src/render.js --input <json> --output <mp4>");
  }
  return { output, input };
}

async function run() {
  const { output, input } = parseArgs();
  const payload = JSON.parse(fs.readFileSync(input, "utf-8"));
  const entry = path.join(process.cwd(), "src/index.ts");
  const bundled = await bundle({ entryPoint: entry });
  const compositions = await getCompositions(bundled);
  const comp = compositions.find((c) => c.id === "DocumentaryComposition");
  if (!comp) throw new Error("DocumentaryComposition not found");

  await renderMedia({
    composition: comp,
    serveUrl: bundled,
    codec: "h264",
    outputLocation: output,
    inputProps: { scenes: payload.scenes }
  });
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
