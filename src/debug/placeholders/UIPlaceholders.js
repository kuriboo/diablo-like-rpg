/**
 * placeholders/UIGenerator.js - UI要素生成機能
 * 
 * PlaceholderAssetsのUI要素生成機能を提供します。
 * 様々なタイプのUI要素を生成し、ゲーム開発のプレースホルダーとして使用します。
 */

import { brightenColor, darkenColor } from '../../utils/ColorUtils';


/**
 * UIプレースホルダーを作成 - 拡張版
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createUIPlaceholders(scene, placeholders) {
  // 既存のプレースホルダー
  createUIPanel(scene, 'ui_panel', 0x333333, placeholders);
  createUIButton(scene, 'ui_button', 0x666666, false, placeholders);
  createUIButton(scene, 'ui_button_hover', 0x888888, true, placeholders);
  createSkillIcon(scene, 'ui_skill_icon', 0x0000FF, placeholders);
  createStatusBar(scene, 'ui_health_bar', 0xFF0000, placeholders);
  createStatusBar(scene, 'ui_mana_bar', 0x0000FF, placeholders);
  createInventorySlot(scene, 'ui_inventory_slot', 0x222222, placeholders);
  createCursor(scene, 'ui_cursor', 0xFFFFFF, placeholders);
  
  // MainMenuScene用のプレースホルダー
  createBackground(scene, 'menu-background', 0x1a3366, placeholders); // 濃い青色の背景
  createGameLogo(scene, 'game-logo', 0xcc0000, placeholders); // 赤色のロゴ
  createMenuButton(scene, 'button-normal', 0x444444, false, placeholders);
  createMenuButton(scene, 'button-hover', 0x666666, true, placeholders);
  
  // OptionsMenuScene用のプレースホルダー
  createBackground(scene, 'options-background', 0x333333, placeholders); // 暗い灰色の背景
  createSliderTrack(scene, 'slider-track', 0x555555, placeholders);
  createSliderThumb(scene, 'slider-thumb', 0x888888, placeholders);
  createCheckbox(scene, 'checkbox-on', 0x00AA00, true, placeholders);
  createCheckbox(scene, 'checkbox-off', 0x555555, false, placeholders);
}

/**
 * ゲーム背景プレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {number} color - 色（16進数）
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createBackground(scene, key, color, placeholders) {
  const graphics = scene.add.graphics();
  const width = 800;  // 標準的なゲーム画面サイズ
  const height = 600;
  
  // 基本背景
  graphics.fillStyle(color, 1);
  graphics.fillRect(0, 0, width, height);
  
  // グラデーション効果（上から下）
  const gradientHeight = height / 2;
  for (let i = 0; i < gradientHeight; i++) {
    const alpha = 0.1 * (i / gradientHeight);
    graphics.fillStyle(0xffffff, alpha);
    graphics.fillRect(0, i, width, 1);
  }
  
  // 装飾的なパターン
  graphics.fillStyle(brightenColor(color, 20), 0.1);
  for (let x = 0; x < width; x += 40) {
    for (let y = 0; y < height; y += 40) {
      graphics.fillRect(x, y, 20, 20);
    }
  }
  
  // テクスチャとして生成して登録
  graphics.generateTexture(key, width, height);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[key] = { type: 'background', color, width, height };
  }
}

/**
 * ゲームロゴプレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {string} color - 色（16進数）
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createGameLogo(scene, key, color, placeholders) {
  const graphics = scene.add.graphics();
  const width = 400;
  const height = 200;
  
  // ロゴ背景
  graphics.fillStyle(color, 1);
  graphics.fillRoundedRect(50, 50, width - 100, height - 100, 20);
  
  // ロゴ枠線
  graphics.lineStyle(4, darkenColor(color, 20), 1);
  graphics.strokeRoundedRect(50, 50, width - 100, height - 100, 20);
  
  // 装飾（斜めの線）
  graphics.lineStyle(3, brightenColor(color, 30), 0.7);
  for (let i = 0; i < 5; i++) {
    graphics.lineBetween(50 + i * 20, 50, 50, 50 + i * 20);
    graphics.lineBetween(width - 50 - i * 20, height - 50, width - 50, height - 50 - i * 20);
  }
  
  // 仮のテキスト表現
  graphics.fillStyle(0xFFFFFF, 1);
  
  // 横線でテキスト表現
  const textY = height / 2;
  graphics.fillRect(width / 4, textY - 15, width / 2, 5);
  graphics.fillRect(width / 4, textY, width / 2, 5);
  graphics.fillRect(width / 4, textY + 15, width / 2, 5);
  
  // テクスチャとして生成して登録
  graphics.generateTexture(key, width, height);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[key] = { type: 'logo', color, width, height };
  }
}

/**
 * メニューボタンプレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {number} color - 色（16進数）
 * @param {boolean} isHover - ホバー状態かどうか
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createMenuButton(scene, key, color, isHover, placeholders) {
  const graphics = scene.add.graphics();
  const width = 250;
  const height = 60;
  
  // ベースとなる角丸長方形
  graphics.fillStyle(color, 1);
  graphics.fillRoundedRect(0, 0, width, height, 10);
  
  // 枠線
  const borderColor = isHover ? brightenColor(color, 60) : brightenColor(color, 30);
  graphics.lineStyle(2, borderColor, 1);
  graphics.strokeRoundedRect(0, 0, width, height, 10);
  
  // ボタン内部の塗りつぶし（グラデーションの代わりに単色を使用）
  // ホバー状態かどうかで色を変える
  const innerColor = isHover ? brightenColor(color, 20) : color;
  graphics.fillStyle(innerColor, 1);
  graphics.fillRoundedRect(2, 2, width - 4, height - 4, 9);
  
  // ホバー状態の時は追加のハイライト効果
  if (isHover) {
    // 上部に明るいハイライトを追加
    graphics.fillStyle(0xFFFFFF, 0.3);
    graphics.fillRoundedRect(4, 4, width - 8, (height - 8) / 2, {tl: 8, tr: 8, bl: 0, br: 0});
  }
  
  // テキストプレースホルダー（中央に白い線）
  graphics.fillStyle(0xFFFFFF, 0.8);
  graphics.fillRect(width / 4, height / 2 - 2, width / 2, 4);
  
  // テクスチャとして生成して登録
  graphics.generateTexture(key, width, height);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[key] = { type: 'button', isHover, color, width, height };
  }
}

/**
 * スライダートラックプレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {number} color - 色（16進数）
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createSliderTrack(scene, key, color, placeholders) {
  const graphics = scene.add.graphics();
  const width = 200;
  const height = 10;
  
  // スライダーの溝
  graphics.fillStyle(darkenColor(color, 30), 1);
  graphics.fillRoundedRect(0, 0, width, height, height / 2);
  
  // スライダーの溝の内側（グラデーション）
  graphics.fillStyle(color, 1);
  graphics.fillRoundedRect(1, 1, width - 2, height - 2, (height - 2) / 2);
  
  // 内部の模様（目盛り）
  graphics.fillStyle(darkenColor(color, 20), 0.5);
  for (let i = 0; i < width; i += 20) {
    graphics.fillRect(i, height / 2 - 1, 1, 2);
  }
  
  // テクスチャとして生成して登録
  graphics.generateTexture(key, width, height);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[key] = { type: 'slider_track', color, width, height };
  }
}

/**
 * スライダーつまみプレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {number} color - 色（16進数）
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createSliderThumb(scene, key, color, placeholders) {
  const graphics = scene.add.graphics();
  const size = 20;
  
  // つまみの円形ベース（外側の円）
  graphics.fillStyle(brightenColor(color, 10), 1);
  graphics.fillCircle(size / 2, size / 2, size / 2);
  
  // 枠線
  graphics.lineStyle(1, darkenColor(color, 20), 1);
  graphics.strokeCircle(size / 2, size / 2, size / 2);
  
  // つまみの内側（グラデーションの代わりに単色で）
  const innerColor = brightenColor(color, 30);
  graphics.fillStyle(innerColor, 1);
  graphics.fillCircle(size / 2, size / 2, size / 2 - 2);
  
  // ハイライト効果（上部に明るい半円）
  graphics.fillStyle(0xFFFFFF, 0.3);
  // 半円を描画（上部のみ）
  graphics.beginPath();
  graphics.arc(size / 2, size / 2, size / 3, Math.PI, 0, false);
  graphics.fillPath();
  
  // つまみの中央の模様
  graphics.fillStyle(darkenColor(color, 10), 0.5);
  graphics.fillCircle(size / 2, size / 2, 2);
  
  // テクスチャとして生成して登録
  graphics.generateTexture(key, size, size);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[key] = { type: 'slider_thumb', color, width: size, height: size };
  }
}

/**
 * チェックボックスプレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {number} color - 色（16進数）
 * @param {boolean} isChecked - チェック状態かどうか
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createCheckbox(scene, key, color, isChecked, placeholders) {
  const graphics = scene.add.graphics();
  const size = 24;
  
  // チェックボックスの外枠
  graphics.fillStyle(0x333333, 1);
  graphics.fillRoundedRect(0, 0, size, size, 4);
  
  // チェックボックスの内側
  graphics.fillStyle(isChecked ? color : 0x666666, 1);
  graphics.fillRoundedRect(2, 2, size - 4, size - 4, 3);
  
  // チェックマーク
  if (isChecked) {
    graphics.fillStyle(0xFFFFFF, 1);
    // チェックマーク（√）の描画
    graphics.beginPath();
    graphics.moveTo(5, size / 2);
    graphics.lineTo(size / 3, size - 7);
    graphics.lineTo(size - 5, 5);
    graphics.lineStyle(3, 0xFFFFFF, 1);
    graphics.strokePath();
  }
  
  // テクスチャとして生成して登録
  graphics.generateTexture(key, size, size);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[key] = { type: 'checkbox', isChecked, color, width: size, height: size };
  }
}

/**
 * UIパネルプレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {number} color - 色（16進数）
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createUIPanel(scene, key, color, placeholders) {
  const graphics = scene.add.graphics();
  const width = 200;
  const height = 150;
  
  // パネル背景
  graphics.fillStyle(color, 0.8);
  graphics.fillRoundedRect(0, 0, width, height, 8);
  
  // パネル枠線
  graphics.lineStyle(2, brightenColor(color, 30), 1);
  graphics.strokeRoundedRect(0, 0, width, height, 8);
  
  // 上部のタイトルバー風
  graphics.fillStyle(darkenColor(color, 20), 1);
  graphics.fillRect(0, 0, width, 20);
  
  // ウィンドウコントロール風のボタン
  graphics.fillStyle(0xFF0000, 1);
  graphics.fillCircle(width - 10, 10, 5);
  
  // テクスチャとして生成して登録
  graphics.generateTexture(key, width, height);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[key] = { type: 'ui_panel', color, width, height };
  }
}

/**
 * UIボタンプレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {number} color - 色（16進数）
 * @param {boolean} isHover - ホバー状態かどうか
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createUIButton(scene, key, color, isHover, placeholders) {
  const graphics = scene.add.graphics();
  const width = 100;
  const height = 30;
  
  // 基本色
  graphics.fillStyle(color, 1);
  graphics.fillRoundedRect(0, 0, width, height, 5);
  
  // 枠線
  const borderColor = isHover ? brightenColor(color, 50) : brightenColor(color, 20);
  graphics.lineStyle(1, borderColor, 1);
  graphics.strokeRoundedRect(0, 0, width, height, 5);
  
  // ホバー時のハイライト
  if (isHover) {
    graphics.fillStyle(0xFFFFFF, 0.2);
    graphics.fillRoundedRect(2, 2, width - 4, height - 4, 4);
  }
  
  // テクスチャ生成
  graphics.generateTexture(key, width, height);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[key] = { type: 'ui_button', isHover, color, width, height };
  }
}

/**
 * スキルアイコンプレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {number} color - 色（16進数）
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createSkillIcon(scene, key, color, placeholders) {
  const graphics = scene.add.graphics();
  const size = 40;
  
  // アイコン背景
  graphics.fillStyle(darkenColor(color, 40), 1);
  graphics.fillRoundedRect(0, 0, size, size, 5);
  
  // アイコン枠線
  graphics.lineStyle(2, brightenColor(color, 20), 1);
  graphics.strokeRoundedRect(0, 0, size, size, 5);
  
  // スキル効果の表現
  graphics.fillStyle(color, 0.8);
  
  if (key.includes('skill')) {
    // スパイラル模様
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 3;
    
    for (let angle = 0; angle < Math.PI * 6; angle += 0.2) {
      const scale = 1 - angle / (Math.PI * 8);
      if (scale <= 0) continue;
      
      const x = centerX + Math.cos(angle) * radius * scale;
      const y = centerY + Math.sin(angle) * radius * scale;
      const dotSize = 1 + scale * 2;
      
      graphics.fillCircle(x, y, dotSize);
    }
  }
  
  // テクスチャとして生成して登録
  graphics.generateTexture(key, size, size);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[key] = { type: 'ui_skill_icon', color, width: size, height: size };
  }
}

/**
 * ステータスバープレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {number} color - 色（16進数）
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createStatusBar(scene, key, color, placeholders) {
  const graphics = scene.add.graphics();
  const width = 200;
  const height = 20;
  
  // バー背景
  graphics.fillStyle(0x222222, 0.8);
  graphics.fillRoundedRect(0, 0, width, height, 3);
  
  // バー本体（80%充填の表示）
  graphics.fillStyle(color, 1);
  graphics.fillRoundedRect(2, 2, (width - 4) * 0.8, height - 4, 2);
  
  // バーの光沢
  graphics.fillStyle(0xFFFFFF, 0.2);
  graphics.fillRect(2, 2, width - 4, height / 3);
  
  // 枠線
  graphics.lineStyle(1, 0x000000, 0.5);
  graphics.strokeRoundedRect(0, 0, width, height, 3);
  
  // テクスチャとして生成して登録
  graphics.generateTexture(key, width, height);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[key] = { type: 'ui_status_bar', color, width, height };
  }
}

/**
 * インベントリスロットプレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {number} color - 色（16進数）
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createInventorySlot(scene, key, color, placeholders) {
  const graphics = scene.add.graphics();
  const size = 40;
  
  // スロット背景
  graphics.fillStyle(color, 0.8);
  graphics.fillRoundedRect(0, 0, size, size, 3);
  
  // スロット枠線
  graphics.lineStyle(1, brightenColor(color, 40), 1);
  graphics.strokeRoundedRect(0, 0, size, size, 3);
  
  // スロットの影
  graphics.fillStyle(0x000000, 0.2);
  graphics.fillRoundedRect(2, 2, size - 4, size - 4, 2);
  
  // テクスチャとして生成して登録
  graphics.generateTexture(key, size, size);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[key] = { type: 'ui_inventory_slot', color, width: size, height: size };
  }
}

/**
 * カーソルプレースホルダー作成
 * @param {Phaser.Scene} scene - Phaserシーン
 * @param {string} key - テクスチャーキー
 * @param {number} color - 色（16進数）
 * @param {Object} placeholders - プレースホルダーオブジェクト
 */
export function createCursor(scene, key, color, placeholders) {
  const graphics = scene.add.graphics();
  const size = 20;
  
  // カーソル
  graphics.fillStyle(color, 1);
  graphics.fillTriangle(0, 0, 0, size, size * 0.7, size * 0.7);
  
  // カーソルの輪郭
  graphics.lineStyle(1, 0x000000, 1);
  graphics.strokeTriangle(0, 0, 0, size, size * 0.7, size * 0.7);
  
  // テクスチャとして生成して登録
  graphics.generateTexture(key, size, size);
  graphics.destroy();
  
  // プレースホルダー一覧に追加
  if (placeholders) {
    placeholders[key] = { type: 'ui_cursor', color, width: size, height: size };
  }
}