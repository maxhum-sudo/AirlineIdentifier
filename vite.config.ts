import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

type CuratedTailImageRequest = {
  airline: {
    id: string;
    name: string;
    country: string;
    iata?: string;
    icao?: string;
  };
  image: {
    fileTitle: string;
    title: string;
    imageUrl: string;
    pageUrl: string;
    author: string;
    license: string;
    licenseUrl?: string;
    credit?: string;
    attributionText: string;
  };
};

const readRequestBody = async (request: import('node:http').IncomingMessage) =>
  new Promise<string>((resolve, reject) => {
    let body = '';

    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => resolve(body));
    request.on('error', reject);
  });

const getImageExtension = (contentType: string | null, fallbackUrl: string) => {
  if (contentType?.includes('image/png')) {
    return '.png';
  }

  if (contentType?.includes('image/webp')) {
    return '.webp';
  }

  if (contentType?.includes('image/gif')) {
    return '.gif';
  }

  if (contentType?.includes('image/jpeg')) {
    return '.jpg';
  }

  const urlExtension = path.extname(new URL(fallbackUrl).pathname).toLowerCase();
  return ['.jpg', '.jpeg', '.png', '.webp', '.gif'].includes(urlExtension)
    ? urlExtension
    : '.jpg';
};

const curatedTailImagePlugin = () => ({
  name: 'curated-tail-image-writer',
  configureServer(server: import('vite').ViteDevServer) {
    server.middlewares.use('/__curate-tail-image', async (request, response) => {
      if (request.method !== 'POST') {
        response.statusCode = 405;
        response.end('Method not allowed');
        return;
      }

      try {
        const body = await readRequestBody(request);
        const payload = JSON.parse(body) as CuratedTailImageRequest;
        const imageResponse = await fetch(payload.image.imageUrl);

        if (!imageResponse.ok) {
          throw new Error(`Image download failed with ${imageResponse.status}`);
        }

        const tailsDirectory = path.join(server.config.root, 'public', 'airlines', 'tails');
        const extension = getImageExtension(
          imageResponse.headers.get('content-type'),
          payload.image.imageUrl,
        );
        const imageFilename = `${payload.airline.id}${extension}`;
        const licenseFilename = `${payload.airline.id}.license.json`;
        const imagePublicPath = `/airlines/tails/${imageFilename}`;
        const licensePublicPath = `/airlines/tails/${licenseFilename}`;
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        const licenseRecord = {
          airline: payload.airline,
          localImagePath: imagePublicPath,
          selectedFileTitle: payload.image.fileTitle,
          wikimediaTitle: payload.image.title,
          wikimediaPageUrl: payload.image.pageUrl,
          originalImageUrl: payload.image.imageUrl,
          author: payload.image.author,
          license: payload.image.license,
          licenseUrl: payload.image.licenseUrl,
          credit: payload.image.credit,
          attributionText: payload.image.attributionText,
          savedAt: new Date().toISOString(),
        };

        await mkdir(tailsDirectory, { recursive: true });
        await writeFile(path.join(tailsDirectory, imageFilename), imageBuffer);
        await writeFile(
          path.join(tailsDirectory, licenseFilename),
          `${JSON.stringify(licenseRecord, null, 2)}\n`,
        );

        response.setHeader('Content-Type', 'application/json');
        response.end(
          JSON.stringify({
            imagePath: imagePublicPath,
            licensePath: licensePublicPath,
          }),
        );
      } catch (error) {
        response.statusCode = 500;
        response.setHeader('Content-Type', 'application/json');
        response.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : 'Failed to save curated image',
          }),
        );
      }
    });
  },
});

export default defineConfig({
  plugins: [react(), curatedTailImagePlugin()],
});
