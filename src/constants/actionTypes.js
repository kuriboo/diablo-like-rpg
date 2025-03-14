/**
 * アクションタイプの定義
 * ゲーム内の様々なアクションを分類するための定数
 */
export const ActionType = {
    // 基本アクションタイプ
    NONE: 'none',                 // 未定義アクション
    MOVE: 'move',                 // 移動アクション
    ATTACK: 'attack',             // 攻撃アクション
    CAST: 'cast',                 // 呪文詠唱アクション
    ITEM: 'item',                 // アイテム使用アクション
    INTERACT: 'interact',         // インタラクションアクション
    
    // 戦闘アクションタイプ
    MELEE: 'melee',               // 近接攻撃
    RANGED: 'ranged',             // 遠距離攻撃
    SKILL: 'skill',               // スキル使用
    SPELL: 'spell',               // 魔法詠唱
    BUFF: 'buff',                 // バフ効果
    DEBUFF: 'debuff',             // デバフ効果
    
    // 移動アクションタイプ
    WALK: 'walk',                 // 歩行
    RUN: 'run',                   // 走行
    TELEPORT: 'teleport',         // 瞬間移動
    DASH: 'dash',                 // 突進
    JUMP: 'jump',                 // ジャンプ
    
    // アイテムアクションタイプ
    USE_POTION: 'use_potion',     // ポーション使用
    EQUIP: 'equip',               // 装備
    UNEQUIP: 'unequip',           // 装備解除
    DROP: 'drop',                 // アイテムドロップ
    PICKUP: 'pickup',             // アイテム拾得
    
    // インタラクションアクションタイプ
    TALK: 'talk',                 // 会話
    SHOP: 'shop',                 // ショップ利用
    OPEN: 'open',                 // 開ける
    CLOSE: 'close',               // 閉める
    ACTIVATE: 'activate',         // 起動
    
    // 特殊アクションタイプ
    DODGE: 'dodge',               // 回避
    BLOCK: 'block',               // ブロック
    PARRY: 'parry',               // パリィ
    CHARGE: 'charge',             // チャージ
    CHANNEL: 'channel',           // チャネリング
    
    // 状態変化アクションタイプ
    STUN: 'stun',                 // スタン
    KNOCKBACK: 'knockback',       // ノックバック
    FREEZE: 'freeze',             // 凍結
    BURN: 'burn',                 // 燃焼
    POISON: 'poison'              // 毒
};
  
/**
* アクションカテゴリの定義
* アクションをグループ化するためのカテゴリ
*/
export const ActionCategory = {
    BASIC: 'basic',               // 基本アクション
    COMBAT: 'combat',             // 戦闘アクション
    MOVEMENT: 'movement',         // 移動アクション
    ITEM: 'item',                 // アイテムアクション
    INTERACTION: 'interaction',   // インタラクションアクション
    SPECIAL: 'special',           // 特殊アクション
    STATUS: 'status'              // 状態変化アクション
};
  
/**
* アクションの条件タイプ
* アクションの実行条件を定義
*/
export const ActionConditionType = {
    MANA_COST: 'manaCost',        // マナコスト
    HEALTH_PERCENT: 'healthPercent', // 体力割合
    COOLDOWN: 'cooldown',         // クールダウン
    LEVEL: 'level',               // レベル条件
    HAS_ITEM: 'hasItem',          // アイテム所持
    STATE: 'state',               // 状態条件
    RANGE: 'range',               // 範囲条件
    CUSTOM: 'custom'              // カスタム条件
};
  
/**
* アクション実行結果のステータス
*/
export const ActionStatus = {
    SUCCESS: 'success',           // 成功
    FAILURE: 'failure',           // 失敗
    INTERRUPTED: 'interrupted',   // 中断
    CANCELLED: 'cancelled',       // キャンセル
    ONGOING: 'ongoing'            // 進行中
};
  
/**
* アクションの方向
* 8方向の向きを定義
*/
export const ActionDirection = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right',
    UP_LEFT: 'up-left',
    UP_RIGHT: 'up-right',
    DOWN_LEFT: 'down-left',
    DOWN_RIGHT: 'down-right'
};
  
/**
* アクション優先度
* 複数のアクションの実行順序を決定するための優先度
*/
export const ActionPriority = {
    LOWEST: 0,
    LOW: 25,
    NORMAL: 50,
    HIGH: 75,
    HIGHEST: 100
};