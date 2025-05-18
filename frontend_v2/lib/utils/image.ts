/**
 * Resolves an image URL correctly for both local and remote images
 * @param path The image path or URL to resolve
 * @returns A properly formatted URL for the image
 */
export const resolveImageUrl = (path: string | undefined | null): string => {
  if (!path) return '';
  
  // If it's already a complete URL, return it as is
  if (path.startsWith('http')) return path;
  
  // If it's an unsplash image without https, add it
  if (path.startsWith('images.unsplash.com')) {
    return `https://${path}`;
  }
  
  // Handle static files from backend
  const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // Properly handle uploads paths by ensuring they start with /static
  if (path.startsWith('uploads/')) {
    return `${baseApiUrl}/static/${path}`;
  }
  
  // For other paths
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseApiUrl}${normalizedPath}`;
}; 