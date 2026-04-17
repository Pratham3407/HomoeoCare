export const SERVER_URL = import.meta.env.VITE_SERVER_URL || (import.meta.env.DEV ? `http://${window.location.hostname}:5000` : "");
const API_URL = `${SERVER_URL}/api`;
export default API_URL;
