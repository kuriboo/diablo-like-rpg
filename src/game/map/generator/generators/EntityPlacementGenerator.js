import MapGenerator from '../MapGenerator';

/**
 * MapGeneratorの敵とNPC配置機能の拡張
 */
class EntityPlacementGenerator extends MapGenerator {
  /**
   * 敵を配置
   * @param {string} mapType - マップタイプ
   */
  placeEnemies(mapType) {
    const { width, height, enemyDensity, difficultyLevel } = this.options;
    
    // マップタイプに基づいて敵の密度を調整
    let adjustedEnemyDensity = enemyDensity;
    
    switch (mapType) {
      case 'dungeon':
        // ダンジョンは敵が多め
        adjustedEnemyDensity *= 1.2;
        break;
      case 'field':
        // フィールドは敵がやや少なめ
        adjustedEnemyDensity *= 0.8;
        break;
      case 'arena':
        // アリーナは中央にボスを配置
        this.placeArenaEnemies();
        return; // 別途処理するので以降はスキップ
      case 'town':
        // 町は敵がほとんどいない
        adjustedEnemyDensity *= 0.1;
        break;
    }
    
    // 候補位置を収集
    const candidatePositions = [];
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        // 移動可能なスペースのみに敵を配置（高さも考慮）
        if (this.objectPlacement[x][y] === 0 && this.heightMap[x][y] >= 0.3) {
          // 敵を配置できる場所を候補に追加
          candidatePositions.push({ x, y });
        }
      }
    }
    
    // 敵の数を計算
    const totalEnemyCount = Math.floor(candidatePositions.length * adjustedEnemyDensity);
    
    // 敵を配置
    for (let i = 0; i < totalEnemyCount; i++) {
      if (candidatePositions.length === 0) break;
      
      // ランダムな位置を選択
      const randomIndex = Math.floor(this.rng() * candidatePositions.length);
      const position = candidatePositions[randomIndex];
      
      // 配置済みの位置を候補から削除
      candidatePositions.splice(randomIndex, 1);
      
      // 敵のタイプを決定（マップタイプと難易度に基づく）
      const enemyType = this.determineEnemyType(mapType, difficultyLevel, position);
      
      // 敵を配置
      this.enemyPlacement.push({
        x: position.x,
        y: position.y,
        type: enemyType,
        level: this.determineEnemyLevel(difficultyLevel, enemyType)
      });
    }
    
    // グループでの敵配置（複数の敵が近くに集まる）
    this.placeEnemyGroups(mapType, difficultyLevel, candidatePositions);
  }

  /**
   * アリーナ用の敵を配置（ボスなど）
   */
  placeArenaEnemies() {
    const { width, height, difficultyLevel } = this.options;
    
    // アリーナの中央座標
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    
    // ボスを中央に配置
    this.enemyPlacement.push({
      x: centerX,
      y: centerY,
      type: 'boss',
      level: this.determineBossLevel(difficultyLevel)
    });
    
    // ボスの周りに複数の敵を配置
    const minionsCount = 4 + Math.floor(this.rng() * 4); // 4～7体
    
    for (let i = 0; i < minionsCount; i++) {
      // ボスの周りにランダムに配置
      const angle = this.rng() * Math.PI * 2;
      const distance = 5 + this.rng() * 5; // ボスから5～10マス離れた位置
      
      const minionX = Math.floor(centerX + Math.cos(angle) * distance);
      const minionY = Math.floor(centerY + Math.sin(angle) * distance);
      
      // マップ範囲内かつ移動可能なスペースにのみ配置
      if (minionX >= 0 && minionX < width && minionY >= 0 && minionY < height &&
          this.objectPlacement[minionX][minionY] === 0) {
        this.enemyPlacement.push({
          x: minionX,
          y: minionY,
          type: 'elite',
          level: this.determineEnemyLevel(difficultyLevel, 'elite')
        });
      }
    }
  }

  /**
   * 敵をグループで配置
   * @param {string} mapType - マップタイプ
   * @param {string} difficultyLevel - 難易度
   * @param {Array} candidatePositions - 配置候補位置
   */
  placeEnemyGroups(mapType, difficultyLevel, candidatePositions) {
    // グループの数
    const groupCount = Math.floor(3 + this.rng() * 5); // 3～7グループ
    
    for (let g = 0; g < groupCount; g++) {
      if (candidatePositions.length === 0) break;
      
      // ランダムな位置をグループの中心として選択
      const randomIndex = Math.floor(this.rng() * candidatePositions.length);
      const centerPosition = candidatePositions[randomIndex];
      
      // 配置済みの位置を候補から削除
      candidatePositions.splice(randomIndex, 1);
      
      // グループの敵の種類を決定
      const groupEnemyType = this.determineEnemyType(mapType, difficultyLevel, centerPosition);
      
      // グループの敵の数
      const groupSize = 3 + Math.floor(this.rng() * 4); // 3～6体
      
      // グループの敵を配置
      for (let i = 0; i < groupSize; i++) {
        // グループの中心から近い位置を探す
        const radius = 1 + Math.floor(this.rng() * 3); // 中心から1～3マス
        const angle = this.rng() * Math.PI * 2;
        
        const enemyX = Math.floor(centerPosition.x + Math.cos(angle) * radius);
        const enemyY = Math.floor(centerPosition.y + Math.sin(angle) * radius);
        
        // マップ範囲内かつ移動可能なスペースにのみ配置
        if (enemyX >= 0 && enemyX < this.options.width && 
            enemyY >= 0 && enemyY < this.options.height &&
            this.objectPlacement[enemyX][enemyY] === 0) {
          
          // 既に配置候補から除外
          const posIndex = candidatePositions.findIndex(p => p.x === enemyX && p.y === enemyY);
          if (posIndex !== -1) {
            candidatePositions.splice(posIndex, 1);
          }
          
          // 敵を配置
          this.enemyPlacement.push({
            x: enemyX,
            y: enemyY,
            type: groupEnemyType,
            level: this.determineEnemyLevel(difficultyLevel, groupEnemyType),
            groupId: g // グループID
          });
        }
      }
    }
  }

  /**
   * 敵のタイプを決定
   * @param {string} mapType - マップタイプ
   * @param {string} difficultyLevel - 難易度
   * @param {object} position - 位置
   * @returns {string} 敵のタイプ
   */
  determineEnemyType(mapType, difficultyLevel, position) {
    // 敵のタイプリスト（マップタイプに応じて変更）
    let enemyTypes = [];
    
    switch (mapType) {
      case 'dungeon':
        enemyTypes = ['skeleton', 'zombie', 'ghost', 'spider', 'slime'];
        break;
      case 'field':
        enemyTypes = ['wolf', 'bandit', 'goblin', 'troll', 'ogre'];
        break;
      case 'town':
        enemyTypes = ['thief', 'drunkard', 'rat', 'stray_dog'];
        break;
      default:
        enemyTypes = ['goblin', 'orc', 'troll', 'skeleton'];
    }
    
    // 難易度に応じてエリート敵の確率を調整
    let eliteChance = 0.05; // 通常の難易度では5%
    
    switch (difficultyLevel) {
      case 'nightmare':
        eliteChance = 0.15; // ナイトメアでは15%
        break;
      case 'hell':
        eliteChance = 0.25; // ヘルでは25%
        break;
    }
    
    // エリート敵かどうか
    if (this.rng() < eliteChance) {
      return 'elite';
    }
    
    // ランダムに敵のタイプを選択
    return enemyTypes[Math.floor(this.rng() * enemyTypes.length)];
  }

  /**
   * 敵のレベルを決定
   * @param {string} difficultyLevel - 難易度
   * @param {string} enemyType - 敵のタイプ
   * @returns {number} 敵のレベル
   */
  determineEnemyLevel(difficultyLevel, enemyType) {
    // 基本レベル範囲
    let minLevel = 1;
    let maxLevel = 10;
    
    // 難易度に応じて調整
    switch (difficultyLevel) {
      case 'normal':
        minLevel = 1;
        maxLevel = 30;
        break;
      case 'nightmare':
        minLevel = 30;
        maxLevel = 60;
        break;
      case 'hell':
        minLevel = 60;
        maxLevel = 100;
        break;
    }
    
    // 敵タイプに応じて調整
    if (enemyType === 'elite') {
      minLevel = Math.floor(minLevel * 1.5);
      maxLevel = Math.floor(maxLevel * 1.2);
    } else if (enemyType === 'boss') {
      minLevel = Math.floor(minLevel * 2);
      maxLevel = Math.floor(maxLevel * 1.5);
    }
    
    // ランダムにレベルを決定
    return Math.floor(minLevel + this.rng() * (maxLevel - minLevel));
  }

  /**
   * ボスのレベルを決定
   * @param {string} difficultyLevel - 難易度
   * @returns {number} ボスのレベル
   */
  determineBossLevel(difficultyLevel) {
    // 難易度に応じたボスのレベル
    switch (difficultyLevel) {
      case 'normal':
        return 25 + Math.floor(this.rng() * 10); // 25-34
      case 'nightmare':
        return 55 + Math.floor(this.rng() * 10); // 55-64
      case 'hell':
        return 90 + Math.floor(this.rng() * 11); // 90-100
      default:
        return 30;
    }
  }

  /**
   * NPCを配置（主に町マップ用）
   */
  placeNPCs() {
    // 町の建物内にNPCを配置
    for (const room of this.rooms) {
      // ショップNPCを配置
      if (room.isShop) {
        this.placeShopNPC(room);
      } 
      // 通常NPCを配置
      else if (this.rng() < 0.7) { // 70%の確率で部屋にNPCを配置
        this.placeRegularNPC(room);
      }
    }
    
    // 町の広場や道路にもいくつかのNPCを配置
    const { width, height, npcDensity } = this.options;
    const townCenterX = Math.floor(width / 2);
    const townCenterY = Math.floor(height / 2);
    const townRadius = Math.min(width, height) * 0.4;
    
    // 配置できる候補位置を収集
    const candidatePositions = [];
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        // 移動可能なスペースにのみNPCを配置
        if (this.objectPlacement[x][y] === 0) {
          // 町の中心からの距離を計算
          const distFromCenter = Math.sqrt((x - townCenterX) ** 2 + (y - townCenterY) ** 2);
          
          // 町の範囲内かつ建物の中ではない場所
          if (distFromCenter < townRadius && !this.isInsideBuilding(x, y)) {
            candidatePositions.push({ x, y });
          }
        }
      }
    }
    
    // 追加NPCの数
    const additionalNpcCount = Math.floor(candidatePositions.length * npcDensity);
    
    // 追加NPCを配置
    for (let i = 0; i < additionalNpcCount; i++) {
      if (candidatePositions.length === 0) break;
      
      // ランダムな位置を選択
      const randomIndex = Math.floor(this.rng() * candidatePositions.length);
      const position = candidatePositions[randomIndex];
      
      // 配置済みの位置を候補から削除
      candidatePositions.splice(randomIndex, 1);
      
      // 通常NPC（町の広場/道路にいるNPC）
      this.npcPlacement.push({
        x: position.x,
        y: position.y,
        type: this.determineNPCType(false),
        isShop: false,
        dialogues: this.generateNPCDialogues(false)
      });
    }
  }

  /**
   * ショップNPCを配置
   * @param {object} room - 部屋情報
   */
  placeShopNPC(room) {
    // ショップNPCは部屋の中央付近に配置
    this.npcPlacement.push({
      x: room.x,
      y: room.y,
      type: this.determineNPCType(true),
      isShop: true,
      shopType: this.determineShopType(),
      items: this.generateShopItems(),
      dialogues: this.generateNPCDialogues(true)
    });
  }

  /**
   * 通常NPCを配置
   * @param {object} room - 部屋情報
   */
  placeRegularNPC(room) {
    // 通常NPCは部屋の中央付近に配置
    this.npcPlacement.push({
      x: room.x,
      y: room.y,
      type: this.determineNPCType(false),
      isShop: false,
      dialogues: this.generateNPCDialogues(false)
    });
  }

  /**
   * NPCのタイプを決定
   * @param {boolean} isShop - ショップNPCかどうか
   * @returns {string} NPCのタイプ
   */
  determineNPCType(isShop) {
    // ショップNPCのタイプ
    if (isShop) {
      const shopkeeperTypes = ['blacksmith', 'merchant', 'alchemist', 'jeweler', 'armorer'];
      return shopkeeperTypes[Math.floor(this.rng() * shopkeeperTypes.length)];
    }
    
    // 通常NPCのタイプ
    const regularNpcTypes = ['villager', 'guard', 'child', 'elder', 'noble', 'beggar', 'bard'];
    return regularNpcTypes[Math.floor(this.rng() * regularNpcTypes.length)];
  }

  /**
   * ショップのタイプを決定
   * @returns {string} ショップのタイプ
   */
  determineShopType() {
    const shopTypes = ['weapon', 'armor', 'potion', 'general', 'magic'];
    return shopTypes[Math.floor(this.rng() * shopTypes.length)];
  }

  /**
   * ショップのアイテムを生成
   * @returns {Array} ショップアイテムのリスト
   */
  generateShopItems() {
    // 簡易的なアイテム生成（実際の実装ではItemFactory等を使用）
    const itemCount = 5 + Math.floor(this.rng() * 10); // 5～14個のアイテム
    const items = [];
    
    for (let i = 0; i < itemCount; i++) {
      items.push({
        id: `item_${i}`,
        price: Math.floor(10 + this.rng() * 1000), // 10～1009のランダムな価格
        // 実際の実装ではここにアイテムの詳細情報を追加
      });
    }
    
    return items;
  }

  /**
   * NPCの会話を生成
   * @param {boolean} isShop - ショップNPCかどうか
   * @returns {Array} 会話のリスト
   */
  generateNPCDialogues(isShop) {
    const dialogues = [];
    const dialogueCount = 2 + Math.floor(this.rng() * 4); // 2～5個の会話
    
    // ショップNPCの会話
    if (isShop) {
      dialogues.push("いらっしゃい！何かお探しかな？");
      dialogues.push("良い品を取り揃えておりますよ。");
      dialogues.push("この品は特別価格でどうだ？");
    } 
    // 通常NPCの会話
    else {
      const possibleDialogues = [
        "今日はいい天気ですね。",
        "この町は昔から平和なところです。",
        "最近、近くの森で奇妙な音が聞こえるという噂があります。",
        "冒険者ですか？素晴らしい！",
        "遠くからいらしたのですか？",
        "東の山には危険な魔物が出るという噂です。気をつけてください。",
        "南の洞窟に宝が眠っているという伝説があります。",
        "町長は最近姿を見せていません。何かあったのでしょうか？",
        "商人のギルドは北側にあります。",
        "西の森では最近、狼の群れが出没しているようです。"
      ];
      
      // ランダムに会話を選択
      for (let i = 0; i < dialogueCount; i++) {
        const randomIndex = Math.floor(this.rng() * possibleDialogues.length);
        dialogues.push(possibleDialogues[randomIndex]);
        // 同じ会話を避けるために使用済みの会話を削除
        possibleDialogues.splice(randomIndex, 1);
        if (possibleDialogues.length === 0) break;
      }
    }
    
    return dialogues;
  }

  /**
   * 指定された座標が建物内かどうかをチェック
   * @param {number} x - X座標
   * @param {number} y - Y座標
   * @returns {boolean} 建物内かどうか
   */
  isInsideBuilding(x, y) {
    // 座標の周囲8方向に壁があるかをチェック
    const directions = [
      [-1, -1], [0, -1], [1, -1],
      [-1, 0],           [1, 0],
      [-1, 1],  [0, 1],  [1, 1]
    ];
    
    let wallCount = 0;
    
    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;
      
      if (nx >= 0 && nx < this.options.width && ny >= 0 && ny < this.options.height) {
        if (this.objectPlacement[nx][ny] === 4) { // 壁
          wallCount++;
        }
      }
    }
    
    // 周囲に3つ以上の壁があれば建物内と判断
    return wallCount >= 3;
  }
}

