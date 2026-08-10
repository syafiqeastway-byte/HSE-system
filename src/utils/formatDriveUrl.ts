export function formatToPreviewUrl(url: string): string {
  if (!url) return '#';
  
  try {
    const urlObj = new URL(url);
    
    // docs, sheets, presentations
    if (urlObj.hostname === 'docs.google.com') {
      const parts = urlObj.pathname.split('/');
      // e.g. /document/d/12345/edit -> /document/d/12345/preview
      // parts = ['', 'document', 'd', '12345', 'edit']
      const dIndex = parts.indexOf('d');
      if (dIndex !== -1 && parts.length > dIndex + 1) {
        // ID is at dIndex + 1
        const basePath = parts.slice(0, dIndex + 2).join('/');
        return `https://docs.google.com${basePath}/preview`;
      }
    }
    
    // drive files
    if (urlObj.hostname === 'drive.google.com') {
      const parts = urlObj.pathname.split('/');
      // e.g. /file/d/12345/view -> /file/d/12345/preview
      const dIndex = parts.indexOf('d');
      if (dIndex !== -1 && parts.length > dIndex + 1) {
        const basePath = parts.slice(0, dIndex + 2).join('/');
        return `https://drive.google.com${basePath}/preview`;
      }
    }
    
    return url;
  } catch (err) {
    // If it's not a valid URL (e.g. "Buka File"), just return it as is or handle it
    return url;
  }
}
