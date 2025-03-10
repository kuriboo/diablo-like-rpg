import Phaser from 'phaser';

export default class Inventory {
  constructor(owner, config = {}) {
    // 所有者（通常はプレイヤー）
    this.owner = owner;
    
    // グリッドサイズ
    this.width = config.width || 10;
    this.height = config.height || 4;
    
    // 最大アイテム数
    this.maxSize = config.maxSize || (this.width * this.height);
    
    // アイテムグリッド（2次元配列）
    this.grid = Array(this.height).fill().map(() => Array(this.width).fill(null));
    
    // 総アイテム数
    this.itemCount = 0;
    
    // ジュエル（特殊アイテム）リスト
    this.jewelList = config.jewelList || [];
    
    // インベントリ変更イベント
    this.events = new Phaser.Events.EventEmitter();
  }
  
  // アイテムの追加
  addItem(item) {
    if (!item) return false;
    
    // ポーションの場合は特別処理
    if (item.constructor.name === 'Potion') {
      return this.addPotion(item);
    }
    
    // アイテムサイズ取得
    const itemSize = item.size || { width: 1, height: 1 };
    
    // 配置可能な位置を探索
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        // この位置にアイテムを配置可能か確認
        if (this.canPlaceItemAt(x, y, itemSize.width, itemSize.height)) {
          // アイテムを配置
          this.placeItemAt(item, x, y);
          
          // インベントリ変更イベント発火
          this.events.emit('item-added', item);
          
          return true;
        }
      }
    }
    
    // 空きスペースが見つからなかった
    return false;
  }
  
  // ポーションの追加（専用処理）
  addPotion(potion) {
    if (!potion || !this.owner) return false;
    
    // プレイヤーのポーション所持数を増やす
    if (this.owner.addPotion) {
      return this.owner.addPotion(1);
    }
    
    // 通常のアイテムとして追加を試みる
    return this.addItem(potion);
  }
  
  // アイテムの削除
  removeItem(item) {
    if (!item) return false;
    
    // グリッド内のアイテムを探す
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] === item) {
          // アイテムが見つかった
          return this.removeItemAt(x, y);
        }
      }
    }
    
    // アイテムが見つからなかった
    return false;
  }
  
  // 指定位置のアイテムを削除
  removeItemAt(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return false;
    }
    
    // その位置にアイテムがあるか確認
    const item = this.grid[y][x];
    if (!item) {
      return false;
    }
    
    // アイテムサイズを取得
    const itemSize = item.size || { width: 1, height: 1 };
    
    // アイテムが占めるすべての位置をクリア
    for (let oy = 0; oy < itemSize.height; oy++) {
      for (let ox = 0; ox < itemSize.width; ox++) {
        if (y + oy < this.height && x + ox < this.width) {
          this.grid[y + oy][x + ox] = null;
        }
      }
    }
    
    // アイテム数を減らす
    this.itemCount--;
    
    // インベントリ変更イベント発火
    this.events.emit('item-removed', item);
    
    return true;
  }
  
  // 指定位置にアイテムを配置できるか確認
  canPlaceItemAt(x, y, width = 1, height = 1) {
    // 位置とサイズのチェック
    if (x < 0 || x + width > this.width || y < 0 || y + height > this.height) {
      return false;
    }
    
    // この範囲に他のアイテムがないか確認
    for (let oy = 0; oy < height; oy++) {
      for (let ox = 0; ox < width; ox++) {
        if (this.grid[y + oy][x + ox] !== null) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  // 指定位置にアイテムを配置
  placeItemAt(item, x, y) {
    if (!item) return false;
    
    // アイテムサイズを取得
    const itemSize = item.size || { width: 1, height: 1 };
    
    // 配置可能かチェック
    if (!this.canPlaceItemAt(x, y, itemSize.width, itemSize.height)) {
      return false;
    }
    
    // アイテムを配置
    for (let oy = 0; oy < itemSize.height; oy++) {
      for (let ox = 0; ox < itemSize.width; ox++) {
        this.grid[y + oy][x + ox] = item;
      }
    }
    
    // アイテム数を増やす
    this.itemCount++;
    
    return true;
  }
  
  // 指定位置にあるアイテムを取得
  getItemAt(x, y) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return null;
    }
    
    return this.grid[y][x];
  }
  
  // インベントリ内のすべてのユニークアイテムを取得
  getAllItems() {
    const uniqueItems = new Set();
    
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const item = this.grid[y][x];
        if (item) {
          uniqueItems.add(item);
        }
      }
    }
    
    return Array.from(uniqueItems);
  }
  
  // 特定のタイプのアイテムを検索
  findItemsByType(type) {
    return this.getAllItems().filter(item => item.constructor.name === type);
  }
  
  // インベントリが満杯か確認
  isFull() {
    return this.itemCount >= this.maxSize;
  }
  
  // インベントリが空か確認
  isEmpty() {
    return this.itemCount === 0;
  }
  
  // 空きスロット数を取得
  getFreeSlots() {
    return this.maxSize - this.itemCount;
  }
  
  // アイテムの使用
  useItem(item) {
    if (!item || !this.owner) return false;
    
    // アイテムの使用
    const result = item.use(this.owner);
    
    // 使用に成功したらインベントリから削除
    if (result) {
      this.removeItem(item);
      
      // インベントリ変更イベント発火
      this.events.emit('item-used', item);
    }
    
    return result;
  }
  
  // 指定位置のアイテムを使用
  useItemAt(x, y) {
    const item = this.getItemAt(x, y);
    if (!item) return false;
    
    return this.useItem(item);
  }
  
  // アイテムの装備
  equipItem(item) {
    if (!item || !this.owner) return false;
    
    // 装備可能アイテムかチェック
    if (item.constructor.name !== 'Equipment') {
      return false;
    }
    
    // 装備
    const result = item.equip(this.owner);
    
    // 装備に成功したらインベントリから削除
    if (result) {
      this.removeItem(item);
      
      // インベントリ変更イベント発火
      this.events.emit('item-equipped', item);
    }
    
    return result;
  }
  
  // 指定位置のアイテムを装備
  equipItemAt(x, y) {
    const item = this.getItemAt(x, y);
    if (!item) return false;
    
    return this.equipItem(item);
  }
  
  // アイテムの所持確認
  hasItem(item) {
    if (!item) return false;
    
    // アイテムIDでの照合
    return this.getAllItems().some(invItem => invItem.uuid === item.uuid);
  }
  
  // アイテムのソート
  sortItems(sortBy = 'type') {
    // すべてのアイテムを取得
    const allItems = this.getAllItems();
    
    // インベントリをクリア
    this.clear();
    
    // ソート処理
    let sortedItems;
    
    switch (sortBy) {
      case 'type':
        // タイプでソート
        sortedItems = allItems.sort((a, b) => {
          if (a.constructor.name === b.constructor.name) {
            return a.name.localeCompare(b.name);
          }
          return a.constructor.name.localeCompare(b.constructor.name);
        });
        break;
      
      case 'name':
        // 名前でソート
        sortedItems = allItems.sort((a, b) => a.name.localeCompare(b.name));
        break;
      
      case 'rarity':
        // レア度でソート（装備品の場合）
        const rarityOrder = { legendary: 5, epic: 4, rare: 3, uncommon: 2, common: 1 };
        sortedItems = allItems.sort((a, b) => {
          const aRarity = a.rarity ? rarityOrder[a.rarity] || 0 : 0;
          const bRarity = b.rarity ? rarityOrder[b.rarity] || 0 : 0;
          return bRarity - aRarity;
        });
        break;
      
      case 'level':
        // レベルでソート
        sortedItems = allItems.sort((a, b) => {
          const aLevel = a.level || 0;
          const bLevel = b.level || 0;
          return bLevel - aLevel;
        });
        break;
      
      default:
        sortedItems = allItems;
    }
    
    // ソートされたアイテムを再配置
    for (const item of sortedItems) {
      this.addItem(item);
    }
    
    // インベントリ変更イベント発火
    this.events.emit('inventory-sorted');
    
    return true;
  }
  
  // インベントリのクリア
  clear() {
    // グリッドをクリア
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = null;
      }
    }
    
    // アイテム数をリセット
    this.itemCount = 0;
    
    // インベントリ変更イベント発火
    this.events.emit('inventory-cleared');
    
    return true;
  }
  
  // ジュエルの追加
  addJewel(jewel) {
    if (!jewel) return false;
    
    // 最大所持数チェック
    if (this.jewelList.length >= 100) {
      return false;
    }
    
    // ジュエルリストに追加
    this.jewelList.push(jewel);
    
    // インベントリ変更イベント発火
    this.events.emit('jewel-added', jewel);
    
    return true;
  }
  
  // ジュエルの削除
  removeJewel(jewel) {
    if (!jewel) return false;
    
    // ジュエルを探す
    const index = this.jewelList.findIndex(j => j.uuid === jewel.uuid);
    
    if (index === -1) {
      return false;
    }
    
    // ジュエルを削除
    this.jewelList.splice(index, 1);
    
    // インベントリ変更イベント発火
    this.events.emit('jewel-removed', jewel);
    
    return true;
  }
  
  // すべてのジュエルを取得
  getAllJewels() {
    return [...this.jewelList];
  }
  
  // インベントリデータの取得（保存用）
  getData() {
    // アイテムデータの作成
    const itemData = [];
    
    this.getAllItems().forEach(item => {
      // アイテムの位置を見つける
      let itemX = -1, itemY = -1;
      
      // 左上の位置を特定
      outerLoop:
      for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
          if (this.grid[y][x] === item) {
            itemX = x;
            itemY = y;
            break outerLoop;
          }
        }
      }
      
      if (itemX !== -1 && itemY !== -1) {
        itemData.push({
          type: item.constructor.name,
          uuid: item.uuid,
          x: itemX,
          y: itemY,
          data: item.serialize ? item.serialize() : { name: item.name }
        });
      }
    });
    
    // ジュエルデータの作成
    const jewelData = this.jewelList.map(jewel => ({
      uuid: jewel.uuid,
      data: jewel.serialize ? jewel.serialize() : { name: jewel.name }
    }));
    
    return {
      width: this.width,
      height: this.height,
      items: itemData,
      jewels: jewelData
    };
  }
  
  // インベントリデータの設定（読み込み用）
  setData(data, itemFactory) {
    if (!data || !itemFactory) return false;
    
    // インベントリをクリア
    this.clear();
    
    // サイズの設定
    this.width = data.width || this.width;
    this.height = data.height || this.height;
    
    // グリッドの再作成
    this.grid = Array(this.height).fill().map(() => Array(this.width).fill(null));
    
    // アイテムの復元
    if (data.items && Array.isArray(data.items)) {
      for (const itemInfo of data.items) {
        const item = itemFactory.createItem({
          type: itemInfo.type.toLowerCase(),
          ...itemInfo.data
        });
        
        if (item) {
          // 直接配置（サイズチェックなし）
          this.placeItemAt(item, itemInfo.x, itemInfo.y);
        }
      }
    }
    
    // ジュエルの復元
    if (data.jewels && Array.isArray(data.jewels)) {
      this.jewelList = [];
      
      for (const jewelInfo of data.jewels) {
        const jewel = itemFactory.createItem({
          type: 'jewel',
          ...jewelInfo.data
        });
        
        if (jewel) {
          this.jewelList.push(jewel);
        }
      }
    }
    
    // インベントリ変更イベント発火
    this.events.emit('inventory-loaded');
    
    return true;
  }
}