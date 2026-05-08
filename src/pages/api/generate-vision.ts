import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();
  const { concept, durationInSeconds, productionType, existingCharacter } = body;
  
  const apiKey = import.meta.env.GROQ_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: 'Groq API key missing. Please add GROQ_API_KEY to your .env file.' 
    }), { status: 500 });
  }

  const isFlexible = durationInSeconds === 0;
  
  // Base instructions for duration
  const durationInstruction = isFlexible 
    ? `You have the freedom to decide the optimal duration for this story. 
       Choose a total duration between 10 and 45 seconds. 
       Break it into logical scenes with varying durations (2s to 6s per scene).`
    : `Create a "Production Blueprint" for a ${durationInSeconds} second video.
       Divide the video into logical scenes with varying durations (2s to 6s per scene) that sum up to exactly ${durationInSeconds} seconds.`;

  // Production Type specific logic
  let modalityInstruction = '';
  let characterContext = '';

  if (productionType === 'character') {
    modalityInstruction = `This is a CHARACTER-DRIVEN narrative. Focus on human-like identity, facial expressions, and consistent character performance.`;
    characterContext = existingCharacter 
      ? `USE THIS EXISTING CHARACTER:
         Description: ${existingCharacter.description}
         Seed Prompt: ${existingCharacter.seed_prompt}
         Maintain this identity exactly.`
      : `Create a "Character Anchor": A detailed physical description of the main character that must remain constant.`;
  } else if (productionType === 'text') {
    modalityInstruction = `This is a TEXT & GRAPHICS video (e.g., Quiz, Social Ad, Info-card). 
    Focus on kinetic typography, text overlays, and generic background visuals. 
    NO HUMAN FACES or specific characters required. 
    Final prompts should describe the background scenery AND the specific text that appears on screen.`;
    characterContext = `Create a "Visual Design Language": Instead of a character, describe the consistent aesthetic, color palette, and font style. Store this in the character_anchor.description field.`;
  } else {
    modalityInstruction = `This is an EXPERIMENTAL/ABSTRACT video. 
    Avoid showing faces. Focus on landscapes, product close-ups, macro shots, or abstract textures. 
    The mood should be atmospheric and non-human centric.`;
    characterContext = `Create an "Atmospheric Anchor": Describe the consistent visual mood and recurring non-human elements. Store this in the character_anchor.description field.`;
  }

  const systemPrompt = `You are a professional AI Video Director. 
Your task is to take a concept and create a "Production Blueprint".

${modalityInstruction}

${durationInstruction}

${characterContext}

First, write a 2-3 sentence "Story Summary" that describes the overarching narrative flow.
Then, for each scene, generate a timestamped "Beat Sheet" with a duration, shot type, and a final prompt.

CRITICAL RULE: For every scene's final prompt, you MUST include the anchor description (character or visual style) at the start to ensure visual continuity.

Format your response as a valid JSON object:
{
  "project_name": "...",
  "summary": "...",
  "total_duration": "...", 
  "character_anchor": {
    "description": "...",
    "seed_prompt": "..."
  },
  "frames": [
    {
      "timestamp": "00:00",
      "duration": "3s",
      "shot_type": "...",
      "final_prompt": "..."
    }
  ]
}

Note: If the production type is 'text', the final_prompt field MUST include the exact text to be displayed (e.g., "TEXT: 'Who is the fastest cat?'").`;

  let lastError = null;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      console.log(`Groq API Attempt ${attempt}...`);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Concept: ${concept}` }
          ],
          response_format: { type: 'json_object' }
        })
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Groq API Error (${response.status}):`, errorText);
        let errorMessage = 'Groq API call failed';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch (e) {
          errorMessage = `Groq returned ${response.status}: ${errorText.slice(0, 100)}`;
        }
        
        // If it's a 429 (Rate Limit) or 5xx, we might want to retry, but for now let's only retry on network errors caught by catch
        return new Response(JSON.stringify({ error: errorMessage }), { status: response.status });
      }

      const data = await response.json();
      console.log('Groq API Response received successfully');
      
      if (!data.choices || data.choices.length === 0) {
        throw new Error('AI returned an empty response choices');
      }

      const choice = data.choices[0];
      if (choice.finish_reason === 'length') {
        return new Response(JSON.stringify({ error: 'AI response was too long and got cut off.' }), { status: 500 });
      }

      let visionData;
      try {
        const content = choice.message?.content;
        if (!content) throw new Error('Empty message content');
        visionData = JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse Groq response content:', choice.message?.content);
        return new Response(JSON.stringify({ error: 'AI returned invalid JSON format' }), { status: 500 });
      }
      
      // If we got here, success!
      // Maintain image_url if applicable
      if (visionData.character_anchor) {
        visionData.character_anchor.image_url = existingCharacter?.image_url || null;
      }

      // Ensure total_duration is set correctly if not provided by AI
      if (!visionData.total_duration) {
        visionData.total_duration = isFlexible ? '30s' : `${durationInSeconds}s`;
      }

      return new Response(JSON.stringify({ ...visionData, status: 'Draft' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });

    } catch (error: any) {
      console.error(`Attempt ${attempt} failed:`, error.message);
      lastError = error;
      if (attempt < maxRetries) {
        const delay = attempt * 1000;
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  return new Response(JSON.stringify({ 
    error: `Connection failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown network error'}` 
  }), { status: 500 });
};
