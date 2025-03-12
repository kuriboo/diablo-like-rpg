/**
 * Base class for AI controllers in the game
 * Provides common functionality for all AI-controlled entities
 */
class AIController {
    /**
     * Create a new AI controller
     * @param {Character} owner - The character this AI controls
     * @param {object} options - Configuration options
     */
    constructor(owner, options = {}) {
      this.owner = owner;
      this.options = {
        updateInterval: 200, // ms between AI updates
        perceptionRadius: 300, // default perception radius
        ...options
      };
      
      this.enabled = true;
      this.target = null;
      this.lastUpdateTime = 0;
      this.blackboard = new Map(); // Shared data for AI components
      this.currentBehavior = null;
    }
  
    /**
     * Update the AI state
     * @param {number} time - Current game time
     * @param {number} delta - Time since last update
     */
    update(time, delta) {
      if (!this.enabled || !this.owner) return;
      
      // Only update at specified intervals to save performance
      if (time - this.lastUpdateTime < this.options.updateInterval) return;
      this.lastUpdateTime = time;
      
      // Update perception
      this.updatePerception();
      
      // Update behavior
      if (this.currentBehavior) {
        const result = this.currentBehavior.execute(delta);
        if (result !== 'running') {
          this.selectNextBehavior();
        }
      } else {
        this.selectNextBehavior();
      }
    }
  
    /**
     * Update the perception system to detect targets and threats
     */
    updatePerception() {
      // Base implementation - to be overridden by specific AI types
    }
  
    /**
     * Select the next behavior to execute
     */
    selectNextBehavior() {
      // Base implementation - to be overridden by specific AI types
    }
  
    /**
     * Set or clear the current target for this AI
     * @param {Character|null} target - The new target, or null to clear
     */
    setTarget(target) {
      this.target = target;
      this.blackboard.set('currentTarget', target);
    }
  
    /**
     * Check if a position is within perception range
     * @param {object} position - Position to check
     * @returns {boolean} True if position is within range
     */
    isInPerceptionRange(position) {
      if (!this.owner || !position) return false;
      
      const distance = this.calculateDistance(this.owner.position, position);
      return distance <= this.options.perceptionRadius;
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
  
    /**
     * Enable or disable the AI controller
     * @param {boolean} value - Whether to enable or disable
     */
    setEnabled(value) {
      this.enabled = value;
    }
  
    /**
     * Store a value in the AI's blackboard
     * @param {string} key - The key to store the value under
     * @param {any} value - The value to store
     */
    setBlackboardValue(key, value) {
      this.blackboard.set(key, value);
    }
  
    /**
     * Retrieve a value from the AI's blackboard
     * @param {string} key - The key to retrieve
     * @param {any} defaultValue - Default value if key doesn't exist
     * @returns {any} The stored value or defaultValue
     */
    getBlackboardValue(key, defaultValue = null) {
      return this.blackboard.has(key) ? this.blackboard.get(key) : defaultValue;
    }
}
  
export default AIController;