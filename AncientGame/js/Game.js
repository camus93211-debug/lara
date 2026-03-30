// Game.js: 游戏主循环引擎与控制器

const Game = {
    state: 'CREATE', 
    BATTLE_SIZE: 5, 

    init: function() { UI.switchPanel('panel-creation'); },

    startGame: function() {
        let name = document.getElementById('char-name').value || "无名氏";
        let trait = document.querySelector('input[name="trait"]:checked').value;
        myPlayer = new Player(name, trait);
        Data.currentMapData = Data.generateChinaMap();
        
        UI.log(`📜 【${myPlayer.name}】踏入了这片神州大地...`);
        document.getElementById('panel-creation').classList.add('hidden'); 
        
        this.state = 'MAP';
        UI.switchPanel('panel-map');
        UI.updateAll(this.state, this.BATTLE_SIZE);
    },

    gameOver: function(reason) {
        UI.log(`<strong style="color:red; font-size:16px;">💀 ${reason} 你的一生就此落幕。请刷新页面重新开始。</strong>`);
        this.state = 'GAMEOVER';
        UI.switchPanel(null); 
    },

    movePlayer: function(dx, dy) {
        if (this.state !== 'MAP') return;
        const newX = myPlayer.mapX + dx; const newY = myPlayer.mapY + dy;
        if (newX < 0 || newX >= Data.MAP_WIDTH || newY < 0 || newY >= Data.MAP_HEIGHT) return;
        
        const tileType = Data.currentMapData[newY][newX];
        if (tileType === 2) { UI.log("⚠️ 高山险阻，无法通行。"); return; }
        if (tileType === 5) { UI.log("🌊 水流湍急，未觅得船只无法渡河。"); return; }

        myPlayer.mapX = newX; myPlayer.mapY = newY; myPlayer.healthSystem.stamina -= 5; myPlayer.passOneDay(1); 
        
        if (myPlayer.activeQuest && myPlayer.mapX === myPlayer.activeQuest.x && myPlayer.mapY === myPlayer.activeQuest.y) {
            UI.log("🚨 <strong style='color:red'>你发现了悬赏告示上的江洋大盗！战斗一触即发！</strong>");
            this.initBattle(true); return;
        }
        
        if (tileType === 1) {
            this.state = 'CITY'; UI.switchPanel('panel-city'); UI.renderCityIdentityUI(); 
            UI.log("🏯 你走入了一座繁华的城池。"); 
        } else if (tileType === 3) {
            this.initBattle(false);
        } else if (tileType === 0 || tileType === 4) {
            let chance = tileType === 4 ? 0.25 : 0.10;
            if(Math.random() < chance) this.triggerRandomEvent(Data.EVENT_POOL);
        }
        UI.updateAll(this.state, this.BATTLE_SIZE);
    },

    takeQuest: function() {
        if (myPlayer.activeQuest) { UI.log("⚠️ 您已经有在身的悬赏了。"); return; }
        let qx, qy, validCoords = false;
        while(!validCoords) {
            qx = Math.max(0, Math.min(Data.MAP_WIDTH-1, myPlayer.mapX + (Math.floor(Math.random()*30)-15)));
            qy = Math.max(0, Math.min(Data.MAP_HEIGHT-1, myPlayer.mapY + (Math.floor(Math.random()*30)-15)));
            let t = Data.currentMapData[qy][qx];
            if(t !== 1 && t !== 2 && t !== 5) validCoords = true;
        }
        myPlayer.activeQuest = { title: "剿灭江洋大盗", x: qx, y: qy, rGold: 200 + myPlayer.level*100, rExp: 150 + myPlayer.level*50 };
        UI.log(`📜 撕下悬赏榜单：请前往 (戊${qx} 亥${qy}) 剿灭流窜的大盗！`);
        UI.updateAll(this.state, this.BATTLE_SIZE);
    },

    cityAction: function(type) {
        if (type === 'rest') {
            if (myPlayer.gold >= 50) { myPlayer.gold -= 50; myPlayer.healthSystem.stamina = 100; myPlayer.hp = myPlayer.maxHp; myPlayer.mp = myPlayer.maxMp; UI.log("🛏️ 歇息恢复全满！"); myPlayer.passOneDay(1); } else UI.log("⚠️ 囊中羞涩！");
        } 
        else if (type === 'buyPotion') {
            if (myPlayer.gold >= 30) { myPlayer.gold -= 30; myPlayer.addItem({ name: '金疮药', type: 'heal', value: 40 }); UI.log("🎒 购买了[金疮药]"); } else UI.log("⚠️ 钱不够！");
        } 
        else if (type === 'buySword') {
            if (myPlayer.gold >= 150) { myPlayer.gold -= 150; myPlayer.addItem({ name: '铁剑', type: 'weapon', bonus: 5 }); UI.log(`🎒 购买了[铁剑]`); } else UI.log("⚠️ 银两不足！");
        }
        UI.updateAll(this.state, this.BATTLE_SIZE);
    },

    // --- 核心：拜访地域门派 ---
    visitSect: function() {
        if (myPlayer.sect) { UI.log(`🏔️ 你已经是【${Data.SECTS.find(s=>s.id===myPlayer.sect).name}】的弟子了。`); return; }
        
        // 关键逻辑：检测玩家当前坐标是否符合门派的地域要求
        let availableSects = Data.SECTS.filter(s => s.check(myPlayer.mapX, myPlayer.mapY, Data.currentMapData[myPlayer.mapY][myPlayer.mapX]));
        
        if (availableSects.length === 0) {
            UI.log("🏔️ 此地并没有隐世门派。你需要根据传闻前往特定的区域（如少林在中原，天山在极北）。");
            return;
        }

        let choices = availableSects.map(s => `<button class="action-btn" onclick="Game.joinSect('${s.id}')">拜入【${s.name}】</button>`).join('');
        choices += `<button style="background:#666; margin-top:10px;" onclick="UI.hideModal(); Game.state='CITY';">离开</button>`;
        this.state = 'EVENT';
        UI.showModal("🏔️ 寻访仙山", "你在此地打探到了隐世宗门的下落。", choices);
    },

    joinSect: function(sectId) {
        let sect = Data.SECTS.find(s => s.id === sectId);
        myPlayer.sect = sect.id;
        UI.log(`🎉 恭喜！你正式成为了【${sect.name}】的弟子！`);
        
        // 门派传授独门绝技
        if (sect.skill) myPlayer.learnSkill(sect.skill);
        
        UI.hideModal(); this.state = 'CITY'; UI.renderCityIdentityUI(); UI.updateAll(this.state, this.BATTLE_SIZE);
    },

    generateNPC: function() {
        let sur = Data.NPC_SURNAMES[Math.floor(Math.random()*Data.NPC_SURNAMES.length)];
        let name = Data.NPC_NAMES[Math.floor(Math.random()*Data.NPC_NAMES.length)];
        let typeInfo = Data.NPC_TYPES[Math.floor(Math.random()*Data.NPC_TYPES.length)];
        this.state = 'EVENT';
        let choices = `<button class="action-btn" onclick="Game.interactNPC('${typeInfo.action}', ${typeInfo.gold})">${typeInfo.action}</button><button style="background:#666;" onclick="UI.hideModal(); Game.state='CITY'; UI.log('你无视了对方。');">无视离开</button>`;
        UI.showModal(`👤 街头偶遇：${sur+name} (${typeInfo.type})`, typeInfo.desc, choices);
    },

    interactNPC: function(action, goldVal) {
        if (action === '施舍') {
            if(myPlayer.gold >= 10) { myPlayer.gold -= 10; myPlayer.gainExp(20); UI.log("💕 施舍了 10 文，获得 20 阅历。"); } else UI.log("⚠️ 囊中羞涩。");
        } else if (action === '切磋') {
            myPlayer.hp -= 20; myPlayer.gainExp(50); UI.log("⚔️ 切磋损失 20 生命，获得 50 阅历。");
        } else if (action === '打劫') {
            if (myPlayer.strength > 30) { myPlayer.gold += goldVal; UI.log(`💰 抢走 ${goldVal} 文钱！`); } else { myPlayer.hp -= 50; UI.log("🤕 被揍了一顿！损失 50 生命。"); }
        }
        UI.hideModal(); this.state = 'CITY'; UI.updateAll(this.state, this.BATTLE_SIZE);
    },

    exitCity: function() { this.state = 'MAP'; UI.switchPanel('panel-map'); UI.log("你踏出了城门，继续游历天下。"); UI.updateAll(this.state, this.BATTLE_SIZE); },

    triggerRandomEvent: function(poolArray) {
        this.state = 'EVENT'; UI.switchPanel(null);
        const evt = poolArray[Math.floor(Math.random() * poolArray.length)];
        UI.showModal(evt.title, evt.desc, evt.choices);
    },

    resolveEvent: function(type, value, msg) {
        if (type === 'gold') myPlayer.gold += value;
        if (type === 'randomSkill') {
            // 随机领悟一本 1-3阶的武学
            let tier1to3 = Data.MARTIAL_ARTS.filter(m => m.tier <= 3);
            let s = tier1to3[Math.floor(Math.random()*tier1to3.length)];
            myPlayer.learnSkill(s.name);
        }
        UI.log(msg); UI.hideModal(); this.state = 'MAP'; UI.switchPanel('panel-map'); UI.updateAll(this.state, this.BATTLE_SIZE);
    },

    useItem: function(itemName) {
        let idx = myPlayer.inventory.findIndex(i => i.name === itemName);
        if(idx > -1 && myPlayer.inventory[idx].type === 'heal') {
            myPlayer.hp = Math.min(myPlayer.maxHp, myPlayer.hp + myPlayer.inventory[idx].value);
            UI.log(`✨ 服用了 [${itemName}]！`);
            myPlayer.inventory[idx].count--; if(myPlayer.inventory[idx].count <= 0) myPlayer.inventory.splice(idx, 1);
            UI.updateAll(this.state, this.BATTLE_SIZE);
        }
    },

    equipItem: function(itemName) { myPlayer.equipItem(itemName); UI.updateAll(this.state, this.BATTLE_SIZE); },

    initBattle: function(isQuestBoss = false) {
        this.state = 'BATTLE'; 
        let scaling = 1 + (myPlayer.level - 1) * 0.2;
        if (isQuestBoss) {
            currentEnemy = { name: "江洋大盗(悬赏)", hp: Math.floor(150 * scaling), str: Math.floor(25 * scaling), color: "#800080", icon: "盗", exp: 0, gold: 0, x: 2, y: 0, isBoss: true };
        } else {
            let t = Data.ENEMY_TYPES[Math.floor(Math.random() * Data.ENEMY_TYPES.length)];
            currentEnemy = { name: t.name, hp: Math.floor(t.hp * scaling), str: Math.floor(t.str * scaling), color: t.color, icon: t.icon, exp: t.exp, gold: t.gold, x: 2, y: 0, isBoss: false };
        }
        UI.switchPanel('panel-battle');
        document.getElementById('enemy-name-display').innerHTML = `⚔️ 遭遇 <b>${currentEnemy.name}</b>！`;
        UI.log(`<strong style='color:${currentEnemy.color};'>⚔️ 强敌拦路！遭遇了 [lv.${myPlayer.level}] ${currentEnemy.name}！</strong>`);
        myPlayer.btlX = 2; myPlayer.btlY = 4; UI.updateAll(this.state, this.BATTLE_SIZE);
    },

    battleAction: function(type, dx=0, dy=0) {
        if (type === 'move') {
            const nx = myPlayer.btlX + dx; const ny = myPlayer.btlY + dy;
            if (nx >= 0 && nx < this.BATTLE_SIZE && ny >= 0 && ny < this.BATTLE_SIZE && !(nx===currentEnemy.x && ny===currentEnemy.y)) {
                myPlayer.btlX = nx; myPlayer.btlY = ny; this.enemyTurn();
            } else { UI.log("⚠️ 无法移动！"); return; }
        } 
        else if (type === 'attack') {
            if (Math.abs(myPlayer.btlX - currentEnemy.x) + Math.abs(myPlayer.btlY - currentEnemy.y) === 1) {
                let dmg = Math.floor(myPlayer.strength * (Math.random()*0.4 + 0.8)); currentEnemy.hp -= dmg;
                UI.log(`🗡️ 白刃战造成 <b>${dmg}</b> 伤害！`);
                if (currentEnemy.hp <= 0) { this.endBattle(true); return; }
                this.enemyTurn();
            } else { UI.log("⚠️ 距离太远！"); return; }
        } 
        else if (type === 'magic') {
            if (myPlayer.mp >= 15) {
                myPlayer.mp -= 15; let dmg = 20 + Math.floor(myPlayer.intelligence * 1.5); currentEnemy.hp -= dmg;
                UI.log(`🔥 内功爆发造成 <b style="color:var(--danger)">${dmg}</b> 伤害！`);
                if (currentEnemy.hp <= 0) { this.endBattle(true); return; }
                this.enemyTurn();
            } else { UI.log("⚠️ 真气不足！"); return; }
        }
        if(this.state !== 'GAMEOVER') UI.updateAll(this.state, this.BATTLE_SIZE);
    },

    enemyTurn: function() {
        if (Math.abs(currentEnemy.x - myPlayer.btlX) + Math.abs(currentEnemy.y - myPlayer.btlY) === 1) {
            let dmg = Math.floor(currentEnemy.str * (Math.random()*0.4 + 0.8)); myPlayer.hp -= dmg;
            UI.log(`<span style='color:${currentEnemy.color};'>🩸 ${currentEnemy.name} 猛击，你承受了 <b>${dmg}</b> 伤害！</span>`);
            if (myPlayer.hp <= 0) { this.gameOver("战死沙场。"); }
        } else {
            if (currentEnemy.x < myPlayer.btlX && currentEnemy.x + 1 < this.BATTLE_SIZE) currentEnemy.x++; 
            else if (currentEnemy.x > myPlayer.btlX && currentEnemy.x - 1 >= 0) currentEnemy.x--;
            else if (currentEnemy.y < myPlayer.btlY && currentEnemy.y + 1 < this.BATTLE_SIZE) currentEnemy.y++; 
            else if (currentEnemy.y > myPlayer.btlY && currentEnemy.y - 1 >= 0) currentEnemy.y--;
        }
    },

    fleeBattle: function() { 
        if (currentEnemy.isBoss) { UI.log("⚠️ 悬赏目标锁定，无法逃跑！"); this.enemyTurn(); UI.updateAll(this.state, this.BATTLE_SIZE); return; }
        if (Math.random() > 0.4) { UI.log("💨 逃跑成功！"); this.endBattle(false); } else { UI.log("⚠️ 逃跑失败！"); this.enemyTurn(); UI.updateAll(this.state, this.BATTLE_SIZE); } 
    },

    endBattle: function(isWin) {
        this.state = 'MAP'; UI.switchPanel('panel-map');
        if (isWin) { 
            if (currentEnemy.isBoss) {
                UI.log(`🎉 <b>斩杀大盗！</b> 获得 ${myPlayer.activeQuest.rGold} 文，${myPlayer.activeQuest.rExp} 阅历！`);
                myPlayer.gold += myPlayer.activeQuest.rGold; myPlayer.gainExp(myPlayer.activeQuest.rExp); myPlayer.activeQuest = null; 
            } else {
                myPlayer.gold += currentEnemy.gold; UI.log(`🎉 战斗胜利！获得 ${currentEnemy.gold} 文。`); 
                myPlayer.gainExp(currentEnemy.exp); Data.currentMapData[myPlayer.mapY][myPlayer.mapX] = 0; 
            }
        } else { myPlayer.mapX = Math.max(0, myPlayer.mapX - 1); }
        UI.updateAll(this.state, this.BATTLE_SIZE);
    },
    
    joinCareer: function(careerName) {
        if (myPlayer.level < 3) { UI.log(`⚠️ 需达到3级才可开启事业。`); return; }
        myPlayer.careerPath = careerName; myPlayer.careerLevel = 1; 
        UI.log(`📜 踏上【${careerName}】之路。`); myPlayer.passOneDay(5); UI.renderCityIdentityUI(); UI.updateAll(this.state, this.BATTLE_SIZE);
    },

    promoteCareer: function() {
        let path = myPlayer.careerPath; let currentLevel = myPlayer.careerLevel; let nextRank = Data.CAREERS[path][currentLevel];
        if (!nextRank) return;
        if (myPlayer.exp < nextRank.reqExp) { UI.log(`⚠️ 阅历不足（需 ${nextRank.reqExp}）。`); return; }
        
        let statCheck = false;
        if (path === '武将') { if (myPlayer.strength >= nextRank.reqStr) statCheck = true; else UI.log(`⚠️ 武勇不足。`); } 
        else if (path === '书生') { if (myPlayer.intelligence >= nextRank.reqInt) statCheck = true; else UI.log(`⚠️ 智谋不足。`); } 
        else if (path === '商人') { if (myPlayer.gold >= nextRank.reqGold) statCheck = true; else UI.log(`⚠️ 通宝不足。`); }

        if (statCheck) {
            myPlayer.careerLevel++; myPlayer.healthSystem.stamina -= 50; 
            UI.log(`🎉 成功晋升为——<b style="color:var(--danger)">【${nextRank.title}】</b>！`);
            myPlayer.passOneDay(10); UI.renderCityIdentityUI(); UI.updateAll(this.state, this.BATTLE_SIZE);
        }
    },

    saveGame: function() {
        localStorage.setItem('ancientRPG_Save_v7', JSON.stringify({ player: myPlayer, map: Data.currentMapData, state: this.state, enemy: currentEnemy }));
        UI.log("<strong style='color:green;'>💾 进度已镌刻于天书。</strong>");
    },
    
    loadGame: function() {
        const saveStr = localStorage.getItem('ancientRPG_Save_v7');
        if (saveStr) {
            const pd = JSON.parse(saveStr); 
            if (pd.state === 'GAMEOVER' || pd.player.hp <= 0) {
                UI.log("⚕️ 神秘高人耗费真元将你救活，取走一半盘缠...");
                pd.player.hp = 10; pd.player.gold = Math.floor(pd.player.gold / 2); pd.state = 'MAP';
            }
            myPlayer = Player.rebuildFromSave(pd.player); Data.currentMapData = pd.map; 
            this.state = pd.state === 'EVENT' ? 'MAP' : pd.state; currentEnemy = pd.enemy;
            document.getElementById('panel-creation').classList.add('hidden'); 
            UI.log("📂 读档成功。"); UI.hideModal(); 
            if (this.state === 'MAP') UI.switchPanel('panel-map');
            if (this.state === 'CITY') { UI.switchPanel('panel-city'); UI.renderCityIdentityUI(); }
            if (this.state === 'BATTLE') UI.switchPanel('panel-battle');
            UI.updateAll(this.state, this.BATTLE_SIZE);
        } else UI.log("⚠️ 未发现存档。");
    }
};

window.onload = () => Game.init();