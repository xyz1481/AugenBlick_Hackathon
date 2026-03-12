// In dev we proxy `/api/*` via Vite, so default base URL is same-origin.
// Override with `VITE_API_URL` when running against a deployed backend.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default API_BASE_URL;
