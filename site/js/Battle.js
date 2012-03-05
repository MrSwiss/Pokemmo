var moveStartTime = 0;

var BATTLE_WILD = 0;
var BATTLE_TRAINER = 1;

var BATTLE_STEP_TRANSITION = 0;
var BATTLE_STEP_POKEMON_APPEARED_TMP = 1;
var BATTLE_STEP_POKEMON_APPEARED = 2;
var BATTLE_STEP_GO_POKEMON = 3;
var BATTLE_STEP_ACTION_MENU = 4;
var BATTLE_STEP_FIGHT_MENU = 5;
var BATTLE_STEP_TURN = 6;

function initBattle(){
	battle = {};
	battle.text = '';
	battle.textTime = 0;
	battle.textNeedPress = 0;
	battle.step = BATTLE_STEP_TRANSITION;
	battle.renderVars = {};
	battle.resultQueue = [];
	battle.runningQueue = false;
	battle.randInt = Math.floor(Math.random() * 1000);
	battle.startTransition = 0;//Math.floor(Math.random() * 2);
}

function renderBattle(){
	var now = +new Date();
	
	ctx.save();
	ctx.translate(isPhone ? 0 : 160, isPhone ? 0 : 140);
	ctx.lineWidth = 2;
	ctx.strokeStyle = 'rgb(0,0,0)';
	ctx.strokeRect(-1, -1, 482, 226);
	if(battle.background.width != 0){
		ctx.drawImage(battle.background, 0, 0);
	}
	
	if(battle.step != BATTLE_STEP_FIGHT_MENU){
		ctx.drawImage(res.battleTextBackground, 2, 228);
		
		if(battle.text != ''){
			var str = battle.text.slice(0, (now - battle.textTime) / 30);
			
			
			ctx.font = '24px Font2';
			
			
			var maxWidth = (battle.step == BATTLE_STEP_ACTION_MENU ? 150 : 420);
			if(ctx.measureText(str).width > maxWidth){
				var firstLine = str;
				var secondLine = '';
				do{
					var arr = firstLine.split(' ');
					secondLine = arr.pop() + ' ' + secondLine;
					firstLine = arr.join(' ');
				} while(ctx.measureText(firstLine).width > maxWidth);
				
				ctx.fillStyle = 'rgb(104,88,112)';
				ctx.fillText(firstLine, 26, 266);
				ctx.fillText(secondLine, 26, 294);
				ctx.fillText(firstLine, 24, 268);
				ctx.fillText(secondLine, 24, 296);
				ctx.fillText(firstLine, 26, 268);
				ctx.fillText(secondLine, 26, 296);
				
				ctx.fillStyle = 'rgb(255,255,255)';
				ctx.fillText(firstLine, 24, 266);
				ctx.fillText(secondLine, 24, 294);
				
			}else{
				ctx.fillStyle = 'rgb(104,88,112)';
				ctx.fillText(str, 24, 268);
				ctx.fillText(str, 26, 266);
				ctx.fillText(str, 26, 268);
				
				ctx.fillStyle = 'rgb(255,255,255)';
				ctx.fillText(str, 24, 266);
			}
			
			if(str == battle.text){
				if(!battle.textCompleted){
					battle.textCompleted = true;
					battle.textCompletedTime = now;
					
					if(battle.textDelay == 0){
						if(battle.textOnComplete) battle.textOnComplete();
					}else if(battle.textDelay != -1){
						if(battle.textOnComplete) setTimeout(function(){battle.textOnComplete();}, battle.textDelay);
					}else{
						hookAButton(battle.textOnComplete);
					}
					
				}else if(battle.textDelay == -1 && now - battle.textCompletedTime > 100){
					var tmp = Math.floor((now % 1000) / 250);
					if(tmp == 3) tmp = 1;
					tmp *= 2;
					ctx.drawImage(res.battleMisc, 0, 0, 32, 32, 24 + ctx.measureText(str).width, 240 + tmp, 32, 32);
				}
			}
		}
		
		if(battle.step == BATTLE_STEP_ACTION_MENU){
			ctx.drawImage(res.battleActionMenu, 246, 226);
			
			var x1 = 252 + Math.floor((now % 1000) / 500) * 2;
			var y1 = 246;
			var x2 = x1 + 112;
			var y2 = y1 + 30;
			
			switch(battle.selectedAction){
				case 0:
					ctx.drawImage(res.battleMisc, 96, 0, 32, 32, x1, y1, 32, 32);
				break;
				case 1:
					ctx.drawImage(res.battleMisc, 96, 0, 32, 32, x2, y1, 32, 32);
				break;
				case 2:
					ctx.drawImage(res.battleMisc, 96, 0, 32, 32, x1, y2, 32, 32);
				break;
				case 3:
					ctx.drawImage(res.battleMisc, 96, 0, 32, 32, x2, y2, 32, 32);
				break;
			}
			
		}
	}
	
	if(battle.step == BATTLE_STEP_FIGHT_MENU){
		ctx.drawImage(res.battleMoveMenu, 2, 228);
		
		var x1 = 40;
		var y1 = 268;
		
		var n = battle.curPokemon.moves[0].toUpperCase();
		ctx.font = '24px Font2';
		ctx.fillStyle = 'rgb(208,208,208)';
		ctx.fillText(n, x1, y1 + 2);
		ctx.fillText(n, x1 + 2, y1);
		
		ctx.fillStyle = 'rgb(72,72,72)';
		ctx.fillText(n, x1, y1);
		
		ctx.drawImage(res.battleMisc, 96, 0, 32, 32, x1 - 28 + Math.floor((now % 1000) / 500) * 2, y1 - 22, 32, 32);
		
		
		ctx.drawImage(res.types, 0, 24 * TYPE.NORMAL, 64, 24, 390, 284, 64, 24);
	}
	
	if(!battle.renderVars.dontRenderEnemy){
		if(battle.renderVars.enemyFainted){
			if(numRTicks - battle.renderVars.enemyFaintedTick <= 5){
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(290, 30);
				ctx.lineTo(418, 30);
				ctx.lineTo(418, 158);
				ctx.lineTo(290, 158);
				ctx.lineTo(290, 30);
				ctx.clip();
				ctx.drawImage(battle.enemyPokemon.sprite, 290, 30 + (numRTicks - battle.renderVars.enemyFaintedTick) * 30);
				ctx.restore();
			}
		}else{
			ctx.drawImage(battle.enemyPokemon.sprite, 290, 30);
		}
	}
	
	if(battle.step < BATTLE_STEP_GO_POKEMON){
		ctx.drawImage(res.playerBacksprite, 0, 0, 128, 128, 60, 96, 128, 128);
	}else if(battle.step == BATTLE_STEP_GO_POKEMON){
		if(battle.animStep >= 4 && battle.animStep < 25){
			var ballAnimation = [
				[60, 179, 1, 0],
				[62, 175, 1, 0],
				
				[70, 168, 1, 0],
				[75, 165, 1, 0],
				
				[83, 160, 1, 0],
				[86, 160, 1, 0],
				
				[95, 161, 1, 0],
				[97, 164, 1, 0],
				
				[105, 170, 1, 0],
				
				[110, 175, 1, 0],
				[111, 178, 1, 0],
				[113, 183, 1, 0],
				[114, 185, 1, 0],
				[115, 190, 1, 0],
				[117, 192, 1, 0],
				[120, 195, 1, 0, 0.95],
				[123, 200, 1, 1, 0.9],
				[124, 205, 1.05, 1, 0.8],
				[125, 200, 1.1, 1, 0.6],
				[126, 192, 1.15, 1, 0.3],
				[127, 192, 1.2, 1, 0.1]
			];
			
			ctx.save();
			ctx.globalAlpha = ballAnimation[battle.animStep-4][4];
			ctx.translate(ballAnimation[battle.animStep-4][0], ballAnimation[battle.animStep-4][1]);
			ctx.scale(ballAnimation[battle.animStep-4][2], ballAnimation[battle.animStep-4][2]);
			ctx.rotate(battle.animStep / 17 * Math.PI * 2);
			
			ctx.drawImage(res.battlePokeballs, 64, 32 * ballAnimation[battle.animStep-4][3], 32, 32, -16, -16, 32, 32);
			ctx.restore();
		}
		
		if(Math.floor(battle.animStep / 4) < 5){
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(480, 0);
			ctx.lineTo(480, 320);
			ctx.lineTo(0, 320);
			ctx.lineTo(0, 0);
			ctx.clip();
			
			ctx.globalAlpha = clamp(1 - (battle.animStep / 20), 0, 1);
			
			ctx.drawImage(res.playerBacksprite, 128 * Math.floor(battle.animStep / 4), 0, 128, 128, 60 - battle.animStep * 5, 96, 128, 128);
			ctx.restore();
		}
		
		if(battle.animStep > 21 && battle.animStep < 35){
			var perc = Math.min((battle.animStep - 21) / 10, 1);
			
			clearTmpCanvas();
			tmpCtx.save();
			tmpCtx.fillStyle = '#FFFFFF';
			tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
			tmpCtx.globalCompositeOperation = "destination-atop";
			tmpCtx.translate(124, 192);
			tmpCtx.scale(perc, perc);
			tmpCtx.drawImage(battle.curPokemon.backsprite, -64, -96);
			tmpCtx.restore();
			
			
			ctx.save();
			ctx.translate(124, 192);
			ctx.scale(perc, perc);
			ctx.drawImage(battle.curPokemon.backsprite, -64, -96);
			
			
			ctx.restore();
			
			ctx.globalAlpha = clamp(1 - Math.max(0, perc * perc - 0.5) * 2, 0, 1);
			ctx.drawImage(tmpCanvas, 0, 0);
			ctx.globalAlpha = 1;
		}else if(battle.animStep >= 35){
			battle.selectedAction = 0;
			battleOpenActionMenu();
		}
		
		
		++battle.animStep;
	}else{
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(60, 96);
		ctx.lineTo(188, 96);
		ctx.lineTo(188, 224);
		ctx.lineTo(60, 224);
		ctx.lineTo(60, 96);
		ctx.clip();
		if(!battle.renderVars.dontRenderPokemon){
			if(battle.renderVars.pokemonFainted){
				if(numRTicks - battle.renderVars.pokemonFaintedTick <= 5){
					ctx.drawImage(battle.curPokemon.backsprite, 60, 96 + (numRTicks - battle.renderVars.pokemonFaintedTick) * 30);
				}
			}else{
				ctx.drawImage(battle.curPokemon.backsprite, 60, 96 + ((battle.step == BATTLE_STEP_ACTION_MENU || battle.step == BATTLE_STEP_FIGHT_MENU) && ((now + battle.randInt) % 600) < 300 ? 2 : 0));
				
			}
			
		}
		
		ctx.restore();
	}
	
	{
		ctx.save();
		if(battle.renderVars.shakeEnemyStatus && numRTicks % 2 == 0) ctx.translate(0, 2);
		ctx.drawImage(res.battleEnemyBar, 26, 32);
		ctx.drawImage(res.battleHealthBar, 0, 0, 1, 6, 104, 66, 96, 6);
		
		var hpPerc = battle.enemyPokemon.hp / battle.enemyPokemon.maxHp;
		if(hpPerc > 0.50){
			ctx.drawImage(res.battleHealthBar, 0, 6, 1, 6, 104, 66, Math.floor(48 * hpPerc) * 2, 6);
		}else if(hpPerc >= 0.20){
			ctx.drawImage(res.battleHealthBar, 0, 12, 1, 6, 104, 66, Math.floor(48 * hpPerc) * 2, 6);
		}else{
			ctx.drawImage(res.battleHealthBar, 0, 18, 1, 6, 104, 66, Math.ceil(48 * hpPerc) * 2, 6);
		}
		
		var pokemonName = (battle.enemyPokemon.nickname || pokemonData[battle.enemyPokemon.id].name).toUpperCase();
		var pokemonLevel = 'Lv'+battle.enemyPokemon.level.toString();
		var lvlX = 168 - (battle.enemyPokemon.level < 10 ? 0 : (battle.enemyPokemon.level < 100) ? 8 : 16);
		
		ctx.font = '21px Font2';
		ctx.fillStyle = 'rgb(216,208,176)';
		ctx.fillText(pokemonName, 42, 56);
		ctx.fillText(pokemonName, 40, 58);
		ctx.fillText(pokemonName, 42, 58);
		ctx.fillText(pokemonLevel, lvlX + 2, 56);
		ctx.fillText(pokemonLevel, lvlX, 58);
		ctx.fillText(pokemonLevel, lvlX + 2, 58);
		
		ctx.fillStyle = 'rgb(64,64,64)';
		ctx.fillText(pokemonName, 40, 56);
		ctx.fillText(pokemonLevel, lvlX, 56);
		
		
		var tmpX = ctx.measureText(pokemonName).width + 40;
		if(battle.enemyPokemon.gender == 1){
			ctx.drawImage(res.battleMisc, 64, 0, 10, 16, tmpX, 42, 10, 16);
		}else if(battle.enemyPokemon.gender == 2){
			ctx.drawImage(res.battleMisc, 74, 0, 10, 16, tmpX, 42, 10, 16);
		}
		ctx.restore();
	}
	if(battle.step >= BATTLE_STEP_ACTION_MENU){
		ctx.save();
		var tmp = 0;
		if(battle.step == BATTLE_STEP_ACTION_MENU || battle.step == BATTLE_STEP_FIGHT_MENU){
			ctx.translate(0, (now % 600) < 300 ? 0 : 2);
		}
		
		if(battle.renderVars.shakePokemonStatus && numRTicks % 2 == 0) ctx.translate(0, 2);
		
		ctx.drawImage(res.battlePokemonBar, 252, 148);
		
		ctx.drawImage(res.battleHealthBar, 0, 0, 1, 6, 348, 182, 96, 6);
		
		
		var hpPerc = battle.curPokemon.hp / battle.curPokemon.maxHp;
		if(hpPerc > 0.50){
			ctx.drawImage(res.battleHealthBar, 0, 6, 1, 6, 348, 182, Math.floor(48 * hpPerc) * 2, 6);
		}else if(hpPerc >= 0.20){
			ctx.drawImage(res.battleHealthBar, 0, 12, 1, 6, 348, 182, Math.floor(48 * hpPerc) * 2, 6);
		}else{
			ctx.drawImage(res.battleHealthBar, 0, 18, 1, 6, 348, 182, Math.ceil(48 * hpPerc) * 2, 6);
		}
		
		ctx.fillStyle = 'rgb(64,200,248)';
		ctx.fillRect(316, 214, Math.floor(battle.curPokemon.experience / battle.curPokemon.experienceNeeded * 64) * 2, 4);
		
		
		var pokemonName = (battle.curPokemon.nickname || pokemonData[battle.curPokemon.id].name).toUpperCase();
		var pokemonLevel = 'Lv'+battle.curPokemon.level.toString();
		var lvlX = 412 - (battle.curPokemon.level < 10 ? 0 : (battle.curPokemon.level < 100) ? 8 : 16);
		var maxHpX = 422 - (battle.curPokemon.maxHp >= 100 ? 8 : 0);
		
		ctx.font = '21px Font2';
		ctx.fillStyle = 'rgb(216,208,176)';
		ctx.fillText(pokemonName, 286, 172);
		ctx.fillText(pokemonName, 284, 174);
		ctx.fillText(pokemonName, 286, 174);
		ctx.fillText(pokemonLevel, lvlX + 2, 172);
		ctx.fillText(pokemonLevel, lvlX, 174);
		ctx.fillText(pokemonLevel, lvlX + 2, 174);
		ctx.fillText(battle.curPokemon.maxHp, maxHpX + 2, 208);
		ctx.fillText(battle.curPokemon.maxHp, maxHpX, 210);
		ctx.fillText(battle.curPokemon.maxHp, maxHpX + 2, 210);
		ctx.fillText(battle.curPokemon.hp, 384, 208);
		ctx.fillText(battle.curPokemon.hp, 382, 210);
		ctx.fillText(battle.curPokemon.hp, 384, 210);
		
		ctx.fillStyle = 'rgb(64,64,64)';
		ctx.fillText(pokemonName, 284, 172);
		ctx.fillText(pokemonLevel, lvlX, 172);
		ctx.fillText(battle.curPokemon.maxHp, maxHpX, 208);
		ctx.fillText(battle.curPokemon.hp, 382, 208);
		
		
		var tmpX = ctx.measureText(pokemonName).width + 284;
		if(battle.curPokemon.gender == 1){
			ctx.drawImage(res.battleMisc, 64, 0, 10, 16, tmpX, 158, 10, 16);
		}else if(battle.curPokemon.gender == 2){
			ctx.drawImage(res.battleMisc, 74, 0, 10, 16, tmpX, 158, 10, 16);
		}
		
		ctx.restore();
	}
	
	if(battle.step == BATTLE_STEP_POKEMON_APPEARED_TMP){
		battle.step = BATTLE_STEP_POKEMON_APPEARED;
		setBattleText('Wild ' + pokemonData[battle.enemyPokemon.id].name.toUpperCase() +' appeared!', -1, function(){
			setBattleText("Go! " + pokemonData[battle.curPokemon.id].name.toUpperCase() + "!");
			battle.step = BATTLE_STEP_GO_POKEMON;
			battle.animStep = 0;
			battle.selectedMove = 0;
		});
	}
	
	ctx.restore();
}

