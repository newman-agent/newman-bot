import { Module } from '@nestjs/common';
import { DiscordService } from './discord.service';
import { SearchCommand } from './commands/search.command';
import { ChatCommand } from './commands/chat.command';
import { VerifyCommand } from './commands/verify.command';
import { HelpCommand } from './commands/help.command';
import { AnalyzeCommand } from './commands/analyze.command';
import { SearchModule } from '../search/search.module';
import { AiModule } from '../ai/ai.module';
import { SearchWithFactCheckUseCase } from '../../core/use-cases/search-with-fact-check.usecase';
import { VerifyClaimUseCase } from '../../core/use-cases/verify-claim.usecase';
import { ChatWithAiUseCase } from '../../core/use-cases/chat-with-ai.usecase';
import { EmbedBuilderService } from '../../application/services/embed-builder.service';
import { FactCheckService } from 'src/application/services/fact-check.service';
import { ConversationMemoryService } from './services/conversation-memory.service';
import { ChatWithWebSearchUseCase } from 'src/core/use-cases/chat-with-search.usecase';

@Module({
  imports: [SearchModule, AiModule],
  providers: [
    DiscordService,
    SearchCommand,
    ChatCommand,
    VerifyCommand,
    HelpCommand,
    AnalyzeCommand,
    SearchWithFactCheckUseCase,
    VerifyClaimUseCase,
    ChatWithAiUseCase,
    ChatWithWebSearchUseCase,
    FactCheckService,
    EmbedBuilderService,
    ConversationMemoryService,
  ],
})
export class DiscordModule {}
