import path from "path";
import { mkdir, writeFile } from "fs/promises";
import { promisify } from "util";
import { execFile } from "child_process";

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
const execFileAsync = promisify(execFile);

type RenderPayload = {
  project_id: string;
  composition_props: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as RenderPayload;
    const outDir = path.resolve(process.cwd(), "out");
    await mkdir(outDir, { recursive: true });
    const propsPath = path.resolve(outDir, `${payload.project_id}.props.json`);
    const outputLocation = path.resolve(outDir, `${payload.project_id}.mp4`);
    await writeFile(propsPath, JSON.stringify(payload.composition_props), "utf-8");

    await execFileAsync(
      "npx",
      [
        "remotion",
        "render",
        "video-composer/index.ts",
        "DocumentaryComposition",
        outputLocation,
        "--props",
        propsPath,
        "--codec",
        "h264",
      ],
      { cwd: process.cwd() },
    );

    return NextResponse.json({ output_location: outputLocation, status: "completed" });
  } catch (error) {
    return NextResponse.json(
      { status: "failed", error: error instanceof Error ? error.message : "Unknown render error" },
      { status: 500 },
    );
  }
}
