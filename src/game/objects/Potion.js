import Item from './Item';

export default class Potion extends Item {
  constructor(scene, x, y, texture, config = {}) {
    super(scene, x, y, texture);
    
    // 基本情報
    this.name = config.name || 'ポーション';
    this.description = config.description || '体力を回復するポーション';
    
    // ポーションタイプ
    this.potionType = config.potionType || 'health'; // health, mana, rejuvenation, special
    
    // 効果量
    this.effectValue = config.effectValue || 30;
    
    // 効果時間（特殊ポーションの場合）
    this.duration = config.duration || 0;
    
    // 見た目の調整
    this.setTint(this.getPotionTint());
    
    // フロート効果の調整
    this.floatSpeed = 2.0;
    this.floatHeight = 5;
  }
  
  getPotionTint() {
    // ポーションタイプに基づく色
    const potionTints = {
      health: 0xff0000,      // 赤
      mana: 0x0000ff,        // 青
      rejuvenation: 0x800080, // 紫
      special: 0xffff00       // 黄
    };
    
    return potionTints[this.potionType] || 0xffffff;
  }
  
  addToPlayerInventory(player) {
    // プレイヤーのポーション所持数を増やす
    if (player) {
      // 最大所持数を超えていなければカウント増加
      if (player.potionCount < player.maxPotion) {
        player.potionCount += 1;
        
        // UIの更新
        const uiScene = this.scene.scene.get('UIScene');
        if (uiScene) {
          uiScene.updatePotionCounter();
        }
        
        return true;
      } else {
        // 所持数上限メッセージ
        const uiScene = this.scene.scene.get('UIScene');
        if (uiScene && uiScene.showMessage) {
          uiScene.showMessage('ポーションの所持数が上限です');
        }
      }
    }
    
    return false;
  }
  
  // ポーションを使用
  use(character) {
    if (!character) return false;
    
    switch(this.potionType) {
      case 'health':
        return this.useHealthPotion(character);
      case 'mana':
        return this.useManaPotion(character);
      case 'rejuvenation':
        return this.useRejuvenationPotion(character);
      case 'special':
        return this.useSpecialPotion(character);
      default:
        return false;
    }
  }
  
  useHealthPotion(character) {
    // ライフ回復
    if (character.life < character.maxLife) {
      // 回復量を計算（キャラクターのレベルとポーションの効果値に基づく）
      const healAmount = Math.floor(this.effectValue * (1 + character.level * 0.05));
      
      // 回復処理
      character.life = Math.min(character.life + healAmount, character.maxLife);
      
      // 効果音再生
      if (this.scene.sound) {
        this.scene.sound.play('potion_use');
      }
      
      // 回復エフェクト表示
      this.showHealEffect(character, healAmount);
      
      // UIの更新
      if (character === this.scene.player) {
        const uiScene = this.scene.scene.get('UIScene');
        if (uiScene) {
          uiScene.updateHealthBar();
          uiScene.updatePotionCounter();
        }
      }
      
      return true;
    }
    
    return false;
  }
  
  useManaPotion(character) {
    // マナ回復
    if (character.mana < character.maxMana) {
      // 回復量を計算
      const manaAmount = Math.floor(this.effectValue * (1 + character.level * 0.05));
      
      // 回復処理
      character.mana = Math.min(character.mana + manaAmount, character.maxMana);
      
      // 効果音再生
      if (this.scene.sound) {
        this.scene.sound.play('potion_use');
      }
      
      // 回復エフェクト表示
      this.showManaEffect(character, manaAmount);
      
      // UIの更新
      if (character === this.scene.player) {
        const uiScene = this.scene.scene.get('UIScene');
        if (uiScene) {
          uiScene.updateManaBar();
          uiScene.updatePotionCounter();
        }
      }
      
      return true;
    }
    
    return false;
  }
  
  useRejuvenationPotion(character) {
    // ライフとマナ両方の回復
    const healthResult = this.useHealthPotion(character);
    const manaResult = this.useManaPotion(character);
    
    return healthResult || manaResult;
  }
  
