import { Injectable, Logger } from '@nestjs/common';
import { SearchResultEntity } from '../../core/domain/entities/search-result.entity';
import { FactCheckStatus } from '../../core/domain/entities/fact-check.entity';

export interface SourceQualityAnalysis {
  score: number;
  details: string[];
}

export interface FactCheckAnalysis {
  status: FactCheckStatus;
  confidence: number;
  reasoning: string;
  redFlags: string[];
  supportingPoints: string[];
}

@Injectable()
export class FactCheckService {
  private readonly logger = new Logger(FactCheckService.name);

  /**
   * Analisa a qualidade e confiabilidade das fontes
   */
  analyzeSourceQuality(sources: SearchResultEntity[]): SourceQualityAnalysis {
    const details: string[] = [];
    let score = 0;

    if (sources.length === 0) {
      return { score: 0, details: ['❌ Nenhuma fonte encontrada'] };
    }

    // Verifica número de fontes
    if (sources.length >= 3) {
      score += 30;
      details.push(`✅ Múltiplas fontes encontradas (${sources.length})`);
    } else if (sources.length >= 2) {
      score += 20;
      details.push(`⚠️ Poucas fontes encontradas (${sources.length})`);
    } else {
      score += 10;
      details.push(`❌ Apenas uma fonte encontrada`);
    }

    // Analisa domínios confiáveis
    const reliableCount = this.countReliableDomains(sources);
    if (reliableCount > 0) {
      score += reliableCount * 15;
      details.push(`✅ ${reliableCount} fonte(s) de alta confiabilidade`);
    }

    // Verifica diversidade de fontes
    const uniqueDomains = new Set(
      sources.map((s) => {
        try {
          return new URL(s.url).hostname;
        } catch {
          return s.url;
        }
      })
    ).size;

    if (uniqueDomains === sources.length) {
      score += 20;
      details.push('✅ Fontes de domínios diversos');
    } else if (uniqueDomains > 1) {
      score += 10;
      details.push(`⚠️ Alguma diversidade (${uniqueDomains} domínios diferentes)`);
    }

    // Normaliza score para máximo de 100
    score = Math.min(score, 100);

    return { score, details };
  }

  /**
   * Extrai status de fact-check de um texto de análise
   */
  extractFactCheckStatus(text: string): FactCheckStatus {
    const lower = text.toLowerCase();

    // Padrões para identificar cada status
    const patterns = {
      [FactCheckStatus.TRUE]: [
        /\b(verdadeiro|verdadeira|correto|correta|confirmado|confirmada)\b/i,
        /\b(é verdade|está correto|comprovado)\b/i,
        /\b(verdadeiro)/i,
      ],
      [FactCheckStatus.FALSE]: [
        /\b(falso|falsa|incorreto|incorreta|mentira|fake|enganoso)\b/i,
        /\b(não é verdade|está errado|desmentido)\b/i,
        /\b(falso)/i,
      ],
      [FactCheckStatus.PARTIALLY_TRUE]: [
        /\b(parcialmente|em parte|meio verdade|meia verdade)\b/i,
        /\b(verdade em parte|contexto necessário|depende do contexto)\b/i,
        /\b(parcial)/i,
      ],
    };

    // Conta matches para cada status
    const scores: Record<string, number> = {
      [FactCheckStatus.TRUE]: 0,
      [FactCheckStatus.FALSE]: 0,
      [FactCheckStatus.PARTIALLY_TRUE]: 0,
    };

    for (const [status, patternList] of Object.entries(patterns)) {
      for (const pattern of patternList) {
        const matches = text.match(new RegExp(pattern, 'gi'));
        if (matches) {
          scores[status] += matches.length;
        }
      }
    }

    // Determina status com maior score
    const maxScore = Math.max(...Object.values(scores));
    if (maxScore === 0) {
      return FactCheckStatus.INSUFFICIENT_DATA;
    }

    for (const [status, score] of Object.entries(scores)) {
      if (score === maxScore) {
        return status as FactCheckStatus;
      }
    }

    return FactCheckStatus.INSUFFICIENT_DATA;
  }