function battleOpenActionMenu(){
	battle.runningQueue = false;
	battle.step = BATTLE_STEP_ACTION_MENU;
	
	setBattleText('What will '+pokemonData[battle.curPokemon.id].name.toUpperCase()+' do?');
	
	hookAButton(function(){
		
		// Ignore actions other than attack for now
		if(battle.selectedAction != 0){
			battleOpenActionMenu();
			return;
		}
		
		switch(battle.selectedAction){
		case 0:
			battleOpenFightMenu();
			break;
		}
	});
}

function battleOpenFightMenu(){
	battle.step = BATTLE_STEP_FIGHT_MENU;
	
	var aAction = function(){
		
		unHookBButton(bAction);
		setBattleText(null);
		battle.step = BATTLE_STEP_TURN;
		socket.emit('battleMove', {move: battle.selectedMove});
	};
	
	var bAction = function(){
		unHookAButton(aAction);
		battleOpenActionMenu();
		battle.textTime = 0;
	};
	
	hookAButton(aAction);
	hookBButton(bAction);
}

function battleRunQueue(force){
	if(!force && battle.runningQueue) return;
	battle.runningQueue = true;
	if(battle.resultQueue.length == 0){
		battleOpenActionMenu();
		return;
	}
	
	var action = battle.resultQueue.shift();
	battle.curAction = action;
	
	console.log('Action: '+action.type, action);
	
	switch(action.type){
	case "moveAttack":
		setBattleText((action.player == 0 ? (battle.curPokemon.nickname || pokemonData[battle.curPokemon.id].name) : (battle.enemyPokemon.nickname || pokemonData[battle.enemyPokemon.id].name)).toUpperCase()+" used "+action.value.move.toUpperCase()+"!");
		setTimeout(function(){
			moveStartTime = +new Date();
			if(moves[action.value.move]){
				moves[action.value.move]();
			}else{
				moves['def']();
			}
		}, 1000);
		break;
	case "moveMiss":
		setBattleText((action.player == 0 ? (battle.curPokemon.nickname || pokemonData[battle.curPokemon.id].name) : (battle.enemyPokemon.nickname || pokemonData[battle.enemyPokemon.id].name)).toUpperCase()+" used "+action.value.toUpperCase()+"!");
		setTimeout(function(){
			setBattleText('But it missed!');
			setTimeout(function(){battleRunQueue(true)}, 1000);
		}, 1000);
		break;
	case "pokemonDefeated":
		var attacker;
		var defeated;
		if(action.player == 0){
			attacker = battle.curPokemon;
			defeated = battle.enemyPokemon;
			battle.renderVars.enemyFainted = true;
			battle.renderVars.enemyFaintedTick = numRTicks;
		}else{
			attacker = battle.enemyPokemon;
			defeated = battle.curPokemon;
			battle.renderVars.pokemonFainted = true;
			battle.renderVars.pokemonFaintedTick = numRTicks;
		}
		
		
		
		setBattleText((battle.type == BATTLE_WILD && action.player == 0 ? 'Wild ':'')+(defeated.nickname || pokemonData[defeated.id].name).toUpperCase()+' fainted!', -1, function(){
			if(action.player == 0){
				setBattleText((attacker.nickname || pokemonData[attacker.id].name).toUpperCase() + ' gained '+action.value+' EXP. Points!', -1, function(){
					battleAnimateExp();
				});
			}else{
				battleRunQueue(true);
			}
		});
		
		break;
	case "win":
		setPokemonParty(action.value.pokemon);
		
		battle.finishX = action.value.x;
		battle.finishY = action.value.y;
		battle.finishMap = action.value.map;
		
		if(battle.type == BATTLE_WILD && action.player == 0){
			battleFinish();
			return;
		}
		
		
		battleFinish();
		
		break;
	case "switchFainted":
		if(action.player != 0){
			setBattleText('The opponent is selecting another pokemon');
			battle.runningQueue = false;
			return;
		}
		
		//TODO
		
		break;
	case "fleeFail":
		
		break;
	case "pokemonLevelup": battleRunQueue(true); break;
	}
}

