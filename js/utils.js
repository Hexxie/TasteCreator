/**
 * Restricts a value to be within a specified range.
 *
 * @function
 * @name clamp
 * @param {number} x - The value to be clamped.
 * @param {number} lo - The lower bound of the range.
 * @param {number} hi - The upper bound of the range.
 * @returns {number} The clamped value, ensuring it is within the range [lo, hi].
 *
 * @example
 * // Example usage:
 * clamp(120, 0, 100);
 * // Returns: 100, because 120 is greater than the upper bound of 100.
 *
 * clamp(-10, 0, 50);
 * // Returns: 0, because -10 is less than the lower bound of 0.
 *
 * clamp(25, 0, 50);
 * // Returns: 25, because the value is within the range.
 */
export function clamp(x, lo, hi) {
    return x < lo ? lo : x > hi ? hi : x;
}