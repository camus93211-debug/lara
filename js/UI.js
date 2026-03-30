// UI.js: DOM 操作与视图渲染

const UI = {
    log: function(msg) {
        const logDiv = document.getElementById('game-log');
        logDiv.innerHTML += `<div class="log-entry">${msg}</div>`;
        logDiv.scrollTop = logDiv.scrollHeight;
    },

    switchPanel: function(panelId) {
        ['panel-map', 'panel-city', 'panel-battle', 'panel-creation'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden');
        });
        if(panelId) document.getElementById(panelId).classList.remove('hidden');
    },

    showModal: function(title, desc, choicesHtml) {
        document.getElementById('event-modal').classList.remove('hidden');
        document.getElementById('event-title').innerText = title;
        document.getElementById('event-desc').innerHTML = desc;
        document.getElementById('event-choices').innerHTML = choicesHtml;
    },
    hideModal: function() { document.getElementById('event-modal').classList.add('hidden'); },

    // --- 全域地图 Canvas 渲染核心 ---
    showMinimap: function() {
        document.getElementById('minimap-modal').classList.remove('hidden');
        const canvas = document.getElementById('minimap-canvas');
        if (!canvas || !Data.currentMapData.length) return;
        
        const ctx = canvas.getContext('2d');
        const pSize = 3; // 每个格子画 3x3 像素，总计 300x300
        canvas.width = Data.MAP_WIDTH * pSize;
        canvas.height = Data.MAP_HEIGHT * pSize;

        for (let y = 0; y < Data.MAP_HEIGHT; y++) {
            for (let x = 0; x < Data.MAP_WIDTH; x++) {
                let t = Data.currentMapData[y][x];
                if (t === 0) ctx.fillStyle = '#a4b38d'; // 平原
                else if (t === 1) ctx.fillStyle = '#d4a35c'; // 城池
                else if (t === 2) ctx.fillStyle = '#7b8388'; // 高山
                else if (t === 3) ctx.fillStyle = '#a34848'; // 险地
                else if (t === 4) ctx.fillStyle = '#4a6b53'; // 森林
                else if (t === 5) ctx.fillStyle = '#5d97be'; // 水脉
                ctx.fillRect(x * pSize, y * pSize, pSize, pSize);
            }
        }
        
        // 绘制玩家位置的红色准星
        ctx.fillStyle = 'red';
        ctx.beginPath();
        ctx.arc(myPlayer.mapX * pSize + 1.5, myPlayer.mapY * pSize + 1.5, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.stroke();
    },
    hideMinimap: function() { document.getElementById('minimap-modal').classList.add('hidden'); },

    renderCityIdentityUI: function() {
        if(!myPlayer) return;
        const container = document.getElementById('city-identity-actions');
        let html = '';
        
        if (myPlayer.careerLevel === 0) {
            html += `<p style="font-size:13px; text-align:center;">在此城可选择人生道路：</p>`;
            html += `<div class="btn-group" style="grid-template-columns: 1fr 1fr 1fr;">
                        <button onclick="Game.joinCareer('书生')" style="background:#41555d;">考取功名</button>
                        <button onclick="Game.joinCareer('武将')" style="background:#9a3b32;">投军戍边</button>
                        <button onclick="Game.joinCareer('商人')" style="background:#b38b4d; color:#000;">经商贸易</button>
                     </div>`;
        } else {
            let careerObj = Data.CAREERS[myPlayer.careerPath];
            let nextRank = careerObj[myPlayer.careerLevel]; 
            
            html += `<div style="background:rgba(0,0,0,0.05); padding:10px; border:1px dashed #8c7355; margin-bottom:10px;">
                        <b>身份：</b>${myPlayer.careerPath} - 【${myPlayer.currentTitle}】<br>
                        <b>俸禄：</b>${careerObj[myPlayer.careerLevel-1].salary * 30} 文/月
                     </div>`;
            
            if (nextRank) {
                let reqStr = '';
                if(myPlayer.careerPath === '武将') reqStr = `武勇≥${nextRank.reqStr}`;
                else if(myPlayer.careerPath === '书生') reqStr = `智谋≥${nextRank.reqInt}`;
                else reqStr = `通宝≥${nextRank.reqGold}`; 
                
                html += `<button class="action-btn" onclick="Game.promoteCareer()" style="width:100%;">🎖️ 申请晋升：${nextRank.title} (条件: ${reqStr}, 阅历≥${nextRank.reqExp})</button>`;
            } else {
                html += `<p style="color:#9a3b32; font-weight:bold; text-align:center;">🐉 你已达到本领域的权力巅峰！</p>`;
            }
        }
        container.innerHTML = html;
    },
    
    updateAll: function(gameState, BATTLE_SIZE) {
        if(!myPlayer) return;

        document.getElementById('stats-display').innerHTML = `
            <span><b>名讳：</b> ${myPlayer.name} </span> <span><b>时日：</b> ${myPlayer.age}载 ${myPlayer.currentSeason} </span><br>
            <span><b>称号：</b> ${myPlayer.currentTitle} </span> <span><b>通宝：</b> <span style="color:var(--gold)">${myPlayer.gold} 文</span> </span><br>
            <span><b>气血：</b> <span style="color:var(--danger)">${myPlayer.hp} / ${myPlayer.maxHp}</span> </span> <span><b>真气：</b> <span style="color:var(--magic)">${myPlayer.mp} / ${myPlayer.maxMp}</span> </span><br>
            <span><b>武勇：</b> ${Math.floor(myPlayer.strength)} </span> <span><b>智谋：</b> ${Math.floor(myPlayer.intelligence)} </span>
        `;

        const questBox = document.getElementById('quest-display');
        if (myPlayer.activeQuest) {
            questBox.style.display = 'block';
            questBox.innerHTML = `🔥 <b>悬赏：</b> ${myPlayer.activeQuest.title} <br> 📍 <b>目标：</b> (戊${myPlayer.activeQuest.x} 亥${myPlayer.activeQuest.y})`;
        } else { questBox.style.display = 'none'; }

        let expPercent = (myPlayer.exp / myPlayer.maxExp) * 100;
        document.getElementById('exp-bar-fill').style.width = `${expPercent}%`;
        document.getElementById('exp-text').innerText = `境界：第 ${myPlayer.level} 层 (${myPlayer.exp} / ${myPlayer.maxExp})`;

        document.getElementById('equip-weapon').innerText = myPlayer.equipment.weapon ? myPlayer.equipment.weapon.name : "空手";
        document.getElementById('equip-armor').innerText = myPlayer.equipment.armor ? myPlayer.equipment.armor.name : "布衣";

        const invDiv = document.getElementById('inventory-list');
        if(myPlayer.inventory.length === 0) invDiv.innerHTML = '<p style="text-align:center; color:#888; font-size:12px;">行囊空空...</p>';
        else {
            invDiv.innerHTML = myPlayer.inventory.map(item => `
                <div class="inv-item"><span>${item.name} x${item.count}</span><div>
                ${item.type === 'heal' ? `<button onclick="Game.useItem('${item.name}')">服用</button>` : ''}
                ${(item.type === 'weapon' || item.type === 'armor') ? `<button onclick="Game.equipItem('${item.name}')" style="background:#5c6b61; color:#fff">装备</button>` : ''}
                </div></div>
            `).join('');
        }

        // 渲染武学列表
        const skillsDiv = document.getElementById('skills-list');
        if(myPlayer.martialArts.length === 0) skillsDiv.innerHTML = '<p style="text-align:center; color:#888; font-size:12px;">尚未习武...</p>';
        else {
            const tNames = ["","凡阶","良阶","上阶","极阶","神阶"];
            skillsDiv.innerHTML = myPlayer.martialArts.map(m => `
                <div class="skill-item tier-${m.tier}">
                    <b>${m.name}</b> (${tNames[m.tier]}) <br>
                    <span style="font-size:10px; color:#666;">效果: 武+${m.str} 智+${m.int} 血+${m.hp} 气+${m.mp}</span>
                </div>
            `).join('');
        }

        const viewTitle = document.getElementById('view-title');
        const gridContainer = document.getElementById('grid-view');
        gridContainer.innerHTML = ''; 

        if (gameState === 'MAP' || gameState === 'CITY' || gameState === 'EVENT') {
            // viewTitle handled in HTML structure now, we just update the text node if needed
            
            const VIEW_RADIUS = 4; 
            const VIEW_SIZE = VIEW_RADIUS * 2 + 1; 
            
            gridContainer.style.gridTemplateColumns = `repeat(${VIEW_SIZE}, 1fr)`;
            gridContainer.style.gridTemplateRows = `repeat(${VIEW_SIZE}, 1fr)`;
            
            for (let dy = -VIEW_RADIUS; dy <= VIEW_RADIUS; dy++) {
                for (let dx = -VIEW_RADIUS; dx <= VIEW_RADIUS; dx++) {
                    const cell = document.createElement('div');
                    const targetX = myPlayer.mapX + dx;
                    const targetY = myPlayer.mapY + dy;
                    
                    if (targetX < 0 || targetX >= Data.currentMapData[0].length || targetY < 0 || targetY >= Data.currentMapData.length) {
                        cell.className = 'cell boundary'; 
                        cell.innerText = '雾';
                    } else {
                        const type = Data.currentMapData[targetY][targetX];
                        if (type === 0) cell.className = 'cell plains';
                        else if (type === 1) { cell.className = 'cell city'; cell.innerText = '城'; }
                        else if (type === 2) { cell.className = 'cell mountain'; cell.innerText = '山'; }
                        else if (type === 3) { cell.className = 'cell bandit'; cell.innerText = '险'; }
                        else if (type === 4) { cell.className = 'cell forest'; cell.innerText = '林'; }
                        else if (type === 5) { cell.className = 'cell river'; cell.innerText = '水'; }
                        
                        if (myPlayer.activeQuest && targetX === myPlayer.activeQuest.x && targetY === myPlayer.activeQuest.y) {
                            cell.style.boxShadow = "inset 0 0 15px rgba(255,0,0,0.8)";
                            cell.innerText = '🎯';
                        }
                    }

                    if (dx === 0 && dy === 0) { cell.innerHTML += `<div class="entity-avatar player-color">我</div>`; }
                    gridContainer.appendChild(cell);
                }
            }
        } else if (gameState === 'BATTLE') {
            gridContainer.style.gridTemplateColumns = `repeat(${BATTLE_SIZE}, 1fr)`; 
            gridContainer.style.gridTemplateRows = `repeat(${BATTLE_SIZE}, 1fr)`;
            for (let y = 0; y < BATTLE_SIZE; y++) {
                for (let x = 0; x < BATTLE_SIZE; x++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell plains'; 
                    if (myPlayer.btlX === x && myPlayer.btlY === y) cell.innerHTML = `<div class="entity-avatar player-color">我</div>`;
                    if (currentEnemy && currentEnemy.x === x && currentEnemy.y === y) cell.innerHTML += `<div class="entity-avatar" style="background-color:${currentEnemy.color}; color:white;">${currentEnemy.icon}</div>`;
                    gridContainer.appendChild(cell);
                }
            }
        }
    }
};

window.addEventListener('logMessage', (e) => UI.log(e.detail));