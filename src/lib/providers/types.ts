export type KeywordDiscoveryInput={seed:string;country:string;language:string};
export type KeywordCandidate={keyword:string;provider:string};
export type KeywordMetric={keyword:string;searchVolume:number|null;competitionScore:number|null};
export interface KeywordProvider { name:string; discover(input:KeywordDiscoveryInput):Promise<KeywordCandidate[]>; metrics(keywords:string[]):Promise<KeywordMetric[]> }
export type TrendMetric={keyword:string;trendScore:number|null;growthRate:number|null};
export interface TrendProvider { name:string; getTrendMetrics(keywords:string[],region:string):Promise<TrendMetric[]> }
export interface SerpProvider { name:string; analyze(keyword:string,country:string):Promise<{competitionScore:number|null;contentGapScore:number|null}> }
