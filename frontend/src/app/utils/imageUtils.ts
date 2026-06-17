export const getFullImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '/placeholder.png';
  if (imageUrl.startsWith('http') || imageUrl.startsWith('data:')) return imageUrl;
  
  // If it's a relative path, add the API base URL
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const backendBase = apiBase.replace('/api', '');
  return `${backendBase}${imageUrl}`;
};