  useSpecialPotion(character) {
    // 特殊効果のポーション（一時的なバフなど）
    if (!character.buffs) character.buffs = [];
    
    // すでに同じバフがあるか確認
    const existingBuff = character.buffs.find(buff => buff.name === this.name);
    if (existingBuff) {
      // 効果時間のリセット
      existingBuff.duration = this.duration;
      existingBuff.startTime = Date.now();
    } else {
      // 新規バフの追加
      const newBuff = {
        name: this.name,
        description: this.description,
        duration: this.duration,
        startTime: Date.now(),
        effects: {}, // 効果の詳細はポーションの種類によって異なる
        uuid: this.uuid
      };
      
      // 効果の設定（例：一時的な速度上昇）
      newBuff.effects.moveSpeed = 1.2; // 移動速度20%アップ
      
      // バフの適用
      character.buffs.push(newBuff);
      character.applyBuffs();
      
      // UIへのバフアイコン追加
      if (character === this.scene.player) {
        const uiScene = this.scene.scene.get('UIScene');
        if (uiScene && uiScene.addBuffIcon) {
          uiScene.addBuffIcon(newBuff);
        }
      }
    }
    
    // 効果音再生
    if (this.scene.sound) {
      this.scene.sound.play('potion_special');
    }
    
    // エフェクト表示
    this.showSpecialEffect(character);
    
    // UIの更新
    if (character === this.scene.player) {
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene) {
        uiScene.updatePotionCounter();
      }
    }
    
    return true;
  }
  
  showHealEffect(character, amount) {
    // 回復エフェクトの表示
    if (!character || !this.scene) return;
    
    // 数値表示
    const healText = this.scene.add.text(
      character.x,
      character.y - 20,
      `+${amount}`,
      { fontFamily: 'Arial', fontSize: 16, color: '#00ff00' }
    ).setOrigin(0.5, 0.5);
    
    // アニメーション
    this.scene.tweens.add({
      targets: healText,
      y: healText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        healText.destroy();
      }
    });
    
    // パーティクルエフェクト
    if (this.scene.add.particles) {
      const particles = this.scene.add.particles(character.x, character.y, 'particle', {
        tint: 0x00ff00,
        lifespan: 800,
        speed: { min: 20, max: 50 },
        scale: { start: 0.6, end: 0 },
        quantity: 10,
        emitting: false
      });
      
      particles.explode();
      
      this.scene.time.delayedCall(800, () => {
        particles.destroy();
      });
    }
  }
  
  showManaEffect(character, amount) {
    // マナ回復エフェクトの表示
    if (!character || !this.scene) return;
    
    // 数値表示
    const manaText = this.scene.add.text(
      character.x,
      character.y - 20,
      `+${amount}`,
      { fontFamily: 'Arial', fontSize: 16, color: '#0000ff' }
    ).setOrigin(0.5, 0.5);
    
    // アニメーション
    this.scene.tweens.add({
      targets: manaText,
      y: manaText.y - 30,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        manaText.destroy();
      }
    });
    
    // パーティクルエフェクト
    if (this.scene.add.particles) {
      const particles = this.scene.add.particles(character.x, character.y, 'particle', {
        tint: 0x0000ff,
        lifespan: 800,
        speed: { min: 20, max: 50 },
        scale: { start: 0.6, end: 0 },
        quantity: 10,
        emitting: false
      });
      
      particles.explode();
      
      this.scene.time.delayedCall(800, () => {
        particles.destroy();
      });
    }
  }
  
  showSpecialEffect(character) {
    // 特殊効果ポーションのエフェクト表示
    if (!character || !this.scene) return;
    
    // キラキラエフェクト
    if (this.scene.add.particles) {
      const particles = this.scene.add.particles(character.x, character.y, 'particle', {
        tint: 0xffff00,
        lifespan: 1200,
        speed: { min: 30, max: 80 },
        scale: { start: 0.8, end: 0 },
        quantity: 20,
        emitting: false
      });
      
      particles.explode();
      
      this.scene.time.delayedCall(1200, () => {
        particles.destroy();
      });
    }
    
    // 光るエフェクト
    const glow = this.scene.add.sprite(character.x, character.y, character.texture.key)
      .setScale(character.scaleX * 1.2, character.scaleY * 1.2)
      .setAlpha(0.7)
      .setTint(0xffff00);
    
    this.scene.tweens.add({
      targets: glow,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        glow.destroy();
      }
    });
  }
  
  getTooltipData() {
    // ツールチップに表示するデータ
    let description = this.description;
    
    // 効果量の詳細を追加
    switch (this.potionType) {
      case 'health':
        description += `\n体力を${this.effectValue}回復します。`;
        break;
      case 'mana':
        description += `\nマナを${this.effectValue}回復します。`;
        break;
      case 'rejuvenation':
        description += `\n体力とマナを${this.effectValue}回復します。`;
        break;
      case 'special':
        description += `\n${this.duration}秒間、一時的な効果を付与します。`;
        break;
    }
    
    return {
      name: this.name,
      description: description,
      type: this.potionType
    };
  }
}