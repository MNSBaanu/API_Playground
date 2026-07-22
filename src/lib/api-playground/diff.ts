export type DiffLine = {
  type: "same" | "add" | "del";
  left: string | null;
  right: string | null;
};

// LCS-based line diff. Small inputs (response bodies capped by history).
export function diffLines(a: string, b: string): DiffLine[] {
  const aLines = a.split("\n");
  const bLines = b.split("\n");
  const m = aLines.length;
  const n = bLines.length;

  // dp[i][j] = LCS length of aLines[i..] and bLines[j..]
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0),
  );
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (aLines[i] === bLines[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (aLines[i] === bLines[j]) {
      out.push({ type: "same", left: aLines[i], right: bLines[j] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: "del", left: aLines[i], right: null });
      i++;
    } else {
      out.push({ type: "add", left: null, right: bLines[j] });
      j++;
    }
  }
  while (i < m) {
    out.push({ type: "del", left: aLines[i++], right: null });
  }
  while (j < n) {
    out.push({ type: "add", left: null, right: bLines[j++] });
  }
  return out;
}
