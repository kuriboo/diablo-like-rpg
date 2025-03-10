import { v4 as uuidv4 } from 'uuid';

export default class Effect {
  constructor(config = {}) {
    // 基本情報
    this.uuid = uuidv4();
    this.name = config.name || 'Effect';
    this.description = config.description || 'A basic effect';
    
    // 効果のタイプ
    this.type = config.type || 'visual'; // visual, stat, damage, heal, buff, debuff
    
    // 効果の持続時間（ミリ秒）、0は即時効果または永続効果
    this.duration = config.duration || 0;
    
    // 効果の発生時刻
    this.startTime = Date.now();
    
    // 発生元と対象
    this.source = config.source || null;
    this.target = config.target || null;
    
    // 効果の値・パラメータ
    this.value = config.value || {};
    
    // 視覚エフェクト用のスプライト
    this.sprite = null;
    this.particles = null;
    
    // シーン参照（表示用）
    this.scene = config.scene || null;
    
    // 効果音
    this.sound = config.sound || null;
    
    // コールバック関数
    this.onStart = config.onStart || null;
    this.onTick = config.onTick || null;
    this.onEnd = config.onEnd || null;
    
    // 初期化
    if (this.scene) {
      this.init();
    }
  }
  
  init() {
    // 効果の初期化
    if (this.onStart) {
      this.onStart(this);
    }
    
    // タイプに応じた初期化
    switch (this.type) {
      case 'visual':
        this.initVisualEffect();
        break;
      case 'stat':
        this.applyStatEffect();
        break;
      case 'damage':
        this.applyDamageEffect();
        break;
      case 'heal':
        this.applyHealEffect();
        break;
      case 'buff':
        this.applyBuffEffect();
        break;
      case 'debuff':
        this.applyDebuffEffect();
        break;
    }
    
    // 持続時間がある場合はタイマーを設定
    if (this.duration > 0 && this.scene) {
      this.timer = this.scene.time.delayedCall(
        this.duration,
        this.end,
        [],
        this
      );
      
      // 定期的な効果更新（ティック）が必要な場合
      if (this.onTick) {
        this.tickTimer = this.scene.time.addEvent({
          delay: 250, // 1/4秒ごとに更新
          callback: () => this.onTick(this),
          callbackScope: this,
          repeat: Math.floor(this.duration / 250) - 1
        });
      }
    }
    
    // 効果音の再生
    if (this.sound && this.scene.sound) {
      this.scene.sound.play(this.sound);
    }
  }
  
  initVisualEffect() {
    // 視覚エフェクトの初期化
    if (!this.scene || !this.target) return;
    
    // スプライトベースのエフェクト
    if (this.value.spriteKey) {
      this.sprite = this.scene.add.sprite(
        this.target.x,
        this.target.y,
        this.value.spriteKey
      );
      
      // アニメーションがある場合は再生
      if (this.value.animKey) {
        this.sprite.play(this.value.animKey);
      }
      
      // 追加プロパティの設定
      if (this.value.scale) {
        this.sprite.setScale(this.value.scale);
      }
      
      if (this.value.alpha !== undefined) {
        this.sprite.setAlpha(this.value.alpha);
      }
      
      if (this.value.blendMode) {
        this.sprite.setBlendMode(this.value.blendMode);
      }
      
      if (this.value.tint) {
        this.sprite.setTint(this.value.tint);
      }
      
      // 対象に追従する場合
      if (this.value.followTarget) {
        this.scene.events.on('update', this.updatePosition, this);
      }
    }
    
    // パーティクルベースのエフェクト
    if (this.value.particleKey && this.scene.add.particles) {
      const emitterConfig = {
        x: this.target.x,
        y: this.target.y,
        lifespan: this.value.lifespan || 1000,
        speed: this.value.speed || { min: 20, max: 50 },
        scale: this.value.scale || { start: 1, end: 0 },
        quantity: this.value.quantity || 10,
        blendMode: this.value.blendMode || 'NORMAL'
      };
      
      if (this.value.tint) {
        emitterConfig.tint = this.value.tint;
      }
      
      if (this.value.emitting !== undefined) {
        emitterConfig.emitting = this.value.emitting;
      }
      
      this.particles = this.scene.add.particles(this.target.x, this.target.y, this.value.particleKey, emitterConfig);
      
      // 対象に追従する場合
      if (this.value.followTarget) {
        this.scene.events.on('update', this.updatePosition, this);
      }
      
      // 一度だけ放出する場合
      if (this.value.explode) {
        this.particles.explode();
      }
    }
  }
  
