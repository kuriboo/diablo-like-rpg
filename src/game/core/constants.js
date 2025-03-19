// src/game/core/constants.js

/**
 * ゲーム内で使用するシーンキーの定数
 */
export const SCENES = {
    BOOT: 'BootScene',
    PRELOAD: 'PreloadScene',
    MAIN_MENU: 'MainMenuScene',
    OPTIONS_MENU: 'OptionsMenuScene',
    GAME: 'MainScene',
    GAME_OVER: 'GameOverScene',
    PAUSE: 'PauseScene',
    LOADING: 'LoadingScene',
    UI: 'UIScene'
  };
  
  /**
   * キャラクタータイプの定数
   */
  export const CHARACTER_TYPES = {
    PLAYER: 'player',
    ENEMY: 'enemy',
    NPC: 'npc'
  };
  
  /**
   * ゲーム設定の定数
   */
  export const GAME_CONFIG = {
    WIDTH: 1280,
    HEIGHT: 720,
    GRAVITY: 0,
    PLAYER_SPEED: 200,
    ENEMY_SPEED: 100,
    DEFAULT_HEALTH: 100,
    DEFAULT_MANA: 50
  };
  
  /**
   * アイテムタイプの定数
   */
  export const ITEM_TYPES = {
    WEAPON: 'weapon',
    ARMOR: 'armor',
    CONSUMABLE: 'consumable',
    QUEST: 'quest'
  };
  
  /**
   * スキルタイプの定数
   */
  export const SKILL_TYPES = {
    ATTACK: 'attack',
    DEFENSE: 'defense',
    BUFF: 'buff',
    DEBUFF: 'debuff',
    HEALING: 'healing'
  };
  
  /**
   * UIイベントの定数
   */
  export const UI_EVENTS = {
    MENU_OPEN: 'menu_open',
    MENU_CLOSE: 'menu_close',
    INVENTORY_OPEN: 'inventory_open',
    INVENTORY_CLOSE: 'inventory_close'
  };
  
  /**
   * ゲームイベントの定数
   */
  export const GAME_EVENTS = {
    PLAYER_DEATH: 'player_death',
    ENEMY_DEATH: 'enemy_death',
    LEVEL_UP: 'level_up',
    QUEST_COMPLETE: 'quest_complete',
    ITEM_PICKUP: 'item_pickup'
  };