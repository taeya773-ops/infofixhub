import { env } from "@/lib/env";
export const providerStates = () => [
 {name:"OpenAI",connected:Boolean(env.OPENAI_API_KEY)}, {name:"Keyword Provider",connected:env.KEYWORD_PROVIDER==="manual"||Boolean(env.KEYWORD_PROVIDER_API_KEY)},
 {name:"SERP Provider",connected:Boolean(env.SERP_PROVIDER&&env.SERP_PROVIDER_API_KEY)}, {name:"Google Trends",connected:env.GOOGLE_TRENDS_ENABLED==="true"},
 {name:"Google Ads",connected:env.GOOGLE_ADS_ENABLED==="true"&&Boolean(env.GOOGLE_ADS_DEVELOPER_TOKEN&&env.GOOGLE_ADS_CUSTOMER_ID)},
 {name:"Search Console",connected:env.GOOGLE_SEARCH_CONSOLE_ENABLED==="true"&&Boolean(env.GOOGLE_CLIENT_EMAIL&&env.GOOGLE_PRIVATE_KEY)} ];
export async function withRetry<T>(operation:()=>Promise<T>,max=3){ let error:unknown; for(let attempt=0;attempt<max;attempt++){ try{return await operation()}catch(e){error=e;if(attempt<max-1) await new Promise(r=>setTimeout(r,200*2**attempt))} } throw error; }
