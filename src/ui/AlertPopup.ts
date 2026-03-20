import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';

export class AlertPopup extends Phaser.GameObjects.Container {
    private panel: Phaser.GameObjects.Graphics;
    private titleText: Phaser.GameObjects.Text;
    private messageText: Phaser.GameObjects.Text;
    private readonly panelWidth = 400;
    private readonly panelHeight = 250;

    constructor(scene: Phaser.Scene) {
        super(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2);
        this.setDepth(100);
        this.setVisible(false);

        // 1. Overlay
        const overlay = scene.add.rectangle(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
            .setOrigin(0, 0).setInteractive();

        // 2. Base Panel
        this.panel = scene.add.graphics();
        this.panel.fillStyle(0xddccb6, 1);
        this.panel.fillRoundedRect(-this.panelWidth / 2, -this.panelHeight / 2, this.panelWidth, this.panelHeight, 16);

        // 3. Title
        this.titleText = scene.add.text(0, -this.panelHeight / 2 + 30, 'Notice', {
            fontFamily: 'Georgia, serif',
            fontSize: '26px',
            color: '#884444',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // 4. Message
        this.messageText = scene.add.text(0, -10, 'Message goes here...', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#3a3a5c',
            align: 'center',
            wordWrap: { width: this.panelWidth - 40 }
        }).setOrigin(0.5);

        // 5. OK Button
        const okBtn = scene.add.container(0, this.panelHeight / 2 - 40);
        const okBg = scene.add.rectangle(0, 0, 120, 40, 0x884444, 1).setInteractive();
        const okTxt = scene.add.text(0, 0, 'OK', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        okBtn.add([okBg, okTxt]);

        okBg.on('pointerdown', () => this.hide());

        this.add([overlay, this.panel, this.titleText, this.messageText, okBtn]);
        scene.add.existing(this);
    }

    public show(title: string, message: string): void {
        this.titleText.setText(title);
        this.messageText.setText(message);

        this.setAlpha(0);
        this.setVisible(true);

        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 200
        });
    }

    private hide(): void {
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 150,
            onComplete: () => {
                this.setVisible(false);
            }
        });
    }
}
