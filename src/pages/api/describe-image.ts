import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { imageUrl } = body;
  
  const apiKey = import.meta.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: 'Groq API key missing. Please add GROQ_API_KEY to your .env file.' 
    }), { status: 500 });
  }

  if (!imageUrl) {
    return new Response(JSON.stringify({ 
      error: 'imageUrl is required.' 
    }), { status: 400 });
  }

  try {
    const visionResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'system',
            content: 'You are an elite prompt engineer for advanced AI generators. Your ONLY goal is to write a prompt that will reproduce the EXACT reference image 1-to-1. Do not invent anything. Do not leave anything out. You must act as a perfect text mirror of the image. CRITICAL RULES:\n1. NO conversational filler. Output ONLY the raw prompt.\n2. Start by locking in the EXACT aesthetic: exact art style, medium, film stock, rendering engine, or stylization level.\n3. Capture the EXACT "feel" and vibe: mood, color grading, lighting setup, and atmosphere.\n4. Describe the character with brutal precision: exact facial structure, exact eye shape/color, exact hair style/texture, exact skin details, and precise body proportions. \n5. Describe the EXACT pose, expression, and micro-expressions.\n6. Detail the EXACT clothing, fabric textures, wear-and-tear, and accessories.\n7. Detail the EXACT background, environment, and camera angle.\n8. Format as a dense, high-impact, comma-separated flow.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Output the exact prompt for this image. Remember: NO conversational filler, just the prompt.' },
              { type: 'image_url', image_url: { url: imageUrl } }
            ]
          }
        ]
      })
    });

    if (!visionResponse.ok) {
      const errorText = await visionResponse.text();
      console.error('Groq Vision API Error:', visionResponse.status, errorText);
      return new Response(JSON.stringify({ error: `Vision API error: ${errorText}` }), { status: visionResponse.status });
    }

    const visionData = await visionResponse.json();
    const prompt = visionData.choices[0].message.content;

    return new Response(JSON.stringify({ prompt }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ 
      error: `Failed to describe image: ${err.message}` 
    }), { status: 500 });
  }
};
