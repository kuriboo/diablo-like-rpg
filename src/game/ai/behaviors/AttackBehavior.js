import { NodeState } from '../core/BehaviorTree';

/**
 * AttackBehavior - Handles character attack actions against a target
 */
class AttackBehavior {
  /**
   * Create a new attack behavior
   * @param {object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      attackRange: 50, // Default attack range
      attackCooldown: 1000, // Default cooldown in ms
      preferredSkills: [], // List of preferred skill IDs to use
      useBasicAttackWhenSkillsUnavailable: true,
      ...options
    };
    
    this.lastAttackTime = 0;
    this.state = NodeState.FAILURE;
  }

  /**
   * Execute the attack behavior
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
    
    // Check if target is in range
    if (distance > this.options.attackRange) {
      this.state = NodeState.FAILURE;
      return this.state;
    }
    
    // Check attack cooldown
    const currentTime = Date.now();
    if (currentTime - this.lastAttackTime < this.options.attackCooldown) {
      this.state = NodeState.RUNNING;
      return this.state;
    }
    
    // Try to use a skill first if we have preferred skills
    let attackPerformed = false;
    
    if (this.options.preferredSkills.length > 0) {
      for (const skillId of this.options.preferredSkills) {
        // Check if skill is available in the skill tree
        const skill = this.findSkillInSkillTree(owner.SkillTree, skillId);
        
        if (skill && this.canUseSkill(owner, skill)) {
          this.useSkill(owner, target, skill);
          attackPerformed = true;
          break;
        }
      }
    }
    
    // If no skill was used and we're allowed to use basic attack
    if (!attackPerformed && this.options.useBasicAttackWhenSkillsUnavailable) {
      this.performBasicAttack(owner, target);
      attackPerformed = true;
    }
    
    // Update attack time if an attack was performed
    if (attackPerformed) {
      this.lastAttackTime = currentTime;
      this.state = NodeState.SUCCESS;
    } else {
      this.state = NodeState.FAILURE;
    }
    
    return this.state;
  }

  /**
   * Perform a basic attack against the target
   * @param {Character} attacker - The attacking character
   * @param {Character} target - The target character
   */
  performBasicAttack(attacker, target) {
    // Get basic attack action from the character
    const basicAttackAction = this.getBasicAttackAction(attacker);
    
    if (basicAttackAction) {
      // Set the target for the action
      basicAttackAction.target = target;
      
      // Execute the action
      basicAttackAction.play();
      
      // Face the target
      this.faceTarget(attacker, target);
    }
  }

  /**
   * Use a skill against the target
   * @param {Character} user - The skill user
   * @param {Character} target - The target
   * @param {object} skill - The skill to use
   */
  useSkill(user, target, skill) {
    // Check if the skill is an action
    if (skill.action) {
      // Set the target for the action
      skill.action.target = target;
      
      // Execute the action
      skill.action.play();
      
      // Consume mana if required
      if (skill.manaCost && user.Mana >= skill.manaCost) {
        user.Mana -= skill.manaCost;
      }
      
      // Face the target
      this.faceTarget(user, target);
    }
  }

  /**
   * Check if a skill can be used
   * @param {Character} character - The character
   * @param {object} skill - The skill to check
   * @returns {boolean} True if the skill can be used
   */
  canUseSkill(character, skill) {
    // Check cooldown
    if (skill.lastUsedTime && Date.now() - skill.lastUsedTime < skill.cooldown) {
      return false;
    }
    
    // Check mana cost
    if (skill.manaCost && character.Mana < skill.manaCost) {
      return false;
    }
    
    return true;
  }

  /**
   * Find a skill in the character's skill tree
   * @param {object} skillTree - The character's skill tree
   * @param {string} skillId - The ID of the skill to find
   * @returns {object|null} The skill object or null if not found
   */
  findSkillInSkillTree(skillTree, skillId) {
    if (!skillTree) return null;
    
    // Implementation depends on your skill tree structure
    // This is a simplified example
    if (skillTree.skills) {
      return skillTree.skills.find(skill => skill.id === skillId);
    }
    
    return null;
  }

  /**
   * Get the basic attack action for a character
   * @param {Character} character - The character
   * @returns {Action|null} The basic attack action or null
   */
  getBasicAttackAction(character) {
    // Implementation depends on your character structure
    // This is a simplified example
    if (character.actions) {
      return character.actions.find(action => action.type === 'basicAttack');
    }
    
    return null;
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
    // This is a simplified example
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
  }
}

export default AttackBehavior;