export function HeroSearch({ query = "" }: { query?: string }) {
  return (
    <form className="editorial-search" action="/search" method="get" role="search">
      <label htmlFor="knowledge-query" className="editorial-sr-only">공개된 글의 제목과 주제 검색</label>
      <input id="knowledge-query" type="search" name="q" defaultValue={query} maxLength={120} placeholder="무엇이 궁금하세요?" autoComplete="off" />
      <button type="submit"><span>SEARCH</span><span aria-hidden="true">↗</span><span className="editorial-sr-only">검색</span></button>
    </form>
  );
}
