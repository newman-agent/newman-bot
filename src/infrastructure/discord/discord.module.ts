import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { SearchCommand } from './commands/search.command';
import { ChatCommand } from './commands/chat.command';
import { VerifyCommand } from './commands/verify.command';
import { HelpCommand } from './commands/help.command';
import { SearchModule } from '../search/search.module';
import { AiModule } from '../ai/ai.module';
import { SearchWithFactCheckUseCase } from '../../core/use-cases/search-with-fact-check.usecase';
import { VerifyClaimUseCase } from '../../core/use-cases/verify-claim.usecase';
import { ChatWithAiUseCase } from '../../core/use-cases/chat-with-ai.usecase';
import { EmbedBuilderService } from '../../application/services/embed-builder.service';

@Module({
  imports: [SearchModule, AiModule],
  providers: [
    DiscordService,
    SearchCommand,
    ChatCommand,
    VerifyCommand,
    HelpCommand,
    SearchWithFactCheckUseCase,
    VerifyClaimUseCase,
    ChatWithAiUseCase,
    EmbedBuilderService,
  ],
})
export class DiscordModule { }
