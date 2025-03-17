// src/debug/index.js
import DebugUtils, * as DebugFunctions from './DebugUtils';
import PlaceholderAssets, * as PlaceholderFunctions from './PlaceholderAssets';

// デバッグモードかどうかを判定（開発環境では自動的にtrue）
const isDebugMode = process.env.NODE_ENV !== 'production';

export {
  DebugUtils,
  PlaceholderAssets,
  isDebugMode,
  // DebugUtils関数
  DebugFunctions,
  // PlaceholderAssets関数
  PlaceholderFunctions
};

// デフォルトエクスポート
export default {
  DebugUtils,
  PlaceholderAssets,
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