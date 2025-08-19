/**
 * Centralized number utility functions for measurement handling
 * Provides consistent, precise number conversion, validation, and formatting
 */

/**
 * Safely converts and normalizes a numeric input with high precision
 * @param {string|number} value - Input value to normalize
 * @param {number} precision - Number of decimal places to maintain (default: 2)
 * @returns {number|null} - Normalized number or null if invalid
 */
export const parseNumber = (value, precision = 2) => {
    if (value === null || value === undefined || value === "") return null;
    
    // Normalize string input (European notation support)
    if (typeof value === "string") {
        value = value.replace(",", ".").replace(/\s/g, "");
    }
    
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    
    // Use Number.parseFloat with precision to avoid floating point errors
    return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
};

/**
 * Validates numeric input for measurements with range checks
 * @param {string|number} value - Value to validate
 * @param {Object} options - Validation options
 * @returns {Object} - { isValid: boolean, value: number|null, error: string|null }
 */
export const validateMeasurement = (value, options = {}) => {
    const { min = 0, max = Infinity, precision = 2, fieldName = "Value" } = options;
    
    if (!value && value !== 0) {
        return { isValid: true, value: null, error: null }; // Optional field
    }
    
    const parsedValue = parseNumber(value, precision);
    
    if (parsedValue === null) {
        return { isValid: false, value: null, error: `${fieldName} must be a valid number` };
    }
    
    if (parsedValue < min) {
        return { isValid: false, value: null, error: `${fieldName} must be at least ${min}` };
    }
    
    if (parsedValue > max) {
        return { isValid: false, value: null, error: `${fieldName} cannot exceed ${max}` };
    }
    
    return { isValid: true, value: parsedValue, error: null };
};

/**
 * Format a number with consistent precision and optional unit
 * @param {string|number} value - Value to format
 * @param {string} unit - Unit to display (optional)
 * @param {number} precision - Decimal places (default: 1)
 * @returns {string} - Formatted string
 */
export const formatNumber = (value, unit = "", precision = 1) => {
    const num = parseNumber(value, precision);
    if (num === null) return "--";
    
    const formatted = num.toLocaleString("en-US", {
        minimumFractionDigits: precision,
        maximumFractionDigits: precision
    });
    
    return unit ? `${formatted} ${unit}` : formatted;
};

/**
 * Legacy function for backwards compatibility
 * @deprecated Use parseNumber instead
 */
export const normalizeNumber = (value) => {
    return parseNumber(value) || value;
};

/**
 * Legacy function for backwards compatibility  
 * @deprecated Use formatNumber instead
 */
export const formatNumberWithOptionalDecimal = (value, unit = "") => {
    return formatNumber(value, unit, 1);
};

/**
 * Measurement field configurations for validation
 * NOTE: All weights are in GRAMS
 */
export const MEASUREMENT_CONFIGS = {
    weight: {
        min: 100,
        max: 50000,
        precision: 0,
        unit: "g",
        fieldName: "Weight"
    },
    height: {
        min: 10,
        max: 150,
        precision: 1,
        unit: "cm", 
        fieldName: "Height"
    },
    headCircumference: {
        min: 20,
        max: 60,
        precision: 1,
        unit: "cm",
        fieldName: "Head Circumference"
    },
    birthWeight: {
        min: 500,
        max: 6000,
        precision: 0,
        unit: "g",
        fieldName: "Birth Weight"
    },
    birthHeight: {
        min: 20,
        max: 60,
        precision: 1,
        unit: "cm",
        fieldName: "Birth Height"
    },
    gestationalWeek: {
        min: 20,
        max: 42,
        precision: 0,
        unit: "weeks",
        fieldName: "Gestational Week"
    }
};

/**
 * Validates and processes measurement data
 * @param {Object} measurements - Object containing measurement values
 * @returns {Object} - { isValid: boolean, processedData: Object, errors: Array }
 */
export const processMeasurements = (measurements) => {
    const processedData = {};
    const errors = [];
    let isValid = true;
    
    Object.entries(measurements).forEach(([field, value]) => {
        const config = MEASUREMENT_CONFIGS[field];
        if (!config) {
            processedData[field] = value; // Pass through unknown fields
            return;
        }
        
        const validation = validateMeasurement(value, config);
        if (!validation.isValid) {
            errors.push(validation.error);
            isValid = false;
        } else {
            processedData[field] = validation.value;
        }
    });
    
    return { isValid, processedData, errors };
};