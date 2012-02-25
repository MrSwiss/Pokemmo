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
	
	switch(type){
	case BATTLE_WILD:
		var client = player1.client = arg1;
		player1.pokemon = client.pokemon[0];
		player1.pokemonList = client.pokemon;
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
		var enemyMoves = enemy.getUsableMoves();
		if(enemyMoves.length == 0){
			player2.action = new BattleAction(BATTLE_ACTION_STRUGGLE);
		}else{
			player2.action = new BattleAction(BATTLE_ACTION_MOVE, enemyMoves[Math.floor(Math.random() * enemyMoves.length)]);
		}
	}
	
	function initTurn(dontSendMessage){
		switch(type){
		case BATTLE_WILD:
			if(!dontSendMessage) client.socket.emit('battleInitTurn', {battle: self.wildInfo});
			player1.pending = true;
			break;
		}
	}
	
	function processTurn(){
		var first = determineFirstAction();
		
		var results = [];
		var tmp;
		
		var firstPlayer, secondPlayer;
		
		if(first == 1){
			firstPlayer = player1;
			secondPlayer = player2;
		}else{
			firstPlayer = player2;
			secondPlayer = player1;
		}
		
		tmp = processAction(firstPlayer, secondPlayer);
		
		if(tmp.battleEnded) return;
		results.push(tmp);
		
		if(canTurnProceed()){
			tmp = processAction(secondPlayer, firstPlayer);
			if(tmp.battleEnded) return;
		}
		
		checkFainted(player1, player2);
		checkFainted(player2, player1);
		
		player1.client.socket.emit('battleTurn', {results: results.map(function(v){return v.formatForPlayer(player1)})});
		
		if(player2.client){
			player2.client.socket.emit('battleTurn', {results: results.map(function(v){return v.formatForPlayer(player2)})});
		}
		
		if(!checkWin()) initTurn();
	}
	
	function canTurnProceed(){
		if(player1.pokemon.hp <= 0) return false;
		if(player2.pokemon.hp <= 0) return false;
		return true;
	}
	
	function checkFainted(player, enemy){
		if(type == BATTLE_VERSUS) return;
		
		if(enemy.pokemon.hp <= 0){
			player.pokemon.addEV(pokemonData[enemy.pokemon.id].evYield);
			
			var exp = enemy.pokemon.calculateExpGain(type == BATTLE_TRAINER);
			player.pokemon.experience += exp;
			
			while(player.pokemon.level < 100 && player.pokemon.experience >= player.pokemon.experienceNeeded){
				player.pokemon.experience -= player.pokemon.experienceNeeded;
				player.pokemon.levelUp();
			}
		}
	}
	
	function checkWin(){
		if(winner != undefined) return;
		
		var player1Dead = true;
		var player2Dead = true;
		for(var i=0;i<player1.pokemon.length;++i){
			if(player1.pokemon[i].hp > 0) player1Dead = false;
		}
		
		for(var i=0;i<player2.pokemon.length;++i){
			if(player2.pokemon[i].hp > 0) player2Dead = false;
		}
		
		if(player1Dead){
			if(player2Dead){
				self.declareWinner(0);
			}else{
				self.declareWinner(2);
			}
			return true;
		}else if(player2Dead){
			self.declareWinner(1);
		}
		
		return false;
	}
	
	self.declareWinner = function(playerId){
		winner = playerId;
		
		//TOOD
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
			var obj = calculateDamage(player.pokemon, enemy.pokemon);
			enemy.pokemon.hp = Math.max(enemy.pokemon.hp - obj.damage, 0);
			
			return new BattleTurnResult(player, "moveAttack", {move: moveData.name, resultHp: enemy.pokemon.hp, isCritical: obj.isCritical, effec:obj.effec});
		
		
		case "custom": return movesFunctions[moveId](player, enemy);
		}
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

function BattleTurnResult(player, type, value, battleEnded){
	this.player = player;
	this.type = type;
	this.value = value;
	this.battleEnded = !!battleEnded;
	this.formatForPlayer = function(p){
		return {
			player: (p == player) ? PLAYER_SELF : PLAYER_ENEMY,
			type: type,
			value: value
		};
	}
}

function getTypeEffectiveness(type, other){
	if(type == null || other == null) return 1.0;
	if(typeData[type][other] == null) return 1.0;
	return typeData[type][other];
}