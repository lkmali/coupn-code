// Vercel serverless entry point.
//
// This file is deliberately plain JavaScript that points at tsc-compiled output
// rather than TypeScript importing ../src/app. @vercel/node compiles TypeScript
// with esbuild, which does not implement `emitDecoratorMetadata` — the metadata
// routing-controllers and class-validator read to resolve parameter types. Under
// esbuild that metadata is silently absent, so controllers bind undefined params
// and DTO validation misbehaves. Building with tsc first (npm run build:server,
// wired up as the Vercel build command) keeps the metadata intact; this entry
// just hands the resulting app to the platform.
require('reflect-metadata')

const app = require('../dist/src/app.js').default

module.exports = app