function battleMoveFinish(){
	battle.renderVars.shakeEnemyStatus = false;
	battle.renderVars.shakePokemonStatus = false;
	
	var action = battle.curAction;
	if(action.type == "moveAttack"){
		if(action.value.effec == 0){
			setBattleText("It's not effective...", 0, battleAnimateHp);
		}else if(action.value.effec < 1){
			setBattleText("It's not very effective...", 0, battleAnimateHp);
		}else if(action.value.effec > 1){
			setBattleText("It's very effective!", 0, battleAnimateHp);
		}else{
			battleAnimateHp();
		}
	}else{
		battleRunQueue(true);
	}
}

function battleAnimateHp(){
	var action = battle.curAction;
	var renderFunc = function(){
		var result = action.value.resultHp;
		var pok;
		if(action.player == 1){
			pok = battle.curPokemon;
		}else{
			pok = battle.enemyPokemon;
		}
		
		var step = Math.ceil(pok.maxHp / 50);
		if(pok.hp > result){
			pok.hp -= step;
			if(pok.hp < result){
				pok.hp = result;
			}
		}else if(pok.hp < result){
			pok.hp += step;
			if(pok.hp > result){
				pok.hp = result;
			}
		}
		
		if(pok.hp == result){
			unHookRender(renderFunc);
			setTimeout(function(){battleRunQueue(true)}, 100);
		}
	};
	
	hookRender(renderFunc);
}