  applyStatEffect() {
    // ステータス効果の適用
    if (!this.target) return;
    
    // ステータス変更の適用
    for (const [stat, value] of Object.entries(this.value.stats || {})) {
      if (this.target[stat] !== undefined) {
        // 既存の値を保存
        if (!this.target.originalStats) {
          this.target.originalStats = {};
        }
        
        if (this.target.originalStats[stat] === undefined) {
          this.target.originalStats[stat] = this.target[stat];
        }
        
        // 加算か乗算かを判定
        if (this.value.multiplicative) {
          this.target[stat] = this.target.originalStats[stat] * value;
        } else {
          this.target[stat] = this.target.originalStats[stat] + value;
        }
      }
    }
  }
  
  applyDamageEffect() {
    // ダメージ効果の適用
    if (!this.target) return;
    
    // ダメージ計算
    let damage = this.value.amount || 0;
    
    // クリティカルヒット判定
    let isCritical = false;
    if (this.source && this.value.canCrit) {
      const critChance = this.source.criticalRate || 5; // デフォルト5%
      isCritical = Math.random() * 100 < critChance;
      
      if (isCritical) {
        const critMult = this.source.criticalDamage || 1.5; // デフォルト1.5倍
        damage *= critMult;
      }
    }
    
    // ダメージタイプごとの処理
    switch (this.value.damageType) {
      case 'physical':
        // 物理耐性を考慮
        if (this.target.physicalResistance) {
          damage *= (1 - Math.min(this.target.physicalResistance / 100, 0.75));
        }
        break;
      case 'poison':
        // 毒耐性を考慮
        if (this.target.poisonResistance) {
          damage *= (1 - Math.min(this.target.poisonResistance / 100, 0.75));
        }
        break;
      case 'fire':
        // 火耐性を考慮
        if (this.target.fireResistance) {
          damage *= (1 - Math.min(this.target.fireResistance / 100, 0.75));
        }
        break;
      case 'cold':
        // 氷耐性を考慮
        if (this.target.coldResistance) {
          damage *= (1 - Math.min(this.target.coldResistance / 100, 0.75));
        }
        break;
      case 'electric':
        // 電気耐性を考慮
        if (this.target.electricResistance) {
          damage *= (1 - Math.min(this.target.electricResistance / 100, 0.75));
        }
        break;
    }
    
    // 最終ダメージの適用（整数に丸める）
    damage = Math.max(1, Math.floor(damage));
    this.target.takeDamage(damage, this.value.damageType, isCritical);
    
    // ライフスティール（吸血）効果
    if (this.source && this.value.lifeLeech && this.value.lifeLeech > 0) {
      const leechAmount = Math.floor(damage * (this.value.lifeLeech / 100));
      if (leechAmount > 0) {
        this.source.heal(leechAmount);
        this.showLeechEffect(this.source, leechAmount, 'life');
      }
    }
    
    // マナスティール効果
    if (this.source && this.value.manaLeech && this.value.manaLeech > 0) {
      const leechAmount = Math.floor(damage * (this.value.manaLeech / 100));
      if (leechAmount > 0) {
        this.source.restoreMana(leechAmount);
        this.showLeechEffect(this.source, leechAmount, 'mana');
      }
    }
    
    // ダメージ表示
    this.showDamageNumber(damage, isCritical, this.value.damageType);
  }
  
  applyHealEffect() {
    // 回復効果の適用
    if (!this.target) return;
    
    // 回復量計算
    let healAmount = this.value.amount || 0;
    
    // ヒール量の増加効果がある場合
    if (this.source && this.source.healingBonus) {
      healAmount *= (1 + this.source.healingBonus / 100);
    }
    
    // 最終回復量の適用（整数に丸める）
    healAmount = Math.floor(healAmount);
    
    // 回復タイプに応じた処理
    switch (this.value.healType) {
      case 'life':
        this.target.heal(healAmount);
        break;
      case 'mana':
        this.target.restoreMana(healAmount);
        break;
      case 'both':
        this.target.heal(healAmount);
        this.target.restoreMana(healAmount);
        break;
    }
    
    // 回復量表示
    this.showHealNumber(healAmount, this.value.healType);
  }
  
