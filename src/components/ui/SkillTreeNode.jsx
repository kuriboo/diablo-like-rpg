import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

/**
 * スキルツリーノードコンポーネント
 * スキルツリー内の個々のノードを表示
 */
const SkillTreeNode = memo(({ data, isConnectable }) => {
  const {
    label,
    nodeType,
    icon,
    isUnlocked,
    isAvailable,
    level,
    maxLevel
  } = data;

  // ノードの状態に基づくスタイルを設定
  const getNodeStyle = () => {
    if (isUnlocked) {
      return {
        background: 'linear-gradient(to bottom, #006600, #003300)',
        border: '2px solid #00ff00',
        color: '#ffffff'
      };
    }
    
    if (isAvailable) {
      return {
        background: 'linear-gradient(to bottom, #665500, #333300)',
        border: '2px solid #ffcc00',
        color: '#ffffff'
      };
    }
    
    return {
      background: 'linear-gradient(to bottom, #333333, #1a1a1a)',
      border: '2px solid #666666',
      color: '#999999'
    };
  };

  // ノードタイプに基づくアイコンの背景色を設定
  const getIconBackground = () => {
    switch (nodeType) {
      case 'passive':
        return '#0066cc';
      case 'skill':
        return '#cc0000';
      case 'root':
        return '#9900cc';
      default:
        return '#333333';
    }
  };

  return (
    <div
      className={`skill-node ${nodeType} ${isUnlocked ? 'unlocked' : ''} ${isAvailable ? 'available' : ''}`}
      style={{
        width: '120px',
        height: '120px',
        borderRadius: '10px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...getNodeStyle()
      }}
    >
      {/* 入力ハンドル（上部） */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: '#555', width: '10px', height: '10px' }}
        isConnectable={isConnectable}
      />

      {/* スキルアイコン */}
      <div
        className="skill-icon"
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: getIconBackground(),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundImage: `url(/assets/images/ui/skills/${icon})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          border: isUnlocked ? '2px solid #00ff00' : '2px solid #666666'
        }}
      >
        {/* アイコン画像が読み込めない場合の代替表示 */}
        {nodeType.charAt(0).toUpperCase()}
      </div>

      {/* スキル名 */}
      <div className="skill-label" style={{ textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }}>
        {label}
      </div>

      {/* スキルレベル（該当する場合） */}
      {(level !== undefined && maxLevel > 1) && (
        <div className="skill-level" style={{ fontSize: '10px' }}>
          Level: {level}/{maxLevel}
        </div>
      )}

      {/* 出力ハンドル（下部） */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: '#555', width: '10px', height: '10px' }}
        isConnectable={isConnectable}
      />
    </div>
  );
});

export default SkillTreeNode;