export interface CharacterAnchor {
  description: string;
  seed_prompt: string;
  image_url?: string;
}

export interface Frame {
  timestamp: string;
  duration: string;
  shot_type: string;
  final_prompt: string;
}

export interface ProjectData {
  project_name: string;
  summary: string;
  total_duration: string;
  status: 'Draft' | 'Approved';
  character_anchor: CharacterAnchor;
  frames: Frame[];
}

export const generateVision = async (concept: string, durationInSeconds: number, productionType: string, existingCharacter?: CharacterAnchor): Promise<ProjectData> => {
  const response = await fetch('/api/generate-vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concept, durationInSeconds, productionType, existingCharacter })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate vision');
  }

  return await response.json();
};

export const refineFrame = async (frame: Frame, tweak: string, characterAnchor: CharacterAnchor, currentSummary: string): Promise<{ final_prompt: string, summary: string }> => {
  const response = await fetch('/api/refine-frame', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ frame, tweak, characterAnchor, currentSummary })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to refine frame');
  }

  return await response.json();
};

export const refineCharacter = async (characterAnchor: CharacterAnchor, tweak: string, currentSummary: string): Promise<{ character_anchor: CharacterAnchor, summary: string }> => {
  const response = await fetch('/api/refine-character', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterAnchor, tweak, currentSummary })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to refine character');
  }

  return await response.json();
};
