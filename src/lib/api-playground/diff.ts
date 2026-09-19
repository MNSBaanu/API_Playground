export type DiffLine = {
  type: "same" | "add" | "del";
  left: string | null;
  right: string | null;
};

const MAX_LCS_CELLS = 4_000_000;

// LCS-based line diff. Common prefix/suffix are trimmed first; if the changed
// middle is still too large for the LCS table, it falls back to delete-all/add-all.
export function diffLines(a: string, b: string): DiffLine[] {
  const aLines = a.split("\n");
  const bLines = b.split("\n");

  let start = 0;
  while (start < aLines.length && start < bLines.length && aLines[start] === bLines[start]) {
    start++;
  }
  let endA = aLines.length;
  let endB = bLines.length;
  while (endA > start && endB > start && aLines[endA - 1] === bLines[endB - 1]) {
    endA--;
    endB--;
  }

  const same = (line: string): DiffLine => ({ type: "same", left: line, right: line });
  return [
    ...aLines.slice(0, start).map(same),
    ...diffMiddle(aLines.slice(start, endA), bLines.slice(start, endB)),
    ...aLines.slice(endA).map(same),
  ];
}

function diffMiddle(aLines: string[], bLines: string[]): DiffLine[] {
  const m = aLines.length;
  const n = bLines.length;
  const out: DiffLine[] = [];

  if (m * n > MAX_LCS_CELLS) {
    for (const line of aLines) out.push({ type: "del", left: line, right: null });
    for (const line of bLines) out.push({ type: "add", left: null, right: line });
    return out;
  }

  // dp[i][j] = LCS length of aLines[i..] and bLines[j..]
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (aLines[i] === bLines[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

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
