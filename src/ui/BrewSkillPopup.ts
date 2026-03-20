import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { gameStore } from '../stores/gameStore';
import { type CoffeeOrder, OrderSystem } from '../systems/OrderSystem';

export class BrewSkillPopup extends Phaser.GameObjects.Container {
    private panel: Phaser.GameObjects.Graphics;
    private targetOrder: CoffeeOrder | null = null;
    private playerBrew: Partial<CoffeeOrder> | null = null;

    private readonly panelWidth = 500;
    private readonly panelHeight = 400;

    // Elements
    private trackContainer: Phaser.GameObjects.Container;
    private cursorThumb: Phaser.GameObjects.Graphics;
    private targetZone: Phaser.GameObjects.Graphics;
    private targetZoneCenter: number = 0;
    private brewBtnBg: Phaser.GameObjects.Rectangle;
    private brewBtnText: Phaser.GameObjects.Text;
    
    // Tween
    private cursorTween: Phaser.Tweens.Tween | null = null;
    private trackWidth = 400;

    // Animation objects
    private animIcon: Phaser.GameObjects.Sprite;
    private animText: Phaser.GameObjects.Text;

    constructor(scene: Phaser.Scene) {
        super(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.setDepth(25);
        this.setVisible(false);

        // 1. Overlay
        const overlay = scene.add.rectangle(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8)
            .setOrigin(0, 0).setInteractive();

        // 2. Base Panel
        this.panel = scene.add.graphics();
        this.panel.fillStyle(0xddccb6, 1);
        this.panel.fillRoundedRect(-this.panelWidth / 2, -this.panelHeight / 2, this.panelWidth, this.panelHeight, 16);

        // Title
        const popupTitle = scene.add.text(0, -this.panelHeight / 2 + 40, 'Brewing Timing!', {
            fontFamily: 'Georgia, serif',
            fontSize: '28px',
            color: '#3a3a5c',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 3. Track Container
        this.trackContainer = scene.add.container(0, 0);
        const trackBg = scene.add.rectangle(0, 0, this.trackWidth, 24, 0x555555, 1);
        
        // Target Zone (Generated dynamically later)
        this.targetZone = scene.add.graphics();
        
        // Cursor
        this.cursorThumb = scene.add.graphics();
        this.cursorThumb.fillStyle(0xffffff, 1);
        this.cursorThumb.fillRect(-4, -18, 8, 36);

        this.trackContainer.add([trackBg, this.targetZone, this.cursorThumb]);

        // 4. Stop Button
        const brewBtn = scene.add.container(0, this.panelHeight / 2 - 60);
        this.brewBtnBg = scene.add.rectangle(0, 0, 200, 60, 0x3a754a, 1).setInteractive();
        this.brewBtnText = scene.add.text(0, 0, 'STOP BREW', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        brewBtn.add([this.brewBtnBg, this.brewBtnText]);

        // Interact
        this.brewBtnBg.on('pointerdown', () => this.handleStop(scene));

        // 5. Post-brew Animation UI
        this.animIcon = scene.add.sprite(0, -10, 'anim_brewing').setScale(0.4).setVisible(false);
        this.animText = scene.add.text(0, 100, 'Brewing...', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#3a754a',
            fontStyle: 'bold'
        }).setOrigin(0.5).setVisible(false);

        this.add([overlay, this.panel, popupTitle, this.trackContainer, brewBtn, this.animIcon, this.animText]);
        scene.add.existing(this);
    }

    public show(playerBrew: Partial<CoffeeOrder>, targetOrder: CoffeeOrder): void {
        this.playerBrew = playerBrew;
        this.targetOrder = targetOrder;

        // Reset UI modes
        this.trackContainer.setVisible(true);
        this.brewBtnBg.setInteractive().setFillStyle(0x3a754a);
        this.brewBtnText.setText('STOP BREW');
        this.animIcon.setVisible(false);
        this.animText.setVisible(false);

        // Generate Target Zone
        this.targetZone.clear();
        
        // Random width: 15% to 25% of track
        const tWidth = this.trackWidth * (0.15 + Math.random() * 0.10);
        // Random center ensuring zone sits entirely inside the track
        const boundsHalf = (this.trackWidth / 2) - (tWidth / 2);
        this.targetZoneCenter = -boundsHalf + (Math.random() * (boundsHalf * 2));
        
        // Draw zone
        this.targetZone.fillStyle(0xffa500, 0.9); // Orange/Yellow
        this.targetZone.fillRect(this.targetZoneCenter - tWidth / 2, -12, tWidth, 24);

        // Slight Glow pulse on target zone (aesthetic feature)
        this.scene.tweens.add({
            targets: this.targetZone,
            alpha: 0.6,
            yoyo: true,
            repeat: -1,
            duration: 500
        });

        // Initialize Cursor Tween
        this.cursorThumb.x = -this.trackWidth / 2;
        this.cursorTween = this.scene.tweens.add({
            targets: this.cursorThumb,
            x: this.trackWidth / 2,
            duration: 800 + Math.random() * 400, // Speed varies per brew
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Fade In
        this.setAlpha(0);
        this.setVisible(true);
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 250
        });
    }

    private handleStop(scene: Phaser.Scene): void {
        if (!this.cursorTween || !this.playerBrew || !this.targetOrder) return;
        
        // 1. Stop Movement and Button interaction
        this.cursorTween.stop();
        this.cursorTween = null;
        this.brewBtnBg.disableInteractive().setFillStyle(0x8888aa);
        
        // Button press feedback tween
        scene.tweens.add({ targets: this.brewBtnBg, scale: 0.95, yoyo: true, duration: 100 });
        
        // 2. Calculate Distance and Multiplier Math
        const distance = Math.abs(this.cursorThumb.x - this.targetZoneCenter);
        const maxDistance = this.trackWidth / 2; // 200
        
        // Score bounds parsing
        let rawMultiplier = 1.5 - (distance / maxDistance);
        const skillMultiplier = Math.max(0.0, Math.min(1.5, rawMultiplier));
        
        // Define Hit Text classification
        let hitText = 'BAD MISS...';
        let hitColor = '#cc4444';
        if (skillMultiplier > 1.4) { hitText = 'PERFECT HIT!'; hitColor = '#ffcc00'; }
        else if (skillMultiplier > 1.1) { hitText = 'GOOD HIT!'; hitColor = '#3a754a'; }
        else if (skillMultiplier > 0.7) { hitText = 'NEAR MISS!'; hitColor = '#8888aa'; }

        // 3. Initiate 3s Brewing Animation Sequence
        this.trackContainer.setVisible(false);
        this.animIcon.setVisible(true);
        this.animText.setVisible(true);
        this.animText.setText(hitText).setColor(hitColor);

        if (!scene.anims.exists('brew_anim_seq')) {
            scene.anims.create({
                key: 'brew_anim_seq',
                frames: scene.anims.generateFrameNumbers('anim_brewing', { start: 0, end: 11 }),
                frameRate: 4, // 12 frames across 3 seconds
                repeat: 0
            });
        }
        
        this.animIcon.play('brew_anim_seq');
        this.animIcon.once('animationcomplete', () => {
            this.resolveOrder(skillMultiplier);
        });
    }

    private resolveOrder(skillMultiplier: number): void {
        if (!this.playerBrew || !this.targetOrder) return;

        // Play Coin SFX
        this.scene.sound.play('coinCollect', { volume: 0.8 });

        // OrderSystem Coin Evaluation
        const { satisfaction } = OrderSystem.calculateOrderScore(this.playerBrew, this.targetOrder);
        const coins = OrderSystem.calculateCoins(18, 'singleBean', this.playerBrew, satisfaction, skillMultiplier);
        
        gameStore.getState().addCoins(coins);
        gameStore.getState().removeOrder(this.targetOrder.id);
        
        // Pop coins up
        const feedback = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, `+${coins} Coins!`, {
            fontFamily: 'monospace',
            fontSize: '40px',
            color: '#ffcc00',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(100);

        this.scene.tweens.add({
            targets: feedback,
            y: GAME_HEIGHT / 2 - 150,
            alpha: 0,
            duration: 2000,
            onComplete: () => feedback.destroy()
        });

        // Hide UI
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                this.setVisible(false);
                this.playerBrew = null;
                this.targetOrder = null;
            }
        });
    }
}
