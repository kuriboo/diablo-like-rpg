// src/debug/index.js
import DebugUtils, * as DebugFunctions from './DebugUtils';

// PlaceholderAssetsの機能統合
import './placeholders/AnimationPlaceholders';
import './placeholders/CharacterDetailPlaceholders';
import './placeholders/CharacterMonsterPlaceholders';
import './placeholders/CharacterPlaceholders';
import './placeholders/CharacterSlimePlaceholders';
import './placeholders/EffectPlaceholders';
import './placeholders/ItemPlaceholders';
import './placeholders/TilePlaceholders';
import './placeholders/UIPlaceholders';

// ベースのPlaceholderAssetsをエクスポート
import PlaceholderAssets,* as PlaceholderFunctions from './PlaceholderAssets';

// デバッグモードかどうかを判定（開発環境では自動的にtrue）
const isDebugMode = process.env.NODE_ENV !== 'production';

export {
  DebugUtils,
  PlaceholderAssets,
  //PlaceholderAssets,
  isDebugMode,
  // DebugUtils関数
  DebugFunctions,
  // PlaceholderAssets関数
  PlaceholderFunctions
};



// デフォルトエクスポート
export default {
  PlaceholderAssets,
  DebugUtils,
  isDebugMode,
  
  // 初期化関数
  initialize: (scene) => {
    if (isDebugMode) {
      console.log('🐞 デバッグモードを初期化しています...');
      PlaceholderAssets.initialize(scene);
      DebugUtils.initDebugMode(scene);
      return true;
    }
    return false;
  }
};