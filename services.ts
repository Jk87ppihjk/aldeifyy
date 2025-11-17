const BASE_URL = 'https://prp-jiww.onrender.com/api';

export const apiFetch = async <T,>(endpoint: string, options: RequestInit = {}): Promise<{ ok: boolean; status: number; data: T | { message: string; code?: string } }> => {
    try {
        const token = localStorage.getItem('userToken');
        const headers: HeadersInit = { ...options.headers };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        let body = options.body;

        // Don't set Content-Type for FormData, the browser does it with the boundary
        if (!(body instanceof FormData)) {
            headers['Content-Type'] = 'application/json';
            // Stringify body if it's an object and not already a string
            if (body && typeof body !== 'string') {
               body = JSON.stringify(body);
            }
        }
        
        const response = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers, body });
        
        if (response.status === 204) {
            return { ok: response.ok, status: response.status, data: {} as T };
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            return { ok: response.ok, status: response.status, data };
        } else {
            // The response is not JSON, likely an HTML error page from the server
            const errorText = await response.text();
            console.error("API did not return JSON. Status:", response.status, "Response body:", errorText);

            let message = `Server returned a non-JSON response. Status: ${response.status}.`;
            if (response.status === 404) {
                message = `API endpoint not found (404). Please check the request URL.`;
            } else if (response.status >= 500) {
                message = `A server error occurred (${response.status}). Please try again later.`;
            }
            
            return { ok: false, status: response.status, data: { message } };
        }
    } catch (error) {
        console.error('API Fetch Network Error:', error);
        return { ok: false, status: 500, data: { message: 'Network error or server is unreachable. Please check your connection.' } };
    }
};
