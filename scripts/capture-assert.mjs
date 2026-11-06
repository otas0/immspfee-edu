/**
 * Shared capture failure markdown (overflow / topH) for scripts + smoke.
 * Used by capture-340px-long-title.mjs and GITHUB_STEP_SUMMARY.
 */
export function formatCaptureFailMarkdown(title, detail = {}) {
  return [
    '### capture:340-title assertion failed',
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
