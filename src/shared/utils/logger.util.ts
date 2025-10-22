import { Logger } from '@nestjs/common';

export class CustomLogger extends Logger {
  error(message: string, trace?: string, context?: string) {
    super.error(message, trace, context);
  }

  warn(message: string, context?: string) {
    super.log(message, context);
  }

  log(message: string, context?: string) {
    super.log(message, context);
  }

  debug(message: string, context?: string) {
    super.debug(message, context);
  }
}

