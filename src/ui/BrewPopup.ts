import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/gameConfig';
import { gameStore } from '../stores/gameStore';
import type { CoffeeOrder } from '../systems/OrderSystem';
import coffeeTypesData from '../data/coffeeTypes.json';
import brewMethodsData from '../data/brewMethods.json';

export class BrewPopup extends Phaser.GameObjects.Container {
    private panel: Phaser.GameObjects.Graphics;

    // Internal State
    private brewState = {
        ice: 0,
        milk: 0,
        sugar: 0,
        honey: 0,
        cinnamon: 0,
        roastLevel: 50,
        brewMethod: 'pourover',
        coffeeType: 'arabica'
    };

    private targetOrder: CoffeeOrder | null = null;

    // Config
    private readonly panelWidth = 560;
    private readonly panelHeight = 580;

    // Text references to update dynamically
    private countTexts: Record<string, Phaser.GameObjects.Text> = {};
    private roastThumb!: Phaser.GameObjects.Arc;
    private roastLabel!: Phaser.GameObjects.Text;
    private brewMethodLabel!: Phaser.GameObjects.Text;
    private coffeeTypeLabel!: Phaser.GameObjects.Text;

    private brewMethodsList = Object.keys(brewMethodsData);
    private coffeeTypesList = Object.keys(coffeeTypesData);

