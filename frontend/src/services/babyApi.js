// src/services/babyApi.js
// API service for baby-related operations with user authentication

import axiosClient from "./axiosClient";

// Base URL for baby-related endpoints
const BASE_URL = "/babies";

/**
 * Create a new baby associated with the current user
 * @param {Object} babyData - Baby information
 * @param {string} babyData.name - Baby's name
 * @param {string} babyData.dob - Date of birth (ISO string)
 * @param {string} babyData.sex - Baby's sex ('male' or 'female')
 * @param {boolean} babyData.premature - Whether baby was premature
 * @param {number} babyData.gestationalWeek - Gestational week if premature
 * @param {string} babyData.userId - User ID (will be added automatically)
 * @returns {Promise<Object>} Created baby data
 */
export const createBaby = async (babyData) => {
    try {
        const response = await axiosClient.post(BASE_URL, babyData);
        return response.data;
    } catch (error) {
        console.error("Error creating baby:", error);
        throw error;
    }
};

/**
 * Get all babies for the current user
 * @returns {Promise<Array>} Array of baby objects
 */
export const getBabies = async () => {
    try {
        const response = await axiosClient.get(BASE_URL);
        console.log("Raw API response:", response.data);

        // Handle different response formats
        if (Array.isArray(response.data)) {
            return response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
            return response.data.data;
        } else if (response.data && Array.isArray(response.data.babies)) {
            return response.data.babies;
        } else {
            console.warn("Unexpected response format:", response.data);
            return [];
        }
    } catch (error) {
        console.error("Error fetching babies:", error);
        throw error;
    }
};

/**
 * Get a specific baby by ID (only if it belongs to current user)
 * @param {string} babyId - Baby ID
 * @returns {Promise<Object>} Baby data
 */
export const getBabyById = async (babyId) => {
    try {
        const response = await axiosClient.get(`${BASE_URL}/${babyId}`);
        // Handle different response formats consistently
        if (response.data && response.data.data) {
            return response.data.data;
        } else if (response.data) {
            return response.data;
        }
        throw new Error("No baby data received");
    } catch (error) {
        console.error("Error fetching baby:", error);
        throw error;
    }
};

/**
 * Update a baby (only if it belongs to current user)
 * @param {string} babyId - Baby ID
 * @param {Object} updateData - Updated baby data
 * @returns {Promise<Object>} Updated baby data
 */
export const updateBaby = async (babyId, updateData) => {
    try {
        const response = await axiosClient.put(`${BASE_URL}/${babyId}`, updateData);
        return response.data;
    } catch (error) {
        console.error("Error updating baby:", error);
        throw error;
    }
};

/**
 * Delete a baby (only if it belongs to current user)
 * @param {string} babyId - Baby ID
 * @returns {Promise<void>}
 */
export const deleteBaby = async (babyId) => {
    try {
        await axiosClient.delete(`${BASE_URL}/${babyId}`);
    } catch (error) {
        console.error("Error deleting baby:", error);
        throw error;
    }
};

/**
 * Add growth data for a baby (only if baby belongs to current user)
 * @param {string} babyId - Baby ID
 * @param {Object} growthData - Growth data
 * @param {number} growthData.weight - Weight in grams
 * @param {number} growthData.height - Height in cm
 * @param {number} growthData.headCircumference - Head circumference in cm
 * @param {string} growthData.date - Date of measurement (ISO string)
 * @returns {Promise<Object>} Created growth data
 */
export const addGrowthData = async (babyId, growthData) => {
    try {
        const response = await axiosClient.post(`${BASE_URL}/${babyId}/growth`, growthData);
        return response.data;
    } catch (error) {
        console.error("Error adding growth data:", error);
        throw error;
    }
};

/**
 * Get growth data for a baby (only if baby belongs to current user)
 * @param {string} babyId - Baby ID
 * @returns {Promise<Array>} Array of growth data objects
 */
export const getGrowthData = async (babyId) => {
    try {
        const response = await axiosClient.get(`${BASE_URL}/${babyId}/growth`);
        return response.data;
    } catch (error) {
        console.error("Error fetching growth data:", error);
        throw error;
    }
};
