import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// Cinematic 21:9 master is encoded with high quality H.264.
Config.setCodec("h264");
Config.setCrf(18);
// Allow loading remote media (stock footage, archival images, narration mp3s).
Config.setChromiumOpenGlRenderer("angle");
