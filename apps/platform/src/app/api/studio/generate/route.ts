import Anthropic from "@anthropic-ai/sdk"
import { auth } from "@clerk/nextjs/server"

const SYSTEM_PROMPT = `You are an expert React developer building polished, interactive web apps.
The user will describe an app idea in plain English. You will generate a complete, working React component.

CRITICAL RULES:
1. Output exactly ONE React component named \`App\` as the default export
2. Use only React (useState, useEffect, useCallback, useMemo, useRef) — no imports needed, React is global
3. Use Tailwind CSS classes for all styling — it is loaded via CDN
4. NO TypeScript, NO import statements, NO external libraries
5. Include realistic placeholder data — the app should look finished, not empty
6. The component must be mobile-friendly and look polished
7. Use emoji for visual interest where appropriate
8. Entry point: \`function App() { ... }\` followed by nothing else (no export default, ReactDOM handles mounting)

RESPONSE FORMAT:
1. Start with 1-3 sentences describing what you built and key features
2. Then output the complete code in a fenced code block: \`\`\`jsx ... \`\`\`
3. End with 3-4 specific refinement suggestions as a bulleted list (e.g. "• Add dark mode toggle", "• Make the chart interactive")

QUALITY BAR:
- Gradient backgrounds, card layouts, icons (emoji), progress bars, status badges
- Interactive: buttons that do things, toggles that toggle, inputs that update state
- Color-coded status (green=good, amber=warning, red=alert using Tailwind)
- Smooth CSS transitions on interactive elements
- No lorem ipsum — use real-feeling placeholder names, dates, amounts`

export async function POST(request: Request): Promise<Response> {
  const { userId } = await auth()
  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response("AI service not configured", { status: 503 })
  }

  let messages: Array<{ role: "user" | "assistant"; content: string }>
  try {
    const body: unknown = await request.json()
    if (
      !body ||
      typeof body !== "object" ||
      !("messages" in body) ||
      !Array.isArray((body as { messages: unknown }).messages)
    ) {
      return new Response("Messages required", { status: 400 })
    }
    const raw = (body as { messages: unknown[] }).messages
    if (raw.length === 0) {
      return new Response("Messages required", { status: 400 })
    }
    for (const m of raw) {
      if (
        !m ||
        typeof m !== "object" ||
        !("role" in m) ||
        !("content" in m) ||
        (m.role !== "user" && m.role !== "assistant") ||
        typeof m.content !== "string"
      ) {
        return new Response("Invalid message format", { status: 400 })
      }
    }
    messages = raw as typeof messages
  } catch {
    return new Response("Invalid request body", { status: 400 })
  }

  const client = new Anthropic({ apiKey })

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-opus-4-6",
          max_tokens: 64000,
          system: SYSTEM_PROMPT,
          messages,
        })

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const chunk = JSON.stringify({ text: event.delta.text })
            controller.enqueue(encoder.encode(`data: ${chunk}\n\n`))
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
      } catch (err) {
        const message = err instanceof Error ? err.message : "Generation failed"
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  })
}
