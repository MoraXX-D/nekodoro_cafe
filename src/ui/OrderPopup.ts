import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { gameStore } from '../stores/gameStore';


export class OrderPopup extends Phaser.GameObjects.Container {
    private unsubStore: () => void;
    private ordersContainer: Phaser.GameObjects.Container;
    private panel: Phaser.GameObjects.Graphics;
    
    // Config values
    private readonly panelWidth = 500;
    private readonly panelHeight = 560;
    
    // Scroll properties
    private maxScroll: number = 0;
    private readonly startYOffset: number;
    private scrollThumb: Phaser.GameObjects.Graphics;

    constructor(scene: Phaser.Scene) {
        super(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2);

        this.setDepth(15);
        this.setVisible(false);
        this.startYOffset = -this.panelHeight / 2 + 80;

        // ── 1. Fullscreen Dark Overlay ──
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
        this.panel = scene.add.graphics();
        this.panel.fillStyle(0xddccb6, 1);
        this.panel.fillRoundedRect(-this.panelWidth / 2, -this.panelHeight / 2, this.panelWidth, this.panelHeight, 16);

        // Make panel interactive for scroll capture
        const zone = scene.add.zone(-this.panelWidth / 2, -this.panelHeight / 2, this.panelWidth, this.panelHeight)
            .setOrigin(0, 0)
            .setInteractive();

        // Title
        const popupTitle = scene.add.text(0, -this.panelHeight / 2 + 30, 'Customer Orders', {
            fontFamily: 'Georgia, serif',
            fontSize: '28px',
            color: '#3a3a5c',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // ── 3. The Close "X" Button ──
        const closeBtn = scene.add.container(this.panelWidth / 2 - 24, -this.panelHeight / 2 + 24);
        const closeBg = scene.add.circle(0, 0, 16, 0x884444).setInteractive();
        const closeText = scene.add.text(0, 0, 'X', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        closeBtn.add([closeBg, closeText]);

        closeBg.on('pointerdown', () => this.setVisible(false));

        // ── 4. Scrollable Container ──
        this.ordersContainer = scene.add.container(0, this.startYOffset);
        
        // Geometry Mask
        const maskShape = scene.make.graphics({});
        maskShape.fillStyle(0xffffff);
        // Position globally for the mask
        const globalX = GAME_WIDTH / 2 - this.panelWidth / 2;
        const globalY = GAME_HEIGHT / 2 - this.panelHeight / 2 + 60;
        maskShape.fillRoundedRect(globalX, globalY, this.panelWidth, this.panelHeight - 70, 16);
        this.ordersContainer.setMask(maskShape.createGeometryMask());

        // ── Scrollbar ──
        this.scrollThumb = scene.add.graphics();

        this.add([overlay, this.panel, zone, popupTitle, closeBtn, this.ordersContainer, this.scrollThumb]);
        scene.add.existing(this);

        // ── Scrolling Logic ──
        zone.on('wheel', (_pointer: Phaser.Input.Pointer, _deltaX: number, deltaY: number, _deltaZ: number) => {
            this.ordersContainer.y -= deltaY;
            this.clampScroll();
        });

        let dragStartY = 0;
        let initialContainerY = 0;
        zone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
            dragStartY = pointer.y;
            initialContainerY = this.ordersContainer.y;
        });

        zone.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!pointer.isDown) return;
            const deltaY = pointer.y - dragStartY;
            this.ordersContainer.y = initialContainerY + deltaY;
            this.clampScroll();
        });

        // ── Setup Zustand Subscription ──
        this.unsubStore = gameStore.subscribe((state, prevState) => {
            if (state.activeOrders.length !== prevState.activeOrders.length) {
                this.renderOrders(scene);
            }
        });
        
        // Initial render
        this.renderOrders(scene);

        scene.events.once('shutdown', () => {
            if (this.unsubStore) this.unsubStore();
        });
    }

    private clampScroll(): void {
        const minY = this.startYOffset - this.maxScroll;
        const maxY = this.startYOffset;
        
        if (this.ordersContainer.y < minY) this.ordersContainer.y = minY;
        if (this.ordersContainer.y > maxY) this.ordersContainer.y = maxY;

        this.updateScrollbar();
    }

    private updateScrollbar(): void {
        this.scrollThumb.clear();
        
        if (this.maxScroll <= 0) return; // No scroll needed

        const trackHeight = this.panelHeight - 80;
        const thumbHeight = Math.max(40, trackHeight * (trackHeight / (trackHeight + this.maxScroll)));
        
        // Percentage scrolled (0 to 1)
        const scrollPercent = (this.startYOffset - this.ordersContainer.y) / this.maxScroll;
        
        const thumbY = -this.panelHeight / 2 + 65 + (trackHeight - thumbHeight) * scrollPercent;
        
        this.scrollThumb.fillStyle(0x8888aa, 0.8);
        this.scrollThumb.fillRoundedRect(this.panelWidth / 2 - 12, thumbY, 6, thumbHeight, 3);
    }

    public show(): void {
        this.setVisible(true);
        this.clampScroll(); // reset formatting
    }

    private renderOrders(scene: Phaser.Scene): void {
        const state = gameStore.getState();
        this.ordersContainer.removeAll(true);

        if (state.activeOrders.length === 0) {
            const emptyText = scene.add.text(0, 50, 'No active orders...\nKeep farming beans!', {
                fontFamily: 'monospace',
                fontSize: '20px',
                color: '#8888aa',
                align: 'center'
            }).setOrigin(0.5);
            this.ordersContainer.add(emptyText);
            this.maxScroll = 0;
            this.clampScroll();
            return;
        }

        let currentY = 0;
        const cardHeight = 110;
        const cardSpacing = 15;

        state.activeOrders.forEach((order) => {
            const cardBg = scene.add.graphics();
            cardBg.fillStyle(0xffffff, 0.8);
            cardBg.fillRoundedRect(-this.panelWidth / 2 + 20, currentY, this.panelWidth - 50, cardHeight, 8);

            // Interactive zone over the card to catch taps specifically
            const cardZone = scene.add.zone(
                -this.panelWidth / 2 + 20, 
                currentY, 
                this.panelWidth - 50, 
                cardHeight
            ).setOrigin(0, 0).setInteractive();

            cardZone.on('pointerup', (pointer: Phaser.Input.Pointer) => {
                if (pointer.getDistance() < 10) {
                    this.emit('orderSelected', order);
                    this.setVisible(false); // Close this popup when launching brew
                }
            });

            // Add hover cursor using phaser 3 inputs
            cardZone.on('pointerover', () => scene.input.setDefaultCursor('pointer'));
            cardZone.on('pointerout', () => scene.input.setDefaultCursor('default'));

            // Dialogue
            const dialogueText = scene.add.text(-this.panelWidth / 2 + 35, currentY + 15, `"${order.dialogueText}"`, {
                fontFamily: 'Georgia, serif',
                fontSize: '18px',
                color: '#3a3a5c',
                wordWrap: { width: this.panelWidth - 80 }
            });

            // Specs
            const specsStr = `${order.coffeeType} | ${order.brewMethod} | ${order.roastLevel} | ${order.strength} | ${order.temperature} | ${order.addons}`;
            const specs = scene.add.text(-this.panelWidth / 2 + 35, currentY + 75, specsStr, {
                fontFamily: 'monospace',
                fontSize: '12px',
                color: '#4a4a75'
            });

            this.ordersContainer.add([cardBg, dialogueText, specs, cardZone]);
            currentY += cardHeight + cardSpacing;
        });

        // Calculate max scroll depth
        const totalContentHeight = currentY;
        const viewableHeight = this.panelHeight - 80;
        this.maxScroll = Math.max(0, totalContentHeight - viewableHeight);
        
        this.clampScroll();
    }

    destroy(): void {
        if (this.unsubStore) this.unsubStore();
        super.destroy();
    }
}
