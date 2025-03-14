import { Scene } from 'phaser';
import { SCENES } from '../constants';

export class MainMenuScene extends Scene {
  constructor() {
    super({ key: SCENES.MAIN_MENU });
  }

  preload() {
    // メニュー画面用のアセットをロード
    this.load.image('menu-background', 'assets/images/ui/menu_background.png');
    this.load.image('game-logo', 'assets/images/ui/game_logo.png');
    this.load.image('button-normal', 'assets/images/ui/button_normal.png');
    this.load.image('button-hover', 'assets/images/ui/button_hover.png');
  }

  create() {
    // 背景画像の追加
    this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'menu-background')
      .setDisplaySize(this.cameras.main.width, this.cameras.main.height);
    
    // ゲームロゴの追加
    const logo = this.add.image(this.cameras.main.width / 2, 120, 'game-logo')
      .setScale(0.8);
    
    // タイトルテキストの追加
    this.add.text(this.cameras.main.width / 2, 250, 'Diablo-like RPG', {
      fontSize: '42px',
      fontFamily: 'Arial Black',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 6,
      shadow: { offsetX: 3, offsetY: 3, color: '#000', blur: 5, stroke: true, fill: true }
    }).setOrigin(0.5);
    
    // メニューボタンの作成
    const buttonStartGame = this.createButton(this.cameras.main.width / 2, 350, 'ゲームスタート', () => {
      this.scene.start(SCENES.GAME);
    });
    
    const buttonOptions = this.createButton(this.cameras.main.width / 2, 420, 'オプション', () => {
      this.scene.start(SCENES.OPTIONS_MENU);
    });
    
    const buttonCredits = this.createButton(this.cameras.main.width / 2, 490, 'クレジット', () => {
      // クレジット表示ロジック
      console.log('クレジット表示');
    });
    
    const buttonExit = this.createButton(this.cameras.main.width / 2, 560, 'ゲーム終了', () => {
      // ゲーム終了ロジック（ブラウザゲームでは実装制限あり）
      if (window.confirm('ゲームを終了しますか？')) {
        window.close(); // ブラウザ環境では制限がある場合があります
      }
    });
    
    // 背景音楽の再生（BGM）
    if (!this.sound.get('menu-bgm')) {
      this.sound.add('menu-bgm', { loop: true, volume: 0.5 }).play();
    }
  }
  
  createButton(x, y, text, callback) {
    const button = this.add.image(x, y, 'button-normal')
      .setInteractive()
      .setScale(0.4);
    
    const buttonText = this.add.text(x, y, text, {
      fontSize: '24px',
      fontFamily: 'Arial',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    button.on('pointerover', () => {
      button.setTexture('button-hover');
      this.sound.play('hover-sfx', { volume: 0.3 });
    });
    
    button.on('pointerout', () => {
      button.setTexture('button-normal');
    });
    
    button.on('pointerdown', () => {
      this.sound.play('click-sfx', { volume: 0.5 });
      callback();
    });
    
    return { button, text: buttonText };
  }
  
  update() {
    // アニメーションやエフェクトの更新（必要に応じて）
  }
}