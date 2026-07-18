# AccessLens AI analysis function

This Supabase Edge Function reads a signed-in citizen's private photo, sends it to OpenAI Vision, and returns a structured accessibility report.

Before deployment, add these Supabase Edge Function secrets:

```text
OPENAI_API_KEY=your OpenAI API key
OPENAI_MODEL=gpt-5.4-mini
```

Deploy with the Supabase CLI after logging in and linking the project:

```bash
supabase functions deploy analyze-barrier
```

The function requires a valid Supabase user JWT, so it keeps the default JWT verification enabled.
