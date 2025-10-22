import { SearchResultEntity } from "./search-result.entity";

export enum FactCheckStatus {
  TRUE = 'true',
  FALSE = 'false',
  PARTIUALLY_TRUE = 'partially_true',
  INSUFFICIENT_DATA = 'insufficient_data',
}

export class FactCheckEntity {
  constructor(
    public readonly claim: string,
    public readonly status: FactCheckStatus,
    public readonly explanation: string,
    public readonly sources: SearchResultEntity[],
    public readonly confidence: number,
  ) { }
}
