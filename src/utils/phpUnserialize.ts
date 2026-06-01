/**
 * PHP serialize 형식의 배열 문자열에서 값 배열만 추출한다.
 * 예) 'a:4:{i:0;s:1:"1";i:1;s:1:"2";}' → ['1', '2']
 */
export function parsePhpSerializedArray(raw: string | null | undefined): string[] {
  if (!raw) return []
  const matches = raw.match(/s:\d+:"([^"]+)"/g)
  if (!matches) return []
  return matches.map((m) => m.replace(/s:\d+:"([^"]+)"/, '$1'))
}
