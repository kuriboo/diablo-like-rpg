/**
 * ゲーム内で使用する数学関連のユーティリティ関数を提供します。
 */

/**
 * 指定された範囲内のランダムな整数を返します。
 * min（含む）からmax（含む）までの範囲で整数をランダムに生成します。
 * 
 * @param {number} min - 範囲の最小値（この値を含む）
 * @param {number} max - 範囲の最大値（この値を含む）
 * @returns {number} - minからmaxまでのランダムな整数
 */
export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
  
/**
* 指定された範囲内のランダムな浮動小数点数を返します。
* min（含む）からmax（含まない）までの範囲で浮動小数点数をランダムに生成します。
* 
* @param {number} min - 範囲の最小値（この値を含む）
* @param {number} max - 範囲の最大値（この値を含まない）
* @returns {number} - minからmaxまでのランダムな浮動小数点数
*/
export function getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}
  
/**
* 角度をラジアンに変換します。
* 
* @param {number} degrees - 度単位の角度
* @returns {number} - ラジアン単位の角度
*/
export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}
  
/**
* ラジアンを角度に変換します。
* 
* @param {number} radians - ラジアン単位の角度
* @returns {number} - 度単位の角度
*/
export function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}
  
/**
* 二点間の距離を計算します。
* 
* @param {number} x1 - 最初の点のx座標
* @param {number} y1 - 最初の点のy座標
* @param {number} x2 - 二番目の点のx座標
* @param {number} y2 - 二番目の点のy座標
* @returns {number} - 二点間の距離
*/
export function getDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}
  
/**
* 値を指定された範囲内に制限します。
* 
* @param {number} value - 制限する値
* @param {number} min - 許容最小値
* @param {number} max - 許容最大値
* @returns {number} - min以上max以下に制限された値
*/
 export function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}
  
/**
* ある範囲の値を別の範囲にマッピングします。
* 
* @param {number} value - マッピングする値
* @param {number} inMin - 入力範囲の最小値
* @param {number} inMax - 入力範囲の最大値
* @param {number} outMin - 出力範囲の最小値
* @param {number} outMax - 出力範囲の最大値
* @returns {number} - マッピングされた値
*/
export function mapRange(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
  
/**
* 乱数による確率チェックを行います。
* 
* @param {number} probability - 0.0～1.0の間の確率値
* @returns {boolean} - 確率チェックが成功した場合はtrue
*/
export function randomChance(probability) {
    return Math.random() < probability;
}
  
/**
* 配列からランダムな要素を返します。
* 
* @param {Array} array - ランダムに選択する配列
* @returns {*} - 配列からランダムに選択された要素
*/
export function getRandomArrayElement(array) {
    if (!array || array.length === 0) return null;
    return array[getRandomInt(0, array.length - 1)];
}
  
/**
 * 重み付けされた配列からランダムな要素を選択します。
* 各要素は {value, weight} の形式のオブジェクトである必要があります。
* 
* @param {Array} weightedArray - 重み付けされた配列
* @returns {*} - 重みに基づいて選択された要素のvalue
*/
export function getWeightedRandomElement(weightedArray) {
    if (!weightedArray || weightedArray.length === 0) return null;
    
    const totalWeight = weightedArray.reduce((sum, item) => sum + (item.weight || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const item of weightedArray) {
      random -= (item.weight || 1);
      if (random <= 0) {
        return item.value;
      }
    }
    
    return weightedArray[0].value;
}
  
/**
* 線形補間（Lerp）を行います。
* 
* @param {number} start - 開始値
* @param {number} end - 終了値
* @param {number} t - 補間係数（0.0～1.0）
* @returns {number} - 補間された値
*/
export function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}