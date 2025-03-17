/**
 * アイテムや装備に関する定数定義ファイル
 */

/**
 * アイテムの基本タイプ
 * @enum {string}
 */
export const ItemType = {
    gold: 'gold',           // ゴールド
    equipment: 'equipment', // 装備品
    potion: 'potion',       // ポーション
    scroll: 'scroll',       // 巻物
    gem: 'gem',             // 宝石
    material: 'material',   // 素材
    keyItem: 'keyItem',     // キーアイテム
    quest: 'quest'          // クエストアイテム
  };
  
  /**
   * 装備品のタイプ
   * @enum {string}
   */
  export const EquipType = {
    helm: 'helm',                         // 頭装備
    armour: 'armour',                     // 体装備
    glove: 'glove',                       // 手装備
    belt: 'belt',                         // ベルト
    ring: 'ring',                         // 指輪
    oneHandLongRangeWeapon: 'oneHandLongRangeWeapon', // 片手射程武器
    oneHandMeleeWeapon: 'oneHandMeleeWeapon',         // 片手近接武器
    twoHandLongRangeWeapon: 'twoHandLongRangeWeapon', // 両手射程武器
    twoHandMeleeWeapon: 'twoHandMeleeWeapon',         // 両手近接武器
    shield: 'shield',                     // 盾
    amulet: 'amulet'                      // アミュレット
  };
  
  /**
   * 武器の攻撃タイプ
   * @enum {string}
   */
  export const WeaponAttackType = {
    melee: 'melee',     // 近接
    ranged: 'ranged'    // 遠距離
  };
  
  /**
   * 装備品の性能値タイプ
   * @enum {string}
   */
  export const EquipPerformanceValueType = {
    // 基本性能
    AttackBasic: 'AttackBasic',           // 基本攻撃力
    DefenceBasic: 'DefenceBasic',         // 基本防御力
    
    // 攻撃関連
    Attack: 'Attack',                     // 攻撃力（倍率）
    AR: 'AR',                             // 命中率
    CriticalRate: 'CriticalRate',         // クリティカル発生率
    CriticalDamage: 'CriticalDamage',     // クリティカルダメージ倍率
    AttackSpeed: 'AttackSpeed',           // 攻撃速度
    
    // 属性攻撃
    PoisonDamage: 'PoisonDamage',         // 毒属性ダメージ
    FireDamage: 'FireDamage',             // 火属性ダメージ
    ColdDamage: 'ColdDamage',             // 冷属性ダメージ
    ElectricDamage: 'ElectricDamage',     // 電属性ダメージ
    
    // 防御関連
    Defence: 'Defence',                   // 防御力（倍率）
    BlockRate: 'BlockRate',               // ブロック率
    
    // 属性耐性
    PoisonResistance: 'PoisonResistance',       // 毒耐性
    FireResistance: 'FireResistance',           // 火耐性
    ColdResistance: 'ColdResistance',           // 冷耐性
    ElectricResistance: 'ElectricResistance',   // 電耐性
    PhysicalResistance: 'PhysicalResistance',   // 物理耐性
    AllElementResistance: 'AllElementResistance', // 全属性耐性
    
    // ステータス関連
    MaxLife: 'MaxLife',                   // 最大ライフ
    MaxMana: 'MaxMana',                   // 最大マナ
    lifeRegeneration: 'lifeRegeneration', // ライフ自動回復
    manaRegeneration: 'manaRegeneration', // マナ自動回復
    lifeLeech: 'lifeLeech',               // ライフ吸収
    manaLeech: 'manaLeech',               // マナ吸収
    
    // その他
    MoveSpeed: 'MoveSpeed',               // 移動速度
    Luck: 'Luck',                         // 幸運（ドロップ率アップ）
    ExpBonus: 'ExpBonus',                 // 経験値ボーナス
    GoldBonus: 'GoldBonus'                // ゴールドボーナス
  };
  
  /**
   * ポーションのタイプ
   * @enum {string}
   */
  export const PotionType = {
    health: 'health',       // 体力回復
    mana: 'mana',           // マナ回復
    stamina: 'stamina',     // スタミナ回復
    strength: 'strength',   // 筋力アップ
    dexterity: 'dexterity', // 器用さアップ
    intelligence: 'intelligence', // 知力アップ
    resist: 'resist',       // 全耐性アップ
    speed: 'speed',         // 移動速度アップ
    cure: 'cure'            // 状態異常回復
  };
  
  /**
   * 巻物のタイプ
   * @enum {string}
   */
  export const ScrollType = {
    identify: 'identify',     // アイテム識別
    townPortal: 'townPortal', // 町への帰還
    enchant: 'enchant',       // エンチャント
    remove: 'remove',         // 呪い解除
    reforge: 'reforge'        // 装備再構成
  };
  
  /**
   * 宝石のタイプ
   * @enum {string}
   */
  export const GemType = {
    ruby: 'ruby',           // ルビー（火属性強化）
    sapphire: 'sapphire',   // サファイア（冷属性強化）
    emerald: 'emerald',     // エメラルド（毒属性強化）
    topaz: 'topaz',         // トパーズ（電属性強化）
    diamond: 'diamond',     // ダイヤモンド（全属性強化）
    amethyst: 'amethyst',   // アメジスト（マナ強化）
    onyx: 'onyx'            // オニキス（ライフ強化）
  };
  
  /**
   * 宝石のグレード
   * @enum {string}
   */
  export const GemGrade = {
    chipped: 'chipped',     // 欠けた
    flawed: 'flawed',       // 傷のある
    normal: 'normal',       // 通常
    flawless: 'flawless',   // 完璧な
    perfect: 'perfect'      // 完全無欠の
  };
  
  /**
   * 素材のタイプ
   * @enum {string}
   */
  export const MaterialType = {
    metal: 'metal',         // 金属
    wood: 'wood',           // 木材
    cloth: 'cloth',         // 布
    leather: 'leather',     // 革
    herb: 'herb',           // 薬草
    monster: 'monster',     // モンスター素材
    magical: 'magical'      // 魔法素材
  };
  
  /**
   * アイテムの希少度
   * @enum {string}
   */
  export const ItemRarity = {
    common: 'common',           // 一般
    uncommon: 'uncommon',       // 珍しい
    rare: 'rare',               // レア
    epic: 'epic',               // エピック
    legendary: 'legendary',     // レジェンダリー
    unique: 'unique',           // ユニーク
    set: 'set'                  // セット
  };
  
  /**
   * エフェクトの種類
   * @enum {string}
   */
  export const EffectType = {
    buff: 'buff',               // バフ効果
    debuff: 'debuff',           // デバフ効果
    dot: 'dot',                 // 継続ダメージ
    hot: 'hot',                 // 継続回復
    aura: 'aura',               // オーラ効果
    trigger: 'trigger',         // 特定条件トリガー
    passive: 'passive'          // 常時効果
  };
  
  /**
   * ダメージタイプ
   * @enum {string}
   */
  export const DamageType = {
    physical: 'physical',       // 物理
    poison: 'poison',           // 毒
    fire: 'fire',               // 火
    cold: 'cold',               // 冷
    electric: 'electric',       // 電
    holy: 'holy',               // 神聖
    dark: 'dark',               // 闇
    true: 'true'                // 真実（無視できないダメージ）
  };
  
  /**
   * 状態異常の種類
   * @enum {string}
   */
  export const StatusEffectType = {
    poison: 'poison',           // 毒
    burn: 'burn',               // 火傷
    freeze: 'freeze',           // 凍結
    shock: 'shock',             // 感電
    stun: 'stun',               // スタン
    slow: 'slow',               // 鈍化
    blind: 'blind',             // 盲目
    curse: 'curse',             // 呪い
    bleed: 'bleed'              // 出血
  };