import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
Config.setConcurrency(2);
// 21:9 cinematic output is configured per-composition via props/calculateMetadata.
