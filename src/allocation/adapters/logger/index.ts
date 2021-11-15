class Logger {
  log(...args: unknown[]) {
    console.log(...args);
  }
}

export const logger = new Logger();
