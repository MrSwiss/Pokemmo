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
			}
		}
		player1.pending = false;
		
		player2.pokemon = arg2;
		player2.pokemonList = [arg2];
		player2.pending = false;
		break;
	}
	
	self.wildInfo = {
		get curPokemon(){return player1.pokemon.ownerInfo},
		get enemy(){return player2.pokemon;}
	};
	
	self.init = function(){
		switch(type){
		case BATTLE_WILD:
			client.socket.on('battleMove', onBattleMoveWild);
			
			client.socket.emit('battleWild', {battle: self.wildInfo, x: client.char.x, y: client.char.y});
			
			break;
		}
		
		initTurn(true);
	}
	
	self.destroy = function(){
		switch(type){
			case BATTLE_WILD:
				client.socket.removeListener('battleMove', onBattleMoveWild);
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
			
			var exp = enemy.pokemon.calculateExpGain(type == BATTLE_TRAINER);
			player.pokemon.experience += exp;
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
			
			if(winner != player1){
				player1.client.moveToSpawn();
				player1.client.restorePokemon();
			}
		}
		
		if(player2.client){
			player2.client.inBattle = false;
			
			if(winner != player2){
				player2.client.moveToSpawn();
				player2.client.restorePokemon();
			}
		}
		
		pushResult(new BattleTurnResult(winner, 'win', function(res, p){
			return {
				map: p.client.map,
				x: p.client.char.x,
				y: p.client.char.y,
				pokemon: p.client.pokemon.map(function(v){return v.ownerInfo})
			}
		}));
		flushResults();
	}
	
	function processAction(player, enemy){
		if(type == BATTLE_WILD && player.action.type == BATTLE_ACTION_RUN){
			var chance = ((player.pokemon.speed * 32) / (enemy.pokemon.speed / 4)) + 30 * (++runAttempt);
			var success = Math.floor(Math.random() * 256) < chance;
			
			if(success){
				self.destroy();
				client.inBattle = false;
				client.battle = null;
				client.socket.emit('battleFleed');
				return new BattleTurnResult(player, "flee", null, true);
			}
			
			return new BattleTurnResult(player, "fleeFail");
		}else if(player.action.type == BATTLE_ACTION_MOVE){
			player.pokemon.movesPP[player.action.value] -= 1;
			return processMove(player, enemy, player.pokemon.moves[player.action.value]);
		}
	}
	
	function processMove(player, enemy, moveId){
		
		var moveData = movesData[moveId];
		
		if(Math.random() >= moveData.accuracy){
			return new BattleTurnResult(player, "moveMiss", moveData.name);
		}
		
		switch(moveData.type){
		case "simple":
			var obj = calculateDamage(player.pokemon, enemy.pokemon, moveData);
			enemy.pokemon.hp = Math.max(enemy.pokemon.hp - obj.damage, 0);
			
			return new BattleTurnResult(player, "moveAttack", {move: moveData.name, resultHp: enemy.pokemon.hp, isCritical: obj.isCritical, effec:obj.effec});
		
		
		case "custom": return movesFunctions[moveId](player, enemy);
		}
		
		throw new Error("Not implemented");
	}
	
	function calculateDamage(pokemon, enemyPokemon, moveData){
		// Note: This mechanic is different from Generation III, but it's more balanced
		// (it was introduced in a later generation, before, special moves were determined by type)
		var isMoveSpecial = !!moveData.special;
		
		var damage = ((2 * pokemon.level + 10) / 250) * (pokemon.atk / enemyPokemon.def) * moveData.power + 2;
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