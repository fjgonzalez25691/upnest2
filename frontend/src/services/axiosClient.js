// src/services/axiosClient.js

// file to configure Axios client for API requests in the UpNest application
// This file sets up the base URL, headers, and interceptors for handling authentication and errors
// It is used throughout the application to make API calls to the backend services  

import axios from 'axios';
import { config } from '../config/index.js';

const axiosClient = axios.create({
    baseURL: config.baseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to add Authorization header if token is available
export function setAuthToken(token) {
    if (token) {
        axiosClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axiosClient.defaults.headers.common['Authorization'];
    }
}

// Interceptor to handle errors globally
axiosClient.interceptors.response.use(
    response => response,
    error => {
        if (error.response) {
            // Handle specific error responses
            if (error.response.status === 401) {
                // Unauthorized access, redirect to login or show a message
                console.error('Unauthorized access - please log in again.');
            } else if (error.response.status === 403) {
                // Forbidden access, show a message or redirect
                console.error('Forbidden access - you do not have permission to view this resource.');
            } else {
                // Other errors, log them or show a generic message
                console.error('An error occurred:', error.response.data);
            }
        } else {
            // Network error or no response from server
            console.error('Network error or no response from server:', error.message);
        }
        return Promise.reject(error);
    }
);

export default axiosClient;
