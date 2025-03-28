/**
 * TilesetGenerator.js - 複数の個別タイルを1枚のタイルセット画像に結合
 * 
 * PlaceholderAssetsで個別に生成されたタイルを統合して、
 * 地形用とオブジェクト用の2種類のタイルセット画像を生成します。
 */

class TilesetGenerator {
    constructor(scene) {
        this.scene = scene;
        this.initialized = false;
        
        // 生成されたタイルセットを追跡
        this.generatedTilesets = {};
    }
    
    /**
     * 初期化処理
     * @param {Phaser.Scene} scene - Phaserシーン（既に渡されていない場合）
     * @returns {boolean} 初期化が成功したかどうか
     */
    initialize(scene) {
        if (scene) this.scene = scene;
        
        if (!this.scene || !this.scene.textures) {
            console.error('TilesetGenerator: 有効なPhaserシーンが必要です');
            return false;
        }
        
        console.log('🧩 TilesetGenerator: 初期化開始...');
        this.initialized = true;
        return true;
    }
    
    /**
     * 地形用タイルセットの生成
     * @param {Object} options - 設定オプション
     * @returns {string} 生成されたタイルセットのテクスチャキー
     */
    generateTerrainTileset(options = {}) {
        if (!this.initialized) {
            if (!this.initialize(this.scene)) {
                return null;
            }
        }
        
        // デフォルトオプション
        const config = Object.assign({
            tileSize: 32,
            columns: 4,
            tileKeys: [
                'tile_water', 'tile_grass', 'tile_dirt', 'tile_sand',
                'tile_stone', 'tile_snow', 'tile_lava'
            ],
            outputKey: 'tileset_terrain'
        }, options);
        
        try {
            console.log(`🌍 地形タイルセット生成: ${config.outputKey}`);
            
            // タイルセットの行数を計算
            const rows = Math.ceil(config.tileKeys.length / config.columns);
            
            // タイルセット画像のサイズ
            const width = config.columns * config.tileSize;
            const height = rows * config.tileSize;
            
            // 新しいRenderTextureを作成
            const renderTexture = this.scene.add.renderTexture(0, 0, width, height);
            
            // 各タイルを配置
            for (let i = 0; i < config.tileKeys.length; i++) {
                const tileKey = config.tileKeys[i];
                
                // タイルが存在するか確認
                if (!this.scene.textures.exists(tileKey)) {
                    console.warn(`タイル ${tileKey} が見つかりません`);
                    continue;
                }
                
                // タイルの座標を計算
                const col = i % config.columns;
                const row = Math.floor(i / config.columns);
                const x = col * config.tileSize;
                const y = row * config.tileSize;
                
                // タイルをレンダーテクスチャに描画
                renderTexture.draw(tileKey, x, y);
            }
            
            // レンダーテクスチャを保存
            renderTexture.saveTexture(config.outputKey);
            
            // renderTextureオブジェクトを破棄
            renderTexture.destroy();
            
            // 生成したタイルセット情報を記録
            this.generatedTilesets[config.outputKey] = {
                type: 'terrain',
                width: width,
                height: height,
                tileSize: config.tileSize,
                columns: config.columns,
                rows: rows,
                tiles: config.tileKeys.map((key, index) => ({
                    key: key,
                    index: index,
                    column: index % config.columns,
                    row: Math.floor(index / config.columns)
                }))
            };
            
            console.log(`✅ 地形タイルセット生成完了: ${config.outputKey} (${width}x${height}px)`);
            
            return config.outputKey;
        } catch (error) {
            console.error(`❌ 地形タイルセット生成エラー:`, error);
            return null;
        }
    }
    
