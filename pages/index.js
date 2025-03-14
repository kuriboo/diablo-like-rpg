import React, { useEffect, useState, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';
import { Game } from '../src/game/core/Game';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const gameContainerRef = useRef(null);
  const gameInitialized = useRef(false);

  useEffect(() => {
    // ゲームインスタンスを取得
    const gameInstance = Game.getInstance();
    
    // ゲームUI要素を追加
    const gameUI = document.createElement('div');
    gameUI.id = 'game-ui';
    gameUI.className = styles.gameUI;
    document.body.appendChild(gameUI);

    // ゲームの初期化（一度だけ実行）
    if (!gameInitialized.current) {
      try {
        // Electronの機能が利用可能かチェック
        const isElectron = typeof window !== 'undefined' && 
                          window.electronAPI && 
                          window.electronAPI.isElectron;

        console.log('Starting game, Electron mode:', isElectron);

        // Electronモードの場合、ローカルストレージの代わりにElectron APIを使用
        if (isElectron) {
          // セーブ関数をオーバーライド
          gameInstance.saveGameData = async (slot, data) => {
            try {
              const result = await window.electronAPI.saveGame({
                ...data,
                saveSlot: slot
              });
              return result.success;
            } catch (error) {
              console.error('Error saving game:', error);
              return false;
            }
          };

          // ロード関数をオーバーライド
          gameInstance.loadGameData = async (slot) => {
            try {
              const result = await window.electronAPI.loadGame(slot);
              return result.success ? result.gameData : null;
            } catch (error) {
              console.error('Error loading game:', error);
              return null;
            }
          };
        }

        // ゲームの初期化
        gameInstance.init();
        gameInitialized.current = true;
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize game:', err);
        setError(err.message || 'Failed to initialize game');
        setIsLoading(false);
      }
    }

    // クリーンアップ関数
    return () => {
      // ゲームUI要素を削除
      if (gameUI && gameUI.parentNode) {
        gameUI.parentNode.removeChild(gameUI);
      }
      
      // ページが閉じられる時にゲームリソースを解放
      if (gameInitialized.current) {
        gameInstance.destroy();
        gameInitialized.current = false;
      }
    };
  }, []);

  return (
    <div className={styles.container}>
      <Head>
        <title>Diablo-Like RPG</title>
        <meta name="description" content="An isometric action RPG game inspired by Diablo" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loading}>
            <h2>Loading Game...</h2>
          </div>
        ) : error ? (
          <div className={styles.error}>
            <h2>Error</h2>
            <p>{error}</p>
            <button className={styles.gameUIInteractive} onClick={() => window.location.reload()}>
              Reload
            </button>
          </div>
        ) : (
          <div 
            id="game-container" 
            ref={gameContainerRef} 
            className={styles.gameContainer}
          />
        )}
      </main>
    </div>
  );
}