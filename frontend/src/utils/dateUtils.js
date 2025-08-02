/**
 * Date utility functions for baby tracking application
 * Functions for calculating age, days since birth, and other date-related calculations
 */

/**
 * Calculate age from date of birth
 * Returns both human-readable format and total days for percentile calculations
 * 
 * @param {string|Date} dateOfBirth - Date of birth in ISO format or Date object
 * @returns {Object} - Object with readable age and totalDays
 * 
 * Examples:
 * calculateAge('2025-01-01') => { readable: "7 months and 1 day old", totalDays: 213 }
 * calculateAge('2025-07-30') => { readable: "3 days old", totalDays: 3 }
 */
export const calculateAge = (dateOfBirth) => {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    
    // Calculate total days for percentiles (what the backend needs)
    const diffTime = today.getTime() - birth.getTime();
    const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // Calculate years, months and days to display to user
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();
    
    // Adjust if days are negative
    if (days < 0) {
        months--;
        const lastDayPrevMonth = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        days += lastDayPrevMonth;
    }
    
    // Adjust if months are negative
    if (months < 0) {
        years--;
        months += 12;
    }
    
    // Create readable text
    let readable;
    if (years > 0) {
        if (months > 0) {
            readable = `${years} year${years > 1 ? 's' : ''}, ${months} month${months > 1 ? 's' : ''} and ${days} day${days !== 1 ? 's' : ''} old`;
        } else {
            readable = `${years} year${years > 1 ? 's' : ''} and ${days} day${days !== 1 ? 's' : ''} old`;
        }
    } else if (months > 0) {
        readable = `${months} month${months > 1 ? 's' : ''} and ${days} day${days !== 1 ? 's' : ''} old`;
    } else {
        readable = `${totalDays} day${totalDays !== 1 ? 's' : ''} old`;
    }
    
    return {
        readable,
        totalDays,
        years,
        months,
        days
    };
};

/**
 * Get total days since birth (useful for percentile calculations)
 * 
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {number} - Total days since birth
 */
export const getDaysSinceBirth = (dateOfBirth) => {
    return calculateAge(dateOfBirth).totalDays;
};

/**
 * Format date to readable string
 * 
 * @param {string|Date} date - Date to format
 * @param {string} locale - Locale for formatting (default: 'en-US')
 * @returns {string} - Formatted date string
 */
export const formatDate = (date, locale = 'en-US') => {
    return new Date(date).toLocaleDateString(locale, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Check if a date is valid
 * 
 * @param {string|Date} date - Date to validate
 * @returns {boolean} - True if valid date
 */
export const isValidDate = (date) => {
    if (!date) return false;
    
    const d = new Date(date);
    if (d instanceof Date && !isNaN(d)) {
        // Additional check: if input was a string, verify it wasn't auto-corrected
        if (typeof date === 'string') {
            const originalParts = date.split('-');
            if (originalParts.length === 3) {
                const year = parseInt(originalParts[0]);
                const month = parseInt(originalParts[1]);
                const day = parseInt(originalParts[2]);
                
                // Check if the parsed date matches the input
                return d.getFullYear() === year && 
                       d.getMonth() === month - 1 && 
                       d.getDate() === day;
            }
        }
        return true;
    }
    return false;
};

/**
 * Calculate weeks since birth (useful for very young babies)
 * 
 * @param {string|Date} dateOfBirth - Date of birth
 * @returns {Object} - Object with total weeks and remaining days
 */
export const getWeeksSinceBirth = (dateOfBirth) => {
    const totalDays = getDaysSinceBirth(dateOfBirth);
    const weeks = Math.floor(totalDays / 7);
    const remainingDays = totalDays % 7;
    
    return {
        totalWeeks: weeks,
        remainingDays: remainingDays,
        totalDays: totalDays
    };
};
