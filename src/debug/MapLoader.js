/**
 * MapLoader.js - 統合されたタイルセットを使用してマップを読み込む
 * 
 * TilesetGeneratorを使って生成されたタイルセットを
 * TopDownMapが利用できるように変換する機能を提供します。
 */

import PlaceholderAssets from './PlaceholderAssets';
import TilesetGenerator from './TilesetGenerator';

class MapLoader {
    constructor() {
        this.scene = null;
        this.initialized = false;
        
        // タイルタイプとIDのマッピング
        this.tileMapping = {
            // 地形タイル
            'tile_water': 0,
            'tile_grass': 1,
            'tile_dirt': 2,
            'tile_sand': 3,
            'tile_stone': 4,
            'tile_snow': 5,
            'tile_lava': 6,
            
            // オブジェクトタイル
            'tile_wall': 0,
            'item_chest': 1
        };
        
        // 生成されたタイルセットの情報
        this.tilesets = {
            terrain: null,
            objects: null
        };
    }
    
    /**
     * 初期化処理
     * @param {Phaser.Scene} scene - Phaserシーン
     * @returns {boolean} 初期化が成功したかどうか
     */
    initialize(scene) {
        if (!scene || !scene.textures) {
            console.error('MapLoader: 有効なPhaserシーンが必要です');
            return false;
        }
        
        this.scene = scene;
        console.log('🗺️ MapLoader: 初期化開始...');
        
        // PlaceholderAssetsが初期化されていることを確認
        if (!PlaceholderAssets.initialized) {
            PlaceholderAssets.initialize(scene);
        }
        
        // TilesetGeneratorを初期化
        TilesetGenerator.initialize(scene);
        
        this.initialized = true;
        console.log('✅ MapLoader: 初期化完了');
        return true;
    }
    
    /**
     * タイルセットを準備
     * @returns {Object} 生成されたタイルセットの情報
     */
    prepareTilesets() {
        if (!this.initialized) {
            if (!this.initialize(this.scene)) {
                return null;
            }
        }
        
        console.log('🔄 タイルセットの準備...');
        
        // 地形タイルが存在するか確認
        const terrainTiles = [
            'tile_water', 'tile_grass', 'tile_dirt', 'tile_sand',
            'tile_stone', 'tile_snow', 'tile_lava'
        ];
        
        // オブジェクトタイルが存在するか確認
        const objectTiles = [
            'tile_wall', 'item_chest'
        ];
        
        // 不足しているタイルをPlaceholderAssetsで生成
        this.ensureTilesExist(terrainTiles.concat(objectTiles));
        
        // タイルセットを生成
        this.tilesets = TilesetGenerator.generateAllTilesets({
            terrain: {
                tileKeys: terrainTiles,
                outputKey: 'tileset_terrain'
            },
            objects: {
                tileKeys: objectTiles,
                outputKey: 'tileset_objects'
            }
        });
        
        console.log('✅ タイルセット準備完了');
        return this.tilesets;
    }
    
    /**
     * 必要なタイルが存在することを確認
     * @param {string[]} tileKeys - 確認するタイルのキー配列
     */
    ensureTilesExist(tileKeys) {
        for (const key of tileKeys) {
            if (!this.scene.textures.exists(key)) {
                console.log(`🔍 タイル ${key} が不足しています。生成します...`);
                
                // PlaceholderAssetsを使ってタイルを生成
                if (key.includes('tile_')) {
                    const tileType = key.replace('tile_', '');
                    PlaceholderAssets.createTileWithPattern(this.scene, key, this.getTileColor(tileType));
                } else if (key === 'item_chest') {
                    PlaceholderAssets.createChestItem(this.scene, key, 0x8B4513, false);
                }
                
                console.log(`✅ タイル ${key} を生成しました`);
            }
        }
    }
    
    /**
     * タイルタイプから色を取得
     * @param {string} tileType - タイルタイプ
     * @returns {number} 色（16進数）
     */
    getTileColor(tileType) {
        const tileColors = {
            'water': 0x1E90FF,
            'grass': 0x3CB371,
            'dirt': 0x8B4513,
            'sand': 0xF4A460,
            'stone': 0x708090,
            'snow': 0xFFFAFA,
            'lava': 0xFF4500,
            'wall': 0x808080
        };
        
        return tileColors[tileType] || 0x888888;
    }
    
