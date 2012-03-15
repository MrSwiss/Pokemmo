var BATTLE_WILD = 0;
var BATTLE_TRAINER = 1;
var BATTLE_VERSUS = 2;

var BATTLE_ACTION_MOVE = 0;
var BATTLE_ACTION_STRUGGLE = 1;
var BATTLE_ACTION_SWITCH = 2;
var BATTLE_ACTION_RUN = 3;
var BATTLE_ACTION_ITEM = 4;
var BATTLE_ACTION_BALL = 5;

var PLAYER_SELF = 0;
var PLAYER_ENEMY = 1;

function Battle(type, arg1, arg2){
	var self = this;
	
	var player1 = {}, player2 = {};
	self.player1 = player1;
	self.player2 = player2;
	self.type = type;
	
	var runAttempts = 0;
	
	var winner;
	
	var results = [];
	
	switch(type){
	case BATTLE_WILD:
		var client = player1.client = arg1;
		player1.pokemon = client.pokemon[0];
		player1.pokemonList = client.pokemon;
		for(var i=0;i<client.pokemon.length;++i){
			if(client.pokemon[i].hp > 0){
				player1.pokemon = client.pokemon[i];
				break;
			}
		}
		
		player2.pokemon = arg2;
		player2.pokemonList = [arg2];
		
		break;
	}
	
	player1.pending = false;
	
	player2.pending = false;
	
	for(var i=0;i<player1.pokemonList.length;++i){
		player1.pokemonList[i].battleStats = {
			atkPower : 0,
			defPower : 0,
			spAtkPower : 0,
			spDefPower : 0,
			speedPower : 0,
			accuracy: 0,
			evasion: 0
		};
	}
	
	for(var i=0;i<player2.pokemonList.length;++i){
		player2.pokemonList[i].battleStats = {
			atkPower : 0,
			defPower : 0,
			spAtkPower : 0,
			spDefPower : 0,
			speedPower : 0,
			accuracy: 0,
			evasion: 0
		};
	}
	
	var powerMultipler = {
		"-6": 2/8,
		"-5": 2/7,
		"-4": 2/6,
		"-3": 2/5,
		"-2": 2/4,
		"-1": 2/3,
		"0": 1,
		"1": 1.5,
		"2": 2,
		"3": 2.5,
		"4": 3,
		"5": 3.5,
		"6": 4,
	};
	
	var accuracyMultipler = {
		"-6": 3/9,
		"-5": 3/8,
		"-4": 3/7,
		"-3": 3/6,
		"-2": 3/5,
		"-1": 3/4,
		"0": 1,
		"1": 4/3,
		"2": 5/3,
		"3": 2,
		"4": 7/3,
		"5": 8/3,
		"6": 3,
	};
	
	self.wildInfo = {
		get curPokemon(){return player1.pokemon.ownerInfo},
		get enemy(){return player2.pokemon;}
	};
	
	self.init = function(){
		switch(type){
		case BATTLE_WILD:
			client.socket.on('battleMove', onBattleMoveWild);
			client.socket.on('battleFlee', onBattleFleeWild);
			
			client.socket.emit('battleWild', {battle: self.wildInfo, x: client.char.x, y: client.char.y});
			
			break;
		}
		
		initTurn(true);
	}
	
	self.destroy = function(){
		switch(type){
			case BATTLE_WILD:
				client.socket.removeListener('battleMove', onBattleMoveWild);
				client.socket.removeListener('battleFlee', onBattleFleeWild);
			break;
		}
	}
	
	function onBattleMoveWild(data){
		if(!player1.pending) return;
		
		if(player1.pokemon.hp <= 0) return;
		
		player1.pending = false;
		
		var tmp = Number(data.move);
		if(isNaN(tmp) || tmp < 0 || tmp > player1.pokemon.moves[tmp] == null){
			tmp = 0;
		}
		
		if(player1.pokemon.movesPP[tmp] <= 0){
			player1.action = new BattleAction(BATTLE_ACTION_STRUGGLE);
		}else{
			player1.action = new BattleAction(BATTLE_ACTION_MOVE, tmp);
		}
		
		calculateAIAction();
		processTurn();
	}
	
	function onBattleFleeWild(data){
		if(!player1.pending) return;
		
		if(player1.pokemon.hp <= 0) return;
		
		player1.pending = false;
		player1.action = new BattleAction(BATTLE_ACTION_RUN);
		
		calculateAIAction();
		processTurn();
	}
	
	
	function calculateAIAction(){
		var enemyMoves = player2.pokemon.getUsableMoves();
		if(enemyMoves.length == 0){
			player2.action = new BattleAction(BATTLE_ACTION_STRUGGLE);
		}else{
			player2.action = new BattleAction(BATTLE_ACTION_MOVE, enemyMoves[Math.floor(Math.random() * enemyMoves.length)]);
		}
	}
	
	function initTurn(dontSendMessage){
		switch(type){
		case BATTLE_WILD:
			//if(!dontSendMessage) client.socket.emit('battleInitTurn', {battle: self.wildInfo});
			player1.pending = true;
			break;
		}
	}
	
	function processTurn(){
		var first = determineFirstAction();
		var tmp;
		
		var firstPlayer, secondPlayer;
		
		if(first == 1){
			firstPlayer = player1;
			secondPlayer = player2;
		}else{
			firstPlayer = player2;
			secondPlayer = player1;
		}
		
		{
			tmp = processAction(firstPlayer, secondPlayer);
			pushResult(tmp);
			if(tmp && tmp.battleEnded) return;
			
			checkFainted(player1, player2);
			checkFainted(player2, player1);
		}
		
		if(canTurnProceed()){
			tmp = processAction(secondPlayer, firstPlayer);
			pushResult(tmp);
			if(tmp && tmp.battleEnded) return;
			
			checkFainted(player1, player2);
			checkFainted(player2, player1);
		}else{
			if(!checkWin()){
				if(player1.pokemon.hp <= 0){
					player1.pending = true;
					pushResult(new BattleTurnResult(player1, "switchFainted"));
				}
				
				if(player2.pokemon.hp <= 0){
					if(type == BATTLE_WILD){
						//TODO: Switch logic
					}else{
						player2.pending = true;
						pushResult(new BattleTurnResult(player2, "switchFainted"));
					}
				}
				
				flushResults();
				return;
			}
		}
		
		flushResults();
		
		if(!checkWin()) initTurn();
	}
	
	function pushResult(res){
		if(res == null) return;
		if(res instanceof Array){
			res.battleEnded = false;
			for(var i=0;i<res.length;++i){
				pushResult(res[i]);
				if(res[i].battleEnded) res.battleEnded = true;
			}
			return;
		}
		results.push(res);
	}
	
	function flushResults(){
		if(results.length == 0) return;
		if(player1.client){
			player1.client.socket.emit('battleTurn', {results: results.map(function(v){return v.formatForPlayer(player1)}).filter(function(v){return v != null})});
		}
		
		if(player2.client){
			player2.client.socket.emit('battleTurn', {results: results.map(function(v){return v.formatForPlayer(player2)}).filter(function(v){return v != null})});
		}
		
		results.length = 0;
	}
	
	function canTurnProceed(){
		if(player1.pokemon.hp <= 0) return false;
		if(player2.pokemon.hp <= 0) return false;
		return true;
	}
	
	function checkFainted(player, enemy){
		if(type == BATTLE_VERSUS) return;
		if(player != player1) return;
		
		if(enemy.pokemon.hp <= 0){
			player.pokemon.addEV(pokemonData[enemy.pokemon.id].evYield);
			
			var exp = player.pokemon.level < 100 ? enemy.pokemon.calculateExpGain(type == BATTLE_TRAINER) : 0;
			pushResult(new BattleTurnResult(player, 'pokemonDefeated', exp));
			
			while(player.pokemon.level < 100 && player.pokemon.experience >= player.pokemon.experienceNeeded){
				player.pokemon.experience -= player.pokemon.experienceNeeded;
				player.pokemon.levelUp();
				pushResult(new BattleTurnResult(player, 'pokemonLevelup', player.pokemon.ownerInfo));
			}
		}
	}
	
	function checkWin(){
		if(winner != undefined) return true;
		
		var player1Dead = true;
		var player2Dead = true;
		for(var i=0;i<player1.pokemonList.length;++i){
			if(player1.pokemonList[i].hp > 0) player1Dead = false;
		}
		
		for(var i=0;i<player2.pokemonList.length;++i){
			if(player2.pokemonList[i].hp > 0) player2Dead = false;
		}
		
		if(player1Dead){
			if(player2Dead){
				self.declareWinner(null);
			}else{
				self.declareWinner(player2);
			}
			return true;
		}else if(player2Dead){
			self.declareWinner(player1);
			return true;
		}
		
		return false;
	}
	
	self.declareWinner = function(player){
		winner = player;
		
		if(player1.client){
			player1.client.inBattle = false;
			player1.client.retrasmitChar = true;
			
			if(winner != player1){
				player1.client.moveToSpawn();
				player1.client.restorePokemon();
			}
		}
		
		if(player2.client){
			player2.client.inBattle = false;
			player2.client.retrasmitChar = true;
			
			if(winner != player2){
				player2.client.moveToSpawn();
				player2.client.restorePokemon();
			}
		}
		
		pushResult(new BattleTurnResult(winner, 'win', function(res, p){
			var obj = {
				map: p.client.map,
				x: p.client.char.x,
				y: p.client.char.y,
				pokemon: p.client.pokemon.map(function(v){return v.ownerInfo})
			};
			
			p.client.retransmitChar = true;
			
			if(winner != p){
				obj.mapChars = p.client.getMapInstance().chars;
			}
			
			return obj;
		}));
		flushResults();
		self.destroy();
	}
	
	function processAction(player, enemy){
		if(type == BATTLE_WILD && player.action.type == BATTLE_ACTION_RUN){
			var chance = ((player.pokemon.speed * 32) / (enemy.pokemon.speed / 4)) + 30 * (++runAttempts);
			var success = Math.floor(Math.random() * 256) < chance;
			
			if(success){
				player.client.inBattle = false;
				player.client.battle = null;
				self.destroy();
				var res = new BattleTurnResult(player, "flee", {x: player.client.char.x, y: player.client.char.y}, true);
				pushResult(res);
				flushResults();
				return res;
			}
			
			return new BattleTurnResult(player, "fleeFail");
		}else if(player.action.type == BATTLE_ACTION_MOVE){
			player.pokemon.movesPP[player.action.value] -= 1;
			return processMove(player, enemy, player.pokemon.moves[player.action.value]);
		}
		
		console.warn('Unknown battle action' + JSON.stringify(player.action));
	}
	
	function processMove(player, enemy, moveId){
		
		var moveData = movesData[moveId];
		
		if(moveData.accuracy != -1){
			if(Math.random() >= (moveData.accuracy) * (accuracyMultipler[player.pokemon.battleStats.accuracy] / accuracyMultipler[enemy.pokemon.battleStats.evasion])){
				return new BattleTurnResult(player, "moveMiss", moveData.name);
			}
		}
		
		switch(moveData.moveType){
		case "simple":
			var obj = calculateDamage(player.pokemon, enemy.pokemon, moveData);
			enemy.pokemon.hp = Math.max(enemy.pokemon.hp - obj.damage, 0);
			
			var res = [new BattleTurnResult(player, "moveAttack", {move: moveData.name, resultHp: enemy.pokemon.hp, isCritical: obj.isCritical, effec:obj.effec})]
			
			if(enemy.pokemon.hp > 0){
				if(moveData.applyStatus){
					if(Math.random() < (moveData.applyStatusChance == null ? 1.0 : moveData.applyStatusChance)){
						var status = Number(moveData.applyStatus);
						enemy.pokemon.status = status;
						res.push(new BattleTurnResult(player, "applyStatus", status));
					}
				}
				
				if(moveData.debuffChance){
					if(Math.random() < moveData.debuffChance){
						enemy.pokemon.battleStats[moveData.debuffStat] -= Number(moveData.debuffAmount);
						if(enemy.pokemon.battleStats[moveData.debuffStat] < -6) enemy.pokemon.battleStats[moveData.debuffStat] = -6;
						res.push(new BattleTurnResult(player, "debuff", {stat:moveData.debuffStat}));
					}
				}
			}
			
			return res;
			
		case "debuff":
			
			enemy.pokemon.battleStats[moveData.debuffStat] -= Number(moveData.debuffAmount);
			if(enemy.pokemon.battleStats[moveData.debuffStat] < -6) enemy.pokemon.battleStats[moveData.debuffStat] = -6;
			return new BattleTurnResult(player, "moveDebuff", {move: moveData.name, stat:moveData.debuffStat});
			
		case "applyStatus":
			var status = Number(moveData.applyStatus);
			enemy.pokemon.status = status;
			var res = [new BattleTurnResult(player, "moveAttack", {move: moveData.name, resultHp: enemy.pokemon.hp, isCritical: false, effec:1})];
			res.push(new BattleTurnResult(player, "applyStatus", status));
			return res;
		case "custom": return movesFunctions[moveId](player, enemy);
		}
		
		throw new Error("Not implemented");
	}
	
	function calculateDamage(pokemon, enemyPokemon, moveData){
		// Note: This mechanic is different from Generation III, but it's more balanced
		// (it was introduced in a later generation, before, special moves were determined by type)
		var isMoveSpecial = !!moveData.special;
		
		var attackerAtk = (pokemon.atk * powerMultipler[pokemon.battleStats.atkPower]);
		var defenderDef = (enemyPokemon.def * powerMultipler[enemyPokemon.battleStats.defPower]);
		
		if(pokemon.status == STATUS_BURN){
			attackerAtk *= 0.5;
		}
		
		var damage = ((2 * pokemon.level + 10) / 250) * (attackerAtk / defenderDef) * moveData.power + 2;
		var modifier = 1.0;
		
		// STAB
		if(moveData.type == pokemonData[pokemon.id].type1 || moveData.type == pokemonData[pokemon.id].type2){
			modifier *= 1.5;
		}
		
		var typeEffectiveness = getTypeEffectiveness(moveData.type, enemyPokemon.type1) * getTypeEffectiveness(moveData.type, enemyPokemon.type2);
		modifier *= typeEffectiveness;
		
		var criticalChance = [0, 0.065, 0.125, 0.25, 0.333, 0.5];
		var criticalStage = 1;
		var isCritical;
		
		if(moveData.highCritical) criticalStage += 2;
		
		if(criticalStage > 5) criticalStage = 5;
		
		isCritical = (Math.random() < criticalChance[criticalStage]);
		
		if(isCritical) modifier *= 2;
		
		modifier *= 1.0 - Math.random() * 0.15;
		
		return {damage:Math.ceil(damage * modifier), isCritical: isCritical, effec:typeEffectiveness};
	}
	
	function determineFirstAction(){
		if(player1.action.type == BATTLE_ACTION_RUN || player1.action.type == BATTLE_ACTION_BALL){
			return 1;
		}else if(player1.action.type == BATTLE_ACTION_SWITCH){
			if(player2.action.type == BATTLE_ACTION_SWITCH){
				return 1 + Math.floor(Math.random() * 2);
			}else{
				return 1;
			}
		}else if(player2.action.type == BATTLE_ACTION_SWITCH){
			return 2;
		}else if(player1.action.type == BATTLE_ACTION_ITEM){
			if(player2.action.type == BATTLE_ACTION_ITEM){
				return 1 + Math.floor(Math.random() * 2);
			}else{
				return 1;
			}
		}else if(player2.action.type == BATTLE_ACTION_ITEM){
			return 2;
		}else if(player1.action.type == BATTLE_ACTION_MOVE && player2.action.type == BATTLE_ACTION_MOVE){
			var player1Move = player1.pokemon.moves[player1.action.value];
			var player2Move = player2.pokemon.moves[player2.action.value];
			
			var player1Priority = (movesData[player1Move].priority || 0);
			var player2Priority = (movesData[player2Move].priority || 0);
			
			if(player1Priority > player2Priority){
				return 1;
			}else if(player2Priority > player1Priority){
				return 2;
			}
			
			if(player2.pokemon.speed > player1.pokemon.speed) return 2;
			return 1;
		}
		
		return 1;
	}
}

function BattleAction(type, value){
	this.type = type;
	this.value = value;
}

function BattleTurnResult(player, type, value, battleEnded, onlyBroadcastToPlayer){
	this.player = player;
	this.type = type;
	this.value = value;
	this.battleEnded = !!battleEnded;
	this.formatForPlayer = function(p){
		if(onlyBroadcastToPlayer && player != p) return null;
		return {
			player: (p == player) ? PLAYER_SELF : PLAYER_ENEMY,
			type: type,
			value: (typeof value == 'function' ? value(this, p) : value)
		};
	}
}

function getTypeEffectiveness(type, other){
	if(type == null || other == null) return 1.0;
	if(typeData[type][other] == null) return 1.0;
	return typeData[type][other];
}