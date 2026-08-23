import { describe, expect, it } from "vitest";
import { extractReadableText } from "./web-research";

describe("extractReadableText", () => {
  it("keeps article text and removes navigation and scripts", () => {
    const html = `<html><body><nav>메뉴</nav><main><h1>업데이트 해결</h1><p>설정에서 업데이트를 확인합니다.</p><script>secret()</script></main><footer>광고</footer></body></html>`;
    const text = extractReadableText(html);
    expect(text).toContain("업데이트 해결");
    expect(text).toContain("설정에서 업데이트를 확인합니다.");
    expect(text).not.toContain("secret");
    expect(text).not.toContain("광고");
  });
});
