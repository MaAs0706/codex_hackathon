# AccessLens AI analysis function

This Supabase Edge Function sends a signed-in citizen's place type, location, and written description to Groq and returns a structured formal report. The photo remains private evidence attached to the submitted report; it is not sent to the model.

Before deployment, add these Supabase Edge Function secrets:

```text
GROQ_API_KEY=your Groq API key
# Optional: defaults to llama-3.3-70b-versatile
GROQ_MODEL=llama-3.3-70b-versatile
```

Deploy with the Supabase CLI after logging in and linking the project:

```bash
supabase functions deploy analyze-barrier
```

The function requires a valid Supabase user JWT, so it keeps the default JWT verification enabled.
