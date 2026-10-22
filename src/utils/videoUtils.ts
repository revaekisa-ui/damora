/**
 * Parses various video URLs (YouTube, Vimeo, etc.) into embeddable iframe URLs.
 */
export const getEmbedVideoUrl = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();

  // YouTube match: standard watch, youtu.be shortlinks, shorts, and embed
  const ytRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?/\s]{11})/i;
  const ytMatch = trimmed.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`;
  }

  // Vimeo match
  const vimeoRegex = /(?:vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+))/i;
  const vimeoMatch = trimmed.match(vimeoRegex);
  if (vimeoMatch && vimeoMatch[3]) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}?badge=0&autopause=0&player_id=0&app_id=58479`;
  }

  return trimmed;
};

/**
 * Extracts a thumbnail URL if possible (e.g. YouTube maxresdefault or hqdefault)
 */
export const getVideoThumbnail = (url?: string): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  const ytRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?/\s]{11})/i;
  const ytMatch = trimmed.match(ytRegex);
  if (ytMatch && ytMatch[1]) {
    return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  }
  return null;
};