  /**
   * Extrai nível de confiança de um texto (0-100)
   */
  extractConfidenceLevel(text: string): number {
    // Procura por menções explícitas de confiança/certeza
    const confidencePatterns = [
      /confiança[:\s]+(\d+)%?/i,
      /confidence[:\s]+(\d+)%?/i,
      /certeza[:\s]+(\d+)%?/i,
      /(\d+)%\s+de\s+(confiança|certeza)/i,
    ];

    for (const pattern of confidencePatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const value = parseInt(match[1], 10);
        return Math.min(Math.max(value, 0), 100);
      }
    }

    // Inferência baseada em palavras-chave qualitativas
    const lower = text.toLowerCase();

    if (
      lower.includes('muito provável') ||
      lower.includes('altamente confiável') ||
      lower.includes('consenso científico') ||
      lower.includes('amplamente comprovado')
    ) {
      return 85;
    }

    if (
      lower.includes('provável') ||
      lower.includes('confiável') ||
      lower.includes('evidências suportam') ||
      lower.includes('bem documentado')
    ) {
      return 70;
    }

    if (
      lower.includes('possivelmente') ||
      lower.includes('pode ser') ||
      lower.includes('alguma evidência') ||
      lower.includes('indícios')
    ) {
      return 50;
    }

    if (
      lower.includes('improvável') ||
      lower.includes('pouca evidência') ||
      lower.includes('não confirmado') ||
      lower.includes('duvidoso')
    ) {
      return 30;
    }

    if (
      lower.includes('altamente improvável') ||
      lower.includes('sem evidências') ||
      lower.includes('desmentido')
    ) {
      return 15;
    }

