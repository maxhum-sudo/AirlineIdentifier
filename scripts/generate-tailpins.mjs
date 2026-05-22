#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { loadAirlinesFromTailsFolder } from './lib/airlines.mjs';
import { buildTailpinPrompt } from './lib/prompt.mjs';
import { generateImage } from './lib/generateImage.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

const defaults = {
  tailsDir: path.join(projectRoot, 'public', 'airlines', 'tails'),
  styleReference: path.join(__dirname, 'reference', 'united-pin-style.png'),
  outputDir: path.join(process.env.HOME, 'tailpins'),
  agentModel: process.env.TAILPIN_AGENT_MODEL || 'composer-2',
  delayMs: Number(process.env.TAILPIN_DELAY_MS || 2000),
  maxRetries: Number(process.env.TAILPIN_MAX_RETRIES || 3),
};

function parseArgs(argv) {
  const options = {
    dryRun: false,
    force: false,
    only: null,
    help: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    } else if (arg === '--force') {
      options.force = true;
    } else if (arg === '--only') {
      options.only = new Set(
        argv[index + 1]
          .split(',')
          .map((value) => value.trim())
          .filter(Boolean),
      );
      index += 1;
    }
  }

  return options;
}

function printHelp() {
  console.log(`Generate enamel pin product photos for airline tails via Cursor GenerateImage.

Usage:
  node scripts/generate-tailpins.mjs [options]

Options:
  --dry-run          Print the run plan without calling GenerateImage
  --force            Regenerate even if output already exists
  --only id1,id2     Generate only the listed airline ids
  --help             Show this help

Environment:
  CURSOR_API_KEY         Required for generation
  TAILPIN_AGENT_MODEL    Cursor agent model (default: composer-2)
  TAILPIN_DELAY_MS       Delay between requests (default: 2000)
  TAILPIN_MAX_RETRIES    Retry count per airline (default: 3)

Inputs:
  Tail photos:   public/airlines/tails/{id}.jpg
  Airline names: public/airlines/tails/{id}.license.json
  Style pin:     scripts/reference/united-pin-style.png
  Prompt:        United gold enamel pin prompt (scripts/lib/prompt.mjs)

Output:
  ~/tailpins/{id}.png
  ~/tailpins/manifest.json
`);
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function loadManifest(manifestPath) {
  if (!(await pathExists(manifestPath))) {
    return { version: 1, generatedAt: null, items: {} };
  }

  const raw = await fs.readFile(manifestPath, 'utf8');
  return JSON.parse(raw);
}

async function saveManifest(manifestPath, manifest) {
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildGenerateImageJob({ airline, tailPhotoPath, styleReferencePath }) {
  return {
    description: buildTailpinPrompt(airline.name),
    filename: `${airline.id}.png`,
    reference_image_paths: [styleReferencePath, tailPhotoPath],
  };
}

async function generatePin({
  airline,
  tailPhotoPath,
  styleReferencePath,
  outputPath,
  apiKey,
  maxRetries,
}) {
  const job = buildGenerateImageJob({ airline, tailPhotoPath, styleReferencePath });
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const result = await generateImage(job, {
        projectRoot,
        apiKey,
        agentModel: defaults.agentModel,
      });

      await fs.copyFile(result.savedPath, outputPath);

      return {
        prompt: job.description,
        attempt,
        generatedPath: result.savedPath,
        agentResponse: result.agentResponse,
      };
    } catch (error) {
      lastError = error;
      const delay = defaults.delayMs * attempt;
      console.warn(
        `[${airline.id}] attempt ${attempt}/${maxRetries} failed: ${error.message}. Retrying in ${delay}ms...`,
      );
      await sleep(delay);
    }
  }

  throw lastError;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  const manifestPath = path.join(defaults.outputDir, 'manifest.json');
  const airlines = await loadAirlinesFromTailsFolder(defaults.tailsDir);
  const selectedAirlines = options.only
    ? airlines.filter((airline) => options.only.has(airline.id))
    : airlines;

  if (selectedAirlines.length === 0) {
    throw new Error('No airlines matched the --only filter.');
  }

  if (!(await pathExists(defaults.styleReference))) {
    throw new Error(`Style reference not found: ${defaults.styleReference}`);
  }

  await fs.mkdir(defaults.outputDir, { recursive: true });
  const manifest = await loadManifest(manifestPath);

  const plan = [];

  for (const airline of selectedAirlines) {
    const tailPhotoPath = path.join(defaults.tailsDir, `${airline.id}.jpg`);
    const outputPath = path.join(defaults.outputDir, `${airline.id}.png`);

    if (!(await pathExists(tailPhotoPath))) {
      plan.push({ airline, status: 'missing-tail-photo', tailPhotoPath, outputPath });
      continue;
    }

    if (!options.force && (await pathExists(outputPath))) {
      plan.push({ airline, status: 'skipped-existing', tailPhotoPath, outputPath });
      continue;
    }

    plan.push({ airline, status: 'pending', tailPhotoPath, outputPath });
  }

  console.log(`Tail pin generation plan (${plan.length} airlines)`);
  console.log(`  Output: ${defaults.outputDir}`);
  console.log(`  Engine: Cursor GenerateImage (via @cursor/sdk)`);
  console.log(`  Agent:  ${defaults.agentModel}`);
  console.log(`  Style:  ${defaults.styleReference}`);

  for (const item of plan) {
    console.log(`  - ${item.airline.id} (${item.airline.name}): ${item.status}`);
  }

  if (options.dryRun) {
    return;
  }

  const apiKey = process.env.CURSOR_API_KEY;
  if (!apiKey) {
    throw new Error('CURSOR_API_KEY is required. Set it in your environment or .env file.');
  }

  manifest.generatedAt = new Date().toISOString();

  for (const item of plan) {
    const { airline, status, tailPhotoPath, outputPath } = item;

    if (status !== 'pending') {
      manifest.items[airline.id] = {
        airline: airline.name,
        status,
        outputPath,
        updatedAt: new Date().toISOString(),
      };
      await saveManifest(manifestPath, manifest);
      continue;
    }

    console.log(`\n[${airline.id}] generating with GenerateImage...`);

    try {
      const result = await generatePin({
        airline,
        tailPhotoPath,
        styleReferencePath: defaults.styleReference,
        outputPath,
        apiKey,
        maxRetries: defaults.maxRetries,
      });

      manifest.items[airline.id] = {
        airline: airline.name,
        status: 'completed',
        outputPath,
        tailPhotoPath,
        styleReferencePath: defaults.styleReference,
        agentModel: defaults.agentModel,
        prompt: result.prompt,
        attempt: result.attempt,
        generatedPath: result.generatedPath,
        updatedAt: new Date().toISOString(),
      };

      console.log(`[${airline.id}] saved ${outputPath}`);
    } catch (error) {
      manifest.items[airline.id] = {
        airline: airline.name,
        status: 'failed',
        outputPath,
        tailPhotoPath,
        error: error.message,
        updatedAt: new Date().toISOString(),
      };

      console.error(`[${airline.id}] failed: ${error.message}`);
    }

    await saveManifest(manifestPath, manifest);
    await sleep(defaults.delayMs);
  }

  const completed = Object.values(manifest.items).filter((item) => item.status === 'completed').length;
  const failed = Object.values(manifest.items).filter((item) => item.status === 'failed').length;
  const skipped = plan.filter((item) => item.status === 'skipped-existing').length;

  console.log(`\nDone. completed=${completed} failed=${failed} skipped=${skipped}`);
  console.log(`Manifest: ${manifestPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
