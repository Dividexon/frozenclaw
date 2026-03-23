import "server-only";

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { getAppConfig } from "@/lib/env";

export function isPiperConfigured() {
  const config = getAppConfig();
  return Boolean(
    config.piperEnabled && config.piperCommand && config.piperModelPath && config.piperConfigPath,
  );
}

export async function synthesizePiperSpeech(text: string) {
  const config = getAppConfig();

  if (!isPiperConfigured()) {
    throw new Error("Piper ist auf diesem Server nicht konfiguriert.");
  }

  const normalizedText = text.trim();

  if (!normalizedText) {
    throw new Error("Kein Text für die Sprachausgabe übergeben.");
  }

  if (normalizedText.length > config.piperMaxTextLength) {
    throw new Error("Der Text für die Sprachausgabe ist zu lang.");
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "frozenclaw-tts-"));
  const outputPath = path.join(tempDir, "speech.wav");

  try {
    await new Promise<void>((resolve, reject) => {
      const child = spawn(
        config.piperCommand!,
        [
          "-m",
          config.piperModelPath!,
          "-c",
          config.piperConfigPath!,
          "-f",
          outputPath,
        ],
        {
          stdio: ["pipe", "ignore", "pipe"],
        },
      );
      const stderrChunks: Buffer[] = [];
      const timeout = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error("Piper hat das Timeout überschritten."));
      }, config.piperTimeoutMs);

      child.stderr.on("data", (chunk: Buffer | string) => {
        stderrChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      child.on("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      child.on("close", (code) => {
        clearTimeout(timeout);
        if (code === 0) {
          resolve();
          return;
        }

        const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();
        reject(new Error(stderr || `Piper wurde mit Status ${code} beendet.`));
      });

      child.stdin.write(normalizedText);
      child.stdin.end();
    });

    return await fs.readFile(outputPath);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
