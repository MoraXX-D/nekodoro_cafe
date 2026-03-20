import Phaser from 'phaser';

/**
 * BootScene – the very first scene that runs.
 *
 * Responsibilities:
 *  1. Show a tiny loading indicator.
 *  2. Preload all shared / global assets.
 *  3. Transition to GameScene once loading is complete.
 */
export class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    /* ───────── preload ───────── */
    preload(): void {
        // ── Loading bar ──
        const { width, height } = this.scale;
        const barWidth = 320;
        const barHeight = 24;
        const x = (width - barWidth) / 2;
        const y = height / 2;

        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x3a3a5c, 0.8);
        progressBox.fillRoundedRect(x, y, barWidth, barHeight, 6);

        const progressBar = this.add.graphics();

        const loadingText = this.add.text(width / 2, y - 30, 'Loading…', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#e0c097',
        });
        loadingText.setOrigin(0.5);

        this.load.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0xe0c097, 1);
            progressBar.fillRoundedRect(x + 4, y + 4, (barWidth - 8) * value, barHeight - 8, 4);
        });

        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });

        // ── Preload global assets ──
        this.load.image('cafe_bg', 'assets/sprites/ui/cafe_background.png');
        this.load.image('table_fg', 'assets/sprites/ui/TableForeground.png');
        this.load.spritesheet('cat_idle', 'assets/sprites/characters/cat/cat_idle_animationv2.png', {
            frameWidth: 500,
            frameHeight: 500,
        });

        // ── Preload Plant Sprites & Icons ──
        this.load.image('coffee_bean_icon', 'assets/icons/coffeeBeanIcon.png');
        this.load.image('icon_coin', 'assets/icons/coin.png');
        this.load.image('item_ice', 'assets/sprites/items/IceCube.png');
        this.load.image('item_cinnamon', 'assets/sprites/items/cinnamon.png');
        this.load.image('item_honey', 'assets/sprites/items/honey.png');
        this.load.image('item_milk', 'assets/sprites/items/milk.png');
        this.load.image('item_sugar', 'assets/sprites/items/sugar.png');
        this.load.image('item_brew_concoction', 'assets/sprites/items/brewConcoction.png');
        this.load.spritesheet('anim_brewing', 'assets/sprites/brewing/brewing.png', {
            frameWidth: 500,
            frameHeight: 500
        });

        // ── Preload Audio ──
        this.load.audio('bgm', 'assets/audio/background/purrplecat-hope-501204.ogg');
        this.load.audio('catMeow', 'assets/audio/Ui/catMeow.wav');
        this.load.audio('coinCollect', 'assets/audio/Ui/coinCollect.wav');
        this.load.audio('completeTimer', 'assets/audio/Ui/completeTimer.wav');
        this.load.audio('harvest', 'assets/audio/Ui/harvest.wav');
        
        for (let i = 1; i <= 6; i++) {
            // Using template literal for stage1.png to stage6.png
            this.load.image(`arabica_stage${i}`, `assets/sprites/plants/arabica/stage${i}.png`);
        }

        //order board
        this.load.image('order_board', 'assets/icons/orderBoardV2.png');
    }

    /* ───────── create ───────── */
    create(): void {
        this.scene.start('GameScene');
    }
}
