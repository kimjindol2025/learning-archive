/**
 * FreeLang → Z-Lang Standard Library Mapping
 *
 * FreeLang의 표준 함수를 Z-Lang으로 매핑
 */

export const STDLIB_MAP: Record<string, string | ((args: string[]) => string)> = {
  // 출력
  "println": (args: string[]) => {
    if (args.length === 0) {
      return `print("\\n")`;
    }
    return `print(${args[0]}); print("\\n")`;
  },

  "print": "print",

  // 타입 변환
  "str": "toString",
  "toStr": "toString",
  "parseInt": "parseInt",
  "parseFloat": "parseFloat",

  // 배열/컬렉션
  "len": "length",
  "push": "push",
  "pop": "pop",
  "shift": "shift",
  "unshift": "unshift",

  // 수학
  "abs": "abs",
  "min": "min",
  "max": "max",
  "sqrt": "sqrt",
  "pow": "pow",

  // 입출력
  "input": "input",
  "readLine": "readLine",

  // 기본값 (매핑 필요 없음)
  "range": "range",
};

/**
 * 함수 호출을 Z-Lang으로 변환
 */
export function transpileCall(funcName: string, args: string[]): string {
  const mapped = STDLIB_MAP[funcName];

  if (typeof mapped === "function") {
    return mapped(args);
  } else if (typeof mapped === "string") {
    return `${mapped}(${args.join(", ")})`;
  } else {
    // 매핑되지 않은 함수는 그대로 유지
    return `${funcName}(${args.join(", ")})`;
  }
}