    /**
     * TopDownMap用にマップデータを準備
     * @param {Object} mapData - 元のマップデータ
     * @returns {Object} 変換されたマップデータ
     */
    prepareMapData(mapData) {
        if (!this.tilesets.terrain || !this.tilesets.objects) {
            this.prepareTilesets();
        }
        
        console.log('🔄 マップデータ準備...');
        
        // マップデータのクローンを作成
        const preparedData = JSON.parse(JSON.stringify(mapData));
        
        // タイルセット情報を追加
        preparedData.tilesets = this.tilesets;
        
        // タイルマッピング情報を追加
        preparedData.tileMapping = this.tileMapping;
        
        console.log('✅ マップデータ準備完了');
        return preparedData;
    }
    
    /**
     * TopDownMapインスタンスに統合されたタイルセットを適用
     * @param {TopDownMap} topDownMap - TopDownMapインスタンス
     * @returns {boolean} 成功したかどうか
     */
    applyTilesetsToMap(topDownMap) {
        if (!topDownMap || !topDownMap.scene) {
            console.error('有効なTopDownMapインスタンスが必要です');
            return false;
        }
        
        if (!this.initialized) {
            this.initialize(topDownMap.scene);
        }
        
        if (!this.tilesets.terrain || !this.tilesets.objects) {
            this.prepareTilesets();
        }
        
        console.log('🔄 タイルセットをTopDownMapに適用...');
        
        try {
            // タイルセット情報をTopDownMapにアタッチ
            topDownMap.integratedTilesets = this.tilesets;
            
            // TopDownMapのgetTextureFromHeight関数をオーバーライド
            const originalGetTextureFromHeight = topDownMap.getTextureFromHeight;
            topDownMap.getTextureFromHeight = (heightValue) => {
                // 元の関数から元のテクスチャキーを取得
                const originalKey = originalGetTextureFromHeight.call(topDownMap, heightValue);
                
                // 統合タイルセットのキーに変換
                return {
                    key: this.tilesets.terrain.terrain,
                    index: this.tileMapping[originalKey] || 0
                };
            };
            
            // オブジェクトタイプからテクスチャを取得する関数の追加
            topDownMap.getObjectTexture = (objectType) => {
                let tileKey;
                
                // MapGeneratorのオブジェクトタイプに基づいてタイルキーを決定
                if (objectType === 3) { // 壁/障害物
                    tileKey = 'tile_wall';
                } else if (objectType === 2) { // 宝箱
                    tileKey = 'item_chest';
                } else {
                    return null;
                }
                
                // 統合タイルセット内のインデックスを取得
                return {
                    key: this.tilesets.objects.objects,
                    index: this.tileMapping[tileKey] || 0
                };
            };
            
            console.log('✅ タイルセットの適用完了');
            return true;
        } catch (error) {
            console.error('タイルセット適用エラー:', error);
            return false;
        }
    }
    
    /**
     * 統合タイルセットで生成されたタイルインデックスをもとのキーに戻す
     * @param {string} tilesetType - タイルセットタイプ ('terrain' または 'objects')
     * @param {number} index - タイルインデックス
     * @returns {string} 元のタイルキー
     */
    getTileKeyFromIndex(tilesetType, index) {
        const mapping = this.tileMapping;
        
        for (const [key, value] of Object.entries(mapping)) {
            if (tilesetType === 'terrain' && key.startsWith('tile_') && !key.includes('wall') && value === index) {
                return key;
            } else if (tilesetType === 'objects' && (key === 'tile_wall' || key === 'item_chest') && value === index) {
                return key;
            }
        }
        
        return null;
    }
}

// シングルトンインスタンスを作成
const instance = new MapLoader();

// デフォルトエクスポート
export default instance;

// 個別の関数としてもエクスポート
export const initialize = instance.initialize.bind(instance);
export const prepareTilesets = instance.prepareTilesets.bind(instance);
export const prepareMapData = instance.prepareMapData.bind(instance);
export const applyTilesetsToMap = instance.applyTilesetsToMap.bind(instance);