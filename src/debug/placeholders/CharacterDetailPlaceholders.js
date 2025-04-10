/**
 * placeholders/CharacterDetailPlaceholders.js - 詳細なキャラクター生成機能
 * 
 * PlaceholderAssetsの高度なキャラクター描画機能を提供します。
 * 様々なタイプの詳細なキャラクターを描画します。
 */

import { brightenColor, darkenColor } from '../../utils/ColorUtils';
import PlaceholderAssets from '../PlaceholderAssets';


class CharacterDetailPlaceholders extends PlaceholderAssets {

    /**
     * 人型キャラクターを描画
     * @param {Phaser.GameObjects.Graphics} graphics - グラフィックスオブジェクト
     * @param {number} color - キャラクターの色
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {string} variant - バリアント ('normal', 'armored', 'robed', 'hooded')
     * @param {boolean} details - 詳細な描画を有効にするか
     * @param {string} direction - 向き ('down', 'up', 'left', 'right')
     * @param {boolean} animation - アニメーション風にするか
     * @param {Object} customFeatures - カスタマイズオプション
     */
    drawHumanoidCharacter(graphics, color, width, height, variant, details, direction, animation, customFeatures = {}) {
        // デフォルトのカスタマイズオプション
        const defaults = {
            hairColor: darkenColor(color, 20),
            skinColor: brightenColor(color, 30),
            clothColor: color,
            armorColor: darkenColor(color, 10),
            eyeColor: 0x000000,
            accessoryColor: 0xFFD700,
            hasWeapon: false,
            weaponType: 'sword', // 'sword', 'axe', 'staff', 'bow'
            hasShield: false,
            hairStyle: 'short', // 'short', 'long', 'ponytail', 'bald'
            hasBeard: false,
            hasHelmet: false,
            hasHat: false
        };
        
        const features = { ...defaults, ...customFeatures };
        
        // 基本的なサイズ計算
        const centerX = width / 2;
        const centerY = height / 2;
        const headRadius = width * 0.15;
        const bodyWidth = width * 0.4;
        const bodyHeight = height * 0.3;
        
        // 腕と足のサイズ
        const limbWidth = width * 0.08;
        const armLength = height * 0.25;
        const legLength = height * 0.2;
        
        // アニメーション効果（静止画でもわずかな動きを表現）
        let animOffsetY = 0;
        let leftLegOffset = 0;
        let rightLegOffset = 0;
        let leftArmAngle = 0;
        let rightArmAngle = 0;
        
        if (animation) {
            animOffsetY = 1;
            leftLegOffset = 2;
            rightLegOffset = -1;
            leftArmAngle = 0.1;
            rightArmAngle = -0.05;
        }
        
        // 頭と体の位置計算
        const headY = centerY - bodyHeight * 0.5 - headRadius;
        let bodyY = centerY;
        
        if (variant === 'normal' || variant === 'hooded') {
            bodyY = centerY;
        } else if (variant === 'armored') {
            bodyY = centerY + 1; // 重い鎧で少し下がる
        } else if (variant === 'robed') {
            bodyY = centerY - 2; // ローブで少し上がる
        }
        
        // 方向による描画順序とサイズの調整
        let drawOrder;
        let headScaleX = 1;
        let bodyScaleX = 1;
        
        if (direction === 'down') {
            drawOrder = ['legs', 'body', 'arms', 'head', 'face', 'hair', 'accessories'];
        } else if (direction === 'up') {
            drawOrder = ['legs', 'arms', 'body', 'head', 'hair', 'accessories', 'face'];
        } else if (direction === 'left') {
            drawOrder = ['legs', 'body', 'right_arm', 'head', 'face', 'hair', 'left_arm', 'accessories'];
            headScaleX = 0.8;
            bodyScaleX = 0.9;
        } else { // right
            drawOrder = ['legs', 'body', 'left_arm', 'head', 'face', 'hair', 'right_arm', 'accessories'];
            headScaleX = 0.8;
            bodyScaleX = 0.9;
        }
        
        // 各パーツを描画順序に従って描画
        for (const part of drawOrder) {
            switch (part) {
            case 'legs':
                // 足を描画
                graphics.fillStyle(features.clothColor, 1);
                
                // 左足
                graphics.fillRect(
                centerX - limbWidth * 1.5,
                bodyY + bodyHeight / 2 + leftLegOffset,
                limbWidth,
                legLength
                );
                
                // 右足
                graphics.fillRect(
                centerX + limbWidth * 0.5,
                bodyY + bodyHeight / 2 + rightLegOffset,
                limbWidth,
                legLength
                );
                
                // バリアントによる調整
                if (variant === 'armored') {
                    // 鎧の足
                    graphics.fillStyle(features.armorColor, 1);
                    graphics.fillRect(
                        centerX - limbWidth * 1.5 - 1,
                        bodyY + bodyHeight / 2 + leftLegOffset + legLength * 0.6,
                        limbWidth + 2,
                        legLength * 0.4
                    );
                    graphics.fillRect(
                        centerX + limbWidth * 0.5 - 1,
                        bodyY + bodyHeight / 2 + rightLegOffset + legLength * 0.6,
                        limbWidth + 2,
                        legLength * 0.4
                    );
                } else if (variant === 'robed') {
                    // ローブの下部
                    graphics.fillStyle(features.clothColor, 1);
                    graphics.fillTriangle(
                        centerX - limbWidth * 2,
                        bodyY + bodyHeight / 2,
                        centerX + limbWidth * 2,
                        bodyY + bodyHeight / 2,
                        centerX,
                        bodyY + bodyHeight / 2 + legLength * 1.2
                    );
                }
                break;
                
            case 'body':
                // 体を描画
                let bodyFillColor = features.clothColor;
                
                if (variant === 'armored') {
                    bodyFillColor = features.armorColor;
                }
                
                // 体の本体
                graphics.fillStyle(bodyFillColor, 1);
                
                if (direction === 'left' || direction === 'right') {
                    // 横向きの体（少し薄く）
                    drawEllipse(
                        graphics,
                        centerX,
                        bodyY,
                        bodyWidth * bodyScaleX,
                        bodyHeight
                    );
                } else {
                    // 前後向きの体
                    drawEllipse(
                        graphics,
                        centerX,
                        bodyY,
                        bodyWidth,
                        bodyHeight
                    );
                }
                
                // バリアントごとの詳細
                if (details) {
                    if (variant === 'armored') {
                        // 鎧のデザイン
                        graphics.fillStyle(darkenColor(features.armorColor, 20), 1);
                        
                        // 胸部プレート
                        if (direction === 'down' || direction === 'up') {
                        graphics.fillRect(
                            centerX - bodyWidth * 0.3,
                            bodyY - bodyHeight * 0.2,
                            bodyWidth * 0.6,
                            bodyHeight * 0.4
                        );
                        }
                        
                        // 肩部プレート
                        graphics.fillStyle(brightenColor(features.armorColor, 10), 1);

                        if (direction !== 'left') {
                            drawEllipse(
                                graphics,
                                centerX - bodyWidth * 0.4,
                                bodyY - bodyHeight * 0.3,
                                bodyWidth * 0.2,
                                bodyHeight * 0.2
                            );
                        }
                        
                        if (direction !== 'right') {
                            drawEllipse(
                                graphics,
                                centerX + bodyWidth * 0.4,
                                bodyY - bodyHeight * 0.3,
                                bodyWidth * 0.2,
                                bodyHeight * 0.2
                            );
                        }
                    } else if (variant === 'robed') {
                        // ローブのデザイン
                        graphics.fillStyle(darkenColor(features.clothColor, 15), 1);
                        
                        // ローブの襟
                        drawEllipse(
                        graphics,
                        centerX,
                        bodyY - bodyHeight * 0.3,
                        bodyWidth * 0.8,
                        bodyHeight * 0.2
                        );
                        
                        // ローブのベルト
                        graphics.fillStyle(darkenColor(features.clothColor, 30), 1);
                        graphics.fillRect(
                        centerX - bodyWidth * 0.5,
                        bodyY,
                        bodyWidth,
                        bodyHeight * 0.1
                        );

                    } else {
                        // 通常の服のデザイン
                        graphics.fillStyle(darkenColor(features.clothColor, 20), 1);
                        
                        if (direction === 'down') {
                            // 前面のボタンやデザイン
                            graphics.fillRect(
                                centerX - bodyWidth * 0.1,
                                bodyY - bodyHeight * 0.3,
                                bodyWidth * 0.2,
                                bodyHeight * 0.6
                            );
                        }
                    }
                }
                break;
                
            case 'arms':
            case 'left_arm':
            case 'right_arm':
                // 腕を描画
                graphics.fillStyle(variant === 'armored' ? features.armorColor : features.skinColor, 1);
                
                // 左右の腕のオフセットとサイズ
                const armOffsetX = bodyWidth * 0.5;
                const armOffsetY = bodyHeight * 0.1;
                
                // 特定方向の場合のみ特定の腕を描画
                if (part === 'arms' || 
                    (part === 'left_arm' && (direction === 'right' || direction === 'down' || direction === 'up')) ||
                    (part === 'right_arm' && (direction === 'left' || direction === 'down' || direction === 'up'))) {
                
                    if (part !== 'right_arm') {
                        // 左腕
                        if (features.hasShield && (direction === 'down' || direction === 'right')) {
                            // 盾を持つ姿勢
                            graphics.fillStyle(features.armorColor, 1);
                            graphics.fillRect(
                                centerX - armOffsetX - limbWidth,
                                bodyY - armOffsetY,
                                limbWidth,
                                armLength * 0.7
                            );
                            
                            // 盾
                            graphics.fillStyle(brightenColor(features.armorColor, 20), 1);
                            graphics.fillRect(
                                centerX - armOffsetX - limbWidth * 3,
                                bodyY - armOffsetY,
                                limbWidth * 2,
                                armLength * 0.8
                            );
                            
                            // 盾のデザイン
                            if (details) {
                                graphics.fillStyle(features.accessoryColor, 1);
                                graphics.fillCircle(
                                centerX - armOffsetX - limbWidth * 2,
                                bodyY - armOffsetY + armLength * 0.4,
                                limbWidth * 0.5
                                );
                            }
                        } else {
                            // 通常の左腕
                            graphics.fillRect(
                                centerX - armOffsetX - limbWidth,
                                bodyY - armOffsetY,
                                limbWidth,
                                armLength
                            );
                            
                            // 左手
                            graphics.fillStyle(features.skinColor, 1);
                            drawEllipse(
                                graphics,
                                centerX - armOffsetX - limbWidth * 0.5,
                                bodyY - armOffsetY + armLength,
                                limbWidth * 0.8,
                                limbWidth * 0.8
                            );
                        }
                    }
                
                    if (part !== 'left_arm') {
                        // 右腕
                        if (features.hasWeapon && (direction === 'down' || direction === 'left')) {
                            // 武器を持つ姿勢
                            graphics.fillStyle(variant === 'armored' ? features.armorColor : features.skinColor, 1);
                            graphics.fillRect(
                                centerX + armOffsetX,
                                bodyY - armOffsetY,
                                limbWidth,
                                armLength * 0.6
                            );
                            
                            // 武器のタイプに応じた描画
                            graphics.fillStyle(0x8B4513, 1); // 武器の柄（茶色）
                            
                            if (features.weaponType === 'sword') {
                                // 剣
                                graphics.fillRect(
                                centerX + armOffsetX + limbWidth,
                                bodyY - armOffsetY + armLength * 0.4,
                                limbWidth * 0.5,
                                armLength * 0.8
                                );
                                
                                // 剣の刃
                                graphics.fillStyle(0xC0C0C0, 1); // 銀色
                                graphics.fillRect(
                                centerX + armOffsetX + limbWidth * 0.75,
                                bodyY - armOffsetY,
                                limbWidth,
                                armLength * 0.4
                                );
                            } else if (features.weaponType === 'axe') {
                                // 斧
                                graphics.fillRect(
                                centerX + armOffsetX + limbWidth,
                                bodyY - armOffsetY + armLength * 0.3,
                                limbWidth * 0.5,
                                armLength
                                );
                                
                                // 斧の刃
                                graphics.fillStyle(0xC0C0C0, 1); // 銀色
                                graphics.fillTriangle(
                                centerX + armOffsetX + limbWidth * 1.5,
                                bodyY - armOffsetY + armLength * 0.3,
                                centerX + armOffsetX + limbWidth * 3,
                                bodyY - armOffsetY + armLength * 0.1,
                                centerX + armOffsetX + limbWidth * 3,
                                bodyY - armOffsetY + armLength * 0.5
                                );
                            } else if (features.weaponType === 'staff') {
                                // 杖
                                graphics.fillRect(
                                centerX + armOffsetX + limbWidth,
                                bodyY - armOffsetY - armLength * 0.3,
                                limbWidth * 0.5,
                                armLength * 1.5
                                );
                                
                                // 杖の飾り
                                graphics.fillStyle(features.accessoryColor, 1); // 金色
                                graphics.fillCircle(
                                centerX + armOffsetX + limbWidth * 1.25,
                                bodyY - armOffsetY - armLength * 0.3,
                                limbWidth
                                );
                            } else if (features.weaponType === 'bow') {
                                // 弓
                                graphics.lineStyle(limbWidth * 0.5, 0x8B4513, 1);
                                graphics.beginPath();
                                graphics.arc(
                                centerX + armOffsetX + limbWidth * 2,
                                bodyY - armOffsetY + armLength * 0.5,
                                armLength * 0.8,
                                -Math.PI * 0.6,
                                Math.PI * 0.6
                                );
                                graphics.strokePath();
                                
                                // 弓の弦
                                graphics.lineStyle(1, 0xFFFFFF, 1);
                                graphics.lineBetween(
                                centerX + armOffsetX + limbWidth * 2 + Math.cos(-Math.PI * 0.6) * armLength * 0.8,
                                bodyY - armOffsetY + armLength * 0.5 + Math.sin(-Math.PI * 0.6) * armLength * 0.8,
                                centerX + armOffsetX + limbWidth * 2 + Math.cos(Math.PI * 0.6) * armLength * 0.8,
                                bodyY - armOffsetY + armLength * 0.5 + Math.sin(Math.PI * 0.6) * armLength * 0.8
                                );
                            }
                        } else {
                            // 通常の右腕
                            graphics.fillRect(
                                centerX + armOffsetX,
                                bodyY - armOffsetY,
                                limbWidth,
                                armLength
                            );
                            
                            // 右手
                            graphics.fillStyle(features.skinColor, 1);
                            drawEllipse(
                                graphics,
                                centerX + armOffsetX + limbWidth * 0.5,
                                bodyY - armOffsetY + armLength,
                                limbWidth * 0.8,
                                limbWidth * 0.8
                            );
                        }
                    }
                }
                break;
                
            case 'head':
                // 頭を描画
                graphics.fillStyle(features.skinColor, 1);
                
                // 方向に応じた頭の形
                if (direction === 'left' || direction === 'right') {
                    // 横向きの頭（楕円形）
                    drawEllipse(
                        graphics,
                        centerX,
                        headY,
                        headRadius * headScaleX * 1.2,
                        headRadius * 1.3
                    );
                } else {
                    // 前後向きの頭（丸）
                    drawEllipse(
                        graphics,
                        centerX,
                        headY,
                        headRadius * 1.2,
                        headRadius * 1.3
                    );
                }
                break;
                
            case 'face':
                // 顔の詳細を描画（目、口など）
                if (details) {
                    if (direction === 'down') {
                        // 目
                        graphics.fillStyle(0xFFFFFF, 1);
                        graphics.fillCircle(
                        centerX - headRadius * 0.4,
                        headY - headRadius * 0.1,
                        headRadius * 0.25
                        );
                        graphics.fillCircle(
                        centerX + headRadius * 0.4,
                        headY - headRadius * 0.1,
                        headRadius * 0.25
                        );
                        
                        // 瞳
                        graphics.fillStyle(features.eyeColor, 1);
                        graphics.fillCircle(
                        centerX - headRadius * 0.4,
                        headY - headRadius * 0.1,
                        headRadius * 0.12
                        );
                        graphics.fillCircle(
                        centerX + headRadius * 0.4,
                        headY - headRadius * 0.1,
                        headRadius * 0.12
                        );
                        
                        // 口
                        graphics.fillStyle(0x000000, 1);
                        graphics.fillRect(
                        centerX - headRadius * 0.3,
                        headY + headRadius * 0.4,
                        headRadius * 0.6,
                        headRadius * 0.1
                        );
                    } else if (direction === 'left') {
                        // 左向きの目と口
                        graphics.fillStyle(0xFFFFFF, 1);
                        graphics.fillCircle(
                        centerX - headRadius * 0.2,
                        headY - headRadius * 0.1,
                        headRadius * 0.25
                        );
                        
                        graphics.fillStyle(features.eyeColor, 1);
                        graphics.fillCircle(
                        centerX - headRadius * 0.2,
                        headY - headRadius * 0.1,
                        headRadius * 0.12
                        );
                        
                        // 口
                        graphics.fillStyle(0x000000, 1);
                        graphics.fillRect(
                        centerX - headRadius * 0.6,
                        headY + headRadius * 0.3,
                        headRadius * 0.3,
                        headRadius * 0.1
                        );
                    } else if (direction === 'right') {
                        // 右向きの目と口
                        graphics.fillStyle(0xFFFFFF, 1);
                        graphics.fillCircle(
                        centerX + headRadius * 0.2,
                        headY - headRadius * 0.1,
                        headRadius * 0.25
                        );
                        
                        graphics.fillStyle(features.eyeColor, 1);
                        graphics.fillCircle(
                        centerX + headRadius * 0.2,
                        headY - headRadius * 0.1,
                        headRadius * 0.12
                        );
                        
                        // 口
                        graphics.fillStyle(0x000000, 1);
                        graphics.fillRect(
                        centerX + headRadius * 0.3,
                        headY + headRadius * 0.3,
                        headRadius * 0.3,
                        headRadius * 0.1
                        );
                    } else if (direction === 'up') {
                        // 後ろ向きは顔の詳細なし
                    }
                    
                    // ひげがある場合
                    if (features.hasBeard && direction !== 'up') {
                        graphics.fillStyle(features.hairColor, 1);
                        
                        if (direction === 'down') {
                            // 正面向きのひげ
                            graphics.fillRect(
                                centerX - headRadius * 0.4,
                                headY + headRadius * 0.5,
                                headRadius * 0.8,
                                headRadius * 0.4
                            );
                        } else if (direction === 'left') {
                            // 左向きのひげ
                            graphics.fillRect(
                                centerX - headRadius * 0.8,
                                headY + headRadius * 0.3,
                                headRadius * 0.5,
                                headRadius * 0.4
                            );
                        } else if (direction === 'right') {
                            // 右向きのひげ
                            graphics.fillRect(
                                centerX + headRadius * 0.3,
                                headY + headRadius * 0.3,
                                headRadius * 0.5,
                                headRadius * 0.4
                            );
                        }
                    }
                }
                break;
                
            case 'hair':
                // 髪の毛を描画
                if (!features.hasHelmet && features.hairStyle !== 'bald') {
                    graphics.fillStyle(features.hairColor, 1);
                    
                    if (features.hairStyle === 'short') {
                        // 短い髪
                        if (direction === 'down') {
                            drawEllipse(
                                graphics,
                                centerX,
                                headY - headRadius * 0.4,
                                headRadius * 1.3,
                                headRadius * 0.7
                            );
                        } else if (direction === 'up') {
                            drawEllipse(
                                graphics,
                                centerX,
                                headY - headRadius * 0.4,
                                headRadius * 1.3,
                                headRadius * 0.7
                            );
                        } else if (direction === 'left') {
                            drawEllipse(
                                graphics,
                                centerX - headRadius * 0.2,
                                headY - headRadius * 0.4,
                                headRadius * 0.8,
                                headRadius * 0.7
                            );
                        } else if (direction === 'right') {
                            drawEllipse(
                                graphics,
                                centerX + headRadius * 0.2,
                                headY - headRadius * 0.4,
                                headRadius * 0.8,
                                headRadius * 0.7
                            );
                        }
                    } else if (features.hairStyle === 'long') {
                        // 長い髪
                        if (direction === 'down') {
                            // 頭頂部
                            drawEllipse(
                                graphics,
                                centerX,
                                headY - headRadius * 0.4,
                                headRadius * 1.3,
                                headRadius * 0.7
                            );
                            
                            // 両サイドの長い髪
                            graphics.fillRect(
                                centerX - headRadius * 1.3,
                                headY - headRadius * 0.4,
                                headRadius * 0.5,
                                bodyHeight
                            );
                            graphics.fillRect(
                                centerX + headRadius * 0.8,
                                headY - headRadius * 0.4,
                                headRadius * 0.5,
                                bodyHeight
                            );
                        } else if (direction === 'up') {
                            // 後ろの長い髪
                            drawEllipse(
                                graphics,
                                centerX,
                                headY - headRadius * 0.2,
                                headRadius * 1.3,
                                headRadius * 0.9
                            );
                            
                            // 背中に垂れる髪
                            graphics.fillRect(
                                centerX - headRadius * 0.8,
                                headY,
                                headRadius * 1.6,
                                bodyHeight * 0.8
                            );
                        } else if (direction === 'left') {
                            // 左向きの長い髪
                            drawEllipse(
                                graphics,
                                centerX - headRadius * 0.2,
                                headY - headRadius * 0.4,
                                headRadius * 0.8,
                                headRadius * 0.7
                            );
                            
                            // 後ろの長い髪
                            graphics.fillRect(
                                centerX + headRadius * 0.5,
                                headY - headRadius * 0.4,
                                headRadius * 0.5,
                                bodyHeight * 0.8
                            );
                        } else if (direction === 'right') {
                            // 右向きの長い髪
                            drawEllipse(
                                graphics,
                                centerX + headRadius * 0.2,
                                headY - headRadius * 0.4,
                                headRadius * 0.8,
                                headRadius * 0.7
                            );
                            
                            // 前の長い髪
                            graphics.fillRect(
                                centerX - headRadius * 1,
                                headY - headRadius * 0.4,
                                headRadius * 0.5,
                                bodyHeight * 0.8
                            );
                        }
                    } else if (features.hairStyle === 'ponytail') {
                        // ポニーテール
                        if (direction === 'down') {
                            // 頭頂部
                            drawEllipse(
                                graphics,
                                centerX,
                                headY - headRadius * 0.4,
                                headRadius * 1.3,
                                headRadius * 0.7
                            );
                            
                            // ポニーテール
                            drawEllipse(
                                graphics,
                                centerX,
                                headY + headRadius * 0.5,
                                headRadius * 0.5,
                                bodyHeight * 0.4
                            );
                        } else if (direction === 'up') {
                            // 頭頂部
                            drawEllipse(
                                graphics,
                                centerX,
                                headY - headRadius * 0.4,
                                headRadius * 1.3,
                                headRadius * 0.7
                            );
                        
                        // 見えないポニーテール
                        } else if (direction === 'left') {
                            // 左向きの頭頂部
                            drawEllipse(
                                graphics,
                                centerX - headRadius * 0.2,
                                headY - headRadius * 0.4,
                                headRadius * 0.8,
                                headRadius * 0.7
                            );
                            
                            // 横から見えるポニーテール
                            drawEllipse(
                                graphics,
                                centerX + headRadius * 0.8,
                                headY,
                                headRadius * 0.5,
                                headRadius * 0.8
                            );
                        } else if (direction === 'right') {
                            // 右向きの頭頂部
                            drawEllipse(
                                graphics,
                                centerX + headRadius * 0.2,
                                headY - headRadius * 0.4,
                                headRadius * 0.8,
                                headRadius * 0.7
                            );
                            
                            // 横から見えるポニーテール
                            drawEllipse(
                                graphics,
                                centerX - headRadius * 0.8,
                                headY,
                                headRadius * 0.5,
                                headRadius * 0.8
                            );
                        }
                    }
                }
                
                // フードがある場合（robed/hooded）
                if (variant === 'hooded' || (variant === 'robed' && customFeatures.hasHood)) {
                    graphics.fillStyle(features.clothColor, 1);
                    
                    if (direction === 'down') {
                        // 前から見たフード
                        graphics.fillCircle(
                        centerX,
                        headY,
                        headRadius * 1.5
                        );
                        
                        // フードの開口部
                        graphics.fillStyle(darkenColor(features.clothColor, 40), 1);
                        graphics.fillCircle(
                        centerX,
                        headY,
                        headRadius * 1.1
                        );
                    } else if (direction === 'up') {
                        // 後ろから見たフード
                        graphics.fillCircle(
                        centerX,
                        headY,
                        headRadius * 1.5
                        );
                    } else if (direction === 'left') {
                        // 左から見たフード
                        graphics.fillRect(
                        centerX - headRadius * 1.5,
                        headY - headRadius * 1.2,
                        headRadius * 3,
                        headRadius * 2.4
                        );
                        
                        // フードの開口部
                        graphics.fillStyle(darkenColor(features.clothColor, 40), 1);
                        graphics.fillCircle(
                        centerX - headRadius * 0.2,
                        headY,
                        headRadius * 1.1
                        );
                    } else if (direction === 'right') {
                        // フードの開口部
                        graphics.fillStyle(darkenColor(features.clothColor, 40), 1);
                        graphics.fillCircle(
                        centerX + headRadius * 0.2,
                        headY,
                        headRadius * 1.1
                        );
                    }
                }

                // アクセサリー（帽子、ヘルメット、その他装飾品）
                if (features.hasHelmet) {
                    // ヘルメット
                    graphics.fillStyle(features.armorColor, 1);
                    
                    if (direction === 'down') {
                        // 前からのヘルメット
                        drawEllipse(
                            graphics,
                            centerX,
                            headY,
                            headRadius * 1.3,
                            headRadius * 1.2
                        );
                        
                        // 詳細表現（ある場合）
                        if (features.details) {
                            // ヘルメットの鼻パーツ
                            graphics.fillStyle(darkenColor(features.armorColor, 20), 1);
                            graphics.fillTriangle(
                            centerX - headRadius * 0.3,
                            headY,
                            centerX + headRadius * 0.3,
                            headY,
                            centerX,
                            headY + headRadius * 0.6
                            );
                            
                            // ヘルメットの装飾
                            graphics.fillStyle(features.accessoryColor, 1);
                            graphics.fillRect(
                            centerX - headRadius * 0.8,
                            headY - headRadius * 0.8,
                            headRadius * 1.6,
                            headRadius * 0.3
                            );
                        }
                    } else if (direction === 'up') {
                        // 後ろからのヘルメット
                        drawEllipse(
                            graphics,
                            centerX,
                            headY,
                            headRadius * 1.3,
                            headRadius * 1.2
                        );
                        
                        // 詳細表現（ある場合）
                        if (features.details) {
                            // ヘルメットの後ろの装飾
                            graphics.fillStyle(darkenColor(features.armorColor, 10), 1);
                            graphics.fillRect(
                            centerX - headRadius * 0.8,
                            headY - headRadius * 0.8,
                            headRadius * 1.6,
                            headRadius * 0.3
                            );
                        }
                    } else if (direction === 'left') {
                        // 左からのヘルメット
                        drawEllipse(
                            graphics,
                            centerX,
                            headY,
                            headRadius * 1.2,
                            headRadius * 1.2
                        );
                    
                        // 詳細表現（ある場合）
                        if (features.details) {
                            // ヘルメットの横の装飾
                            graphics.fillStyle(features.accessoryColor, 1);
                            graphics.fillCircle(
                            centerX + headRadius * 0.3,
                            headY - headRadius * 0.5,
                            headRadius * 0.3
                            );
                        }
                    } else if (direction === 'right') {
                        // 右からのヘルメット
                        drawEllipse(
                            graphics,
                            centerX,
                            headY,
                            headRadius * 1.2,
                            headRadius * 1.2
                        );
                        
                        // 詳細表現（ある場合）
                        if (features.details) {
                            // ヘルメットの横の装飾
                            graphics.fillStyle(features.accessoryColor, 1);
                            graphics.fillCircle(
                            centerX - headRadius * 0.3,
                            headY - headRadius * 0.5,
                            headRadius * 0.3
                            );
                        }
                    }
                } else if (features.hasHat) {
                    // 帽子（ローブのときは魔法使いの帽子）
                    const hatColor = variant === 'robed' ? features.clothColor : features.accessoryColor;
                    graphics.fillStyle(hatColor, 1);
                    
                    if (variant === 'robed') {
                        // 魔法使いの帽子
                        if (direction === 'down') {
                            // 帽子の円錐部分
                            graphics.fillTriangle(
                            centerX - headRadius * 1.0,
                            headY - headRadius * 0.5,
                            centerX + headRadius * 1.0,
                            headY - headRadius * 0.5,
                            centerX,
                            headY - headRadius * 2.5
                            );
                            
                            // 帽子のつば
                            drawEllipse(
                            graphics,
                            centerX,
                            headY - headRadius * 0.5,
                            headRadius * 1.3,
                            headRadius * 0.3
                            );
                            
                            // 帽子の装飾
                            if (features.details) {
                                graphics.fillStyle(features.accessoryColor, 1);
                                graphics.fillCircle(
                                    centerX,
                                    headY - headRadius * 1.5,
                                    headRadius * 0.3
                                );
                            }
                        } else if (direction === 'up') {
                            // 背面からは帽子の後ろ部分
                            graphics.fillTriangle(
                            centerX - headRadius * 1.0,
                            headY - headRadius * 0.5,
                            centerX + headRadius * 1.0,
                            headY - headRadius * 0.5,
                            centerX,
                            headY - headRadius * 2.5
                            );
                            
                            // 帽子のつば
                            drawEllipse(
                            graphics,
                            centerX,
                            headY - headRadius * 0.5,
                            headRadius * 1.3,
                            headRadius * 0.3
                            );
                        } else if (direction === 'left' || direction === 'right') {
                            // 横向きの魔法使いの帽子
                            const dirMod = direction === 'left' ? -1 : 1;
                            
                            // 帽子の円錐部分（横から見ると曲がっている）
                            graphics.beginPath();
                            graphics.moveTo(centerX, headY - headRadius * 0.5);
                            graphics.quadraticCurveTo(
                            centerX + dirMod * headRadius * 1.0,
                            headY - headRadius * 1.5,
                            centerX + dirMod * headRadius * 0.5,
                            headY - headRadius * 2.5
                            );
                            graphics.lineTo(centerX, headY - headRadius * 0.5);
                            graphics.fillPath();
                            
                            // 帽子のつば（楕円形）
                            drawEllipse(
                            graphics,
                            centerX,
                            headY - headRadius * 0.5,
                            headRadius * 0.8,
                            headRadius * 0.3
                            );
                        } else {
                            // 一般的な帽子
                            if (direction === 'down') {
                                // 帽子の上部
                                drawEllipse(
                                graphics,
                                centerX,
                                headY - headRadius * 0.8,
                                headRadius * 1.2,
                                headRadius * 0.5
                                );
                                
                                // 帽子のつば
                                drawEllipse(
                                graphics,
                                centerX,
                                headY - headRadius * 0.5,
                                headRadius * 1.5,
                                headRadius * 0.2
                                );
                            } else if (direction === 'up') {
                                // 背面から見た帽子
                                drawEllipse(
                                graphics,
                                centerX,
                                headY - headRadius * 0.8,
                                headRadius * 1.2,
                                headRadius * 0.5
                                );
                                
                                // 帽子のつば
                                drawEllipse(
                                graphics,
                                centerX,
                                headY - headRadius * 0.5,
                                headRadius * 1.5,
                                headRadius * 0.2
                                );
                            } else if (direction === 'left' || direction === 'right') {
                                // 横向きの帽子
                                const dirMod = direction === 'left' ? -1 : 1;
                                
                                // 帽子の上部
                                drawEllipse(
                                graphics,
                                centerX + dirMod * headRadius * 0.2,
                                headY - headRadius * 0.8,
                                headRadius * 0.8,
                                headRadius * 0.5
                                );
                                
                                // 帽子のつば（前または後ろに突き出た部分）
                                graphics.fillRect(
                                centerX - dirMod * headRadius * 0.8,
                                headY - headRadius * 0.6,
                                headRadius * 1.0,
                                headRadius * 0.2
                                );
                            }
                        }
                    }
                
                    // バリアントに基づいた追加アクセサリー
                    if (variant === 'armored' && features.details) {
                        // 鎧の装飾
                        graphics.fillStyle(features.accessoryColor, 1);
                        
                        if (direction === 'down') {
                            // 鎧の紋章
                            graphics.fillCircle(
                                centerX,
                                centerY - bodyHeight * 0.2,
                                bodyWidth * 0.15
                            );
                        }
                    }
                }
                break;
            }
        }
    }

}

Object.assign(PlaceholderAssets.prototype, {
    drawHumanoidCharacter: CharacterDetailPlaceholders.prototype.drawHumanoidCharacter,
});

export default PlaceholderAssets;
//export default CharacterDetailPlaceholders;
