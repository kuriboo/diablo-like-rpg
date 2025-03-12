/**
 * Manages and updates multiple AI controllers in the game
 * Provides centralized control and performance optimization
 */
class AIManager {
    constructor() {
      this.controllers = new Map();
      this.enabled = true;
      this.globalBlackboard = new Map(); // Shared data between all AIs
    }
  
    /**
     * Register an AI controller with the manager
     * @param {string} id - Unique identifier for this controller
     * @param {AIController} controller - The controller to register
     */
    register(id, controller) {
      if (this.controllers.has(id)) {
        console.warn(`AI controller with ID ${id} already exists, replacing.`);
      }
      this.controllers.set(id, controller);
    }
  
    /**
     * Unregister an AI controller
     * @param {string} id - ID of the controller to remove
     */
    unregister(id) {
      this.controllers.delete(id);
    }
  
    /**
     * Get a registered AI controller
     * @param {string} id - ID of the controller to retrieve
     * @returns {AIController|undefined} The requested controller or undefined
     */
    getController(id) {
      return this.controllers.get(id);
    }
  
    /**
     * Update all registered AI controllers
     * @param {number} time - Current game time
     * @param {number} delta - Time since last update
     */
    update(time, delta) {
      if (!this.enabled) return;
      
      // Update all controllers
      for (const controller of this.controllers.values()) {
        controller.update(time, delta);
      }
    }
  
    /**
     * Enable or disable all AI controllers
     * @param {boolean} value - Whether to enable or disable
     */
    setEnabled(value) {
      this.enabled = value;
      
      // Apply to all controllers
      for (const controller of this.controllers.values()) {
        controller.setEnabled(value);
      }
    }
  
    /**
     * Store a value in the global blackboard
     * @param {string} key - The key to store the value under
     * @param {any} value - The value to store
     */
    setGlobalBlackboardValue(key, value) {
      this.globalBlackboard.set(key, value);
    }
  
    /**
     * Retrieve a value from the global blackboard
     * @param {string} key - The key to retrieve
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} The stored value or defaultValue
     */
    getGlobalBlackboardValue(key, defaultValue = null) {
      return this.globalBlackboard.has(key) ? this.globalBlackboard.get(key) : defaultValue;
    }
  
    /**
     * Get all AI controllers within a certain radius of a position
     * @param {object} position - Center position
     * @param {number} radius - Radius to search within
     * @returns {Array} Array of AI controllers within the radius
     */
    getControllersInRadius(position, radius) {
      const result = [];
      
      for (const controller of this.controllers.values()) {
        if (controller.owner && controller.owner.position) {
          const distance = this.calculateDistance(position, controller.owner.position);
          if (distance <= radius) {
            result.push(controller);
          }
        }
      }
      
      return result;
    }
  
    /**
     * Calculate distance between two positions
     * @param {object} pos1 - First position
     * @param {object} pos2 - Second position
     * @returns {number} Distance between positions
     */
    calculateDistance(pos1, pos2) {
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      return Math.sqrt(dx * dx + dy * dy);
    }
}
  
export default AIManager;