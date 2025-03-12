import React from 'react';

/**
 * スキルツールチップコンポーネント
 * スキルノードにマウスオーバーした際の詳細情報表示
 */
const SkillTooltip = ({ node, position, remainingPoints, onAllocate }) => {
  if (!node) return null;

  const { data } = node;
  const {
    label,
    nodeType,
    description,
    isUnlocked,
    isAvailable,
    manaCost,
    cooldown,
    level,
    maxLevel,
    requiredLevel
  } = data;

  // ツールチップの位置調整
  const tooltipStyle = {
    position: 'fixed',
    left: `${position.x + 10}px`,
    top: `${position.y + 10}px`,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    border: '1px solid #444',
    borderRadius: '5px',
    padding: '10px',
    maxWidth: '300px',
    zIndex: 1000,
    color: '#fff',
    pointerEvents: 'none', // マウスイベントを透過させる
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)'
  };

  // ノードタイプの表示名を取得
  const getNodeTypeName = () => {
    switch (nodeType) {
      case 'passive':
        return 'パッシブスキル';
      case 'skill':
        return 'アクティブスキル';
      case 'root':
        return 'ルートスキル';
      default:
        return 'スキル';
    }
  };

  // スキルの状態表示テキストを取得
  const getStatusText = () => {
    if (isUnlocked) {
      return <span style={{ color: '#00ff00' }}>習得済み</span>;
    }
    
    if (isAvailable) {
      if (remainingPoints > 0) {
        return <span style={{ color: '#ffcc00' }}>習得可能</span>;
      }
      return <span style={{ color: '#ff6600' }}>スキルポイントが不足しています</span>;
    }
    
    return <span style={{ color: '#ff0000' }}>未解放（前提スキルが必要）</span>;
  };

  return (
    <div className="skill-tooltip" style={tooltipStyle}>
      <h3 style={{ margin: '0 0 5px 0', color: isUnlocked ? '#00ff00' : isAvailable ? '#ffcc00' : '#ccc' }}>
        {label}
      </h3>
      
      <div style={{ fontSize: '12px', marginBottom: '5px' }}>
        <span style={{ color: '#aaa' }}>{getNodeTypeName()}</span>
        {requiredLevel && (
          <span style={{ marginLeft: '10px', color: '#aaa' }}>
            必要レベル: {requiredLevel}
          </span>
        )}
      </div>
      
      <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>{description}</p>
      
      {/* アクティブスキル特有の情報 */}
      {nodeType === 'skill' && (
        <div className="skill-stats" style={{ fontSize: '12px', color: '#aaa' }}>
          {manaCost !== undefined && (
            <div>マナコスト: <span style={{ color: '#3399ff' }}>{manaCost}</span></div>
          )}
          {cooldown !== undefined && (
            <div>クールダウン: <span style={{ color: '#ff9900' }}>{cooldown}秒</span></div>
          )}
          {level !== undefined && maxLevel > 1 && (
            <div>レベル: <span style={{ color: '#ffcc00' }}>{level}/{maxLevel}</span></div>
          )}
        </div>
      )}
      
      {/* スキル状態 */}
      <div style={{ marginTop: '10px', fontSize: '12px' }}>
        状態: {getStatusText()}
      </div>
      
      {isAvailable && !isUnlocked && remainingPoints > 0 && (
        <div 
          style={{ 
            marginTop: '10px', 
            fontSize: '12px',
            color: '#ffcc00',
            opacity: 0.7
          }}
        >
          クリックしてスキルポイントを割り当て可能
        </div>
      )}
    </div>
  );
};

export default SkillTooltip;