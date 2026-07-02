import { fetchInterceptors } from '@/interceptors/fetch';

// Add your request interceptors here, like url-rewrite or auth-header injection
fetchInterceptors.request.use((config) => config);

// Add your response interceptors here, like logging or error handling
fetchInterceptors.response.use((response) => response);
