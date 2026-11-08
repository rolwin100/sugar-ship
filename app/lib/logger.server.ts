import pino, { type Logger } from "pino";
import pretty from "pino-pretty";
import { getLogContext } from "./log-context.server";

/**
 * The app's logger (server only). Use a child per area so every line says where it
 * came from, and pass details as fields rather than in the message:
 *
 *   const log = logger.child({ module: "rates" });
 *   log.info({ shop, outcome, ms }, "rates request");
 *   log.error({ err: error, shop }, "quoting failed");
 *
 * Development: readable lines in the terminal, plus logs/dev.log (git-ignored).
 * Production: one JSON object per line on stdout, for the host's log collector.
 * LOG_LEVEL overrides the level (default: debug in development, info in production).
 * Lines written while a request is handled also get its reqId (see log-context.server).
 */

const isProduction = process.env.NODE_ENV === "production";
const level = process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug");

/** Adds the current request's id (and shop) to every line; nothing outside a request. */
const mixin = () => getLogContext() ?? {};

function createLogger(): Logger {
  if (isProduction) {
    return pino({ level, mixin, base: { app: "sugar-ship" } });
  }
  // In-process streams, not pino.transport(): transports start worker threads that
  // look targets up by file path, which fails inside Vite's dev server.
  return pino(
    { level, mixin },
    pino.multistream([
      {
        level,
        stream: pretty({
          colorize: true,
          translateTime: "SYS:HH:MM:ss",
          ignore: "pid,hostname",
        }),
      },
      {
        level,
        stream: pino.destination({ dest: "logs/dev.log", mkdir: true }),
      },
    ]),
  );
}

declare global {
  // eslint-disable-next-line no-var
  var loggerGlobal: Logger | undefined;
}

// In development the server reloads modules on every change; keep one logger (and
// its open log file) instead of starting a new one each time, as db.server does.
export const logger: Logger = isProduction
  ? createLogger()
  : (global.loggerGlobal ??= createLogger());
