import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This is the correct configuration for Genkit in a Next.js app.
export const ai = genkit({
  plugins: [
    googleAI(),
  ],
  // Log all telemetry to the console.
  telemetry: {
    instrumentation: {
      // openTelemetry: {
      //   // Jaeger exporter can be used to debug locally.
      //   // It is recommended to use a managed service in production.
      //   exporter: new JaegerExporter({
      //     endpoint: 'http://localhost:14268/api/traces',
      //   }),
      // },
    },
    logger: {
      // console: true,
    },
  },
  // Allow all origins, for local development.
  // We should probably lock this down in production.
  cors: {
    origin: '*',
  },
});
