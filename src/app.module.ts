import { Module } from '@nestjs/common';

/* import { ConfigModule } from '@nestjs/config';
* import { DiscordModule } from './discord/discord.module';
* import { SearchModule } from './search/search.module';
* import { AiModule } from './infrastructure/ai/ai.module';
* import envValidation } from '.infrastructure/config/env.validation';
*/
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  /* ConfigModule.forRoot({
  * isGlobal: true,
  * validate: envValidation,
  * }),
  * DiscordModule,
  * SearchModule,
  * AiModule,
  */
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
