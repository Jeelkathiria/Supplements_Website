import { auth } from '../firebase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface FetchOptions extends RequestInit {
  requireAuth?: boolean;
}

/**
 * Get current Firebase user's ID token
 */
const getAuthToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }
    return await user.getIdToken();
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Make authenticated API call with automatic Firebase token injection
 */
export const apiFetch = async (
  endpoint: string,
  options: FetchOptions = {},
): Promise<Response> => {
  const { requireAuth = true, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(typeof fetchOptions.headers === 'object' && fetchOptions.headers ? fetchOptions.headers : {}),
  };

  if (requireAuth) {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Not authenticated');
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  return response;
};

/**
 * Make authenticated API call and parse JSON response
 */
export const apiCall = async <T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> => {
  const response = await apiFetch(endpoint, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return await response.json();
};

/**
 * Make unauthenticated API call
 */
export const apiCallNoAuth = async <T>(
  endpoint: string,
  options: FetchOptions = {},
): Promise<T> => {
  const { ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(typeof fetchOptions.headers === 'object' && fetchOptions.headers ? fetchOptions.headers : {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  return await response.json();
};
