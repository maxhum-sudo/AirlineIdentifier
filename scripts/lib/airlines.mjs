import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadAirlinesFromTailsFolder(tailsDir) {
  const entries = await fs.readdir(tailsDir);
  const licenseFiles = entries.filter((entry) => entry.endsWith('.license.json')).sort();

  const airlines = [];

  for (const licenseFile of licenseFiles) {
    const licensePath = path.join(tailsDir, licenseFile);
    const license = JSON.parse(await fs.readFile(licensePath, 'utf8'));
    const id = license.airline?.id ?? licenseFile.replace('.license.json', '');

    airlines.push({
      id,
      name: license.airline?.name ?? id,
      licensePath,
    });
  }

  return airlines;
}
