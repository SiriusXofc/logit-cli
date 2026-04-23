import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs'],
  clean: true,
  sourcemap: false,
  dts: true,
  banner: {
    js: '#!/usr/bin/env node'
  }
})
