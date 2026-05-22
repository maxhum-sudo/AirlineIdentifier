import type { ViteDevServer } from 'vite';
export declare const localApiPlugin: () => {
    name: string;
    configureServer(server: ViteDevServer): void;
};
