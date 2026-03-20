import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { gameStore } from '../stores/gameStore';

export class TimerPopup extends Phaser.GameObjects.Container {
    private plantSprite: Phaser.GameObjects.Sprite;
    private timerText: Phaser.GameObjects.Text;
    private startSessionBtnBg: Phaser.GameObjects.Rectangle;
    private startSessionBtnText: Phaser.GameObjects.Text;
    private harvestBtnBg: Phaser.GameObjects.Rectangle;
    private harvestBtnText: Phaser.GameObjects.Text;
    private popupTitle: Phaser.GameObjects.Text;
    private closeBtn: Phaser.GameObjects.Container;
    private unsubStore: () => void;

    constructor(scene: Phaser.Scene) {
        // Place it directly in the center
        super(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2);

        this.setDepth(10);
        this.setVisible(false);

        // ── 1. Fullscreen Dark Overlay ──
        // (Position offset by -WIDTH/2, -HEIGHT/2 to cover the canvas relative to the container center)
        const overlay = scene.add.rectangle(
            -GAME_WIDTH / 2,
            -GAME_HEIGHT / 2,
            GAME_WIDTH,
            GAME_HEIGHT,
            0x000000,
            0.6
        )
        .setOrigin(0, 0)
        .setInteractive(); // Blocks clicks to the game behind it

        // ── 2. The Main Panel ──
        const panelWidth = 360;
        const panelHeight = 400; // Increased height to fit everything
        const panel = scene.add.graphics();
        panel.fillStyle(0xddccb6, 1);
        panel.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);

        // Title
        this.popupTitle = scene.add.text(0, -160, 'Ready to Focus?', {
            fontFamily: 'Georgia, serif',
            fontSize: '26px',
            color: '#3a3a5c'
        }).setOrigin(0.5);

        // ── 3. The Close "X" Button ──
        this.closeBtn = scene.add.container(panelWidth / 2 - 24, -panelHeight / 2 + 24);
        const closeBg = scene.add.circle(0, 0, 16, 0x884444).setInteractive();
        const closeText = scene.add.text(0, 0, 'X', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this.closeBtn.add([closeBg, closeText]);

        // ── 3.5. Alert Modal ──
        const alertOverlay = this.buildAlertOverlay(scene);

        // Close logic
        closeBg.on('pointerdown', () => this.handleClose(alertOverlay));

        // ── 4. The Plant and Timer Elements ──
        // Floating Timer placed above the plant
        this.timerText = scene.add.text(0, -70, '25:00', {
            fontFamily: 'monospace',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#2c2c44',
            strokeThickness: 6,
        }).setOrigin(0.5).setDepth(50);

        // Plant Sprite placed centrally
        this.plantSprite = scene.add.sprite(0, 40, 'arabica_stage1').setScale(0.7).setOrigin(0.5).setDepth(10);

        // ── 5. The Start Session & Harvest Buttons ──
        const btnContainer = scene.add.container(0, 140);
        
        this.startSessionBtnBg = scene.add.rectangle(0, 0, 200, 54, 0x3a754a, 1).setInteractive();
        this.startSessionBtnText = scene.add.text(0, 0, 'Start Session', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.harvestBtnBg = scene.add.rectangle(0, 0, 200, 54, 0x9370db, 1).setInteractive();
        this.harvestBtnText = scene.add.text(0, 0, 'Harvest', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#ffffff'
        }).setOrigin(0.5);

        btnContainer.add([
            this.startSessionBtnBg, this.startSessionBtnText, 
            this.harvestBtnBg, this.harvestBtnText
        ]);

        this.startSessionBtnBg.on('pointerdown', () => {
            const state = gameStore.getState();
            if (state.timerState !== 'running') {
                state.startTimer();
            }
        });

        this.harvestBtnBg.on('pointerdown', () => {
            const state = gameStore.getState();
            if (state.timerState === 'completed') {
                scene.sound.play('harvest', { volume: 0.8 });
                state.harvestBeans();
                this.setVisible(false);
            }
        });

        // ── Assemble Container ──
        this.add([
            overlay,
            panel,
            this.popupTitle,
            this.closeBtn,
            this.plantSprite,
            this.timerText,
            btnContainer
        ]);

        // Add to scene display list
        scene.add.existing(this);

        // ── Setup Zustand Subscription ──
        this.unsubStore = gameStore.subscribe((state, prevState) => this.syncStore(state, prevState));
        this.syncStore(gameStore.getState(), gameStore.getState());
        
        // Clean up store subscription when scene shuts down
        scene.events.once('shutdown', () => {
            if (this.unsubStore) this.unsubStore();
        });
    }