  applyBuffEffect() {
    // バフ効果の適用
    if (!this.target) return;
    
    // バフをターゲットに追加
    if (!this.target.buffs) {
      this.target.buffs = [];
    }
    
    // 既存の同名バフがあれば上書き
    const existingBuffIndex = this.target.buffs.findIndex(buff => buff.name === this.name);
    if (existingBuffIndex !== -1) {
      this.target.buffs.splice(existingBuffIndex, 1);
    }
    
    // バフデータを作成
    const buffData = {
      uuid: this.uuid,
      name: this.name,
      description: this.description,
      duration: this.duration,
      startTime: this.startTime,
      effects: this.value.effects || {},
      icon: this.value.icon
    };
    
    // バフの追加
    this.target.buffs.push(buffData);
    
    // ステータス効果があれば適用
    if (this.value.stats) {
      this.applyStatEffect();
    }
    
    // バフアイコンの表示
    this.showBuffIcon();
  }
  
  applyDebuffEffect() {
    // デバフ効果の適用
    if (!this.target) return;
    
    // デバフをターゲットに追加
    if (!this.target.debuffs) {
      this.target.debuffs = [];
    }
    
    // 既存の同名デバフがあれば上書き
    const existingDebuffIndex = this.target.debuffs.findIndex(debuff => debuff.name === this.name);
    if (existingDebuffIndex !== -1) {
      this.target.debuffs.splice(existingDebuffIndex, 1);
    }
    
    // デバフデータを作成
    const debuffData = {
      uuid: this.uuid,
      name: this.name,
      description: this.description,
      duration: this.duration,
      startTime: this.startTime,
      effects: this.value.effects || {},
      icon: this.value.icon
    };
    
    // デバフの追加
    this.target.debuffs.push(debuffData);
    
    // ステータス効果があれば適用
    if (this.value.stats) {
      this.applyStatEffect();
    }
    
    // デバフアイコンの表示
    this.showDebuffIcon();
  }
  
  showDamageNumber(amount, isCritical, damageType) {
    // ダメージ数値の表示
    if (!this.scene || !this.target) return;
    
    // ダメージタイプに応じた色
    const colors = {
      physical: '#ffffff',
      poison: '#00ff00',
      fire: '#ff0000',
      cold: '#00ffff',
      electric: '#ffff00'
    };
    
    const color = colors[damageType] || '#ffffff';
    
    // テキスト表示
    const damageText = this.scene.add.text(
      this.target.x,
      this.target.y - 20,
      amount.toString(),
      { 
        fontFamily: 'Arial', 
        fontSize: isCritical ? 24 : 16, 
        color: color,
        stroke: '#000000',
        strokeThickness: 3
      }
    ).setOrigin(0.5, 0.5);
    
    // クリティカルヒットの場合は効果を追加
    if (isCritical) {
      damageText.setText(`${amount} CRITICAL!`);
      
      // 追加エフェクト
      this.scene.tweens.add({
        targets: damageText,
        scale: { from: 1.5, to: 1 },
        duration: 300
      });
    }
    
    // アニメーション
    this.scene.tweens.add({
      targets: damageText,
      y: damageText.y - 40,
      alpha: 0,
      duration: 1200,
      onComplete: () => {
        damageText.destroy();
      }
    });
  }
  
