/**
 * JSONファイルのロードを行うユーティリティクラス
 */
class JsonLoader {
    /**
     * JSONファイルをロードする
     * @param {string} path - JSONファイルのパス
     * @returns {Promise<Object>} - JSONデータ
     */
    static async loadJson(path) {
      try {
        const response = await fetch(path);
        
        if (!response.ok) {
          throw new Error(`Failed to load JSON: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error(`Error loading JSON from ${path}:`, error);
        throw error;
      }
    }
    
    /**
     * 複数のJSONファイルをロードする
     * @param {Array<string>} paths - JSONファイルのパスの配列
     * @returns {Promise<Array<Object>>} - JSONデータの配列
     */
    static async loadJsons(paths) {
      try {
        const promises = paths.map(path => JsonLoader.loadJson(path));
        return await Promise.all(promises);
      } catch (error) {
        console.error('Error loading multiple JSON files:', error);
        throw error;
      }
    }
    
    /**
     * JSONファイルをキャッシュを利用してロードする
     * @param {string} path - JSONファイルのパス
     * @param {Map} cache - キャッシュオブジェクト
     * @returns {Promise<Object>} - JSONデータ
     */
    static async loadJsonWithCache(path, cache) {
      if (cache.has(path)) {
        return cache.get(path);
      }
      
      const data = await JsonLoader.loadJson(path);
      cache.set(path, data);
      return data;
    }
}
  
export default JsonLoader;