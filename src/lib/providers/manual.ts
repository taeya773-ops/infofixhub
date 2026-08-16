import type { KeywordProvider } from "./types";
export class ManualSeedProvider implements KeywordProvider { name="MANUAL"; async discover(input:Parameters<KeywordProvider["discover"]>[0]){return [{keyword:input.seed,provider:this.name}]}; async metrics(keywords:string[]){return keywords.map(keyword=>({keyword,searchVolume:null,competitionScore:null}))} }
