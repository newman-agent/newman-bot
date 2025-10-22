import { Injectable } from '@nestjs/common';
import { SearchRepository } from '../domain/repositories/search.repository';
import { AiRepository } from '../domain/repositories/ai.repository';
import { SearchQuery } from '../domain/value-objects/search-query.vo';
import { MessageEntity } from '../domain/entities/message.entity';
import { FactCheckEntity } from '../domain/entities/fact-check.entity';
import { FactCheckService } from 'src/application/services/fact-check.service';

@Injectable()
export class VerifyClaimUseCase {
  constructor(
    private readonly searchRepository: SearchRepository,
    private readonly aiRepository: AiRepository,
    private readonly factCheckService: FactCheckService,
  ) { }

  async execute(claim: string): Promise<FactCheckEntity> {
    // 1. Buscar informações sobre a afirmação
    const query = SearchQuery.create(`fact check ${claim}`);
    const searchResults = await this.searchRepository.search(query);

    // 2. Analisar qualidade das fontes
    const sourceQuality = this.factCheckService.analyzeSourceQuality(searchResults);

    // 3. Preparar contexto
    const context = searchResults
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nFonte: ${r.url}`)
      .join('\n\n');

    // 4. Pedir análise da IA com instruções específicas
    const messages = [
      new MessageEntity(
        'user',
        `Verifique esta afirmação: "${claim}". 

Analise criticamente com base nas fontes fornecidas.

INSTRUÇÕES:
1. Determine o status: VERDADEIRO, FALSO, PARCIALMENTE VERDADEIRO ou DADOS INSUFICIENTES
2. Explique seu raciocínio detalhadamente
3. Cite as fontes usando [1], [2], etc.
4. Indique o nível de confiança (0-100%)
5. Identifique pontos que suportam ou contradizem a afirmação

Qualidade das fontes encontradas: ${sourceQuality.score}/100
${sourceQuality.details.join('\n')}`,
      ),
    ];

    const analysis = await this.aiRepository.chat(messages, context);

    // 5. Extrair informações estruturadas da análise
    const status = this.factCheckService.extractFactCheckStatus(analysis);
    const confidence = this.factCheckService.extractConfidenceLevel(analysis);
    const redFlags = this.factCheckService.identifyRedFlags(claim + ' ' + analysis, searchResults);
    const supportingPoints = this.factCheckService.identifySupportingPoints(analysis, searchResults);

    // 6. Enriquecer análise com red flags e pontos de suporte
    let enrichedAnalysis = analysis;

    if (redFlags.length > 0) {
      enrichedAnalysis += `\n\n⚠️ **Alertas:**\n${redFlags.map(f => `• ${f}`).join('\n')}`;
    }

    if (supportingPoints.length > 0) {
      enrichedAnalysis += `\n\n✅ **Pontos Positivos:**\n${supportingPoints.map(p => `• ${p}`).join('\n')}`;
    }

    // 7. Retornar resultado estruturado
    return new FactCheckEntity(
      claim,
      status,
      enrichedAnalysis,
      searchResults,
      confidence,
    );
  }
}
