// Stats primitives — Wilson CI, Shannon entropy, Cohen's kappa.
// Inline tests via node:test. Run with: pnpm test:stats
//
// All formulas implemented from primary sources:
// - Wilson, E.B. (1927) "Probable inference, the law of succession, and statistical inference"
// - Shannon, C.E. (1948) "A Mathematical Theory of Communication"
// - Cohen, J. (1960) "A coefficient of agreement for nominal scales"

/**
 * Inverse standard normal CDF (probit). Beasley-Springer-Moro approximation.
 * Sufficient precision for confidence intervals at common levels (0.90, 0.95, 0.99).
 */
function probit(p: number): number {
  if (p <= 0 || p >= 1) throw new RangeError('probit: p must be in (0, 1)');
  // Acklam's algorithm (well-known, ~1e-9 absolute error)
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239e0];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838e0, -2.549732539343734e0, 4.374664141464968e0, 2.938163982698783e0];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996e0, 3.754408661907416e0];
  const pLow = 0.02425;
  const pHigh = 1 - pLow;
  let q: number, r: number;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= pHigh) {
    q = p - 0.5;
    r = q * q;
    return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
}

/**
 * Wilson score 95% confidence interval for a binomial proportion.
 * Returns [lower, upper] in [0, 1].
 *
 * Robust at small n and at p near 0 or 1, where the normal approximation
 * (Wald interval) misbehaves.
 */
export function wilsonInterval(successes: number, total: number, confidence = 0.95): [number, number] {
  if (total === 0) return [0, 0];
  if (successes < 0 || successes > total) throw new RangeError('wilsonInterval: successes out of range');
  const z = probit(1 - (1 - confidence) / 2);
  const p = successes / total;
  const n = total;
  const denom = 1 + (z * z) / n;
  const center = (p + (z * z) / (2 * n)) / denom;
  const half = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / denom;
  return [Math.max(0, center - half), Math.min(1, center + half)];
}

/**
 * Shannon entropy of a discrete distribution, normalized to [0, 1].
 * Input is a vector of counts or probabilities (any non-negative numbers).
 * Returns 0 for a degenerate distribution, 1 for uniform over the support.
 */
export function shannonEntropy(distribution: number[]): number {
  const total = distribution.reduce((a, b) => a + b, 0);
  if (total === 0) return 0;
  const k = distribution.length;
  if (k <= 1) return 0;
  let h = 0;
  for (const c of distribution) {
    if (c <= 0) continue;
    const p = c / total;
    h -= p * Math.log2(p);
  }
  const maxH = Math.log2(k);
  return maxH === 0 ? 0 : h / maxH;
}

/**
 * Cohen's kappa for two raters with the same set of category labels.
 * Returns kappa in [-1, 1]. 1 = perfect agreement, 0 = chance agreement.
 */
export function cohensKappa(rater1: string[], rater2: string[]): number {
  if (rater1.length !== rater2.length) throw new RangeError('cohensKappa: rater length mismatch');
  const n = rater1.length;
  if (n === 0) return 0;
  const categories = new Set<string>([...rater1, ...rater2]);
  let agree = 0;
  for (let i = 0; i < n; i++) if (rater1[i] === rater2[i]) agree++;
  const po = agree / n;
  let pe = 0;
  for (const c of categories) {
    const p1 = rater1.filter((x) => x === c).length / n;
    const p2 = rater2.filter((x) => x === c).length / n;
    pe += p1 * p2;
  }
  if (pe === 1) return 1; // both raters used a single label, fully and identically
  return (po - pe) / (1 - pe);
}

