import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import {
  buildSolutionUserPrompt,
  parseSolutionResponse,
  SOLUTION_SYSTEM_PROMPT,
} from './src/game/solutionPrompt.js'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile'

function readBody(req: NodeJS.ReadableStream): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => {
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

/**
 * Dev-only proxy for the AI tutor.
 *
 * The API key is read here, in the Node process, and never reaches the browser -
 * which is the whole reason this exists rather than the client calling Groq directly.
 * For a deployed build the same request needs to move to a Supabase Edge Function;
 * the prompt itself is shared from src/game/solutionPrompt.ts so it stays identical.
 */
function aiTutorProxy(apiKey: string): Plugin {
  return {
    name: 'ai-tutor-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/solve', async (req, res) => {
        res.setHeader('Content-Type', 'application/json')

        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'POST only' }))
          return
        }
        if (!apiKey) {
          res.statusCode = 503
          res.end(JSON.stringify({ error: 'No GROQ_API_KEY set in .env.local' }))
          return
        }

        try {
          const payload = JSON.parse(await readBody(req))

          const upstream = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: GROQ_MODEL,
              temperature: 0.3,
              max_tokens: 900,
              response_format: { type: 'json_object' },
              messages: [
                { role: 'system', content: SOLUTION_SYSTEM_PROMPT },
                { role: 'user', content: buildSolutionUserPrompt(payload) },
              ],
            }),
          })

          if (!upstream.ok) {
            const detail = await upstream.text()
            server.config.logger.warn(`[ai-tutor] Groq ${upstream.status}: ${detail.slice(0, 300)}`)
            res.statusCode = upstream.status
            res.end(JSON.stringify({ error: `Groq returned ${upstream.status}`, detail: detail.slice(0, 300) }))
            return
          }

          const json = (await upstream.json()) as {
            choices?: { message?: { content?: string } }[]
          }
          const content = json.choices?.[0]?.message?.content ?? ''
          const solution = parseSolutionResponse(content)

          if (!solution) {
            res.statusCode = 502
            res.end(JSON.stringify({ error: 'Model response was not usable JSON' }))
            return
          }

          res.statusCode = 200
          res.end(JSON.stringify(solution))
        } catch (error) {
          server.config.logger.error(`[ai-tutor] ${String(error)}`)
          res.statusCode = 500
          res.end(JSON.stringify({ error: String(error) }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  // Empty prefix so non-VITE_ vars (the API key) are readable here, in Node, without
  // being exposed to the client bundle the way a VITE_ prefix would.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss(), aiTutorProxy(env.GROQ_API_KEY ?? '')],
  }
})
