import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { genre, productionType } = body;
  
  const apiKey = import.meta.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: 'Groq API key missing.' 
    }), { status: 500 });
  }

  const systemPrompt = `You are a creative Video Director. 
Based on the provided GENRE and PRODUCTION TYPE, generate 3 unique, highly detailed, and cinematic video concepts.
Each concept should be a 2-3 sentence paragraph describing a specific scene or narrative beat.

CRITICAL CONSTRAINTS: 
Your suggestions must be optimized for execution by high-end image and video models.
- DO NOT include model names like 'Nano Banana' or 'Veo' in your descriptions.
- Keep concepts visually grounded and executable.
- Avoid impossible physics or overly crowded scenes.
- Focus on clear subjects, atmospheric lighting, and high-quality textures.

${productionType === 'character' ? 'Focus on CHARACTER-DRIVEN narratives with a specific protagonist.' : ''}
${productionType === 'text' ? 'Focus on TEXT & GRAPHICS, kinetic typography, and visual design.' : ''}
${productionType === 'abstract' ? 'Focus on EXPERIMENTAL, ABSTRACT, and non-human centric visuals.' : ''}

Format your response as a valid JSON object:
{
  "ideas": [
    "Idea 1 description...",
    "Idea 2 description...",
    "Idea 3 description..."
  ]
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
          { role: 'user', content: `Genre/Topic: ${genre}\nProduction Type: ${productionType}` }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      throw new Error('Groq API call failed');
    }

    const data = await response.json();
    const content = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(content), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Idea generation failed:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
