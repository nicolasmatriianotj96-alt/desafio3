const { NodeSDK } = require('@opentelemetry/sdk-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { ATTR_SERVICE_NAME } = require('@opentelemetry/semantic-conventions');
const env = require('../config/env');

let sdk;

function startTracing() {
  if (!env.otel.enabled || sdk) return;

  sdk = new NodeSDK({
    resource: new Resource({ [ATTR_SERVICE_NAME]: env.otel.serviceName }),
    traceExporter: new OTLPTraceExporter({ url: env.otel.endpoint }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Reduz ruído: não precisamos rastrear leitura de arquivos estáticos, por exemplo.
        '@opentelemetry/instrumentation-fs': { enabled: false },
      }),
    ],
  });

  sdk.start();

  // eslint-disable-next-line no-console
  console.log(`[otel] tracing habilitado -> ${env.otel.endpoint}`);

  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .finally(() => process.exit(0));
  });
}

module.exports = { startTracing };
