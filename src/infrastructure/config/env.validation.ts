import { plainToClass } from 'class-transformer';
import { IsString, IsEnum, validateSync, IsOptional } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsString()
  DISCORD_TOKEN: string;

  @IsString()
  PAWAN_API_KEY: string;

  @IsString()
  @IsOptional()
  BRAVE_API_KEY?: string;

  @IsString()
  @IsOptional()
  BOT_PREFIX: string = '!';
}

export function envValidation(config: Record<string, unknown>) {
  const validateConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validateConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validateConfig;
}