function battleAnimateExp(){
	var action = battle.curAction;
	if(action.player != 0 || battle.curPokemon.level >= 100){
		battleRunQueue(true);
		return;
	}
	
	battle.textDelay = 1/0;
	var expGained = action.value;
	var step = Math.ceil(expGained / 100);
	
	var renderFunc = function(){
		var pok = battle.curPokemon;
		
		if(step > expGained) step = expGained;
		pok.experience += step;
		expGained -= step;
		
		if(pok.experience >= pok.experienceNeeded){
			expGained += pok.experience - pok.experienceNeeded;
			
			var info = battle.resultQueue.shift();
			if(info.type != 'pokemonLevelup') throw new Error('Assertion failed');
			
			var backsprite = battle.curPokemon.backsprite;
			battle.curPokemon = info.value;
			battle.curPokemon.backsprite = backsprite;
			pok = battle.curPokemon;
			
			
			pok.experience = 0;
		}
		
		
		if(expGained <= 0){
			unHookRender(renderFunc);
			setTimeout(function(){battleRunQueue(true)}, 100);
		}
	};
	
	hookRender(renderFunc);
}

function battleFinish(){
	var step = 0;
	var func = function(){
		ctx.fillStyle = '#000000';
		if(step < 15){
			ctx.globalAlpha = step / 15;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.globalAlpha = 1;
		}else if(step < 20){
			ctx.globalAlpha = 1;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			if(step == 15){
				if(battle.finishMap == curMapId){
					var chr = getPlayerChar();
					if(chr){
						chr.x = battle.finishX;
						chr.y = battle.finishY;
					}
				}else{
					unHookRender(func);
					loadMap(battle.finishMap);
				}
				
				inBattle = false;
				battle = null;
				drawPlayerChar = true;
				drawPlayerFollower = true;
				
				var chr = getPlayerChar();
				if(chr){
					chr.inBattle = false;
				}
			}
			
		}else{
			ctx.globalAlpha = 1 - (step - 20) / 8;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.globalAlpha = 1;
			if(step >= 28){
				unHookRender(func);
			}
		}
		++step;
	}
	
	hookRender(func);
}

function battleButtonHandler(dir){
	if(!inBattle) return;
	
	
	if(battle.step == BATTLE_STEP_ACTION_MENU){
		switch(battle.selectedAction){
		case 0:
			if(dir == DIR_RIGHT){
				battle.selectedAction = 1;
			}else if(dir == DIR_DOWN){
				battle.selectedAction = 2;
			}
			break;
		case 1:
			if(dir == DIR_LEFT){
				battle.selectedAction = 0;
			}else if(dir == DIR_DOWN){
				battle.selectedAction = 3;
			}
			break;
		case 2:
			if(dir == DIR_UP){
				battle.selectedAction = 0;
			}else if(dir == DIR_RIGHT){
				battle.selectedAction = 3;
			}
			break;
		case 3:
			if(dir == DIR_UP){
				battle.selectedAction = 1;
			}else if(dir == DIR_LEFT){
				battle.selectedAction = 2;
			}
			break;
		}
	}
}
hookDirButtons(battleButtonHandler);

function setBattleText(str, delay, onComplete){
	battle.text = str || '';
	battle.textTime = +new Date();
	if(delay == null) delay = NaN;
	battle.textDelay = delay;
	battle.textOnComplete = onComplete;
	battle.textCompleted = false;
}