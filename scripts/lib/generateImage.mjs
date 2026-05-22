import fs from 'node:fs/promises';
import path from 'node:path';
import { Agent } from '@cursor/sdk';

function projectAssetsDirs(projectRoot) {
  const slug = projectRoot.replace(/^\//, '').replace(/\//g, '-');

  return [
    path.join(projectRoot, 'assets'),
    path.join(process.env.HOME, '.cursor', 'projects', slug, 'assets'),
  ];
}

async function findGeneratedImage(filename, projectRoot) {
  const candidates = [];

  for (const assetsDir of projectAssetsDirs(projectRoot)) {
    candidates.push(path.join(assetsDir, filename));
  }

  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // continue
    }
  }

  return null;
}

function extractSavedPath(agentText) {
  if (!agentText) {
    return null;
  }

  const matches = [...agentText.matchAll(/(\/[^\s"'`]+?\.(?:png|jpg|jpeg|webp))/gi)];
  return matches.length > 0 ? matches[matches.length - 1][1] : null;
}

/**
 * Cursor GenerateImage-compatible wrapper.
 * Invokes a local Cursor agent run that calls GenerateImage once.
 */
export async function generateImage(
  { description, filename, reference_image_paths = [] },
  { projectRoot, apiKey, agentModel = 'composer-2' },
) {
  if (!description) {
    throw new Error('generateImage requires description');
  }

  if (!filename) {
    throw new Error('generateImage requires filename');
  }

  if (!apiKey) {
    throw new Error('CURSOR_API_KEY is required for generateImage');
  }

  const agentPrompt = [
    'Use the GenerateImage tool exactly once. Do not read files, edit code, or use any other tools.',
    '',
    'GenerateImage parameters:',
    `- description: ${JSON.stringify(description)}`,
    `- filename: ${JSON.stringify(filename)}`,
    reference_image_paths.length > 0
      ? `- reference_image_paths: ${JSON.stringify(reference_image_paths)}`
      : null,
    '',
    'After generation, reply with one line containing only the absolute saved image path.',
  ]
    .filter(Boolean)
    .join('\n');

  const result = await Agent.prompt(agentPrompt, {
    apiKey,
    model: { id: agentModel },
    local: { cwd: projectRoot },
  });

  if (result.status !== 'finished') {
    throw new Error(`GenerateImage agent run ended with status "${result.status}"`);
  }

  const savedPath =
    extractSavedPath(result.result) ?? (await findGeneratedImage(filename, projectRoot));

  if (!savedPath) {
    throw new Error(
      `GenerateImage completed but "${filename}" was not found. Agent response: ${result.result ?? '(empty)'}`,
    );
  }

  return {
    savedPath,
    agentResponse: result.result ?? '',
  };
}
