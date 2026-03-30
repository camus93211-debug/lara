// Entities.js: 人物、健康、装备等实体模型逻辑

class HealthSystem {
    constructor() { this.stamina = 100; this.nutrition = 100; this.isSick = false; }
    dailyUpdate() {
        this.nutrition = Math.max(0, this.nutrition - 5);
        if (this.nutrition < 40) this.stamina = Math.max(0, this.stamina - 15);
    }
}

class Player {
    constructor(name, trait) {
        this.name = name; 
        this.gold = 50; 
        this.age = 15; 
        this.daysPassed = 0;
        
        this.level = 1;
        this.exp = 0;
        this.maxExp = 100;
        
        this.baseHp = 100; 
        this.baseMp = 50;  
        this.baseStr = 10; 
        this.baseInt = 10; 
        
        if (trait === 'str') { this.baseStr += 10; this.baseHp += 50; }
        if (trait === 'int') { this.baseInt += 10; this.baseMp += 50; }
        if (trait === 'gold') { this.gold += 500; }
        
        this.hp = this.baseHp; 
        this.mp = this.baseMp;
        
        this.healthSystem = new HealthSystem();
        this.careerPath = '平民'; 
        this.careerLevel = 0;     
        this.sect = null; 
        
        this.mapX = 50; this.mapY = 50; this.btlX = 0; this.btlY = 0; 
        this.inventory = []; 
        this.equipment = { weapon: null, armor: null }; 
        this.activeQuest = null; 
        this.martialArts = []; // 玩家已学的武学库
    }

    // --- 叠加计算：基础 + 装备 + 职业 + 门派 + 所有已学武学 ---
    get maxHp() { 
        let bonus = this.equipment.armor ? this.equipment.armor.bonus : 0;
        this.martialArts.forEach(m => bonus += m.hp);
        return this.baseHp + bonus; 
    }
    get maxMp() { 
        let bonus = 0;
        this.martialArts.forEach(m => bonus += m.mp);
        return this.baseMp + bonus; 
    }
    get strength() { 
        let bonus = (this.careerPath === '武将' && this.careerLevel > 0) ? Data.CAREERS['武将'][this.careerLevel-1].bonusStr : 0;
        bonus += (this.equipment.weapon ? this.equipment.weapon.bonus : 0); 
        this.martialArts.forEach(m => bonus += m.str);
        return this.baseStr + bonus; 
    }
    get intelligence() { 
        let bonus = (this.careerPath === '书生' && this.careerLevel > 0) ? Data.CAREERS['书生'][this.careerLevel-1].bonusInt : 0;
        if (this.careerPath === '商人' && this.careerLevel > 0) bonus = Data.CAREERS['商人'][this.careerLevel-1].bonusInt;
        this.martialArts.forEach(m => bonus += m.int);
        return this.baseInt + bonus; 
    }

    get currentTitle() {
        let prefix = this.sect ? `【${Data.SECTS.find(s=>s.id===this.sect).name}】` : "";
        if (this.careerLevel === 0 || this.careerPath === '平民') return prefix + '布衣平民';
        return prefix + Data.CAREERS[this.careerPath][this.careerLevel - 1].title;
    }

    get currentSeason() { return ['🌸春', '☀️夏', '🍁秋', '❄️冬'][Math.floor((this.daysPassed % 360) / 90)]; }

    learnSkill(skillName) {
        let skill = Data.MARTIAL_ARTS.find(m => m.name === skillName);
        if (skill && !this.martialArts.find(m => m.name === skill.name)) {
            this.martialArts.push(skill);
            window.dispatchEvent(new CustomEvent('logMessage', { detail: `🌟 醍醐灌顶！领悟了${skill.tier}阶武学【${skill.name}】，属性永久提升！` }));
            // 学会武功自动满血蓝，当做奖励
            this.hp = this.maxHp; this.mp = this.maxMp;
            return true;
        }
        return false;
    }

    gainExp(amount) {
        this.exp += amount;
        window.dispatchEvent(new CustomEvent('logMessage', { detail: `✨ 阅历提升了 ${amount} 点。` }));
        while (this.exp >= this.maxExp) { this.levelUp(); }
    }

    levelUp() {
        this.level++;
        this.exp -= this.maxExp;
        this.maxExp = Math.floor(this.maxExp * 1.6); 
        this.baseHp += 20; this.baseStr += 3; this.baseInt += 3;
        this.hp = this.maxHp; 
        window.dispatchEvent(new CustomEvent('logMessage', { detail: `🎉 境界突破！当前人物等级：<b>${this.level}</b>。` }));
    }

    passOneDay(days = 1) {
        let oldSeason = this.currentSeason;
        this.daysPassed += days;
        for(let i = 0; i < days; i++) this.healthSystem.dailyUpdate();
        if (this.daysPassed >= 360) { this.age += 1; this.daysPassed -= 360; window.dispatchEvent(new CustomEvent('logMessage', { detail: `🎊 岁月如梭，你今年 <b>${this.age}</b> 岁了。` })); }
        if (oldSeason !== this.currentSeason) window.dispatchEvent(new CustomEvent('logMessage', { detail: `⏳ 时节交替，目前已是 <b>${this.currentSeason}</b> 季。` })); 
        if(this.careerLevel > 0 && this.careerPath !== '平民') {
            let salary = Data.CAREERS[this.careerPath][this.careerLevel-1].salary;
            if(salary > 0 && this.daysPassed % 30 === 0) {
                this.gold += salary;
                window.dispatchEvent(new CustomEvent('logMessage', { detail: `💰 朝廷发放了作为【${this.currentTitle}】的月俸禄 ${salary * 30} 文。` }));
            }
        }
    }

    addItem(itemObj) { let existing = this.inventory.find(i => i.name === itemObj.name); if(existing) existing.count++; else { itemObj.count = 1; this.inventory.push(itemObj); } }
    equipItem(itemName) {
        let itemIndex = this.inventory.findIndex(i => i.name === itemName);
        if(itemIndex > -1) {
            let item = this.inventory[itemIndex];
            if (item.type === 'weapon') this.equipment.weapon = item;
            if (item.type === 'armor') this.equipment.armor = item;
            window.dispatchEvent(new CustomEvent('logMessage', { detail: `🗡️ 装备上了 [${item.name}]。` }));
        }
    }

    static rebuildFromSave(saveData) {
        let newPlayer = new Player(saveData.name, 'none'); 
        Object.assign(newPlayer, saveData); 
        let newHealth = new HealthSystem();
        Object.assign(newHealth, saveData.healthSystem);
        newPlayer.healthSystem = newHealth;
        return newPlayer;
    }
}

let myPlayer = null; 
let currentEnemy = null;