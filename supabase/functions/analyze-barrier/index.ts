import { createClient } from '@supabase/supabase-js'

const edgeRuntime = globalThis as typeof globalThis & {
  Deno: {
    env: { get: (name: string) => string | undefined }
    serve: (handler: (request: Request) => Response | Promise<Response>) => void
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

edgeRuntime.Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authorization = request.headers.get('Authorization')
  if (!authorization) return json({ error: 'Authentication is required.' }, 401)

  const supabase = createClient(
    edgeRuntime.Deno.env.get('SUPABASE_URL') ?? '',
    edgeRuntime.Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authorization } } },
  )
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return json({ error: 'Invalid user session.' }, 401)

  const { placeType, location, note } = await request.json()
  if (!placeType || !location || !note?.trim()) return json({ error: 'Place type, location, and a description are required.' }, 400)

  const prompt = `Turn this citizen-submitted public accessibility or civic-safety report into a concise, formal, actionable report.\n\nPlace type: ${placeType}\nLocation: ${location}\nCitizen description: ${note.trim()}\n\nChoose the most appropriate department, authority, or facilities team to receive the complaint. Use a practical department name rather than inventing a specific officer or claiming it has been accepted. Use only the information provided. Do not invent visual details or identify people. Produce a clear report suitable for a formal civic complaint.`

  const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${edgeRuntime.Deno.env.get('GROQ_API_KEY')}`,
    },
    body: JSON.stringify({
      model: edgeRuntime.Deno.env.get('GROQ_MODEL') || 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: 'Return only valid JSON with these exact string keys: category, severity, department, affected, impact, action, evidence. The department value must name the most suitable civic department, authority, or facility team to receive the complaint. Severity must be one of: Low priority, Moderate priority, High priority, Urgent.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    }),
  })

  if (!groqResponse.ok) {
    const error = await groqResponse.json().catch(() => null)
    const message = error?.error?.message || 'The Groq request was rejected.'
    console.error({ status: groqResponse.status, message })
    return json({ error: `Groq request failed (${groqResponse.status}): ${message}` }, 502)
  }

  const response = await groqResponse.json()
  try {
    const analysis = JSON.parse(response.choices?.[0]?.message?.content || '')
    return json({ analysis, source: 'Groq text analysis' })
  } catch {
    return json({ error: 'AI analysis returned an unexpected format.' }, 502)
  }
})
