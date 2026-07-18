# AccessLens AI analysis function

This Supabase Edge Function sends a signed-in citizen's place type, location, and written description to OpenAI and returns a structured formal report. The photo remains private evidence attached to the submitted report; it is not sent to the model.

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
