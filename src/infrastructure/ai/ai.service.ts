import { Injectable } from "@nestjs/common";
import { MessageEntity } from "src/core/domain/entities/message.entity";
import { PawanAdapter } from "./adapters/pawan.adapter";
import { AiRepository } from "src/core/domain/repositories/ai.repository";

@Injectable()
export class AiService implements AiRepository {
  constructor(private readonly pawanAdapter: PawanAdapter) { }

  async chat(messages: MessageEntity[], context?: string): Promise<string> {
    return this.pawanAdapter.chat(messages, context);
  }
}

