import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_HTML_BYTES = 1_500_000;
const MAX_TEXT_CHARS = 10_000;

function isPrivateAddress(address: string) {
  if (address === "::1" || address.startsWith("fc") || address.startsWith("fd") || address.startsWith("fe80:")) return true;
  if (!isIP(address)) return true;
  const parts = address.split(".").map(Number);
  if (parts.length !== 4) return false;
  return parts[0] === 10 || parts[0] === 127 || parts[0] === 0 || (parts[0] === 169 && parts[1] === 254) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || (parts[0] === 192 && parts[1] === 168);
}

async function assertPublicUrl(value: string) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error("Unsupported source URL");
  const records = await lookup(url.hostname, { all: true });
  if (!records.length || records.some((record) => isPrivateAddress(record.address))) throw new Error("Private source URL is not allowed");
  return url;
}

export function extractReadableText(html: string) {
  const preferred = html.match(/<(?:article|main)\b[^>]*>([\s\S]*?)<\/(?:article|main)>/i)?.[1] ?? html;
  return preferred
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .replace(/<(script|style|svg|noscript|template|nav|footer|header|aside|form)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|section|article|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n\n").trim().slice(0, MAX_TEXT_CHARS);
}

export async function crawlPublicPage(sourceUrl: string) {
  let url = await assertPublicUrl(sourceUrl);
  for (let redirect = 0; redirect <= 3; redirect += 1) {
    const response = await fetch(url, { redirect: "manual", cache: "no-store", headers: { "User-Agent": "InfoFixHubResearchBot/1.0 (+https://infofixhub.org/robots.txt)", Accept: "text/html,application/xhtml+xml,text/plain;q=0.8" }, signal: AbortSignal.timeout(15_000) });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === 3) throw new Error("Too many redirects");
      url = await assertPublicUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) throw new Error(`Source returned ${response.status}`);
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain") && !contentType.includes("application/xhtml+xml")) throw new Error("Unsupported source content type");
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength > MAX_HTML_BYTES) throw new Error("Source document is too large");
    const text = extractReadableText(new TextDecoder().decode(bytes));
    if (text.length < 200) throw new Error("Source content is too short");
    return { finalUrl: url.toString(), text };
  }
  throw new Error("Source crawl failed");
}
