/**
 * AudioPlaceholders.js - 音声プレースホルダーの生成
 * 
 * Web Audio APIを使用して簡単なサウンドプレースホルダーを生成します。
 * BGM（背景音楽）とSFX（効果音）の両方をサポートします。
 */

/**
 * 音声プレースホルダー生成ユーティリティ
 */
const AudioPlaceholders = {
    /**
     * デバッグモード設定
     */
    debugMode: false,
    
    /**
     * 初期化済みフラグ
     */
    initialized: false,
    
    /**
     * 生成した音声バッファのキャッシュ
     */
    bufferCache: {},
    
    /**
     * デバッグモードを設定
     * @param {boolean} isDebug - デバッグモードかどうか
     */
    setDebugMode(isDebug) {
      this.debugMode = isDebug;
    },
    
    /**
     * 音声プレースホルダーを初期化
     * @param {Phaser.Scene} scene - Phaserシーン
     * @returns {boolean} 初期化が成功したかどうか
     */
    initialize(scene) {
      if (this.initialized) return true;
      if (!this.debugMode) return false;
      
      try {
        console.log('🔊 音声プレースホルダーを初期化中...');
        
        // 必要に応じて何か初期化処理を行う
        
        this.initialized = true;
        console.log('✅ 音声プレースホルダーの初期化完了');
        return true;
      } catch (error) {
        console.error('音声プレースホルダーの初期化中にエラーが発生しました:', error);
        return false;
      }
    },
    
    /**
     * BGM（背景音楽）用のプレースホルダーを追加
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - 音声キー
     */
    addBgmPlaceholder(scene, key) {
      if (!this.debugMode) return;
      if (!scene || !scene.sound) return;
      
      try {
        // AudioContextを取得
        const audioContext = scene.sound.context;
        if (!audioContext) {
          console.warn(`AudioContextが利用できないため、プレースホルダー ${key} を作成できません`);
          return;
        }
        
        // バッファを生成（キャッシュがあればそれを使用）
        if (!this.bufferCache[key]) {
          // 2秒間の音声バッファを作成
          const sampleRate = audioContext.sampleRate;
          const duration = 2.0;
          const frameCount = sampleRate * duration;
          
          const audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
          const channelData = audioBuffer.getChannelData(0);
          
          // 単純な低音のサイン波を生成（BGM用）
          for (let i = 0; i < frameCount; i++) {
            // 低音のサイン波（110Hz程度）
            const oscillation = Math.sin(i * 2 * Math.PI * 110 / sampleRate);
            // 音量を下げる（0.1程度）
            channelData[i] = oscillation * 0.1;
          }
          
          // エンベロープ（音の変化）をつける
          this.applyEnvelope(channelData, sampleRate);
          
          // バッファをキャッシュ
          this.bufferCache[key] = audioBuffer;
        }
        
        // Blob URLを作成してPhaserに登録（オーディオタグとして）
        this.createBlobURLAndAddToScene(scene, key, this.bufferCache[key], true);
        
        console.log(`🔊 BGMプレースホルダー作成: ${key}`);
      } catch (error) {
        console.error(`BGMプレースホルダー作成エラー (${key}):`, error);
      }
    },
    
    /**
     * SFX（効果音）用のプレースホルダーを追加
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - 音声キー
     * @param {string} type - 効果音タイプ ('click', 'hover', 'attack', 'spell', 'item' など)
     */
    addSfxPlaceholder(scene, key, type = 'click') {
      if (!this.debugMode) return;
      if (!scene || !scene.sound) return;
      
      try {
        // AudioContextを取得
        const audioContext = scene.sound.context;
        if (!audioContext) {
          console.warn(`AudioContextが利用できないため、プレースホルダー ${key} を作成できません`);
          return;
        }
        
        // バッファを生成（キャッシュがあればそれを使用）
        if (!this.bufferCache[key]) {
          // 0.3秒の短い音声バッファを作成
          const sampleRate = audioContext.sampleRate;
          const duration = 0.3;
          const frameCount = sampleRate * duration;
          
          const audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
          const channelData = audioBuffer.getChannelData(0);
          
          // 効果音タイプに基づいて音を生成
          let frequency = 440; // デフォルト周波数
          
          switch (type) {
            case 'click':
              // クリック音（短く鋭い）
              frequency = 880;
              for (let i = 0; i < frameCount; i++) {
                const time = i / sampleRate;
                const oscillation = Math.sin(i * 2 * Math.PI * frequency / sampleRate);
                // 急速に減衰する音
                channelData[i] = oscillation * Math.exp(-10 * time);
              }
              break;
              
            case 'hover':
              // ホバー音（やや柔らかい）
              frequency = 440;
              for (let i = 0; i < frameCount; i++) {
                const time = i / sampleRate;
                const oscillation = Math.sin(i * 2 * Math.PI * frequency / sampleRate);
                // やや緩やかに減衰
                channelData[i] = oscillation * Math.exp(-5 * time);
              }
              break;
              
            case 'attack':
              // 攻撃音（強めで少し唸る）
              for (let i = 0; i < frameCount; i++) {
                const time = i / sampleRate;
                // 周波数を時間と共に変化させる
                const currentFreq = 300 - 150 * time;
                const oscillation = Math.sin(i * 2 * Math.PI * currentFreq / sampleRate);
                channelData[i] = oscillation * Math.exp(-3 * time);
              }
              break;
              
            case 'spell':
              // 魔法音（うねる高音）
              for (let i = 0; i < frameCount; i++) {
                const time = i / sampleRate;
                // うねりのある高音
                const currentFreq = 600 + 300 * Math.sin(time * 20);
                const oscillation = Math.sin(i * 2 * Math.PI * currentFreq / sampleRate);
                channelData[i] = oscillation * Math.exp(-2 * time);
              }
              break;
              
            case 'item':
              // アイテム音（明るく軽い）
              for (let i = 0; i < frameCount; i++) {
                const time = i / sampleRate;
                // 上昇する音
                const currentFreq = 440 + 400 * time;
                const oscillation = Math.sin(i * 2 * Math.PI * currentFreq / sampleRate);
                channelData[i] = oscillation * Math.exp(-4 * time);
              }
              break;
              
            default:
              // その他のデフォルト効果音
              for (let i = 0; i < frameCount; i++) {
                const time = i / sampleRate;
                const oscillation = Math.sin(i * 2 * Math.PI * frequency / sampleRate);
                channelData[i] = oscillation * Math.exp(-7 * time);
              }
          }
          
          // バッファをキャッシュ
          this.bufferCache[key] = audioBuffer;
        }
        
        // Blob URLを作成してPhaserに登録
        this.createBlobURLAndAddToScene(scene, key, this.bufferCache[key], false);
        
        console.log(`🔊 SFXプレースホルダー作成: ${key} (${type})`);
      } catch (error) {
        console.error(`SFXプレースホルダー作成エラー (${key}):`, error);
      }
    },
    
    /**
     * 音声にエンベロープを適用（音の変化をよりなめらかに）
     * @param {Float32Array} channelData - 音声データ
     * @param {number} sampleRate - サンプルレート
     */
    applyEnvelope(channelData, sampleRate) {
      const fadeInTime = 0.05; // フェードイン時間（秒）
      const fadeOutTime = 0.1;  // フェードアウト時間（秒）
      
      const fadeInSamples = Math.floor(fadeInTime * sampleRate);
      const fadeOutSamples = Math.floor(fadeOutTime * sampleRate);
      
      // フェードイン
      for (let i = 0; i < fadeInSamples; i++) {
        const factor = i / fadeInSamples;
        channelData[i] *= factor;
      }
      
      // フェードアウト
      const fadeOutStart = channelData.length - fadeOutSamples;
      for (let i = 0; i < fadeOutSamples; i++) {
        const factor = 1 - (i / fadeOutSamples);
        channelData[fadeOutStart + i] *= factor;
      }
    },
    
    /**
     * AudioBufferからBlobを作成し、Phaserシーンに追加
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - 音声キー
     * @param {AudioBuffer} audioBuffer - 音声バッファ
     * @param {boolean} isLoop - ループ再生するかどうか
     */
    createBlobURLAndAddToScene(scene, key, audioBuffer, isLoop) {
      // Web Audio APIのバッファからWAVファイルを生成
      const wavBlob = this.audioBufferToWav(audioBuffer);
      
      // BlobからURLを作成
      const blobUrl = URL.createObjectURL(wavBlob);
      
      // キーが既に存在する場合は削除
      if (scene.cache.audio.exists(key)) {
        scene.cache.audio.remove(key);
      }
      
      // URLからオーディオを直接追加（Phaserのキャッシュに入る）
      scene.sound.addAudioSprite(key, {
        spritemap: {
          [key]: {
            start: 0,
            end: audioBuffer.duration * 1000, // ミリ秒単位
            loop: isLoop
          }
        },
        url: blobUrl
      });
    },
    
    /**
     * AudioBufferをWAVファイル形式のBlobに変換
     * @param {AudioBuffer} audioBuffer - 音声バッファ
     * @returns {Blob} WAVファイル形式のBlob
     */
    audioBufferToWav(audioBuffer) {
      const numChannels = audioBuffer.numberOfChannels;
      const sampleRate = audioBuffer.sampleRate;
      const format = 1; // PCM
      const bitDepth = 16;
      
      // サンプルデータを取得
      const channelData = [];
      for (let channel = 0; channel < numChannels; channel++) {
        channelData.push(audioBuffer.getChannelData(channel));
      }
      
      // WAVファイルのヘッダーとデータ部分を作成
      const dataLength = channelData[0].length * numChannels * (bitDepth / 8);
      const buffer = new ArrayBuffer(44 + dataLength);
      const view = new DataView(buffer);
      
      // WAVヘッダーの書き込み
      // "RIFF"
      view.setUint8(0, 'R'.charCodeAt(0));
      view.setUint8(1, 'I'.charCodeAt(0));
      view.setUint8(2, 'F'.charCodeAt(0));
      view.setUint8(3, 'F'.charCodeAt(0));
      
      // ファイルサイズからRIFFチャンクサイズを計算
      view.setUint32(4, 36 + dataLength, true);
      
      // "WAVE"
      view.setUint8(8, 'W'.charCodeAt(0));
      view.setUint8(9, 'A'.charCodeAt(0));
      view.setUint8(10, 'V'.charCodeAt(0));
      view.setUint8(11, 'E'.charCodeAt(0));
      
      // "fmt "チャンク
      view.setUint8(12, 'f'.charCodeAt(0));
      view.setUint8(13, 'm'.charCodeAt(0));
      view.setUint8(14, 't'.charCodeAt(0));
      view.setUint8(15, ' '.charCodeAt(0));
      
      // fmtチャンクのサイズ (16)
      view.setUint32(16, 16, true);
      // フォーマット (1 = PCM)
      view.setUint16(20, format, true);
      // チャンネル数
      view.setUint16(22, numChannels, true);
      // サンプルレート
      view.setUint32(24, sampleRate, true);
      // バイトレート (サンプルレート * チャンネル数 * ビット深度 / 8)
      view.setUint32(28, sampleRate * numChannels * (bitDepth / 8), true);
      // ブロックアライン (チャンネル数 * ビット深度 / 8)
      view.setUint16(32, numChannels * (bitDepth / 8), true);
      // ビット深度
      view.setUint16(34, bitDepth, true);
      
      // "data"チャンク
      view.setUint8(36, 'd'.charCodeAt(0));
      view.setUint8(37, 'a'.charCodeAt(0));
      view.setUint8(38, 't'.charCodeAt(0));
      view.setUint8(39, 'a'.charCodeAt(0));
      
      // データ長
      view.setUint32(40, dataLength, true);
      
      // サンプルデータの書き込み
      let offset = 44;
      for (let i = 0; i < channelData[0].length; i++) {
        for (let channel = 0; channel < numChannels; channel++) {
          const sample = Math.max(-1, Math.min(1, channelData[channel][i]));
          let value = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          view.setInt16(offset, value, true);
          offset += 2;
        }
      }
      
      return new Blob([buffer], { type: 'audio/wav' });
    },
    
    /**
     * 安全な音声ロード（実際のアセットが読み込めない場合はプレースホルダーを使用）
     * @param {Phaser.Scene} scene - Phaserシーン
     * @param {string} key - 音声キー
     * @param {string} path - 音声パス
     * @param {Object} options - オプション（音声タイプなど）
     */
    safeLoadAudio(scene, key, path, options = {}) {
      // プレースホルダーが無効または既に読み込まれている場合は通常のロード
      if (!this.debugMode || (scene.cache && scene.cache.audio && scene.cache.audio.exists(key))) {
        if (scene.load && scene.load.audio) {
          scene.load.audio(key, path);
        }
        return;
      }
      
      // パス名からオーディオの種類を判断
      const isBgm = key.includes('bgm') || key.includes('music') || key.includes('theme');
      const type = this.getAudioTypeFromKey(key);
      
      // BGMまたはSFXのプレースホルダーを追加
      if (isBgm) {
        this.addBgmPlaceholder(scene, key);
      } else {
        this.addSfxPlaceholder(scene, key, type);
      }
    },
    
    /**
     * キー名から音声タイプを取得
     * @param {string} key - 音声キー
     * @returns {string} 音声タイプ
     */
    getAudioTypeFromKey(key) {
      const key_lower = key.toLowerCase();
      
      if (key_lower.includes('click')) return 'click';
      if (key_lower.includes('hover')) return 'hover';
      if (key_lower.includes('attack')) return 'attack';
      if (key_lower.includes('spell') || key_lower.includes('magic')) return 'spell';
      if (key_lower.includes('item') || key_lower.includes('pickup')) return 'item';
      if (key_lower.includes('game_over')) return 'game_over';
      
      // デフォルト
      return 'click';
    }
  };
  
  export default AudioPlaceholders;