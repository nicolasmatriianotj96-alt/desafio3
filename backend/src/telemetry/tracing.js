const env = require('../config/env');

let sdk;

// Requires dinâmicos (não literais) de propósito: em Lambda, OTEL_ENABLED
// é 'false' por padrão (ver serverless.yml), então este bloco nunca chega a
// rodar. Usar `require(variavel)` em vez de `require('pacote')` impede que o
// esbuild resolva/empacote essas dependências (o auto-instrumentations-node
// sozinho tem ~15 mil arquivos) no pacote de deploy da Lambda.
const OTEL_PACKAGES = [
  '@opentelemetry/sdk-node',
  '@opentelemetry/exporter-trace-otlp-http',
  '@opentelemetry/auto-instrumentations-node',
  '@opentelemetry/resources',
  '@opentelemetry/semantic-conventions',
];

function startTracing() {
  if (!env.otel.enabled || sdk) return;

  const [
    { NodeSDK },
    { OTLPTraceExporter },
    { getNodeAutoInstrumentations },
    { Resource },
    { ATTR_SERVICE_NAME },
  ] = OTEL_PACKAGES.map((name) => require(name)); // eslint-disable-line global-require, import/no-dynamic-require

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
