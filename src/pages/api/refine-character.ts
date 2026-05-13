import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { characterAnchor, tweak, currentSummary } = body;
  
  const apiKey = import.meta.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Groq API key missing.' }), { status: 500 });
  }

  const systemPrompt = `You are an AI Character Designer and Narrative Consultant. 
Refine the character description based on the user's tweak. 
Also, if the character change significantly alters the story's tone or flow, update the Story Summary accordingly.

CRITICAL CONSTRAINTS:
- DO NOT mention 'Nano Banana' or 'Veo' in the output.
- Ensure the character description is highly detailed and visually consistent for image generation.

Current Character: ${characterAnchor.description}
Current Summary: ${currentSummary}
User Tweak: ${tweak}

Return a valid JSON object:
{
  "character_anchor": {
    "description": "...",
    "seed_prompt": "..."
  },
  "summary": "..."
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Refine the character and update the summary if needed.` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(JSON.stringify({ error: errorData.error?.message || 'Groq API call failed' }), { status: response.status });
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
