import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { frame, tweak, characterAnchor } = body;
  
  const apiKey = import.meta.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('API Error: GROQ_API_KEY is not defined.');
    return new Response(JSON.stringify({ error: 'Groq API key missing.' }), { status: 500 });
  }

  const systemPrompt = `You are an AI Video Prompt Engineer. 
Refine the following video prompt based on the user's tweak while ensuring the Character Anchor remains at the start of the prompt for continuity.

Character Anchor: ${characterAnchor.description}
Current Prompt: ${frame.final_prompt}
User Tweak: ${tweak}

Return ONLY the new refined prompt text.`;

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
          { role: 'user', content: `Refine this frame.` }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API Error:', errorData);
      return new Response(JSON.stringify({ error: errorData.error?.message || 'Groq API call failed' }), { status: response.status });
    }

    const data = await response.json();
    const refinedPrompt = data.choices[0].message.content.trim();
    
    return new Response(JSON.stringify({ final_prompt: refinedPrompt }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Server Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
