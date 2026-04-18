/**
 * SVG bar chart for monthly commit counts (used by production-report.mjs).
 * Y-axis pinned at 0; sparse X labels; red→green bar fill by value in range.
 */
import * as fs from "node:fs/promises";

function escapeXml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** Upper bound for Y scale: slightly above max, with readable tick steps (e.g. 287 → 300, not 500). */
function niceCeilAxis(n) {
  if (!Number.isFinite(n) || n <= 0) return 1;
  const headroom = Math.max(n * 1.02, n + 1);
  const exp = Math.floor(Math.log10(headroom));
  const base = 10 ** exp;
  for (const mult of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 9, 10]) {
    const cap = mult * base;
    if (cap >= headroom) return Math.round(cap);
  }
  return Math.ceil(headroom);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Red (low) → green (high) by value within [minV, maxV]. */
function barColorRgb(value, minV, maxV) {
  if (maxV <= minV) return "rgb(160, 160, 40)";
  const t = Math.min(1, Math.max(0, (value - minV) / (maxV - minV)));
  const r = Math.round(lerp(214, 35, t));
  const g = Math.round(lerp(48, 170, t));
  const b = Math.round(lerp(48, 72, t));
  return `rgb(${r},${g},${b})`;
}

/**
 * SVG bar chart: Y starts at 0 (baseline aligned), sparse X labels, black text,
 * bar fill from red (fewer commits) to green (more) across the dataset range.
 */
export function buildCommitsBarChartSvg(labels, values, title) {
  const n = labels.length;
  const maxVal = n ? Math.max(...values) : 0;
  const minVal = n ? Math.min(...values) : 0;
  const yMax = niceCeilAxis(maxVal);
  const width = 960;
  const height = 440;
  const padL = 54;
  const padR = 28;
  const padT = 48;
  const padB = 108;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const baselineY = padT + plotH;

  const divisions = 5;
  const yTicks = Array.from({ length: divisions + 1 }, (_, i) => Math.round((yMax * i) / divisions));

  const maxLabels = 18;
  const labelStride = Math.max(1, Math.ceil(n / maxLabels));

  const parts = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escapeXml(title)}">`
  );
  parts.push('<rect x="0" y="0" width="100%" height="100%" fill="#ffffff"/>');
  parts.push(
    `<text x="${width / 2}" y="28" text-anchor="middle" fill="#000000" font-family="system-ui,Segoe UI,Helvetica,Arial,sans-serif" font-size="16" font-weight="600">${escapeXml(title)}</text>`
  );

  parts.push(
    `<line x1="${padL}" y1="${baselineY}" x2="${padL + plotW}" y2="${baselineY}" stroke="#000000" stroke-width="1.5"/>`
  );
  parts.push(`<line x1="${padL}" y1="${padT}" x2="${padL}" y2="${baselineY}" stroke="#000000" stroke-width="1.5"/>`);

  for (const tv of yTicks) {
    const yy = baselineY - (tv / yMax) * plotH;
    if (tv > 0) {
      parts.push(
        `<line x1="${padL}" y1="${yy}" x2="${padL + plotW}" y2="${yy}" stroke="#e8e8e8" stroke-width="1"/>`
      );
    }
    const labelY = tv === 0 ? yy - 4 : yy + 4;
    parts.push(
      `<text x="${padL - 8}" y="${labelY}" text-anchor="end" fill="#000000" font-family="system-ui,Segoe UI,Helvetica,Arial,sans-serif" font-size="12">${tv}</text>`
    );
  }

  parts.push(
    `<text transform="translate(${padL - 42},${padT + plotH / 2}) rotate(-90)" text-anchor="middle" fill="#000000" font-family="system-ui,Segoe UI,Helvetica,Arial,sans-serif" font-size="13">Commits</text>`
  );

  const slotW = n > 0 ? plotW / n : plotW;
  const barW = n > 0 ? slotW * 0.72 : 0;

  for (let i = 0; i < n; i += 1) {
    const v = values[i];
    const cx = padL + (i + 0.5) * slotW;
    const h = yMax > 0 ? (v / yMax) * plotH : 0;
    const x = cx - barW / 2;
    const y = baselineY - h;
    parts.push(
      `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${h.toFixed(2)}" fill="${barColorRgb(v, minVal, maxVal)}" stroke="#333333" stroke-width="0.3"/>`
    );
  }

  for (let i = 0; i < n; i += 1) {
    if (i % labelStride !== 0 && i !== n - 1) continue;
    const cx = padL + (i + 0.5) * slotW;
    const lab = labels[i];
    parts.push(`<g transform="translate(${cx.toFixed(2)},${baselineY + 14}) rotate(-42)">`);
    parts.push(
      `<text text-anchor="end" fill="#000000" font-family="system-ui,Segoe UI,Helvetica,Arial,sans-serif" font-size="10">${escapeXml(lab)}</text>`
    );
    parts.push("</g>");
  }

  parts.push(
    `<text x="${width / 2}" y="${height - 20}" text-anchor="middle" fill="#000000" font-family="system-ui,Segoe UI,Helvetica,Arial,sans-serif" font-size="11">Bar color: red = fewer commits in this range · green = more · Y-axis is 0 at the baseline.</text>`
  );
  parts.push("</svg>");
  return parts.join("\n");
}

export async function writeCommitsChartSvg(outSvgPath, labels, values, title) {
  const svg = buildCommitsBarChartSvg(labels, values, title);
  await fs.writeFile(outSvgPath, `${svg}\n`, "utf8");
}
