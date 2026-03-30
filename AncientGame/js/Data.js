// Data.js: 游戏核心资源与配置中心

const Data = {
    MAP_WIDTH: 100,
    MAP_HEIGHT: 100,
    currentMapData: [], 

    // --- 新增：三大武侠门派 ---
    SECTS: [
        { id: 'shaolin', name: '少林寺', desc: '天下武功出少林。加入可强健体魄。', bonusStr: 5, bonusHp: 50 },
        { id: 'wudang', name: '武当派', desc: '内家正宗，绵绵不绝。加入可提升真气与智谋。', bonusInt: 8, bonusMp: 30 },
        { id: 'gaibang', name: '丐帮', desc: '天下第一大帮，弟子遍布神州。加入可获打狗棍。', bonusStr: 2, item: {name:'打狗棍', type:'weapon', bonus: 8} }
    ],

    // --- 新增：随机 NPC 词库 ---
    NPC_SURNAMES: ["赵", "钱", "孙", "李", "周", "吴", "郑", "王", "慕容", "上官", "欧阳"],
    NPC_NAMES: ["天", "地", "风", "云", "龙", "虎", "无忌", "三娘", "铁牛", "逍遥", "雪"],
    NPC_TYPES: [
        { type: "乞丐", desc: "衣衫褴褛，捧着破碗看着你。", action: "施舍", str: 5, hp: 30, gold: 5 },
        { type: "游侠", desc: "背着长剑，目光如电，似乎在寻找切磋的对手。", action: "切磋", str: 25, hp: 120, gold: 100 },
        { type: "富商", desc: "大腹便便，身边带着几个家丁。", action: "打劫", str: 8, hp: 60, gold: 300 }
    ],

    CAREERS: {
        '书生': [
            { level: 1, title: '白丁', reqInt: 0, reqExp: 0, salary: 0, bonusInt: 0 },
            { level: 2, title: '童生', reqInt: 25, reqExp: 100, salary: 5, bonusInt: 2 },
            { level: 3, title: '秀才', reqInt: 40, reqExp: 300, salary: 15, bonusInt: 5 },
            { level: 4, title: '举人', reqInt: 60, reqExp: 800, salary: 30, bonusInt: 8 },
            { level: 5, title: '贡士', reqInt: 90, reqExp: 1500, salary: 60, bonusInt: 12 },
            { level: 6, title: '同进士', reqInt: 130, reqExp: 2500, salary: 100, bonusInt: 15 },
            { level: 7, title: '赐进士', reqInt: 180, reqExp: 4000, salary: 150, bonusInt: 20 },
            { level: 8, title: '探花', reqInt: 250, reqExp: 6000, salary: 300, bonusInt: 30 },
            { level: 9, title: '榜眼', reqInt: 350, reqExp: 9000, salary: 500, bonusInt: 40 },
            { level: 10, title: '状元', reqInt: 500, reqExp: 15000, salary: 1000, bonusInt: 60 } 
        ],
        '武将': [
            { level: 1, title: '乡勇', reqStr: 0, reqExp: 0, salary: 0, bonusStr: 0 },
            { level: 2, title: '伍长', reqStr: 30, reqExp: 150, salary: 10, bonusStr: 3 },
            { level: 3, title: '什长', reqStr: 50, reqExp: 400, salary: 25, bonusStr: 6 },
            { level: 4, title: '百夫长', reqStr: 80, reqExp: 1000, salary: 50, bonusStr: 10 },
            { level: 5, title: '千总', reqStr: 120, reqExp: 2000, salary: 100, bonusStr: 15 },
            { level: 6, title: '偏将', reqStr: 170, reqExp: 3500, salary: 180, bonusStr: 22 },
            { level: 7, title: '牙将', reqStr: 230, reqExp: 5500, salary: 300, bonusStr: 30 },
            { level: 8, title: '参将', reqStr: 300, reqExp: 8000, salary: 500, bonusStr: 40 },
            { level: 9, title: '总兵', reqStr: 400, reqExp: 12000, salary: 800, bonusStr: 55 },
            { level: 10, title: '大将军', reqStr: 600, reqExp: 20000, salary: 1500, bonusStr: 80 } 
        ],
        '商人': [
            { level: 1, title: '走街货郎', reqGold: 0, reqExp: 0, salary: 0, bonusInt: 0 },
            { level: 2, title: '市井坐商', reqGold: 200, reqExp: 100, salary: 20, bonusInt: 2 },
            { level: 3, title: '商铺掌柜', reqGold: 500, reqExp: 300, salary: 50, bonusInt: 5 },
            { level: 4, title: '商行东家', reqGold: 1000, reqExp: 800, salary: 100, bonusInt: 8 },
            { level: 5, title: '地方巨贾', reqGold: 3000, reqExp: 1500, salary: 200, bonusInt: 12 },
            { level: 6, title: '跨州豪商', reqGold: 8000, reqExp: 2500, salary: 400, bonusInt: 18 },
            { level: 7, title: '皇家皇商', reqGold: 20000, reqExp: 4000, salary: 800, bonusInt: 25 },
            { level: 8, title: '天下财神', reqGold: 50000, reqExp: 6000, salary: 1500, bonusInt: 35 },
            { level: 9, title: '富可敌国', reqGold: 100000, reqExp: 9000, salary: 3000, bonusInt: 50 },
            { level: 10, title: '陶朱再世', reqGold: 300000, reqExp: 15000, salary: 8000, bonusInt: 80 }
        ]
    },

    generateChinaMap: function() {
        let map = new Array(this.MAP_HEIGHT).fill(0).map(() => new Array(this.MAP_WIDTH).fill(0));
        
        for (let y = 0; y < this.MAP_HEIGHT; y++) {
            for (let x = 0; x < this.MAP_WIDTH; x++) {
                let randomVal = Math.random();
                if (x < this.MAP_WIDTH * 0.35) { map[y][x] = randomVal > 0.4 ? 2 : 0; } 
                else if (y < this.MAP_HEIGHT * 0.3 && x > this.MAP_WIDTH * 0.5) { map[y][x] = randomVal > 0.4 ? 4 : 0; } 
                else if (x > this.MAP_WIDTH * 0.6 && y > this.MAP_HEIGHT * 0.5) { map[y][x] = randomVal > 0.6 ? 5 : 0; } 
                else { map[y][x] = randomVal > 0.85 ? 4 : 0; }
            }
        }

        for (let i = 0; i < 4; i++) { 
            let newMap = JSON.parse(JSON.stringify(map));
            for (let y = 1; y < this.MAP_HEIGHT - 1; y++) {
                for (let x = 1; x < this.MAP_WIDTH - 1; x++) {
                    let mountainCount = 0, forestCount = 0, waterCount = 0;
                    for(let dy=-1; dy<=1; dy++){
                        for(let dx=-1; dx<=1; dx++){
                            if(dx===0 && dy===0) continue;
                            if(map[y+dy][x+dx] === 2) mountainCount++;
                            if(map[y+dy][x+dx] === 4) forestCount++;
                            if(map[y+dy][x+dx] === 5) waterCount++;
                        }
                    }
                    if (mountainCount >= 4) newMap[y][x] = 2;
                    else if (waterCount >= 4) newMap[y][x] = 5;
                    else if (forestCount >= 4) newMap[y][x] = 4;
                    else if (mountainCount >= 5) newMap[y][x] = 2;
                }
            }
            map = newMap;
        }

        for(let riverY of [Math.floor(this.MAP_HEIGHT*0.4), Math.floor(this.MAP_HEIGHT*0.65)]) {
            let currentY = riverY;
            for(let x = Math.floor(this.MAP_WIDTH * 0.2); x < this.MAP_WIDTH; x++) {
                map[currentY][x] = 5; map[currentY+1][x] = 5; 
                if(Math.random() > 0.6) currentY += (Math.random() > 0.5 ? 1 : -1);
                currentY = Math.max(1, Math.min(this.MAP_HEIGHT-2, currentY));
            }
        }

        for (let y = 2; y < this.MAP_HEIGHT - 2; y++) {
            for (let x = 2; x < this.MAP_WIDTH - 2; x++) {
                if (map[y][x] === 0 && Math.random() < 0.02) map[y][x] = 1;
                if ((map[y][x] === 2 || map[y][x] === 4) && Math.random() < 0.08) map[y][x] = 3;
            }
        }

        map[50][50] = 0; map[49][50] = 1; map[50][49] = 0; map[50][51] = 0;
        return map;
    },

    ENEMY_TYPES: [
        { id: 'bandit', name: "山贼", hp: 60, str: 10, color: "#a52a2a", icon: "贼", exp: 20, gold: 15 },
        { id: 'elite_bandit', name: "悍匪头目", hp: 150, str: 25, color: "#8b0000", icon: "匪", exp: 80, gold: 100 },
        { id: 'tiger', name: "深山猛虎", hp: 200, str: 35, color: "#d35400", icon: "虎", exp: 120, gold: 50 },
        { id: 'assassin', name: "绝命刺客", hp: 80, str: 45, color: "#2c3e50", icon: "刺", exp: 150, gold: 200 }
    ],

    EVENT_POOL: [
        { title: "🌟 古洞遗宝", desc: "你在深林中偶然踏入一个隐蔽的石洞...", choices: `<button class="action-btn" onclick="Game.resolveEvent('gold', 150, '发财了！找到了 150 文钱！')">深入搜索</button>` },
        { title: "⛺ 游商巨贾", desc: "一支商队在此扎营。'朋友，要买把好兵刃防身吗？只要 100 文。'", choices: `<button class="action-btn" onclick="Game.resolveEvent('buyEquip', '精钢剑', '获得了【精钢剑】！')">花 100 文购买</button><button style="background:#666; margin-top:10px;" onclick="Game.resolveEvent('none', 0, '摆手拒绝。')">婉拒</button>` }
        
    ]
};
// 修复：取消初始化生成，改由玩家“踏入江湖”后生成！