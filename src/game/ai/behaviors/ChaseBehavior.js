import { NodeState } from '../core/BehaviorTree';

/**
 * ChaseBehavior - Makes a character chase/pursue a target
 */
class ChaseBehavior {
  /**
   * Create a new chase behavior
   * @param {object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      updatePathInterval: 500, // ms between path recalculations
      maxChaseDistance: 500, // Maximum chase distance
      minDistance: 30, // Minimum distance to maintain from target
      chaseSpeed: 1.5, // Speed multiplier while chasing
      pathfindingEnabled: true, // Whether to use pathfinding
      ...options
    };
    
    this.lastPathUpdateTime = 0;
    this.currentPath = [];
    this.currentPathIndex = 0;
    this.state = NodeState.FAILURE;
  }

  /**
   * Execute the chase behavior
   * @param {AIController} controller - The AI controller
   * @param {number} delta - Time since last update
   * @returns {string} The resulting state
   */
  execute(controller, delta) {
    const owner = controller.owner;
    const target = controller.target;
    
    // Validate owner and target
    if (!owner || !target) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // Check if target is alive
    if (target.Life <= 0) {
      controller.setTarget(null);
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // Calculate distance to target
    const distance = this.calculateDistance(owner.position, target.position);
    
    // If we're too far from target, stop chasing
    if (distance > this.options.maxChaseDistance) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // If we're close enough to the target, succeed
    if (distance <= this.options.minDistance) {
      this.state = NodeState.SUCCESS;
      return this.state;
    }
    
    // Update path to target if needed
    const currentTime = Date.now();
    if (this.options.pathfindingEnabled && 
        (currentTime - this.lastPathUpdateTime > this.options.updatePathInterval || 
         this.currentPath.length === 0)) {
      this.updatePath(controller);
      this.lastPathUpdateTime = currentTime;
    }
    
    // Follow the path or move directly to target
    if (this.options.pathfindingEnabled && this.currentPath.length > 0) {
      this.followPath(owner, delta);
    } else {
      this.moveDirectlyTowardsTarget(owner, target, delta);
    }
    
    // Face the target
    this.faceTarget(owner, target);
    
    this.state = NodeState.RUNNING;
    return this.state;
  }

  /**
   * Update the path to the target
   * @param {AIController} controller - The AI controller
   */
  updatePath(controller) {
    const owner = controller.owner;
    const target = controller.target;
    
    // If we have a pathfinder in the controller, use it
    const pathfinder = controller.getBlackboardValue('pathfinder');
    if (pathfinder) {
      this.currentPath = pathfinder.findPath(owner.position, target.position);
      this.currentPathIndex = 0;
    } else {
      // No pathfinder available, clear the path
      this.currentPath = [];
    }
  }

  /**
   * Follow the calculated path
   * @param {Character} character - The character
   * @param {number} delta - Time since last update
   */
  followPath(character, delta) {
    if (this.currentPath.length === 0 || this.currentPathIndex >= this.currentPath.length) {
      return;
    }
    
    // Get current waypoint
    const waypoint = this.currentPath[this.currentPathIndex];
    
    // Calculate distance to waypoint
    const distance = this.calculateDistance(character.position, waypoint);
    
    // If we're close enough to the waypoint, move to the next one
    if (distance <= 5) {
      this.currentPathIndex++;
      
      // If we've reached the end of the path, stop
      if (this.currentPathIndex >= this.currentPath.length) {
        return;
      }
    }
    
    // Move towards current waypoint
    this.moveTowards(character, waypoint, delta);
  }

  /**
   * Move directly towards the target without pathfinding
   * @param {Character} character - The character
   * @param {Character} target - The target
   * @param {number} delta - Time since last update
   */
  moveDirectlyTowardsTarget(character, target, delta) {
    this.moveTowards(character, target.position, delta);
  }

  /**
   * Move a character towards a position
   * @param {Character} character - The character
   * @param {object} position - The target position
   * @param {number} delta - Time since last update
   */
  moveTowards(character, position, delta) {
    // Calculate direction vector
    const dx = position.x - character.position.x;
    const dy = position.y - character.position.y;
    
    // Normalize direction
    const length = Math.sqrt(dx * dx + dy * dy);
    const dirX = dx / length;
    const dirY = dy / length;
    
    // Calculate movement distance
    const speed = character.MoveSpeed * this.options.chaseSpeed;
    const moveDistance = speed * delta / 1000; // Convert to seconds
    
    // Calculate new position
    const newX = character.position.x + dirX * moveDistance;
    const newY = character.position.y + dirY * moveDistance;
    
    // Update character position
    if (character.move) {
      character.move(newX, newY);
    } else {
      character.position.x = newX;
      character.position.y = newY;
    }
  }

  /**
   * Make a character face a target
   * @param {Character} character - The character
   * @param {Character} target - The target
   */
  faceTarget(character, target) {
    if (!character || !target) return;
    
    // Calculate direction to target
    const dx = target.position.x - character.position.x;
    const dy = target.position.y - character.position.y;
    
    // Set character direction based on angle
    const angle = Math.atan2(dy, dx);
    
    // Implementation depends on your character structure
    if (character.setDirection) {
      character.setDirection(angle);
    }
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
   * Reset the behavior's state
   */
  reset() {
    this.state = NodeState.FAILURE;
    this.currentPath = [];
    this.currentPathIndex = 0;
  }
}

export default ChaseBehavior;