export interface CharacterAnchor {
  description: string;
  seed_prompt: string;
}

export interface Frame {
  timestamp: string;
  shot_type: string;
  final_prompt: string;
}

export interface ProjectData {
  project_name: string;
  total_duration: string;
  status: 'Draft' | 'Approved';
  character_anchor: CharacterAnchor;
  frames: Frame[];
}

export const generateVision = async (concept: string, durationInSeconds: number): Promise<ProjectData> => {
  const response = await fetch('/api/generate-vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concept, durationInSeconds })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate vision');
  }

  return await response.json();
};

export const refineFrame = async (frame: Frame, tweak: string, characterAnchor: CharacterAnchor): Promise<string> => {
  const response = await fetch('/api/refine-frame', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ frame, tweak, characterAnchor })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to refine frame');
  }

  const data = await response.json();
  return data.final_prompt;
};

export const refineCharacter = async (characterAnchor: CharacterAnchor, tweak: string): Promise<CharacterAnchor> => {
  const response = await fetch('/api/refine-character', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterAnchor, tweak })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to refine character');
  }

  return await response.json();
};