    constructor(scene: Phaser.Scene) {
        super(scene, GAME_WIDTH / 2, GAME_HEIGHT / 2);

        this.setDepth(20);
        this.setVisible(false);

        // ── 1. Overlay ──
        const overlay = scene.add.rectangle(-GAME_WIDTH / 2, -GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.7)
            .setOrigin(0, 0).setInteractive();

        // ── 2. Panel ──
        this.panel = scene.add.graphics();
        this.panel.fillStyle(0xddccb6, 1);
        this.panel.fillRoundedRect(-this.panelWidth / 2, -this.panelHeight / 2, this.panelWidth, this.panelHeight, 16);

        // Title
        const popupTitle = scene.add.text(0, -260, 'Brewing Station', {
            fontFamily: 'Georgia, serif',
            fontSize: '28px',
            color: '#3a3a5c',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        // ── 3. Close Button ──
        const closeBtn = scene.add.container(this.panelWidth / 2 - 24, -260);
        const closeBg = scene.add.circle(0, 0, 16, 0x884444).setInteractive();
        const closeText = scene.add.text(0, 0, 'X', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        closeBtn.add([closeBg, closeText]);
        closeBg.on('pointerdown', () => this.hide());

        this.add([overlay, this.panel, popupTitle, closeBtn]);

        // ── 4. Top Area: Brew Concoction & Method Selector ──
        const concoctionIcon = scene.add.image(0, -215, 'item_brew_concoction').setScale(0.04);
        this.add(concoctionIcon);
        this.createCycleSelector(scene, 0, -170, this.brewMethodsList, 'brewMethod', 'brewMethodLabel', brewMethodsData);

        // ── 5. Ingredients Generators ──
        const startY = -70;
        const colSpacing = 160;

        // Ice, Milk, Sugar
        this.createStepper(scene, 'ice', 'Ice', 'item_ice', -colSpacing, startY);
        this.createStepper(scene, 'milk', 'Milk', 'item_milk', 0, startY);
        this.createStepper(scene, 'sugar', 'Sugar', 'item_sugar', colSpacing, startY);

        // Honey, Cinnamon
        this.createStepper(scene, 'honey', 'Honey', 'item_honey', -colSpacing / 2, startY + 100);
        this.createStepper(scene, 'cinnamon', 'Cinnamon', 'item_cinnamon', colSpacing / 2, startY + 100);

        // ── 6. Coffee Bean Type & Roast Slider ──
        this.createCycleSelector(scene, 0, startY + 190, this.coffeeTypesList, 'coffeeType', 'coffeeTypeLabel', coffeeTypesData);
        this.createRoastSlider(scene, 0, startY + 260);

        // ── 7. Brew Button ──
        const brewBtn = scene.add.container(0, 255);
        const brewBtnBg = scene.add.rectangle(0, 0, 200, 60, 0x3a754a, 1).setInteractive();
        const brewBtnText = scene.add.text(0, 0, 'BREW!', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        brewBtn.add([brewBtnBg, brewBtnText]);

        brewBtnBg.on('pointerdown', () => this.handleBrew());
        // Add tween feedback
        brewBtnBg.on('pointerdown', () => {
            scene.tweens.add({
                targets: brewBtn,
                scale: 0.95,
                yoyo: true,
                duration: 100
            });
        });

        this.add(brewBtn);
        scene.add.existing(this);
    }

    private createStepper(scene: Phaser.Scene, key: 'ice' | 'milk' | 'sugar' | 'honey' | 'cinnamon', label: string, texture: string, x: number, y: number) {
        const container = scene.add.container(x, y);

        // Icon
        const icon = scene.add.image(0, 0, texture).setScale(0.04); // Assuming icons are large

        // Label
        const labelText = scene.add.text(0, -35, label, {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#3a3a5c'
        }).setOrigin(0.5);

        // Buttons
        const minusBg = scene.add.circle(-40, 30, 16, 0x8888aa).setInteractive();
        const minusTxt = scene.add.text(-40, 30, '-', { fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        const plusBg = scene.add.circle(40, 30, 16, 0x3a754a).setInteractive();
        const plusTxt = scene.add.text(40, 30, '+', { fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        // Value
        const valText = scene.add.text(0, 30, '0', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#3a3a5c',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        this.countTexts[key] = valText;

        minusBg.on('pointerdown', () => {
            if (this.brewState[key] > 0) {
                this.brewState[key]--;
                valText.setText(this.brewState[key].toString());
            }
        });

        plusBg.on('pointerdown', () => {
            if (this.brewState[key] < 5) {
                this.brewState[key]++;
                valText.setText(this.brewState[key].toString());
            }
        });

        container.add([icon, labelText, minusBg, minusTxt, plusBg, plusTxt, valText]);
        this.add(container);
    }

    private createCycleSelector(scene: Phaser.Scene, x: number, y: number, list: string[], stateKey: 'brewMethod' | 'coffeeType', labelTextRef: 'brewMethodLabel' | 'coffeeTypeLabel', dataMap: any) {
        const container = scene.add.container(x, y);

        const leftBg = scene.add.circle(-100, 0, 16, 0x8888aa).setInteractive();
        const leftTxt = scene.add.text(-100, 0, '<', { fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        const label = scene.add.text(0, 0, 'Placeholder', {
            fontFamily: 'monospace',
            fontSize: '20px',
            color: '#3a3a5c',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        this[labelTextRef] = label;

        const rightBg = scene.add.circle(100, 0, 16, 0x8888aa).setInteractive();
        const rightTxt = scene.add.text(100, 0, '>', { fontSize: '20px', color: '#fff', fontStyle: 'bold' }).setOrigin(0.5);

        const updateLabel = (key: string) => {
            label.setText(dataMap[key].name.toUpperCase());
        };

        leftBg.on('pointerdown', () => {
            let idx = list.indexOf(this.brewState[stateKey] as string);
            idx = (idx - 1 + list.length) % list.length;
            (this.brewState as any)[stateKey] = list[idx];
            updateLabel(list[idx]);
        });

        rightBg.on('pointerdown', () => {
            let idx = list.indexOf(this.brewState[stateKey] as string);
            idx = (idx + 1) % list.length;
            (this.brewState as any)[stateKey] = list[idx];
            updateLabel(list[idx]);
        });

        updateLabel(this.brewState[stateKey]);
        container.add([leftBg, leftTxt, label, rightBg, rightTxt]);
        this.add(container);
    }

    private createRoastSlider(scene: Phaser.Scene, x: number, y: number) {
        const container = scene.add.container(x, y);

        // Icon
        const icon = scene.add.image(-180, 0, 'coffee_bean_icon').setScale(0.04);

        // Label
        this.roastLabel = scene.add.text(0, -25, 'Coffee Beans: Medium Roast (50)', {
            fontFamily: 'monospace',
            fontSize: '18px',
            color: '#3a3a5c'
        }).setOrigin(0.5);

        // Track
        const trackWidth = 300;
        const track = scene.add.rectangle(0, 10, trackWidth, 8, 0x8888aa);

        // Thumb
        this.roastThumb = scene.add.circle(0, 10, 14, 0x5c3a21).setInteractive({ draggable: true });

        scene.input.setDraggable(this.roastThumb);

        this.roastThumb.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number, _dragY: number) => {
            // Clamp dragX to track boundaries -> local coordinate system is centered on container
            let clampedX = Math.max(-trackWidth / 2, Math.min(trackWidth / 2, dragX));
            this.roastThumb.x = clampedX;

            // Map X to 0-100 logic
            const percent = (clampedX + trackWidth / 2) / trackWidth;
            this.brewState.roastLevel = Math.floor(percent * 100);

            let descriptive = 'Medium';
            if (this.brewState.roastLevel < 33) descriptive = 'Light';
            else if (this.brewState.roastLevel > 66) descriptive = 'Dark';

            this.roastLabel.setText(`Coffee Beans: ${descriptive} Roast (${this.brewState.roastLevel})`);
        });

        container.add([icon, this.roastLabel, track, this.roastThumb]);
        this.add(container);
    }

    private handleBrew() {
        if (!this.targetOrder) return;

        // Map UI state to CoffeeOrder evaluation struct
        const temperature = this.brewState.ice > 0 ? 'iced' : 'hot';
        let roastLevel = 'medium';
        if (this.brewState.roastLevel < 33) roastLevel = 'light';
        else if (this.brewState.roastLevel > 66) roastLevel = 'dark';

        let addons = 'none';
        if (this.brewState.milk > 0) addons = 'milk';
        else if (this.brewState.sugar > 0) addons = 'sugar';
        else if (this.brewState.honey > 0) addons = 'honey';
        else if (this.brewState.cinnamon > 0) addons = 'cinnamon';

        const playerBrew: Partial<CoffeeOrder> = {
            temperature,
            roastLevel,
            addons,
            brewMethod: this.brewState.brewMethod,
            coffeeType: this.brewState.coffeeType
        };

        const requiredBeans = (brewMethodsData as any)[this.brewState.brewMethod]?.beansRequired || 18;
        if (!gameStore.getState().removeBeans(requiredBeans)) {
             this.emit('notEnoughBeans', `Not enough beans!\n\nYou need ${requiredBeans}g of beans to brew a ${this.brewState.brewMethod.toUpperCase()}.\n\nPlease start a new Focus Session to harvest more!`);
             return;
        }

        // Instead of resolving here, emit to launch the Skill Minigame!
        this.emit('startBrewSkill', playerBrew, this.targetOrder);
        this.hide();
    }

    public show(order: CoffeeOrder): void {
        this.targetOrder = order;

        // Reset State
        this.brewState = { ice: 0, milk: 0, sugar: 0, honey: 0, cinnamon: 0, roastLevel: 50, brewMethod: 'pourover', coffeeType: 'arabica' };
        Object.keys(this.countTexts).forEach(key => this.countTexts[key].setText('0'));
        this.roastThumb.x = 0;
        this.roastLabel.setText('Coffee Beans: Medium Roast (50)');
        this.brewMethodLabel.setText(brewMethodsData['pourover'].name.toUpperCase());
        this.coffeeTypeLabel.setText(coffeeTypesData['arabica'].name.toUpperCase());

        // Fade in
        this.setAlpha(0);
        this.setVisible(true);
        this.scene.tweens.add({
            targets: this,
            alpha: 1,
            duration: 200
        });
    }

    private hide(): void {
        // Fade out
        this.scene.tweens.add({
            targets: this,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                this.setVisible(false);
                this.targetOrder = null;
            }
        });
    }
}