    /** 
     * Builds a custom alert modal for confirming session cancellation 
     */
    private buildAlertOverlay(scene: Phaser.Scene): Phaser.GameObjects.Container {
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        
        const alertContainer = scene.add.container(cx, cy).setDepth(30).setVisible(false);

        // Darker overlay just for the alert, blocking the popup inputs
        const alertDarkBg = scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
            .setOrigin(0.5)
            .setInteractive(); // Blocks clicks

        // Alert Panel
        const alertPanelWidth = 320;
        const alertPanelHeight = 200;
        const alertPanel = scene.add.graphics();
        alertPanel.fillStyle(0xddccb6, 1);
        alertPanel.lineStyle(4, 0x884444, 1); // Red border
        alertPanel.fillRoundedRect(-alertPanelWidth / 2, -alertPanelHeight / 2, alertPanelWidth, alertPanelHeight, 12);
        alertPanel.strokeRoundedRect(-alertPanelWidth / 2, -alertPanelHeight / 2, alertPanelWidth, alertPanelHeight, 12);

        // Alert Text
        const alertTitle = scene.add.text(0, -60, 'Cancel Session?', {
            fontFamily: 'Georgia, serif',
            fontSize: '24px',
            color: '#884444',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const alertDesc = scene.add.text(0, -10, 'You will lose 5 reputation\npoints if you cancel now.', {
            fontFamily: 'monospace',
            fontSize: '16px',
            color: '#3a3a5c',
            align: 'center'
        }).setOrigin(0.5);

        // Buttons
        const noBtnBg = scene.add.rectangle(-70, 50, 100, 40, 0x8888aa, 1).setInteractive();
        const noBtnText = scene.add.text(-70, 50, 'Back', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
        
        const yesBtnBg = scene.add.rectangle(70, 50, 100, 40, 0x884444, 1).setInteractive();
        const yesBtnText = scene.add.text(70, 50, 'Confirm', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);

        alertContainer.add([alertDarkBg, alertPanel, alertTitle, alertDesc, noBtnBg, noBtnText, yesBtnBg, yesBtnText]);

        // Interactions
        noBtnBg.on('pointerdown', () => {
            alertContainer.setVisible(false);
        });

        yesBtnBg.on('pointerdown', () => {
            alertContainer.setVisible(false);
            gameStore.getState().cancelTimer();
            this.setVisible(false); // Close main popup
        });

        return alertContainer;
    }

    /** 
     * Handles when the 'X' button is clicked. 
     */
    private handleClose(alertOverlay: Phaser.GameObjects.Container): void {
        const state = gameStore.getState();

        if (state.timerState === 'running') {
            alertOverlay.setVisible(true);
        } else {
            // Idle or completed, just close safely
            this.setVisible(false);
        }
    }

    /** Expose show method to the Scene */
    public show(): void {
        this.setVisible(true);
    }

    /** Synchronize UI with Zustand gameStore */
    private syncStore(state: ReturnType<typeof gameStore.getState>, prevState: ReturnType<typeof gameStore.getState>): void {
        // Update Timer Text
        const m = Math.floor(state.timerSeconds / 60).toString().padStart(2, '0');
        const s = (state.timerSeconds % 60).toString().padStart(2, '0');
        this.timerText.setText(`${m}:${s}`);

        // Update Plant Image
        if (state.plantStage !== prevState.plantStage || !this.plantSprite.texture.key.includes(state.plantStage.toString())) {
            if (state.plantStage >= 1 && state.plantStage <= 6) {
                this.plantSprite.setTexture(`arabica_stage${state.plantStage}`);
            }
        }

        // Handle State Visuals
        if (state.timerState === 'running') {
            this.popupTitle.setText('Focusing...');
            this.startSessionBtnBg.setVisible(false);
            this.startSessionBtnText.setVisible(false);
            this.harvestBtnBg.setVisible(false);
            this.harvestBtnText.setVisible(false);
        } else if (state.timerState === 'completed') {
            this.popupTitle.setText('Session Complete!');
            this.startSessionBtnBg.setVisible(false);
            this.startSessionBtnText.setVisible(false);
            this.harvestBtnBg.setVisible(true);
            this.harvestBtnText.setVisible(true);
        } else {
            // Idle
            this.popupTitle.setText('Ready to Focus?');
            this.startSessionBtnBg.setVisible(true);
            this.startSessionBtnText.setVisible(true);
            this.harvestBtnBg.setVisible(false);
            this.harvestBtnText.setVisible(false);
        }
    }

    destroy(): void {
        if (this.unsubStore) this.unsubStore();
        super.destroy();
    }
}
