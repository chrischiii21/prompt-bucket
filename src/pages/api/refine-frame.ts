import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { frame, tweak, characterAnchor, currentSummary } = body;
  
  const apiKey = import.meta.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Groq API key missing.' }), { status: 500 });
  }

  const systemPrompt = `You are a professional AI Video Director. 
Refine the scene prompt based on the user's tweak while ensuring visual consistency with the character.
Also, if the scene change alters the overall story flow, update the Story Summary.

Character Anchor: ${characterAnchor.description}
Current Summary: ${currentSummary}
Current Scene [${frame.timestamp}]: ${frame.final_prompt}
User Tweak: ${tweak}

Return a valid JSON object:
{
  "final_prompt": "...",
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
          { role: 'user', content: `Refine the scene and update the summary if needed.` }
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
