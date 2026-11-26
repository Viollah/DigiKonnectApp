import axios from 'axios'; // Axios sends HTTP requests from React to the C# API.

// One shared Axios instance keeps the API address and token behavior in one place.
const api = axios.create({ baseURL: 'http://localhost:5000/api' });

// Before every request, attach the signed-in user's token when one exists.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // Read the token saved after login.
  if (token) config.headers.Authorization = `Bearer ${token}`; // ASP.NET validates this bearer token.
  return config; // Continue with the updated request.
});

export default api; // Other files import this configured API client.
