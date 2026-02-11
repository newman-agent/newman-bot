import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { LLMAdapter } from './adapters/llm.adapter';
import { AiRepository } from '../../core/domain/repositories/ai.repository';

@Module({
  providers: [
    LLMAdapter,
    {
      provide: AiRepository,
      useClass: AiService,
    },
  ],
  exports: [AiRepository],
})
export class AiModule { }
