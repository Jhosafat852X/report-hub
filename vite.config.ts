import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  nitro: true,
  vite: {
    server: {
      allowedHosts: true,
    },
  },
  tanstackStart: {
    server: { entry: "server" },
  },
});
