/**
 * Simple logger utility for serverless functions
 */
class Logger {
  constructor(context = 'Unknown') {
    this.context = context;
  }

  log(message, ...optionalParams) {
    console.log(
      `[${new Date().toISOString()}] [${this.context}] LOG:`,
      message,
      ...optionalParams,
    );
  }

  error(message, ...optionalParams) {
    console.error(
      `[${new Date().toISOString()}] [${this.context}] ERROR:`,
      message,
      ...optionalParams,
    );
  }

  warn(message, ...optionalParams) {
    console.warn(
      `[${new Date().toISOString()}] [${this.context}] WARN:`,
      message,
      ...optionalParams,
    );
  }

  debug(message, ...optionalParams) {
    console.debug(
      `[${new Date().toISOString()}] [${this.context}] DEBUG:`,
      message,
      ...optionalParams,
    );
  }
}

module.exports = { Logger };
