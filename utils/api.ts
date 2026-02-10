// utils/api.ts
import { globalEvents } from './events';

// const API_BASE_URL = 'https://zordr-backend-main.onrender.com/api';
// Use 10.0.2.2 for Android Emulator, or your LAN IP (e.g., 192.168.x.x) for Physical Device
// const API_BASE_URL = 'http://10.0.2.2:3000/api';
const API_BASE_URL = 'https://zordr-backend.onrender.com/api';

// Custom options type that allows object literals in body
interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, any> | string | FormData | null;
}

/**
 * Simple API client wrapper for Zordr Backend
 * @param endpoint The API endpoint (e.g., 'auth/send-otp')
 * @param options Fetch options (method, body, headers)
 * @param token Optional JWT token for authenticated requests
 */
export async function apiFetch(endpoint: string, options: ApiRequestOptions = {}, token?: string) {
  const url = `${API_BASE_URL}/${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  try {
    console.log(`🌐 API Request: ${url}`);

    const response = await fetch(url, {
      ...options,
      
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
      // Handle body serialization for POST/PUT requests
      body:
        options.body && typeof options.body !== 'string'
          ? JSON.stringify(options.body)
          : (options.body as string | undefined),
    });

    const jsonResponse = await response.json();

    if (!response.ok) {
      // GLOBAL LOGOUT ON 401
      if (response.status === 401) {
        console.warn(`🔒 Unauthorized Access (401). Emitting logout event.`);
        globalEvents.emit('auth:unauthorized');
      }

      console.error(`❌ API Error ${response.status}:`, jsonResponse);
      // Throw API error response for easy handling in components
      throw new Error(jsonResponse.message || `API call failed with status ${response.status}`);
    }

    console.log(`✅ API Success:`, jsonResponse);

    // Backend returns { success: true, data: {...} }
    // Extract and return only the data property
    return jsonResponse.data || jsonResponse;
  } catch (error: any) {
    console.error(`❌ API Error on ${endpoint}:`, error.message || error);

    // Network errors
    if (error.message === 'Network request failed' || error.message.includes('fetch')) {
      throw new Error(`Cannot connect to server at ${API_BASE_URL}. Is the backend running?`);
    }

    throw error;
  }
}
