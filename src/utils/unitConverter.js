/**
 * Distance unit conversion utilities
 */

const KM_TO_MILES = 0.621371;
const MILES_TO_KM = 1.60934;

/**
 * Convert kilometers to miles
 * @param {number} km - Distance in kilometers
 * @returns {number} Distance in miles
 */
export const kmToMiles = (km) => {
    return km * KM_TO_MILES;
};

/**
 * Convert miles to kilometers
 * @param {number} miles - Distance in miles
 * @returns {number} Distance in kilometers
 */
export const milesToKm = (miles) => {
    return miles * MILES_TO_KM;
};

/**
 * Format distance based on unit preference
 * @param {number} distanceKm - Distance in kilometers (always stored in km)
 * @param {string} unit - 'km' or 'miles'
 * @returns {string} Formatted distance with unit
 */
export const formatDistance = (distanceKm, unit = 'km') => {
    if (unit === 'miles') {
        const miles = kmToMiles(distanceKm);
        return `${miles.toFixed(2)} mi`;
    }
    return `${distanceKm.toFixed(2)} km`;
};

/**
 * Format pace based on unit preference
 * @param {number} secondsPerKm - Pace in seconds per kilometer
 * @param {string} unit - 'km' or 'miles'
 * @returns {string} Formatted pace (e.g., "5:30 /km" or "8:51 /mi")
 */
export const formatPace = (secondsPerKm, unit = 'km') => {
    let seconds = secondsPerKm;

    if (unit === 'miles') {
        // Convert pace from /km to /mile
        seconds = secondsPerKm * MILES_TO_KM;
    }

    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const unitLabel = unit === 'miles' ? '/mi' : '/km';

    return `${minutes}:${secs.toString().padStart(2, '0')} ${unitLabel}`;
};

/**
 * Get distance value in the specified unit
 * @param {number} distanceKm - Distance in kilometers
 * @param {string} unit - 'km' or 'miles'
 * @returns {number} Distance in the specified unit
 */
export const getDistanceValue = (distanceKm, unit = 'km') => {
    if (unit === 'miles') {
        return kmToMiles(distanceKm);
    }
    return distanceKm;
};

/**
 * Get unit label
 * @param {string} unit - 'km' or 'miles'
 * @returns {string} Unit label
 */
export const getUnitLabel = (unit = 'km') => {
    return unit === 'miles' ? 'mi' : 'km';
};