    /**
     * オブジェクト用タイルセットの生成
     * @param {Object} options - 設定オプション
     * @returns {string} 生成されたタイルセットのテクスチャキー
     */
    generateObjectTileset(options = {}) {
        if (!this.initialized) {
            if (!this.initialize(this.scene)) {
                return null;
            }
        }
        
        // デフォルトオプション
        const config = Object.assign({
            tileSize: 32,
            columns: 2,
            tileKeys: [
                'tile_wall', 'item_chest'
            ],
            outputKey: 'tileset_objects'
        }, options);
        
        try {
            console.log(`🏠 オブジェクトタイルセット生成: ${config.outputKey}`);
            
            // タイルセットの行数を計算
            const rows = Math.ceil(config.tileKeys.length / config.columns);
            
            // タイルセット画像のサイズ
            const width = config.columns * config.tileSize;
            const height = rows * config.tileSize;
            
            // 新しいRenderTextureを作成
            const renderTexture = this.scene.add.renderTexture(0, 0, width, height);
            
            // 各タイルを配置
            for (let i = 0; i < config.tileKeys.length; i++) {
                const tileKey = config.tileKeys[i];
                
                // タイルが存在するか確認
                if (!this.scene.textures.exists(tileKey)) {
                    console.warn(`タイル ${tileKey} が見つかりません`);
                    continue;
                }
                
                // タイルの座標を計算
                const col = i % config.columns;
                const row = Math.floor(i / config.columns);
                const x = col * config.tileSize;
                const y = row * config.tileSize;
                
                // タイルをレンダーテクスチャに描画
                renderTexture.draw(tileKey, x, y);
            }
            
            // レンダーテクスチャを保存
            renderTexture.saveTexture(config.outputKey);
            
            // renderTextureオブジェクトを破棄
            renderTexture.destroy();
            
            // 生成したタイルセット情報を記録
            this.generatedTilesets[config.outputKey] = {
                type: 'objects',
                width: width,
                height: height,
                tileSize: config.tileSize,
                columns: config.columns,
                rows: rows,
                tiles: config.tileKeys.map((key, index) => ({
                    key: key,
                    index: index,
                    column: index % config.columns,
                    row: Math.floor(index / config.columns)
                }))
            };
            
            console.log(`✅ オブジェクトタイルセット生成完了: ${config.outputKey} (${width}x${height}px)`);
            
            return config.outputKey;
        } catch (error) {
            console.error(`❌ オブジェクトタイルセット生成エラー:`, error);
            return null;
        }
    }
    
    /**
     * 生成したタイルセットからタイルIDを取得
     * @param {string} tilesetKey - タイルセットのキー
     * @param {string} tileKey - 元のタイルのキー
     * @returns {number} タイルID（見つからない場合は-1）
     */
    getTileId(tilesetKey, tileKey) {
        if (!this.generatedTilesets[tilesetKey]) {
            console.warn(`タイルセット ${tilesetKey} が生成されていません`);
            return -1;
        }
        
        const tileset = this.generatedTilesets[tilesetKey];
        const tileInfo = tileset.tiles.find(tile => tile.key === tileKey);
        
        if (!tileInfo) {
            console.warn(`タイル ${tileKey} はタイルセット ${tilesetKey} に存在しません`);
            return -1;
        }
        
        return tileInfo.index;
    }
    
    /**
     * タイルセット情報の取得
     * @param {string} tilesetKey - タイルセットのキー
     * @returns {Object|null} タイルセット情報（存在しない場合はnull）
     */
    getTilesetInfo(tilesetKey) {
        return this.generatedTilesets[tilesetKey] || null;
    }
    
    /**
     * すべてのタイルセットを一括生成
     * @returns {Object} 生成されたタイルセットのキーを含むオブジェクト
     */
    generateAllTilesets(options = {}) {
        // 地形タイルセットを生成
        const terrainKey = this.generateTerrainTileset(options.terrain);
        
        // オブジェクトタイルセットを生成
        const objectKey = this.generateObjectTileset(options.objects);
        
        return {
            terrain: terrainKey,
            objects: objectKey
        };
    }
}

// シングルトンインスタンスを作成
const instance = new TilesetGenerator();

// デフォルトエクスポート
export default instance;

// 個別の関数としてもエクスポート
export const initialize = instance.initialize.bind(instance);
export const generateTerrainTileset = instance.generateTerrainTileset.bind(instance);
export const generateObjectTileset = instance.generateObjectTileset.bind(instance);
export const generateAllTilesets = instance.generateAllTilesets.bind(instance);
export const getTileId = instance.getTileId.bind(instance);
export const getTilesetInfo = instance.getTilesetInfo.bind(instance);