// MapGeneratorクラスにミックスイン
Object.assign(MapGenerator.prototype, {
  placeEnemies: EntityPlacementGenerator.prototype.placeEnemies,
  placeArenaEnemies: EntityPlacementGenerator.prototype.placeArenaEnemies,
  placeEnemyGroups: EntityPlacementGenerator.prototype.placeEnemyGroups,
  determineEnemyType: EntityPlacementGenerator.prototype.determineEnemyType,
  determineEnemyLevel: EntityPlacementGenerator.prototype.determineEnemyLevel,
  determineBossLevel: EntityPlacementGenerator.prototype.determineBossLevel,
  placeNPCs: EntityPlacementGenerator.prototype.placeNPCs,
  placeShopNPC: EntityPlacementGenerator.prototype.placeShopNPC,
  placeRegularNPC: EntityPlacementGenerator.prototype.placeRegularNPC,
  determineNPCType: EntityPlacementGenerator.prototype.determineNPCType,
  determineShopType: EntityPlacementGenerator.prototype.determineShopType,
  generateShopItems: EntityPlacementGenerator.prototype.generateShopItems,
  generateNPCDialogues: EntityPlacementGenerator.prototype.generateNPCDialogues,
  isInsideBuilding: EntityPlacementGenerator.prototype.isInsideBuilding
});

export default MapGenerator;