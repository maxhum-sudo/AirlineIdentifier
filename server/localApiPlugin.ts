import type { ViteDevServer } from 'vite';
import { handleApiRequest } from './apiHandlers';

export const localApiPlugin = () => ({
  name: 'local-api',
  configureServer(server: ViteDevServer) {
    server.middlewares.use(async (request, response, next) => {
      if (!request.url?.startsWith('/api/')) {
        next();
        return;
      }

      try {
        const host = request.headers.host || 'localhost:5173';
        const url = new URL(request.url, `http://${host}`);
        const body =
          request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH'
            ? await new Promise<Buffer>((resolve, reject) => {
                const chunks: Buffer[] = [];
                request.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
                request.on('end', () => resolve(Buffer.concat(chunks)));
                request.on('error', reject);
              })
            : undefined;

        const apiResponse = await handleApiRequest(
          new Request(url, {
            method: request.method,
            headers: request.headers as HeadersInit,
            body: body?.length ? new Uint8Array(body) : undefined,
          }),
        );

        response.statusCode = apiResponse.status;
        apiResponse.headers.forEach((value, key) => {
          response.setHeader(key, value);
        });
        response.end(Buffer.from(await apiResponse.arrayBuffer()));
      } catch (error) {
        response.statusCode = 500;
        response.setHeader('Content-Type', 'application/json');
        response.end(
          JSON.stringify({
            error: error instanceof Error ? error.message : 'Local API request failed.',
          }),
        );
      }
    });
  },
});
