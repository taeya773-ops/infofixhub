export function normalizeKeyword(value:string){return value.trim().toLocaleLowerCase().replace(/\s+/g," ")}
export function slugify(value:string){return value.normalize("NFKC").toLocaleLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu,"-").replace(/(^-|-$)/g,"")}
