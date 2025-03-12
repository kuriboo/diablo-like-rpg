import React, { useState, useEffect, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';
import skillTreeManager from '../../game/skills/core/SkillTreeManager';
import SkillTreeNode from './SkillTreeNode';
import SkillTooltip from './SkillTooltip';
import gameInstance from '../../game/core/Game';

// カスタムノードタイプの定義
const nodeTypes = {
  skillNode: SkillTreeNode,
};

/**
 * スキルツリーUIコンポーネント
 * reactflowを使用してスキルツリーを視覚化
 */
const SkillTree = ({ character, onClose }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [remainingPoints, setRemainingPoints] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);

  // スキルツリーデータの読み込み
  useEffect(() => {
    const loadSkillTree = async () => {
      if (!character) return;

      try {
        // スキルツリーマネージャーを初期化
        await skillTreeManager.initialize(character);
        
        // スキルツリーグラフデータを取得
        const graphData = skillTreeManager.getSkillTreeGraph(character);
        setNodes(graphData.nodes);
        setEdges(graphData.edges);
        
        // 残りのスキルポイントを取得
        const points = skillTreeManager.getRemainingSkillPoints(character);
        setRemainingPoints(points);
      } catch (error) {
        console.error('Failed to load skill tree:', error);
      }
    };

    loadSkillTree();
  }, [character]);

  // スキルツリーデータの更新
  const updateSkillTree = useCallback(() => {
    if (!character) return;
    
    // スキルツリーグラフデータを取得
    const graphData = skillTreeManager.getSkillTreeGraph(character);
    setNodes(graphData.nodes);
    setEdges(graphData.edges);
    
    // 残りのスキルポイントを取得
    const points = skillTreeManager.getRemainingSkillPoints(character);
    setRemainingPoints(points);
  }, [character]);

  // ノードクリック時の処理
  const onNodeClick = useCallback((event, node) => {
    // 選択中のノードを設定
    setSelectedNode(node);
  }, []);

  // ノード上にマウスを置いた時の処理
  const onNodeMouseEnter = useCallback((event, node) => {
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY
    });
    setSelectedNode(node);
    setShowTooltip(true);
  }, []);

  // ノードからマウスが離れた時の処理
  const onNodeMouseLeave = useCallback(() => {
    setShowTooltip(false);
  }, []);

  // スキルポイント割り当て処理
  const allocateSkillPoint = useCallback((nodeId) => {
    if (!character || !nodeId) return;
    
    // スキルポイントを割り当て
    const success = skillTreeManager.allocateSkillPoint(nodeId, character);
    
    if (success) {
      // スキルツリーを更新
      updateSkillTree();
      
      // スキルツリー変更イベントを発行
      gameInstance.events.emit('skillTreeChanged', character);
    }
  }, [character, updateSkillTree]);

  // スキルポイントリセット処理
  const resetSkillPoints = useCallback(() => {
    if (!character) return;
    
    // スキルポイントをリセット
    const success = skillTreeManager.playerSkillState.resetSkillPoints();
    
    if (success) {
      // スキルツリーを更新
      updateSkillTree();
      
      // スキルツリー変更イベントを発行
      gameInstance.events.emit('skillTreeChanged', character);
    }
  }, [character, updateSkillTree]);

  return (
    <div className="skill-tree-container" style={{ width: '100%', height: '100%' }}>
      <div className="skill-tree-header">
        <h2>スキルツリー</h2>
        <div className="skill-points-info">
          <span>残りスキルポイント: {remainingPoints}</span>
          <button 
            className="reset-button" 
            onClick={resetSkillPoints}
            disabled={skillTreeManager.playerSkillState?.spentSkillPoints <= 0}
          >
            リセット
          </button>
          <button className="close-button" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
      
      <div className="skill-tree-content" style={{ height: 'calc(100% - 60px)' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            nodesDraggable={false}
            nodesConnectable={false}
            elementsSelectable={true}
            zoomOnScroll={true}
            panOnScroll={true}
            panOnDrag={true}
            minZoom={0.2}
            maxZoom={4}
            fitView={true}
            attributionPosition="bottom-right"
          >
            <Background />
            <Controls />
            <MiniMap 
              nodeColor={(node) => {
                if (node.data.isUnlocked) return '#00ff00';
                if (node.data.isAvailable) return '#ffcc00';
                return '#999999';
              }}
              maskColor="#1a1a1a77"
            />
          </ReactFlow>
        </ReactFlowProvider>
        
        {showTooltip && selectedNode && (
          <SkillTooltip 
            node={selectedNode} 
            position={tooltipPosition}
            remainingPoints={remainingPoints}
            onAllocate={() => allocateSkillPoint(selectedNode.id)}
          />
        )}
      </div>
      
      {selectedNode && !showTooltip && (
        <div className="selected-node-info">
          <h3>{selectedNode.data.label}</h3>
          <p>{selectedNode.data.description}</p>
          {selectedNode.data.isAvailable && remainingPoints >= 1 && !selectedNode.data.isUnlocked && (
            <button 
              className="allocate-button"
              onClick={() => allocateSkillPoint(selectedNode.id)}
            >
              スキルポイントを割り当て
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillTree;