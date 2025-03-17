/**
 * characterTypes.js - キャラクタークラスと種類の定義
 * 
 * トップダウンRPGで使用されるキャラクタークラスや敵タイプなどの
 * 定数とそれらの基本パラメータを定義します。
 */

// キャラクタークラスタイプ
export const CharacterClassType = {
    // プレイヤークラス
    warrior: {
      name: 'ウォーリア',
      description: '戦闘に特化した戦士。高い体力と防御力が特徴。',
      basicHP: 120,
      basicMana: 40,
      basicAttack: 12,
      basicDefence: 8,
      ar: 70, // 命中率
      startingSkills: ['bash', 'taunt'],
      keyStats: ['strength', 'vitality'],
      equipmentProficiency: ['oneHandMeleeWeapon', 'twoHandMeleeWeapon', 'shield', 'heavyArmor']
    },
    
    rogue: {
      name: 'ローグ',
      description: '素早さと隠密行動に長けた盗賊。高いクリティカル率が特徴。',
      basicHP: 90,
      basicMana: 60,
      basicAttack: 10,
      basicDefence: 5,
      ar: 85, // 命中率
      startingSkills: ['dualStrike', 'evade'],
      keyStats: ['dexterity', 'energy'],
      equipmentProficiency: ['oneHandMeleeWeapon', 'oneHandLongRangeWeapon', 'lightArmor']
    },
    
    sorcerer: {
      name: 'ソーサラー',
      description: '魔法の扱いに長けた魔術師。高いマナと魔法攻撃が特徴。',
      basicHP: 70,
      basicMana: 120,
      basicAttack: 8,
      basicDefence: 3,
      ar: 75, // 命中率
      startingSkills: ['fireball', 'frostNova'],
      keyStats: ['energy', 'intelligence'],
      equipmentProficiency: ['staff', 'wand', 'robe']
    },
    
    // NPC/共通タイプ
    villager: {
      name: '村人',
      basicHP: 50,
      basicMana: 0,
      basicAttack: 2,
      basicDefence: 0,
      ar: 50
    },
    
    guard: {
      name: '衛兵',
      basicHP: 100,
      basicMana: 20,
      basicAttack: 8,
      basicDefence: 6,
      ar: 70
    },
    
    merchant: {
      name: '商人',
      basicHP: 60,
      basicMana: 0,
      basicAttack: 3,
      basicDefence: 2,
      ar: 50
    }
  };
  
  // 敵キャラクタータイプ
  export const EnemyType = {
    skeleton: {
      name: 'スケルトン',
      description: '骸骨の亡者。弱いが数が多い。',
      basicHP: 60,
      basicMana: 0,
      basicAttack: 8,
      basicDefence: 4,
      ar: 65,
      moveSpeed: 80,
      aggroRange: 150,
      attackRange: 32, // 1タイル分
      expValue: 20,
      goldValue: [5, 15],
      dropTable: [
        { id: 'bone_fragment', chance: 0.3 },
        { id: 'rusty_sword', chance: 0.05 }
      ]
    },
    
    zombie: {
      name: 'ゾンビ',
      description: '腐敗した死体。動きは遅いが体力が高い。',
      basicHP: 100,
      basicMana: 0,
      basicAttack: 10,
      basicDefence: 5,
      ar: 60,
      moveSpeed: 60,
      aggroRange: 120,
      attackRange: 32, // 1タイル分
      expValue: 25,
      goldValue: [8, 20],
      dropTable: [
        { id: 'rotten_flesh', chance: 0.4 },
        { id: 'tattered_cloth', chance: 0.2 }
      ]
    },
    
    ghost: {
      name: 'ゴースト',
      description: '悲しみに満ちた霊体。物理攻撃が効きにくい。',
      basicHP: 70,
      basicMana: 40,
      basicAttack: 7,
      basicDefence: 2,
      ar: 70,
      moveSpeed: 90,
      aggroRange: 180,
      attackRange: 64, // 2タイル分
      expValue: 30,
      goldValue: [10, 25],
      resistances: {
        physical: 50,
        poison: 100,
        cold: 0,
        fire: 30
      },
      dropTable: [
        { id: 'ectoplasm', chance: 0.3 },
        { id: 'spectral_essence', chance: 0.1 }
      ]
    },
    
    spider: {
      name: 'スパイダー',
      description: '巨大な蜘蛛。毒を持ち、素早い動きが特徴。',
      basicHP: 50,
      basicMana: 20,
      basicAttack: 6,
      basicDefence: 3,
      ar: 80,
      moveSpeed: 110,
      aggroRange: 160,
      attackRange: 40, // 近接よりやや長め
      expValue: 22,
      goldValue: [7, 18],
      abilities: [
        { id: 'poison_bite', chance: 0.3, effect: { type: 'poison', damage: 3, duration: 5000 } }
      ],
      dropTable: [
        { id: 'spider_silk', chance: 0.35 },
        { id: 'venom_sac', chance: 0.15 }
      ]
    },
    
    slime: {
      name: 'スライム',
      description: '粘液質の生物。弱いが分裂することがある。',
      basicHP: 40,
      basicMana: 0,
      basicAttack: 5,
      basicDefence: 2,
      ar: 60,
      moveSpeed: 70,
      aggroRange: 100,
      attackRange: 32, // 1タイル分
      expValue: 15,
      goldValue: [3, 10],
      abilities: [
        { id: 'split', chance: 0.2, effect: { type: 'spawn', enemyType: 'small_slime', count: 2 } }
      ],
      dropTable: [
        { id: 'slime_jelly', chance: 0.4 }
      ]
    },
    
    wolf: {
      name: 'ウルフ',
      description: '野生の狼。素早く、群れで行動する。',
      basicHP: 65,
      basicMana: 0,
      basicAttack: 9,
      basicDefence: 4,
      ar: 75,
      moveSpeed: 120,
      aggroRange: 200,
      attackRange: 40, // 近接よりやや長め
      expValue: 28,
      goldValue: [6, 16],
      packBehavior: true, // 仲間が攻撃されると一緒に反応する
      dropTable: [
        { id: 'wolf_pelt', chance: 0.3 },
        { id: 'sharp_fang', chance: 0.2 }
      ]
    },
    
    boss: {
      name: 'ダンジョンロード',
      description: '恐るべき力を持つダンジョンの主。',
      basicHP: 500,
      basicMana: 200,
      basicAttack: 25,
      basicDefence: 15,
      ar: 85,
      moveSpeed: 80,
      aggroRange: 250,
      attackRange: 64, // 2タイル分
      expValue: 300,
      goldValue: [100, 250],
      abilities: [
        { id: 'ground_slam', chance: 0.2, effect: { type: 'aoe', damage: 20, radius: 96 } },
        { id: 'summon_minions', chance: 0.1, effect: { type: 'spawn', enemyType: 'skeleton', count: 3 } },
        { id: 'enrage', chance: 0.05, effect: { type: 'buff', stat: 'attackSpeed', value: 50, duration: 10000 } }
      ],
      phases: [
        { hp: 0.5, trigger: 'summon_minions' },
        { hp: 0.25, trigger: 'enrage' }
      ],
      dropTable: [
        { id: 'boss_essence', chance: 1.0 },
        { id: 'rare_equipment', chance: 0.7 },
        { id: 'legendary_equipment', chance: 0.2 }
      ]
    }
  };
  
  // NPCタイプ
  export const NPCType = {
    villager: {
      name: '村人',
      interactionType: 'dialogue',
      moveSpeed: 50,
      dialogues: [
        '今日はいい天気ですね。',
        'この辺りは最近物騒になってきました。',
        'あなたのような冒険者が来てくれて助かります。'
      ]
    },
    
    guard: {
      name: '衛兵',
      interactionType: 'dialogue',
      moveSpeed: 60,
      dialogues: [
        '町の安全は我々が守る。',
        '最近、この辺りで怪しい奴を見かけたか？',
        '身分証明書を見せてもらおうか。'
      ]
    },
    
    merchant: {
      name: '商人',
      interactionType: 'shop',
      shopType: 'general',
      moveSpeed: 50,
      dialogues: [
        'いらっしゃい！何かお探しかね？',
        '品揃えには自信があるよ。ゆっくり見ていってくれ。',
        '最近の流行りはこの辺の商品さ。'
      ]
    },
    
    blacksmith: {
      name: '鍛冶屋',
      interactionType: 'shop',
      shopType: 'weapon',
      moveSpeed: 45,
      dialogues: [
        '良い武器をお求めかね？',
        '私の作る武器は頑丈さが売りさ。',
        '素材があれば特注品も作れるんだが...'
      ]
    },
    
    alchemist: {
      name: '錬金術師',
      interactionType: 'shop',
      shopType: 'potion',
      moveSpeed: 40,
      dialogues: [
        'ふむ、ポーションが必要かね？',
        '私の薬は効き目が違うぞ。',
        '素材を集めてきてくれれば、特別なものも作れるがね。'
      ]
    },
    
    innkeeper: {
      name: '宿屋の主人',
      interactionType: 'service',
      serviceType: 'inn',
      moveSpeed: 45,
      dialogues: [
        'ようこそ、我が宿へ。',
        '一泊10ゴールドだ。休んでいくかい？',
        'この辺りの噂なら、私に聞くといい。'
      ]
    },
    
    questgiver: {
      name: '依頼人',
      interactionType: 'quest',
      moveSpeed: 50,
      dialogues: [
        '冒険者さん、ちょっといいかな？',
        'あなたなら私の依頼をこなせるかもしれない。',
        'この仕事を引き受けてくれたら報酬は弾むよ。'
      ]
    }
  };
  
  // 方向の定義
  export const Direction = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right'
  };
  
  // アニメーション状態の定義
  export const AnimationState = {
    IDLE: 'idle',
    WALK: 'walk',
    ATTACK: 'attack',
    HURT: 'hurt',
    DEATH: 'death',
    CAST: 'cast'
  };
  
  // ダメージタイプ
  export const DamageType = {
    PHYSICAL: 'physical',
    FIRE: 'fire',
    COLD: 'cold',
    LIGHTNING: 'lightning',
    POISON: 'poison',
    ARCANE: 'arcane',
    HOLY: 'holy',
    DARK: 'dark'
  };
  
  // エフェクトタイプ
  export const EffectType = {
    HEAL: 'heal',
    MANA: 'mana',
    BUFF: 'buff',
    DEBUFF: 'debuff',
    DOT: 'dot', // ダメージオーバータイム
    STUN: 'stun',
    KNOCKBACK: 'knockback'
  };
  
  // デフォルトのエクスポート
  export default {
    CharacterClassType,
    EnemyType,
    NPCType,
    Direction,
    AnimationState,
    DamageType,
    EffectType
  };