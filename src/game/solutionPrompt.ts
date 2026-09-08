/**
 * Prompt construction for generated worked solutions.
 *
 * Kept separate from any transport so the dev proxy and a future Supabase Edge
 * Function build the identical request - only where it runs differs.
 */

export interface SolutionRequest {
  question: string
  options: string[]
  correctIndex: number
  subject: string
  topic: string
  difficulty: number
}

export const SOLUTION_SYSTEM_PROMPT = [
  'You are a patient JEE-level tutor writing a worked solution for a student who just got this question wrong.',
  '',
  'You are told the correct answer. Your job is to show how to reach it, not to re-derive which option is right.',
  '',
  'Respond with ONLY a JSON object, no prose around it, in exactly this shape:',
  '{"keyIdea": "<one sentence>", "steps": ["<step>", "<step>", ...]}',
  '',
  'Rules:',
  '- keyIdea: one sentence naming the single concept or theorem that unlocks the question.',
  '- steps: 4 to 7 entries, each one short line of actual working that follows from the previous.',
  '- The final step must arrive at the correct answer given.',
  '- Write maths in plain readable text (x^2, sqrt(3), pi/6, integral from 0 to 1). No LaTeX, no markdown.',
  '- Be concrete and numeric. Do not say "substitute and solve" without showing the substitution.',
  '- If the question refers to a figure or a previous question you cannot see, say so plainly in keyIdea and give the general method in steps.',
].join('\n')

export function buildSolutionUserPrompt(req: SolutionRequest): string {
  const options = req.options
    .map((opt, i) => `${String.fromCharCode(65 + i)}. ${opt}${i === req.correctIndex ? '   <-- correct answer' : ''}`)
    .join('\n')

  return [
    `Chapter: ${req.subject} / ${req.topic} (difficulty ${req.difficulty} of 5)`,
    '',
    `Question: ${req.question}`,
    '',
    options,
  ].join('\n')
}

/** Validates a model response into a usable solution, or null if it came back malformed. */
export function parseSolutionResponse(raw: string): { keyIdea: string; steps: string[] } | null {
  try {
    // Models sometimes wrap JSON in prose or a code fence; take the outermost object.
    const start = raw.indexOf('{')
    const end = raw.lastIndexOf('}')
    if (start === -1 || end === -1) return null

    const parsed = JSON.parse(raw.slice(start, end + 1))
    const keyIdea = typeof parsed.keyIdea === 'string' ? parsed.keyIdea.trim() : ''
    const steps = Array.isArray(parsed.steps)
      ? parsed.steps.filter((s: unknown): s is string => typeof s === 'string' && s.trim() !== '')
      : []

    if (!keyIdea || steps.length === 0) return null
    return { keyIdea, steps }
  } catch {
    return null
  }
}
