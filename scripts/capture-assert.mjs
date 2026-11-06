/**
 * Shared capture failure markdown (overflow / topH) for scripts + smoke.
 * Used by capture-340px-long-title.mjs, capture-1280-desktop.mjs, GITHUB_STEP_SUMMARY.
 */
export function formatCaptureFailMarkdown(title, detail = {}, opts = {}) {
  const kind = opts.kind || 'capture';
  return [
    `### ${kind} assertion failed`,
    '',
    `**${title}**`,
    '',
    '```json',
    JSON.stringify(detail, null, 2),
    '```',
    '',
    `- overflow: \`${detail.overflow}\` (want \`ellipsis\`)`,
    `- overflows: \`${detail.overflows}\` (want text wider than select)`,
    `- topH: \`${detail.topH}\` (want ≤100)`,
    '',
  ].join('\n');
}
