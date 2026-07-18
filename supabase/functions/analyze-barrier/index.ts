import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const authorization = request.headers.get('Authorization')
  if (!authorization) return json({ error: 'Authentication is required.' }, 401)

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authorization } } },
  )
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return json({ error: 'Invalid user session.' }, 401)

  const { placeType, location, note } = await request.json()
  if (!placeType || !location || !note?.trim()) return json({ error: 'Place type, location, and a description are required.' }, 400)

  const prompt = `Turn this citizen-submitted public accessibility or civic-safety report into a concise, formal, actionable report.\n\nPlace type: ${placeType}\nLocation: ${location}\nCitizen description: ${note.trim()}\n\nUse only the information provided. Do not invent visual details, identify people, or claim an authority has accepted the issue. Produce a clear report suitable for a formal civic complaint.`

  const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') || 'gpt-5.4-mini',
      store: false,
      input: [{
        role: 'user',
        content: [{ type: 'input_text', text: prompt }],
      }],
      text: {
        format: {
          type: 'json_schema',
          name: 'accesslens_analysis',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              category: { type: 'string' },
              severity: { type: 'string', enum: ['Low priority', 'Moderate priority', 'High priority', 'Urgent'] },
              affected: { type: 'string' },
              impact: { type: 'string' },
              action: { type: 'string' },
              evidence: { type: 'string' },
            },
            required: ['category', 'severity', 'affected', 'impact', 'action', 'evidence'],
            additionalProperties: false,
          },
        },
      },
    }),
  })

  if (!openaiResponse.ok) {
    const error = await openaiResponse.json().catch(() => null)
    const message = error?.error?.message || 'The OpenAI request was rejected.'
    console.error({ status: openaiResponse.status, message })
    return json({ error: `OpenAI request failed (${openaiResponse.status}): ${message}` }, 502)
  }

  const response = await openaiResponse.json()
  try {
    return json({ analysis: JSON.parse(response.output_text), source: 'OpenAI vision' })
  } catch {
    return json({ error: 'AI analysis returned an unexpected format.' }, 502)
  }
})