    // Default médio quando não há indicadores claros
    return 50;
  }

  /**
   * Identifica red flags (sinais de alerta) em afirmações
   */
  identifyRedFlags(text: string, sources: SearchResultEntity[]): string[] {
    const redFlags: string[] = [];
    const lower = text.toLowerCase();

    // Alerta sobre quantidade de fontes
    if (sources.length < 2) {
      redFlags.push('⚠️ Poucas fontes disponíveis para verificação cruzada');
    }

    // Padrões de linguagem problemática
    if (
      lower.includes('sem fonte') ||
      lower.includes('fonte desconhecida') ||
      lower.includes('fonte anônima')
    ) {
      redFlags.push('🚩 Fontes não identificadas ou anônimas mencionadas');
    }

    if (
      lower.includes('teoria da conspiração') ||
      lower.includes('governo oculta') ||
      lower.includes('eles não querem que você saiba')
    ) {
      redFlags.push('🚩 Possível teoria conspiratória');
    }

    if (
      lower.includes('100% eficaz') ||
      lower.includes('totalmente comprovado') ||
      lower.includes('absolutamente certo')
    ) {
      redFlags.push('🚩 Linguagem absoluta (raramente aplicável em fatos)');
    }

    if (
      lower.includes('compartilhe urgente') ||
      lower.includes('não deixe apagar') ||
      lower.includes('mídia esconde') ||
      lower.includes('a verdade que')
    ) {
      redFlags.push('🚩 Linguagem típica de desinformação viral');
    }

    if (
      lower.includes('remédio milagroso') ||
      lower.includes('cura definitiva') ||
      lower.includes('médicos odeiam')
    ) {
      redFlags.push('🚩 Promessas de curas milagrosas');
    }

    // Verifica URLs suspeitas nas fontes
    const suspiciousDomains = sources.filter((s) =>
      this.isSuspiciousDomain(s.url)
    );
    if (suspiciousDomains.length > 0) {
      redFlags.push(
        `🚩 ${suspiciousDomains.length} fonte(s) de domínios questionáveis`
      );
    }

    return redFlags;
  }

  /**
   * Identifica pontos que suportam a confiabilidade
   */
  identifySupportingPoints(text: string, sources: SearchResultEntity[]): string[] {
    const points: string[] = [];

    // Conta fontes confiáveis
    const reliableCount = this.countReliableDomains(sources);
    if (reliableCount > 0) {
      points.push(`✅ ${reliableCount} fonte(s) de alta confiabilidade`);
    }

    const lower = text.toLowerCase();

    // Verifica menções de especialistas
    if (
      lower.match(/especialista|pesquisador|cientista|professor|doutor/i)
    ) {
      points.push('✅ Cita especialistas ou autoridades no assunto');
    }

    // Verifica menções de estudos/pesquisas
    if (
      lower.match(/estudo|pesquisa|análise|investigação|paper|artigo científico/i)
    ) {
      points.push('✅ Referencia estudos ou pesquisas');
    }

    // Verifica consenso
    if (
      lower.match(/consenso|amplamente aceito|comprovado|bem estabelecido/i)
    ) {
      points.push('✅ Indica consenso ou ampla aceitação');
    }

    // Verifica revisão por pares
    if (lower.match(/peer.?review|revisado por pares|revisão por pares/i)) {
      points.push('✅ Menciona revisão por pares');
    }

    // Verifica dados quantitativos
    if (lower.match(/\d+%|\d+ participantes|amostra de \d+/i)) {
      points.push('✅ Apresenta dados quantitativos específicos');
    }

    return points;
  }

  /**
   * Conta quantos domínios confiáveis existem nas fontes
   */
  private countReliableDomains(sources: SearchResultEntity[]): number {
    return sources.filter((s) => this.isReliableDomain(s.url)).length;
  }

  /**
   * Verifica se um domínio é considerado confiável
   */
  private isReliableDomain(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();

      const reliableDomains = [
        // Notícias confiáveis Brasil
        'g1.globo.com',
        'folha.uol.com.br',
        'estadao.com.br',
        'valor.globo.com',
        'exame.com',
        'bbc.com',
        'uol.com.br',
        'oglobo.globo.com',

        // Fact-checking
        'aos.faktos.org',
        'lupa.uol.com.br',
        'boatos.org',
        'e-farsas.com',
        'comprova.com.br',

        // Instituições governamentais e educacionais
        'gov.br',
        'edu.br',
        'fiocruz.br',
        'anvisa.gov.br',
        'saude.gov.br',

        // Organizações internacionais
        'who.int',
        'cdc.gov',
        'nih.gov',

        // Mídia internacional confiável
        'reuters.com',
        'apnews.com',
        'bbc.co.uk',
        'theguardian.com',
        'nytimes.com',

        // Fact-checking internacional
        'factcheck.org',
        'snopes.com',
        'politifact.com',
        'fullfact.org',

        // Científico/Acadêmico
        'nature.com',
        'science.org',
        'sciencedirect.com',
        'pubmed.ncbi.nlm.nih.gov',
      ];

      return reliableDomains.some((domain) => hostname.includes(domain));
    } catch {
      return false;
    }
  }

  /**
   * Verifica se um domínio é suspeito
   */
  private isSuspiciousDomain(url: string): boolean {
    try {
      const hostname = new URL(url).hostname.toLowerCase();

      // Padrões que indicam domínios suspeitos
      const suspiciousPatterns = [
        /\d{4,}/, // Muitos números consecutivos
        /-news\./, // Padrão "-news.algo"
        /-noticias\./, // Padrão "-noticias.algo"
        /\.tk$/, // TLD .tk (frequentemente usado para spam)
        /\.ml$/, // TLD .ml (frequentemente usado para spam)
        /\.ga$/, // TLD .ga (frequentemente usado para spam)
        /fake/i,
        /hoax/i,
        /clickbait/i,
      ];

      return suspiciousPatterns.some((pattern) => pattern.test(hostname));
    } catch {
      return true; // URL inválida é considerada suspeita
    }
  }
}
