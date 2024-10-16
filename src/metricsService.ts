import { PROMETHEUS_PUSHGATEWAY_URL } from "./config";

const client = await require("prom-client");

export class MetricsService {
  gateway = new client.Pushgateway(PROMETHEUS_PUSHGATEWAY_URL);

  constructor() {
    if (!PROMETHEUS_PUSHGATEWAY_URL) {
      throw new Error("Prometheus pushgateway is not set up");
    }
  }

  setJobRunTimestamp() {
    new client.Gauge({
      name: "dollar_data_to_google_spreadsheets_last_job_run",
      help: "Last time the job was run",
      collect() {
        this.set(Date.now());
      },
    });
  }

  async sendMetrics() {
    await this.gateway.push({ jobName: "dollar-data-to-google-spreadsheets" });
  }
}
