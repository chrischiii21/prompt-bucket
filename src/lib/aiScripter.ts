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
  video_url?: string;
}

export interface ProjectData {
  project_name: string;
  summary: string;
  total_duration: string;
  status: 'Draft' | 'Approved';
  character_anchor: CharacterAnchor;
  frames: Frame[];
}

export const generateVision = async (concept: string, durationInSeconds: number, productionType: string, genre: string, referenceImageUrl?: string, existingCharacter?: CharacterAnchor): Promise<ProjectData> => {
  const response = await fetch('/api/generate-vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ concept, durationInSeconds, productionType, genre, referenceImageUrl, existingCharacter })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate vision');
  }

  return await response.json();
};

export const generateIdeas = async (genre: string, productionType: string): Promise<string[]> => {
  const response = await fetch('/api/generate-ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ genre, productionType })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to generate ideas');
  }

  const data = await response.json();
  return data.ideas;
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

export const getVideoThumbnail = (url?: string): string | null => {
  if (!url) return null;

  // YouTube
  const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|v\/|embed\/|shorths\/))([^?&"'>]+)/);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/|channels\/|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/);
  if (vimeoMatch && vimeoMatch[3]) {
    // Note: This is a placeholder as Vimeo thumbnails usually need an API call
    // But we can use this specific pattern for some cases or a generic high-quality placeholder
    return `https://vumbnail.com/${vimeoMatch[3]}.jpg`;
  }

  // Google Drive
  const driveMatch = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=)|docs\.google\.com\/file\/d\/)([^/?&]+)/);
  if (driveMatch && driveMatch[1]) {
    return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w800`;
  }

  return null;
};
