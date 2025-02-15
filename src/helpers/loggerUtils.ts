import winston from "winston";

export function createLogger(serviceName: string) {
  return winston.createLogger({
    level: "silly",
    defaultMeta: { service: serviceName },
    transports: [new winston.transports.Console()],
  });
}
