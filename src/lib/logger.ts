const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log("[TMS]", ...args);
  },
  info: (...args: unknown[]) => {
    if (isDev) console.info("[TMS]", ...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn("[TMS]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[TMS]", ...args);
  },
};