  showHealNumber(amount, healType) {
    // 回復数値の表示
    if (!this.scene || !this.target) return;
    
    // 回復タイプに応じた色
    const colors = {
      life: '#00ff00',
      mana: '#0000ff',
      both: '#00ffff'
    };
    
    const color = colors[healType] || '#00ff00';
    
    // テキスト表示
    const healText = this.scene.add.text(
      this.target.x,
      this.target.y - 20,
      `+${amount}`,
      { 
        fontFamily: 'Arial', 
        fontSize: 16, 
        color: color,
        stroke: '#000000',
        strokeThickness: 2
      }
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
  }
  
  showLeechEffect(character, amount, leechType) {
    // 吸血効果の表示
    if (!this.scene || !character) return;
    
    // 吸血タイプに応じた色
    const color = leechType === 'life' ? '#ff0080' : '#0080ff';
    
    // テキスト表示
    const leechText = this.scene.add.text(
      character.x,
      character.y - 20,
      `+${amount}`,
      { 
        fontFamily: 'Arial', 
        fontSize: 14, 
        color: color,
        stroke: '#000000',
        strokeThickness: 2
      }
    ).setOrigin(0.5, 0.5);
    
    // アニメーション
    this.scene.tweens.add({
      targets: leechText,
      y: leechText.y - 25,
      alpha: 0,
      duration: 800,
      onComplete: () => {
        leechText.destroy();
      }
    });
    
    // パーティクルエフェクト
    if (this.scene.add.particles) {
      const particles = this.scene.add.particles(character.x, character.y, 'particle', {
        tint: leechType === 'life' ? 0xff0080 : 0x0080ff,
        lifespan: 600,
        speed: { min: 10, max: 30 },
        scale: { start: 0.4, end: 0 },
        quantity: 5,
        emitting: false
      });
      
      particles.explode();
      
      this.scene.time.delayedCall(600, () => {
        particles.destroy();
      });
    }
  }
  
  showBuffIcon() {
    // バフアイコンの表示
    if (!this.scene || !this.target || !this.value.icon) return;
    
    // プレイヤーの場合はUIにバフアイコンを追加
    if (this.target === this.scene.player) {
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.addBuffIcon) {
        uiScene.addBuffIcon({
          uuid: this.uuid,
          name: this.name,
          description: this.description,
          duration: this.duration,
          startTime: this.startTime,
          image: this.value.icon
        });
      }
    } 
    // NPCの場合はキャラクターの上にアイコンを表示
    else {
      if (!this.target.buffIcons) {
        this.target.buffIcons = [];
      }
      
      const icon = this.scene.add.image(
        this.target.x,
        this.target.y - 30,
        this.value.icon
      ).setOrigin(0.5, 0.5).setScale(0.5);
      
      this.target.buffIcons.push({
        uuid: this.uuid,
        icon: icon
      });
      
      // 対象が移動したらアイコンも移動させる
      this.scene.events.on('update', () => {
        if (this.target && icon) {
          icon.setPosition(this.target.x, this.target.y - 30);
        }
      });
    }
  }
  
  showDebuffIcon() {
    // デバフアイコンの表示
    if (!this.scene || !this.target || !this.value.icon) return;
    
    // プレイヤーの場合はUIにデバフアイコンを追加
    if (this.target === this.scene.player) {
      const uiScene = this.scene.scene.get('UIScene');
      if (uiScene && uiScene.addBuffIcon) { // addBuffIconを共用
        uiScene.addBuffIcon({
          uuid: this.uuid,
          name: this.name,
          description: this.description,
          duration: this.duration,
          startTime: this.startTime,
          image: this.value.icon,
          isDebuff: true
        });
      }
    } 
    // NPCの場合はキャラクターの上にアイコンを表示
    else {
      if (!this.target.debuffIcons) {
        this.target.debuffIcons = [];
      }
      
      const icon = this.scene.add.image(
        this.target.x,
        this.target.y - 30,
        this.value.icon
      ).setOrigin(0.5, 0.5).setScale(0.5).setTint(0xff0000);
      
      this.target.debuffIcons.push({
        uuid: this.uuid,
        icon: icon
      });
      
      // 対象が移動したらアイコンも移動させる
      this.scene.events.on('update', () => {
        if (this.target && icon) {
          icon.setPosition(this.target.x, this.target.y - 30);
        }
      });
    }
  }
  
  updatePosition() {
    // 対象に追従するエフェクトの位置更新
    if (!this.target) return;
    
    if (this.sprite) {
      this.sprite.setPosition(this.target.x, this.target.y);
    }
    
    if (this.particles) {
      this.particles.setPosition(this.target.x, this.target.y);
    }
  }
  
  update(time, delta) {
    // 毎フレームの更新処理
    
    // 経過時間の計算
    const elapsed = time - this.startTime;
    
    // 持続時間が過ぎたら終了
    if (this.duration > 0 && elapsed >= this.duration) {
      this.end();
      return;
    }
    
    // 追加の更新処理
    if (this.onTick) {
      this.onTick(this);
    }
  }
  
