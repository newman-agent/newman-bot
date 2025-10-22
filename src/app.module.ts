import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DiscordModule } from './infrastructure/discord/discord.module';
import { SearchModule } from './infrastructure/search/search.module';
import { AiModule } from './infrastructure/ai/ai.module';
import { envValidation } from './infrastructure/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: envValidation,
    }),
    DiscordModule,
    SearchModule,
    AiModule,
  ],
})
export class AppModule { }
