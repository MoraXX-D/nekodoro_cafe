import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { gameStore } from '../stores/gameStore';
import { TimerSystem } from '../systems/TimerSystem';
import { TimerPopup } from '../ui/TimerPopup';
import { OrderPopup } from '../ui/OrderPopup';
import { BrewSkillPopup } from '../ui/BrewSkillPopup';
import { BrewPopup } from '../ui/BrewPopup';
import { AlertPopup } from '../ui/AlertPopup';
import { GameStateManager } from '../systems/GameStateManager';

/**
 * GameScene – the main gameplay scene.
 *
 * This is the hub where the player sees their café, cat, plants,
 * Timer popup, order board, interactive gameplay states, and globally looping ambient sound systems.
 */
export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    /* ───────── create ───────── */
    create(): void {
        // ── Background image ──
        const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'cafe_bg');


        // Scale the background to fit the height (600px), which will cover the 800x600 width
        // since the image is 2752x1536 (16:9 aspect ratio).
        const scaleY = GAME_HEIGHT / bg.height;
        bg.setScale(scaleY);

        // ── Title text ──
        this.add
            .text(GAME_WIDTH / 2, 70, ' Nekodoro Café ', {
                fontFamily: 'Georgia, serif',
                fontSize: '48px',
                color: '#f1b86eff',
                stroke: '#984b4bff',
                strokeThickness: 3

            })
            .setOrigin(0.5);

        // ── Subtitle ──
        // this.add
        //     .text(GAME_WIDTH / 2, 80, 'Focus made intresting — start concentrating!', {
        //         fontFamily: 'monospace',
        //         fontSize: '14px',
        //         color: '#44445aff',
        //     })
        //     .setOrigin(0.5);

        // ── Cat idle sprite animation ──
        this.anims.create({
            key: 'cat_idle_anim',
            frames: this.anims.generateFrameNumbers('cat_idle', { start: 0, end: 3 }),
            frameRate: 6,
            repeat: -1,
        });

        const cat = this.add.sprite(740, 370, 'cat_idle');
        cat.setScale(0.45);
        cat.setFlipX(true);
        cat.play('cat_idle_anim');

        // ── Table Foreground ──
        const tableFg = this.add.image(760, 510, 'table_fg');
        tableFg.setScale(0.3); // Use the same scale as the background to align perfectly

        // ── Depth Sorting ──
        bg.setDepth(0);
        cat.setDepth(1);
        tableFg.setDepth(2);

        // ── Top-Left Bean Inventory ──
        this.add.image(40, 40, 'coffee_bean_icon').setScale(0.03).setDepth(4);
        const beanText = this.add.text(70, 30, '0g', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#3a3a5c',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0, 0);

        // Coin Display
        this.add.image(40, 90, 'icon_coin').setOrigin(0.5, 0.5).setScale(0.023).setDepth(4);
        const coinText = this.add.text(70, 80, '0', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#d4af37',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 3
        }).setOrigin(0, 0).setDepth(4);


        //----order board-----
        const orderBoard = this.add.image(150, 440, 'order_board').setScale(0.1).setDepth(4).setInteractive();
        const orderText = this.add.text(150, 430, '0', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5, 0.5).setDepth(4).setScale(0.7);

        // ── Top-Right Start Button ──
        const startBtn = this.add.container(GAME_WIDTH - 100, 60).setDepth(4);
        const startBtnBg = this.add.rectangle(0, 0, 140, 46, 0x4a4a75, 1).setInteractive();
        const startBtnText = this.add.text(0, 0, 'START', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#ffffff'
        }).setOrigin(0.5);
        startBtn.add([startBtnBg, startBtnText]);

        // ── Timer Popup Overlay ──
        const timerPopup = new TimerPopup(this);

        // ── Order Popup Overlay ──
        const orderPopup = new OrderPopup(this);

        // ── Brew Popup Overlay ──
        const brewPopup = new BrewPopup(this);

        // ── Interactions ──
        startBtnBg.on('pointerdown', () => {
            timerPopup.show();
        });

        orderBoard.on('pointerdown', () => {
            orderPopup.show();
        });

        orderPopup.on('orderSelected', (order: any) => {
            brewPopup.show(order);
        });

        // Minigame UI Hookup
        const brewSkillPopup = new BrewSkillPopup(this);
        const alertPopup = new AlertPopup(this);

        brewPopup.on('startBrewSkill', (playerBrew: any, targetOrder: any) => {
            brewSkillPopup.show(playerBrew, targetOrder);
        });

        brewPopup.on('notEnoughBeans', (message: string) => {
            alertPopup.show('Out of Beans!', message);
        });

        // ── Logic Systems ──
        const timerSystem = new TimerSystem();
        timerSystem.init();

        // ── System Bootloaders ──
        GameStateManager.init();

        // ── Global Audio Layer ──
        if (!this.sound.get('bgm')) {
             this.sound.play('bgm', { volume: 0.5, loop: true });
        }

        // 2-Minute Randomized Cat Meow Ambiance
        this.time.addEvent({
            delay: 120000,
            callback: () => {
                this.sound.play('catMeow', { volume: 0.3 });
            },
            loop: true
        });

        // ── Store UI Binding ──
        const unsub = gameStore.subscribe((state, prevState) => {
            // Check Timer Complete Sound Trigger
            if (state.timerState === 'completed' && prevState.timerState === 'running') {
                this.sound.play('completeTimer', { volume: 0.8 });
            }

            // Hide main START button if timer is running
            startBtn.setVisible(state.timerState !== 'running');
            // Update bean grams
            beanText.setText(`${state.beanGrams}g`);
            // Update active orders count
            orderText.setText(`${state.activeOrders.length}`);
            // Update coins
            coinText.setText(`${state.coins}`);
        });

        // Initialize Store State Tracking
        const initialState = gameStore.getState();
        startBtn.setVisible(initialState.timerState !== 'running');
        beanText.setText(`${initialState.beanGrams}g`);
        orderText.setText(`${initialState.activeOrders.length}`);
        coinText.setText(`${initialState.coins}`);

        // Cleanup on scene shutdown
        this.events.on('shutdown', () => {
            timerSystem.destroy();
            unsub();
        });
    }
}
