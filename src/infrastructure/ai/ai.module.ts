import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { PawanAdapter } from './adapters/pawan.adapter';
import { AiRepository } from '../../core/domain/repositories/ai.repository';

@Module({
  providers: [
    PawanAdapter,
    {
      provide: AiRepository,
      useClass: AiService,
    },
  ],
  exports: [AiRepository],
})

export class AiModule { }


