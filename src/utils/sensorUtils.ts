
/**
 * Utility functions for handling sensor data values and errors.
 */

/**
 * Checks if a sensor value represents an error state.
 * 
 * Rules:
 * 1. Global: Value of -999 indicates an error for ANY sensor.
 * 2. DHT-11 Specific: 
 *    - Applies ONLY if sensor ID contains 'dht11'. 
 *    - Error Condition: If BOTH Temperature and Humidity are 0, then ERROR.
 *    - If only one is 0, it is considered VALID.
 * 
 * @param sensorId - The ID or type of the sensor (e.g., 'mq4_1', 'dht11_temp', 'temperature')
 * @param value - The current value of the sensor
 * @param context - Object containing other sensor values (needed for cross-referencing DHT values)
 * @returns boolean - True if the value represents an error
 */
export const isSensorError = (
    sensorId: string,
    value: number,
    context: Record<string, any> = {}
): boolean => {
    if (!sensorId) return false;

    // Rule 1: Global Error Value
    // "-999" means ERROR for ANY sensor.
    if (value === -999) return true;

    const idLower = sensorId.toLowerCase();

    // Rule 2: DHT-11 Specific Logic
    // User Requirement: "if both DHT-11_temp and DHT-11_hum are equal to 0, make it ERROR."
    if (idLower.includes('dht11')) {

        // If the value itself is NOT 0, it doesn't match the "Both are 0" error condition.
        if (value !== 0) return false;

        // Value is 0. Now check the Sibling.
        // If Sibling is ALSO 0, then it is an ERROR.

        // Helper to find sibling value
        const getSiblingValue = (currentType: 'temp' | 'hum'): number | undefined => {
            // 1. Try generic keys from simulation
            const genericKey = currentType === 'temp' ? 'humidity' : 'temperature';
            if (context[genericKey] !== undefined) return context[genericKey];

            // 2. Try ID replacement
            const search = currentType === 'temp' ? /temp/i : /hum/i;
            const replace = currentType === 'temp' ? 'hum' : 'temp';
            const siblingId = search.test(sensorId) ? sensorId.replace(search, replace) : null;

            if (siblingId && context[siblingId] !== undefined) return context[siblingId];

            return undefined;
        };

        if (idLower.includes('temp')) {
            const siblingVal = getSiblingValue('temp');
            // If sibling is 0, then BOTH are 0 -> Error
            if (siblingVal === 0) return true;
        }

        if (idLower.includes('hum')) {
            const siblingVal = getSiblingValue('hum');
            // If sibling is 0, then BOTH are 0 -> Error
            if (siblingVal === 0) return true;
        }
    }

    return false;
};

/**
 * Formats the sensor value for display.
 * Returns "ERROR" if the value is determined to be an error, otherwise returns formatted number.
 * 
 * @param value - Check logic inside component, pass formatted or raw? 
 * This helper might just return string.
 */
export const getSensorDisplayValue = (value: number | null, isError: boolean, precision: number = 4): string => {
    if (isError) return 'ERROR';
    if (value === null || value === undefined) return '--';
    return value.toFixed(precision);
};
