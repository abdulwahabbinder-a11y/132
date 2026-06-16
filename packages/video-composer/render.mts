import fs from "node:fs/promises";
import path from "node:path";

import { bundle } from "@remotion/bundler";
import { getCompositions, renderMedia } from "@remotion/renderer";

type CliArgs = {
  manifestPath: string;
  outputPath: string;
};

function parseArgs(argv: string[]): CliArgs {
  const manifestIndex = argv.indexOf("--manifest");
  const outputIndex = argv.indexOf("--output");

  if (manifestIndex === -1 || outputIndex === -1 || !argv[manifestIndex + 1] || !argv[outputIndex + 1]) {
    throw new Error("Usage: pnpm render --manifest <path> --output <path>");
  }

  return {
    manifestPath: argv[manifestIndex + 1],
    outputPath: argv[outputIndex + 1],
  };
}

async function main() {
  const { manifestPath, outputPath } = parseArgs(process.argv);
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const entry = path.resolve("src/Root.tsx");
  const serveUrl = await bundle({ entryPoint: entry, webpackOverride: (config) => config });
  const compositions = await getCompositions(serveUrl, {
    inputProps: { manifest },
  });
  const composition = compositions.find((item) => item.id === "DocumentaryTimeline");

  if (!composition) {
    throw new Error("DocumentaryTimeline composition not found.");
  }

  await renderMedia({
    codec: "h264",
    composition: {
      ...composition,
      durationInFrames: manifest.scenes.length * manifest.fps * 4,
    },
    serveUrl,
    outputLocation: outputPath,
    inputProps: { manifest },
  });

  console.log(outputPath);
}

void main();
