import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defaultPayload, type DocumentaryRenderPayload } from "./lib/types";

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const payload = args.props
    ? (JSON.parse(await readFile(args.props, "utf-8")) as DocumentaryRenderPayload)
    : defaultPayload;
  const outputLocation = args.output ?? "renders/documentary-21x9.mp4";
  const entryPoint = path.join(path.dirname(fileURLToPath(import.meta.url)), "Root.tsx");

  const serveUrl = await bundle({
    entryPoint,
    webpackOverride: (config) => config
  });
  const compositions = await getCompositions(serveUrl, {
    inputProps: payload
  });
  const composition = compositions.find((item) => item.id === "DocumentaryFilm");
  if (!composition) {
    throw new Error("DocumentaryFilm composition was not found");
  }

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation,
    inputProps: payload,
    chromiumOptions: {
      gl: "angle"
    }
  });
}

function parseArgs(args: string[]) {
  const parsed: { props?: string; output?: string } = {};
  for (let index = 0; index < args.length; index += 1) {
    const key = args[index];
    const value = args[index + 1];
    if (key === "--props") {
      parsed.props = value;
      index += 1;
    }
    if (key === "--output") {
      parsed.output = value;
      index += 1;
    }
  }
  return parsed;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
