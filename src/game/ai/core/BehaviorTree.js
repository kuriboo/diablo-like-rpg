/**
 * Behavior Tree implementation for AI decision making
 * Based on a hierarchical structure of nodes that define decision logic
 */

// Node states
export const NodeState = {
    SUCCESS: 'success',
    FAILURE: 'failure',
    RUNNING: 'running'
};
  
/**
* Base node class for all behavior tree nodes
*/
export class BehaviorNode {
    constructor() {
      this.state = NodeState.FAILURE;
    }
  
    /**
     * Execute this node's behavior
     * @param {AIController} controller - The AI controller
     * @param {number} delta - Time since last update
     * @returns {string} Node state after execution
     */
    execute(controller, delta) {
      // Base implementation - to be overridden by specific nodes
      return NodeState.FAILURE;
    }
  
    /**
     * Reset the node's state
     */
    reset() {
      this.state = NodeState.FAILURE;
    }
  }
  
  /**
   * Sequence node - executes children in order until one fails
   * Returns success only if all children succeed
   */
  export class SequenceNode extends BehaviorNode {
    constructor(children = []) {
      super();
      this.children = children;
      this.currentIndex = 0;
    }
  
    execute(controller, delta) {
      if (this.children.length === 0) {
        this.state = NodeState.SUCCESS;
        return this.state;
      }
  
      // Continue from where we left off
      while (this.currentIndex < this.children.length) {
        const child = this.children[this.currentIndex];
        const childState = child.execute(controller, delta);
  
        // If child is running or failed, return its state
        if (childState === NodeState.RUNNING) {
          this.state = NodeState.RUNNING;
          return this.state;
        } else if (childState === NodeState.FAILURE) {
          this.reset();
          this.state = NodeState.FAILURE;
          return this.state;
        }
  
        // Child succeeded, move to next child
        this.currentIndex++;
      }
  
      // All children succeeded
      this.reset();
      this.state = NodeState.SUCCESS;
      return this.state;
    }
  
    reset() {
      super.reset();
      this.currentIndex = 0;
      for (const child of this.children) {
        child.reset();
      }
    }
  }
  
  /**
   * Selector node - executes children in order until one succeeds
   * Returns failure only if all children fail
   */
  export class SelectorNode extends BehaviorNode {
    constructor(children = []) {
      super();
      this.children = children;
      this.currentIndex = 0;
    }
  
    execute(controller, delta) {
      if (this.children.length === 0) {
        this.state = NodeState.FAILURE;
        return this.state;
      }
  
      // Continue from where we left off
      while (this.currentIndex < this.children.length) {
        const child = this.children[this.currentIndex];
        const childState = child.execute(controller, delta);
  
        // If child is running or succeeded, return its state
        if (childState === NodeState.RUNNING) {
          this.state = NodeState.RUNNING;
          return this.state;
        } else if (childState === NodeState.SUCCESS) {
          this.reset();
          this.state = NodeState.SUCCESS;
          return this.state;
        }
  
        // Child failed, move to next child
        this.currentIndex++;
      }
  
      // All children failed
      this.reset();
      this.state = NodeState.FAILURE;
      return this.state;
    }
  
    reset() {
      super.reset();
      this.currentIndex = 0;
      for (const child of this.children) {
        child.reset();
      }
    }
  }
  
  /**
   * Inverter node - inverts the result of its child
   * Success becomes failure and vice versa
   */
  export class InverterNode extends BehaviorNode {
    constructor(child) {
      super();
      this.child = child;
    }
  
    execute(controller, delta) {
      if (!this.child) {
        this.state = NodeState.FAILURE;
        return this.state;
      }
  
      const childState = this.child.execute(controller, delta);
  
      if (childState === NodeState.RUNNING) {
        this.state = NodeState.RUNNING;
      } else if (childState === NodeState.SUCCESS) {
        this.state = NodeState.FAILURE;
      } else if (childState === NodeState.FAILURE) {
        this.state = NodeState.SUCCESS;
      }
  
      return this.state;
    }
  
    reset() {
      super.reset();
      if (this.child) {
        this.child.reset();
      }
    }
  }
  
  /**
   * Condition node - evaluates a condition function
   */
  export class ConditionNode extends BehaviorNode {
    constructor(condition) {
      super();
      this.condition = condition;
    }
  
    execute(controller, delta) {
      const result = this.condition(controller);
      this.state = result ? NodeState.SUCCESS : NodeState.FAILURE;
      return this.state;
    }
  }
  
  /**
   * Action node - performs an action when executed
   */
  export class ActionNode extends BehaviorNode {
    constructor(action) {
      super();
      this.action = action;
    }
  
    execute(controller, delta) {
      this.state = this.action(controller, delta);
      return this.state;
    }
  }
  
  /**
   * Main behavior tree class
   */
  export class BehaviorTree {
    constructor(rootNode = null) {
      this.rootNode = rootNode;
    }
  
    /**
     * Execute the behavior tree
     * @param {AIController} controller - The AI controller
     * @param {number} delta - Time since last update
     * @returns {string} Resulting state of execution
     */
    execute(controller, delta) {
      if (!this.rootNode) return NodeState.FAILURE;
      return this.rootNode.execute(controller, delta);
    }
  
    /**
     * Reset the behavior tree's state
     */
    reset() {
      if (this.rootNode) {
        this.rootNode.reset();
      }
    }
}
  
export default BehaviorTree;