import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { characterAnchor, tweak } = body;
  
  const apiKey = import.meta.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('API Error: GROQ_API_KEY is not defined.');
    return new Response(JSON.stringify({ error: 'Groq API key missing.' }), { status: 500 });
  }

  const systemPrompt = `You are an AI Character Designer. 
Refine the following character description based on the user's tweak. 
Maintain the core essence but apply the requested changes.

Current Description: ${characterAnchor.description}
User Tweak: ${tweak}

Return a valid JSON object with the updated description and a new seed prompt:
{
  "description": "...",
  "seed_prompt": "..."
}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Refine this character.` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API Error:', errorData);
      return new Response(JSON.stringify({ error: errorData.error?.message || 'Groq API call failed' }), { status: response.status });
    }

    const data = await response.json();
    const updatedAnchor = JSON.parse(data.choices[0].message.content);
    
    return new Response(JSON.stringify(updatedAnchor), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Server Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
