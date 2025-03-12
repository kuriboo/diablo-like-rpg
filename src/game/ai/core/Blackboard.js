/**
 * Blackboard for sharing data between AI components
 * Provides a centralized storage for AI perception, memory, and decision-making
 */
class Blackboard {
    constructor(parent = null) {
      this.data = new Map();
      this.parent = parent; // Optional parent blackboard for hierarchical access
    }
  
    /**
     * Set a value in the blackboard
     * @param {string} key - The key to set
     * @param {any} value - The value to store
     */
    set(key, value) {
      this.data.set(key, value);
    }
  
    /**
     * Get a value from the blackboard
     * @param {string} key - The key to retrieve
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} The stored value or defaultValue
     */
    get(key, defaultValue = null) {
      // Check if the key exists in this blackboard
      if (this.data.has(key)) {
        return this.data.get(key);
      }
      
      // If not found and we have a parent, check the parent
      if (this.parent) {
        return this.parent.get(key, defaultValue);
      }
      
      // Not found anywhere
      return defaultValue;
    }
  
    /**
     * Check if a key exists in the blackboard
     * @param {string} key - The key to check
     * @returns {boolean} True if the key exists
     */
    has(key) {
      return this.data.has(key) || (this.parent && this.parent.has(key));
    }
  
    /**
     * Remove a key from the blackboard
     * @param {string} key - The key to remove
     * @returns {boolean} True if the key was removed
     */
    remove(key) {
      return this.data.delete(key);
    }
  
    /**
     * Clear all data from the blackboard
     */
    clear() {
      this.data.clear();
    }
  
    /**
     * Get all keys in the blackboard
     * @returns {Array} Array of keys
     */
    getKeys() {
      const keys = Array.from(this.data.keys());
      
      // Add parent keys if we have a parent
      if (this.parent) {
        const parentKeys = this.parent.getKeys();
        // Only add parent keys that don't exist in this blackboard
        for (const key of parentKeys) {
          if (!this.data.has(key)) {
            keys.push(key);
          }
        }
      }
      
      return keys;
    }
  
    /**
     * Create a child blackboard that inherits from this one
     * @returns {Blackboard} A new blackboard with this one as its parent
     */
    createChild() {
      return new Blackboard(this);
    }
}
  
export default Blackboard;