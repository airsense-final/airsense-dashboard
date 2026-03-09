export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';  // auth, users, companies, root, health
export const API_BASE_URL = `${BASE_URL}/api`; // sensors
export const WEBSOCKET_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8001/ws';