import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { concept, durationInSeconds } = body;
  
  const apiKey = import.meta.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error('API Error: GROQ_API_KEY is not defined.');
    return new Response(JSON.stringify({ 
      error: 'Groq API key missing. Please add GROQ_API_KEY to your .env file.' 
    }), { status: 500 });
  }

  const secondsPerFrame = 3;
  const frameCount = Math.ceil(durationInSeconds / secondsPerFrame);

  const systemPrompt = `You are a professional AI Video Director. 
Your task is to take a concept and create a "Production Bible" for a ${durationInSeconds} second video.
Divide the video into ${frameCount} scenes of approximately ${secondsPerFrame} seconds each.

First, create a "Character Anchor": A detailed physical description of the main character that must remain constant.
Then, for each scene, generate a timestamped "Beat Sheet" with a shot type and a final prompt.

CRITICAL RULE: For every scene's final prompt, you MUST include the "Character Anchor" description at the start to ensure visual continuity.

Format your response as a valid JSON object:
{
  "project_name": "...",
  "character_anchor": {
    "description": "...",
    "seed_prompt": "..."
  },
  "frames": [
    {
      "timestamp": "00:00 - 00:03",
      "shot_type": "...",
      "final_prompt": "..."
    }
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
          { role: 'user', content: `Concept: ${concept}` }
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
    const visionData = JSON.parse(data.choices[0].message.content);
    
    return new Response(JSON.stringify({ ...visionData, status: 'Draft', total_duration: `${durationInSeconds}s` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Server Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};
