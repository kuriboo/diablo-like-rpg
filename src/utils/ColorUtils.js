/**
 * utils/ColorUtils.js - 色に関する便利な関数
 * 色の明るさを調整する関数を提供します
 */

/**
 * 色を明るくする
 * @param {number} color - 元の色
 * @param {number} percent - 明るくする割合（0-100）
 * @returns {number} 明るくした色
 */
export function brightenColor(color, percent) {
    if (color === undefined || color === null) {
      console.warn('brightenColor: 無効な色が指定されました');
      return 0xFFFFFF; // デフォルト白
    }
  
    try {
      // 16進数の色から各成分を抽出
      const r = (color >> 16) & 0xFF;
      const g = (color >> 8) & 0xFF;
      const b = color & 0xFF;
      
      // 各成分を明るくする
      const newR = Math.min(255, r + Math.floor(r * percent / 100));
      const newG = Math.min(255, g + Math.floor(g * percent / 100));
      const newB = Math.min(255, b + Math.floor(b * percent / 100));
      
      // 新しい色を16進数に変換して返す
      return (newR << 16) | (newG << 8) | newB;
    } catch (e) {
      console.warn('brightenColor: エラーが発生しました', e);
      return color || 0xFFFFFF;
    }
  }
  
  /**
   * 色を暗くする
   * @param {number} color - 元の色
   * @param {number} percent - 暗くする割合（0-100）
   * @returns {number} 暗くした色
   */
  export function darkenColor(color, percent) {
    if (color === undefined || color === null) {
      console.warn('darkenColor: 無効な色が指定されました');
      return 0x000000; // デフォルト黒
    }
  
    try {
      // 16進数の色から各成分を抽出
      const r = (color >> 16) & 0xFF;
      const g = (color >> 8) & 0xFF;
      const b = color & 0xFF;
      
      // 各成分を暗くする
      const newR = Math.max(0, r - Math.floor(r * percent / 100));
      const newG = Math.max(0, g - Math.floor(g * percent / 100));
      const newB = Math.max(0, b - Math.floor(b * percent / 100));
      
      // 新しい色を16進数に変換して返す
      return (newR << 16) | (newG << 8) | newB;
    } catch (e) {
      console.warn('darkenColor: エラーが発生しました', e);
      return color || 0x000000;
    }
  }
  
  export default {
    brightenColor,
    darkenColor
  };