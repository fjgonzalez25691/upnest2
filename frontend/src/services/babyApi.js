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
 * @param {number} babyData.headCircumference - Birth head circumference in cm
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
export const updateBaby = async (babyId, updateData, options = {}) => {
    try {
        const query = options.syncRecalc ? "?syncRecalc=1" : "";
        const response = await axiosClient.patch(`${BASE_URL}/${babyId}${query}`, updateData);
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

// For legacy compatibility, we can provide an alias that points to the new service
// This way existing code won't break immediately
export const getBaby = getBabyById; // Alias for consistency

export default {
    createBaby,
    getBabies,
    getBabyById,
    getBaby: getBabyById, // Alias
    updateBaby,
    deleteBaby
};
