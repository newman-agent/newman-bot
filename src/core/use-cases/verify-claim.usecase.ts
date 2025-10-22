import { Injectable } from "@nestjs/common";
import { AiRepository } from "../domain/repositories/ai.repository";
import { SearchRepository } from "../domain/repositories/search.repository";
import { SearchQuery } from "../domain/value-objects/search-query.vo";
import { FactCheckEntity } from "../domain/entities/fact-check.entity";
import { MessageEntity } from "../domain/entities/message.entity";

@Injectable()
export class VerifyClaimUseCase {
  constructor(
    private readonly searchRepository: SearchRepository,
    private readonly aiRepository: AiRepository,
  ) { }

  async execute(claim: string): Promise<FactCheckEntity> {

    // 1. Search for information related to the claim
    const query = SearchQuery.create(`fact check: ${claim}`);
    const searchResults = await this.searchRepository.search(query);

    // 2. Prepare context
    const context = searchResults
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nFonte: ${r.url}`)
      .join('\n\n');

    // 3. Ask AI to verify the claim
    const messages = [
      new MessageEntity(
        'user',
        `Verifique a seguinte afirmação: "${claim}". Indique se é verdadeira, falsa, parcialmente verdadeira ou sem informações suficientes. Explique o raciocício e cite as fontes. Forneça também um nível de confiança de 0-100`,
      ),
    ];
    const analysis = await this.aiRepository.chat(messages, context);

    // 4. Return the fact-check result
    return new FactCheckEntity(
      claim,
      this.extractStatus(analysis),
      analysis,
      searchResults,
      this.extractConfidence(analysis)
    );
  }

  private extractStatus(analysis: string): any {
    const lower = analysis.toLowerCase();

    if (lower.includes('verdadeira') && !lower.includes('parcialmente')) {
      return 'true';
    }
    if (lower.includes('falsa')) return 'false';
    if (lower.includes('parcialmente')) return 'partially_true';
    return 'insufficient_data';
  }


  private extractConfidence(analysis: string): number {
    const match = analysis.match(/confiança[:\s]+(\d+)/i);
    return match ? parseInt(match[1]) : 50;
  }

}

