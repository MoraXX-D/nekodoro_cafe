import coffeeTypesData from '../data/coffeeTypes.json';
import brewMethodsData from '../data/brewMethods.json';
import orderRulesData from '../data/orderRules.json';
import economyMultipliersData from '../data/economyMultipliers.json';
import customerOrdersData from '../data/customerOrders.json';

export interface CoffeeOrder {
    id: string;
    coffeeType: string;
    brewMethod: string;
    roastLevel: string;
    strength: string;
    temperature: string;
    addons: string;
    dialogueText: string;
}

export class OrderSystem {

    /** Helper to pick a random element from an array */
    private static pickRandom<T>(arr: T[]): T {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    /** 
     * 1 & 2. Generates an NPC order dynamically while respecting JSON rule configurations
     */
    public static generateRandomOrder(): CoffeeOrder {
        const brewKeys = Object.keys(brewMethodsData);
        const coffeeKeys = Object.keys(coffeeTypesData);
        
        // Pick base method and beans
        const brewMethod = this.pickRandom(brewKeys);
        const coffeeType = this.pickRandom(coffeeKeys);
        
        // Grab constraints
        const rules = (orderRulesData.brewMethods as any)[brewMethod];
        
        // Pick compatible temperature and roast based on rules map
        const temperature = this.pickRandom(rules.allowedTemperatures) as string;
        const roastLevel = this.pickRandom(rules.allowedRoasts) as string;
        
        // Pick unconstrained properties
        const strength = this.pickRandom(orderRulesData.validStrengths) as string;
        const addons = this.pickRandom(orderRulesData.validAddons) as string;

        // Map to a dialogue template
        let dialogueText = this.pickRandom(customerOrdersData.templates) as string;
        dialogueText = dialogueText.replace('{{temperature}}', temperature);
        dialogueText = dialogueText.replace('{{brewMethod}}', (brewMethodsData as any)[brewMethod].name);
        dialogueText = dialogueText.replace('{{coffeeType}}', (coffeeTypesData as any)[coffeeType].name);
        dialogueText = dialogueText.replace('{{roastLevel}}', roastLevel);
        dialogueText = dialogueText.replace('{{strength}}', strength);
        dialogueText = dialogueText.replace('{{addons}}', addons);

        return {
            id: `order_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            coffeeType,
            brewMethod,
            roastLevel,
            strength,
            temperature,
            addons,
            dialogueText
        };
    }

    /** Helper to generate multiple orders */
    public static generateMultipleOrders(min: number, max: number): CoffeeOrder[] {
        const count = Math.floor(Math.random() * (max - min + 1)) + min;
        const orders: CoffeeOrder[] = [];
        for (let i = 0; i < count; i++) {
            orders.push(this.generateRandomOrder());
        }
        return orders;
    }

    /** 
     * 3 & 4. Validates player brew against the order yielding a 0-100 score and satisfaction tier.
     */
    public static calculateOrderScore(playerBrew: Partial<CoffeeOrder>, npcOrder: CoffeeOrder): { score: number, satisfaction: string } {
        let score = 0;
        
        if (playerBrew.brewMethod === npcOrder.brewMethod) score += economyMultipliersData.scoring.brewMethod;
        if (playerBrew.coffeeType === npcOrder.coffeeType) score += economyMultipliersData.scoring.coffeeType;
        if (playerBrew.roastLevel === npcOrder.roastLevel) score += economyMultipliersData.scoring.roastLevel;
        if (playerBrew.temperature === npcOrder.temperature) score += economyMultipliersData.scoring.temperature;
        if (playerBrew.addons === npcOrder.addons) score += economyMultipliersData.scoring.addons;

        let satisfaction = 'badMatch';
        if (score >= 90) satisfaction = 'perfectMatch';
        else if (score >= 70) satisfaction = 'goodMatch';
        else if (score >= 50) satisfaction = 'normalMatch';

        return { score, satisfaction };
    }

    /** 
     * 5. Coin Reward Calculation
     */
    public static calculateCoins(beansUsed: number, blendType: string, playerBrew: Partial<CoffeeOrder>, satisfaction: string, skillMultiplier: number = 1.0): number {
        const baseReward = beansUsed * economyMultipliersData.baseRewardMultiplier;
        
        const brewMult = (brewMethodsData as any)[playerBrew.brewMethod!]?.multiplier || 1.0;
        const coffeeMult = (coffeeTypesData as any)[playerBrew.coffeeType!]?.multiplier || 1.0;
        const blendMult = (economyMultipliersData.blends as any)[blendType] || 1.0;
        const satisfactionMult = (economyMultipliersData.satisfaction as any)[satisfaction] || 1.0;
        
        return Math.floor(baseReward * brewMult * coffeeMult * blendMult * satisfactionMult * skillMultiplier);
    }
}