  end() {
    // 効果の終了処理
    
    // 終了コールバック呼び出し
    if (this.onEnd) {
      this.onEnd(this);
    }
    
    // ステータス効果の場合は元に戻す
    if (this.type === 'stat' && this.target && this.target.originalStats) {
      for (const [stat, value] of Object.entries(this.value.stats || {})) {
        if (this.target.originalStats[stat] !== undefined) {
          this.target[stat] = this.target.originalStats[stat];
        }
      }
    }
    
    // バフの場合はリストから削除
    if (this.type === 'buff' && this.target && this.target.buffs) {
      const index = this.target.buffs.findIndex(buff => buff.uuid === this.uuid);
      if (index !== -1) {
        this.target.buffs.splice(index, 1);
      }
      
      // UIのバフアイコンを削除
      if (this.target === this.scene.player) {
        const uiScene = this.scene.scene.get('UIScene');
        if (uiScene && uiScene.removeBuffIcon) {
          uiScene.removeBuffIcon(this.uuid);
        }
      } 
      // NPCのバフアイコンを削除
      else if (this.target.buffIcons) {
        const iconIndex = this.target.buffIcons.findIndex(icon => icon.uuid === this.uuid);
        if (iconIndex !== -1) {
          const icon = this.target.buffIcons[iconIndex];
          if (icon.icon) {
            icon.icon.destroy();
          }
          this.target.buffIcons.splice(iconIndex, 1);
        }
      }
    }
    
    // デバフの場合もリストから削除
    if (this.type === 'debuff' && this.target && this.target.debuffs) {
      const index = this.target.debuffs.findIndex(debuff => debuff.uuid === this.uuid);
      if (index !== -1) {
        this.target.debuffs.splice(index, 1);
      }
      
      // UIのデバフアイコンを削除
      if (this.target === this.scene.player) {
        const uiScene = this.scene.scene.get('UIScene');
        if (uiScene && uiScene.removeBuffIcon) {
          uiScene.removeBuffIcon(this.uuid);
        }
      } 
      // NPCのデバフアイコンを削除
      else if (this.target.debuffIcons) {
        const iconIndex = this.target.debuffIcons.findIndex(icon => icon.uuid === this.uuid);
        if (iconIndex !== -1) {
          const icon = this.target.debuffIcons[iconIndex];
          if (icon.icon) {
            icon.icon.destroy();
          }
          this.target.debuffIcons.splice(iconIndex, 1);
        }
      }
    }
    
    // リソースの解放
    this.destroy();
  }
  
  destroy() {
    // リソースの解放
    if (this.scene) {
      // タイマーの解除
      if (this.timer) {
        this.timer.remove();
      }
      
      if (this.tickTimer) {
        this.tickTimer.remove();
      }
      
      // イベントリスナーの解除
      this.scene.events.off('update', this.updatePosition, this);
      
      // スプライトの削除
      if (this.sprite) {
        this.sprite.destroy();
      }
      
      // パーティクルの削除
      if (this.particles) {
        this.particles.destroy();
      }
    }
  }
  
  // 静的メソッド：簡単なエフェクト作成
  static createDamageEffect(scene, source, target, config) {
    return new Effect({
      scene,
      name: config.name || 'Damage Effect',
      type: 'damage',
      source,
      target,
      value: {
        amount: config.amount || 1,
        damageType: config.damageType || 'physical',
        canCrit: config.canCrit !== undefined ? config.canCrit : true,
        lifeLeech: config.lifeLeech || 0,
        manaLeech: config.manaLeech || 0
      },
      sound: config.sound,
      duration: 0 // 即時効果
    });
  }
  
  static createHealEffect(scene, source, target, config) {
    return new Effect({
      scene,
      name: config.name || 'Heal Effect',
      type: 'heal',
      source,
      target,
      value: {
        amount: config.amount || 1,
        healType: config.healType || 'life'
      },
      sound: config.sound,
      duration: 0 // 即時効果
    });
  }
  
  static createBuffEffect(scene, target, config) {
    return new Effect({
      scene,
      name: config.name || 'Buff Effect',
      description: config.description || 'A temporary beneficial effect',
      type: 'buff',
      target,
      value: {
        effects: config.effects || {},
        stats: config.stats || {},
        icon: config.icon
      },
      sound: config.sound,
      duration: config.duration || 10000,
      onEnd: config.onEnd
    });
  }
}