
/**
 * Safe utility functions for handling ArrayBuffer operations to prevent detachment errors
 */

/**
 * Creates a safe, independent copy of an ArrayBuffer that won't be affected by detachment
 * @param buffer The original ArrayBuffer to clone
 * @returns A new independent ArrayBuffer with the same content
 */
export const cloneArrayBuffer = (buffer: ArrayBuffer): ArrayBuffer => {
  // Create a completely new ArrayBuffer with the same content
  const clone = new ArrayBuffer(buffer.byteLength);
  
  // Copy the content
  new Uint8Array(clone).set(new Uint8Array(buffer));
  
  return clone;
};

/**
 * Creates a typed array from an ArrayBuffer safely with cloning to prevent detachment issues
 * @param buffer The original ArrayBuffer
 * @returns A new Uint8Array with a cloned buffer
 */
export const createSafeTypedArray = (buffer: ArrayBuffer): Uint8Array => {
  const clonedBuffer = cloneArrayBuffer(buffer);
  return new Uint8Array(clonedBuffer);
};

/**
 * Check if an ArrayBuffer is likely detached and log a warning if it is
 * @param buffer The ArrayBuffer to check
 * @returns Whether the buffer appears to be detached
 */
export const isArrayBufferDetached = (buffer: ArrayBuffer): boolean => {
  try {
    // Try to create a view - this will fail if the buffer is detached
    new Uint8Array(buffer, 0, 1);
    return false;
  } catch (e) {
    console.warn("Detected detached ArrayBuffer, creating a new copy");
    return true;
  }
};
