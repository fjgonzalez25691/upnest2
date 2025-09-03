// src/services/growthDataApi.js
// API service for growth data operations following API Gateway routes

import axiosClient from "./axiosClient";

// Base URL for growth data endpoints (matches API Gateway)
const BASE_URL = "/growth-data";

/**
 * Get all growth data for a baby
 * @param {string} babyId - Baby ID to filter growth data
 * @returns {Promise<Array>} Array of growth data objects
 */
export const getGrowthData = async (babyId) => {
    try {
        // GET /growth-data with babyId as query parameter
        const response = await axiosClient.get(`${BASE_URL}?babyId=${babyId}`);
        
        // Handle different response formats
        if (Array.isArray(response.data)) {
            return response.data;
        } else if (response.data && Array.isArray(response.data.data)) {
            return response.data.data;
        } else if (response.data && Array.isArray(response.data.growthData)) {
            return response.data.growthData;
        } else {
            console.warn("Unexpected response format:", response.data);
            return [];
        }
    } catch (error) {
        console.error("Error fetching growth data:", error);
        throw error;
    }
};

/**
 * Get a specific growth measurement by dataId
 * @param {string} dataId - Growth data ID
 * @returns {Promise<Object>} Growth data object
 */
export const getGrowthMeasurement = async (dataId) => {
    try {
        // GET /growth-data/{dataId}
        const response = await axiosClient.get(`${BASE_URL}/${dataId}`);
        
        // Handle different response formats
        if (response.data && response.data.data) {
            return response.data.data;
        } else if (response.data) {
            return response.data;
        }
        throw new Error("No growth data received");
    } catch (error) {
        console.error("Error fetching growth measurement:", error);
        throw error;
    }
};

/**
 * Create new growth data for a baby
 * @param {Object} growthData - Growth data object
 * @param {string} growthData.babyId - Baby ID
 * @param {string} growthData.measurementDate - Date of measurement (ISO string)
 * @param {Object} growthData.measurements - Measurement values
 * @param {string} [growthData.measurements.weight] - Weight in grams
 * @param {string} [growthData.measurements.height] - Height in cm  
 * @param {string} [growthData.measurements.headCircumference] - Head circumference in cm
 * @param {string} [growthData.notes] - Optional notes
 * @param {string} [growthData.measurementSource] - Source of measurement (home, clinic, doctor)
 * @returns {Promise<Object>} Created growth data
 */
export const createGrowthData = async (growthData) => {
    try {
        // POST /growth-data
        const response = await axiosClient.post(BASE_URL, growthData);
        return response.data;
    } catch (error) {
        console.error("Error creating growth data:", error);
        throw error;
    }
};

/**
 * Update existing growth data
 * @param {string} dataId - Growth data ID
 * @param {Object} updateData - Updated growth data
 * @returns {Promise<Object>} Updated growth data including percentiles
 */
export const updateGrowthData = async (dataId, updateData) => {
    try {
        // PUT /growth-data/{dataId}
        const response = await axiosClient.put(`${BASE_URL}/${dataId}`, updateData);
        return response.data;
    } catch (error) {
        console.error("Error updating growth data:", error);
        throw error;
    }
};

/**
 * Delete growth data
 * @param {string} dataId - Growth data ID to delete
 * @returns {Promise<void>}
 */
export const deleteGrowthData = async (dataId) => {
    try {
        // DELETE /growth-data/{dataId}
        await axiosClient.delete(`${BASE_URL}/${dataId}`);
    } catch (error) {
        console.error("Error deleting growth data:", error);
        throw error;
    }
};

/**
 * Get WHO percentile data for a baby's measurements
 * @param {string} babyId - Baby ID
 * @param {string} measurementType - Type of measurement (weight, height, headCircumference)
 * @returns {Promise<Object>} Percentile data
 */
export const getPercentileData = async (babyId, measurementType) => {
    try {
        // GET /percentiles with query parameters
        const response = await axiosClient.get(`/percentiles?babyId=${babyId}&type=${measurementType}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching percentile data:", error);
        throw error;
    }
};

// Export legacy function names for backward compatibility
export const addGrowthData = createGrowthData;

export default {
    getGrowthData,
    getGrowthMeasurement,
    createGrowthData,
    updateGrowthData,
    deleteGrowthData,
    getPercentileData,
    // Legacy aliases
    addGrowthData: createGrowthData
};
