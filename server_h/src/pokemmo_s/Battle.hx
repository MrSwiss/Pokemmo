package pokemmo_s;
import pokemmo_s.GameData;
import pokemmo_s.Pokemon;

using pokemmo_s.exts.ArrayExt;

/**
 * 
 * @author Sonyp
 */

class Battle {
	static public var BATTLE_WILD:Int = 0;
	static public var BATTLE_TRAINER:Int = 1;
	static public var BATTLE_VERSUS:Int = 2;
	
	static public var powerMultipler:Array<Float> = { untyped __js__('{"-6": 2/8,"-5": 2/7,"-4": 2/6,"-3": 2/5,"-2": 2/4,"-1": 2/3,"0": 1,"1": 1.5,"2": 2,"3": 2.5,"4": 3,"5": 3.5,"6": 4}');};
	static public var accuracyMultipler:Array<Float> = { untyped __js__('{"-6": 3/9,"-5": 3/8,"-4": 3/7,"-3": 3/6,"-2": 3/5,"-1": 3/4,"0": 1,"1": 4/3,"2": 5/3,"3": 2,"4": 7/3,"5": 8/3,"6": 3,}');};
	
	private var players:Array<BattlePlayer>;
	private var curPlayerTurn:BattlePlayer;
	private var actionQueue:Array<BattlePlayer>;
	
	private var runAttempts:Int;
	private var winnerTeam:Int;
	private var ended:Bool;
	
	private var isTrainerBattle:Bool;
	
	private var results:Array<BattleActionResult>;
	
	public function new() {
		players = [];
		runAttempts = 0;
		results = [];
		ended = false;
		actionQueue = [];
		isTrainerBattle = true;
	}
	
	public function init():Void {
		for (p in players) {
			
			// A player team is determined by his id
			// If the game has 4 players, [0, 1] will be team 0, and [2, 3] will be team 1
			// 6 players, [0, 2] = 0, [3, 5], etc
			
			p.team = p.id < Math.floor(players.length / 2) ? 0 : 1;
			if (p.client == null) continue;
			
			p.client.socket.emit('battleInit', {
				type: BATTLE_WILD,
				x: p.client.character.x,
				y: p.client.character.y,
				id: p.id,
				team: p.team,
				info: {
					players: Lambda.array(Lambda.map(players, function(otherPlayer:BattlePlayer) {
						return {
							pokemon: otherPlayer.pokemon.generateNetworkObject(otherPlayer == p)
						}
					}))
				}
			});
			
			p.client.socket.on('battleAction', p.fOnBattleAction = function(data:Dynamic) { onBattleAction(p, data); } );
			p.client.socket.on('battleLearnMove', p.fOnBattleLearnMove = function(data:Dynamic) { onBattleLearnMove(p, data); } );
		}
		
		initTurn();
	}
	
	public function destroy():Void {
		ended = true;
		for (p in players) {
			if (p.client == null) continue;
			p.client.socket.removeListener("battleAction", p.fOnBattleAction);
			p.client.socket.removeListener("battleLearnMove", p.fOnBattleLearnMove);
		}
	}
	
	public function win(team:Int, transmit:Bool = true):Void {
		winnerTeam = team;
		ended = true;
		
		if (transmit) {
			pushResult(new BattleActionResult(null, "win", winnerTeam));
			for (p in players) {
				finishBattleFor(p);
			}
		}
	}
	
	public function pushResult(res:BattleActionResult):Void {
		if (res == null) return;
		if (Std.is(res, Array)) {
			for (e in cast(res, Array<Dynamic>)) pushResult(e);
			return;
		}
		
		results.push(res);
	}
	
	public function flushResults():Void {
		if (results.length == 0) return;
		for (p in players) {
			if (p.client == null) continue;
			var res = [];
			for (r in results) {
				var obj = r.generateNetworkObject(p);
				if (obj != null) res.push(obj);
			}
			
			p.client.socket.emit('battleTurn', {results: res});
		}
		
		untyped results.length = 0;
	}
	
	public function initTurn():Void {
		if (ended) return;
		if (actionQueue.length > 0) {
			runQueue();
			flushResults();
		}
		for (p in players) {
			if(p.client != null){
				p.pendingAction = true;
			}else {
				p.pendingAction = false;
				calculateAIAction(p);
			}
		}
	}
	
	public function isTurnReady():Bool {
		if (ended) return false;
		for (p in players) if (p.pendingAction) return false;
		return true;
	}
	
	private function calculateAIAction(player:BattlePlayer):Void {
		var moves = player.pokemon.getUsableMoves();
		if (moves.length == 0) {
			player.action = TStruggle;
		}else {
			//FIXME: It doesn't respect target selecting at all, only selects a random enemy
			player.action = TMove(moves.random(), [getRandomPlayerFromTeam(getPlayerEnemyTeam(player))]);
		}
	}
	
	public function onBattleAction(player:BattlePlayer, data):Void {
		if (!player.pendingAction) return;
		
		if (player.pokemon == null || player.pokemon.hp <= 0) {
			if (data.type != 'switchPokemon') return;
			// TODO: switch fainted pokemon
			return;
		}
		
		if (player.pokemon == null) return;
		
		switch(data.type) {
		case "move":
			if (!Std.is(data.move, Int)) return;
			var move = Math.floor(Math.abs(data.move) % 4);
			
			if (player.pokemon.movesPP[move] > 0) {
				player.action = TMove(player.pokemon.moves[move], [getRandomPlayerFromTeam(getPlayerEnemyTeam(player))]);
			}else {
				player.action = TStruggle;
			}
			
		case "run":
			player.action = TRun;
			
		default: return;
		}
		
		player.pendingAction = false;
		processTurn();
	}
	
	public function onBattleLearnMove(player:BattlePlayer, data:Dynamic):Void {
		if (player.pokemon == null) return;
		if (!Std.is(data.slot, Int)) return;
		if (!Std.is(data.move, String)) return;
		var move:String = data.move;
		var slot:Int = data.slot;
		if (slot < 0 || slot >= Pokemon.MAX_MOVES) return;
		
		if (!Lambda.has(player.pokemon.battleStats.learnableMoves, move)) return;
		
		player.pokemon.battleStats.learnableMoves.remove(move);
		player.pokemon.learnMove(slot, move);
	}
	
	public function playerSurrendered(player:BattlePlayer):Void {
		win(getPlayerEnemyTeam(player), true);
	}
	
	public function finishBattleFor(player:BattlePlayer):Void {
		if (player.client == null) return;
		
		var client = player.client;
		var char = client.character;
		var socket = client.socket;
		
		var func = function(data:Dynamic = null) {
			char.battle = null;
			char.retransmit = true;
			
			if (player.team != winnerTeam) {
				char.moveToSpawn();
				char.restorePokemon();
			}
			
			socket.emit('battleFinish', {pokemon: char.generatePokemonNetworkObject()});
		};
		
		if (client.disconnected) {
			func();
		}else {
			socket.once('battleFinished', func);
		}
	}
	
	public function processTurn():Void {
		if (actionQueue.length > 0) {
			runQueue();
			flushResults();
			initTurn();
		}
		
		if (!isTurnReady()) return;
		
		
		var turnOrder:Array<BattlePlayer> = players.copy();
		turnOrder.sort(sortActions);
		
		for (p in turnOrder) {
			actionQueue.push(p);
		}
		
		runQueue();
		flushResults();
		
		initTurn();
	}
	
	public function runQueue():Void {
		if (ended) {
			return;
		}
		var p:BattlePlayer;
		while (actionQueue.length > 0) {
			p = actionQueue.shift();
			processPlayerTurn(p);
			
			checkFainted();
			checkWin();
			
			if (ended) {
				flushResults();
				return;
			}
		}
	}
	
	private function checkFainted() {
		for (p in players) {
			if (p.pokemon == null) continue;
			if (p.pokemon.hp > 0) continue;
			var exp = p.pokemon.calculateExpGain(isTrainerBattle);
			
			var killers = getPlayersFromTeam(getPlayerEnemyTeam(p));
			
			exp = Math.ceil(exp / killers.length);
			
			pushResult(new BattleActionResult(p, 'pokemonDefeated', exp));
			
			for (killer in killers) {
				killer.pokemon.experience += exp;
				
				while (killer.pokemon.level < Pokemon.MAX_LEVEL && killer.pokemon.experience >= killer.pokemon.experienceNeeded) {
					killer.pokemon.experience -= killer.pokemon.experienceNeeded;
					var lvlup = killer.pokemon.levelUp();
					
					pushResult(new BattleActionResult(killer, 'pokemonLevelup', killer.pokemon.generateNetworkObject(true), true));
					
					if (lvlup.movesLearned.length > 0) {
						pushResult(new BattleActionResult(killer, 'pokemonLearnedMove', lvlup.movesLearned));
					}
				}
				
				if (killer.pokemon.battleStats.learnableMoves.length > 0) {
					pushResult(new BattleActionResult(killer, 'pokemonLearnMoves', killer.pokemon.battleStats.learnableMoves, true));
				}
			}
		}
	}
	
	private function getPlayersFromTeam(t:Int):Array<BattlePlayer> {
		return players.slice(Math.floor(t * (players.length / 2)), Math.floor(players.length / 2));
	}
	
	private function checkWin():Void {
		if (ended) return;
		
		var deadTeams:Array<Bool> = [true, true];
		for (p in players) {
			if (!deadTeams[p.team]) continue;
			for (pok in p.pokemonList) {
				if (pok.hp > 0) {
					deadTeams[p.team] = false;
					break;
				}
			}
		}
		
		if (deadTeams[0]) {
			if (deadTeams[1]) {
				win(-1);
			}else {
				win(1);
			}
		}else {
			if (deadTeams[1]) {
				win(0);
			}else {
				// No one won
			}
		}
	}
	
	private inline function getPlayerEnemyTeam(p:BattlePlayer):Int {
		return p.team == 0 ? 1 : 0;
	}
	
	private inline function getRandomPlayerFromTeam(t:Int):BattlePlayer {
		return players[Math.floor(t * Math.floor(players.length / 2) + Math.floor(players.length / 2) * Math.random())];
	}
	
	public function processPlayerTurn(p:BattlePlayer):Void {
		switch(p.action) {
		case TRun:
			var chance = ((p.pokemon.speed * 32) / (players[1].pokemon.speed / 4)) + 30 * (++runAttempts);
			var success = Math.floor(Math.random() * 256) < chance;
			
			if (success) {
				win(p.team, false);
				finishBattleFor(p);
				destroy();
				
				pushResult(new BattleActionResult(p, "flee"));
				flushResults();
			}else {
				pushResult(new BattleActionResult(p, "fleeFail"));
			}
		case TMove(move, targets):
			for (i in targets) processMove(p, i, move);
		case TStruggle:
			processMove(p, players[Math.floor((p.id + players.length / 2) % players.length)], 'struggle');
		}
	}
	
	public function processMove(player:BattlePlayer, enemy:BattlePlayer, move:String):Void {
		var moveData = GameData.getMoveData(move);
		
		// Buff type moves not implemented, use tackle
		if (moveData.moveType == 'buff') {
			moveData = GameData.getMoveData('tackle');
		}
		
		// Check to see if it missed
		if (moveData.accuracy != -1) {
			if (Math.random() >= moveData.accuracy * (accuracyMultipler[player.pokemon.battleStats.accuracy] / accuracyMultipler[enemy.pokemon.battleStats.evasion])) {
				pushResult(new BattleActionResult(player, "moveMiss", move));
				return;
			}
		}
		
		switch(moveData.moveType) {
		case "simple":
			var obj = calculateDamage(player.pokemon, enemy.pokemon, moveData);
			
			enemy.pokemon.hp -= obj.damage;
			if (enemy.pokemon.hp < 0) enemy.pokemon.hp = 0;
			
			pushResult(new BattleActionResult(player, "moveAttack", {move: move, resultHp: enemy.pokemon.hp, isCritical: obj.isCritical, effec:obj.effect}));
			
			if (enemy.pokemon.hp > 0){
				if (moveData.applyStatus != null) {
					if (Math.random() < (moveData.applyStatusChance == null ? 1.0 : moveData.applyStatusChance)) {
						enemy.pokemon.status = moveData.applyStatus;
						pushResult(new BattleActionResult(player, "applyStatus", moveData.applyStatus));
					}
				}
				
				if (moveData.debuffStat != null) {
					if (Math.random() < (moveData.debuffChance == null ? 1.0 : moveData.debuffChance)) {
						for (s in moveData.debuffStat.split(',')) {
							enemy.pokemon.buffBattleStat(s, -moveData.debuffAmount);
							pushResult(new BattleActionResult(player, "debuff", { stat:s } ));
						}
					}
				}
			}
			
			return;
			
		case "debuff":
			for (s in moveData.debuffStat.split(',')) {
				enemy.pokemon.buffBattleStat(s, -moveData.debuffAmount);
			}
			pushResult(new BattleActionResult(player, "moveDebuff", { stat: moveData.debuffStat, move: move} ));
			
		case "applyStatus":
			enemy.pokemon.status = moveData.applyStatus;
			pushResult(new BattleActionResult(player, "moveAttack", { move: moveData.name, resultHp: enemy.pokemon.hp, isCritical: false, effec:1 } ));
			pushResult(new BattleActionResult(player, "applyStatus", moveData.applyStatus));
			return;
		}
	}
	
	public function calculateDamage(pokemon:Pokemon, enemyPokemon:Pokemon, data:MoveData) {
		var isMoveSpecial = !!data.special;
		
		var attackerAtk;
		var defenderDef;
		
		if (isMoveSpecial) {
			attackerAtk = pokemon.spAtk * powerMultipler[pokemon.battleStats.spAtkPower];
			defenderDef = enemyPokemon.spDef * powerMultipler[enemyPokemon.battleStats.spDefPower];
		}else{
			attackerAtk = pokemon.atk * powerMultipler[pokemon.battleStats.atkPower];
			defenderDef = enemyPokemon.def * powerMultipler[enemyPokemon.battleStats.defPower];
		}
		
		if (pokemon.status == Pokemon.STATUS_BURN) {
			attackerAtk /= 2;
		}
		
		var damage = ((2 * pokemon.level + 10) / 250) * (attackerAtk / defenderDef) * data.power + 2;
		var modifier = 1.0;
		
		// STAB
		if (data.type == GameData.getPokemonData(pokemon.id).type1 || data.type == GameData.getPokemonData(pokemon.id).type2) {
			modifier *= 1.5;
		}
		
		var typeEffectiveness = 1.0;
		typeEffectiveness *= GameData.getTypeEffectiveness(data.type, GameData.getPokemonData(enemyPokemon.id).type1);
		typeEffectiveness *= GameData.getTypeEffectiveness(data.type, GameData.getPokemonData(enemyPokemon.id).type2);
		
		modifier *= typeEffectiveness;
		
		var criticalChance = [0, 0.065, 0.125, 0.25, 0.333, 0.5];
		var criticalStage = 1;
		
		// Add things that increase critical stage here
		if (data.highCritical) criticalStage += 2;
		
		
		if (criticalStage > 5) criticalStage = 5;
		var isCritical = Math.random() < criticalChance[criticalStage];
		
		if (isCritical) modifier *= 2;
		
		modifier *= 1.0 - Math.random() * 0.15;
		
		return {
			damage: Math.ceil(damage * modifier),
			isCritical: isCritical,
			effect: typeEffectiveness
		};
	}
	
	public function addPlayer(client:Client, pokemonList:Array<Pokemon>):BattlePlayer {
		
		var pok:Pokemon = pokemonList[0];
		for (p in pokemonList) {
			if (p.hp <= 0) continue;
			pok = p;
			break;
		}
		
		for (p in pokemonList) p.resetBattleStats();
		
		if (client != null) {
			client.character.battle = this;
			client.character.retransmit = true;
		}
		
		var bp:BattlePlayer = {
			id: players.length,
			team: -1,
			client: client,
			pokemon: pok,
			pokemonList: pokemonList,
			pendingAction: true,
			action: null,
			
			fOnBattleAction: null,
			fOnBattleLearnMove: null
		};
		
		players.push(bp);
		
		return bp;
	}
	
	private function sortActions(a:BattlePlayer, b:BattlePlayer):Int {
		var ap = getActionPriority(a.action);
		var bp = getActionPriority(b.action);
		if (ap > bp) {
			return -1;
		}else if (bp > ap) {
			return 1;
		}
		
		if (a.pokemon.speed * powerMultipler[a.pokemon.battleStats.speedPower] >= b.pokemon.speed * powerMultipler[b.pokemon.battleStats.speedPower]) {
			return -1;
		}else{
			return 1;
		}
	}
	
	private function getActionPriority(action:BattleAction):Int {
		if (action == null) return 0;
		switch(action) {
		case TRun: return 6;
		case TMove(move, target):
			var p = GameData.getMoveData(move).priority;
			if (p == null) return 0;
			return p;
		default: return 0;
		}
	}
	
	public function getPlayerOfClient(client:Client):BattlePlayer {
		for (p in players) if (p.client == client) return p;
		return null;
	}
	
	public function isOpponent(p1:BattlePlayer, p2:BattlePlayer):Bool {
		return true;
	}
}

typedef BattlePlayer = {
	var id:Int;
	var team:Int;
	
	var client:Client;
	var pokemon:Pokemon;
	var pokemonList:Array<Pokemon>;
	
	var pendingAction:Bool;
	
	var action:BattleAction;
	
	var fOnBattleAction:Dynamic->Void;
	var fOnBattleLearnMove:Dynamic->Void;
}

enum BattleAction {
	TRun;
	TMove(move:String, targets:Array<BattlePlayer>);
	TStruggle;
}

class BattleActionResult {
	private var player:BattlePlayer;
	private var type:String;
	private var value:Dynamic;
	private var broadcastOnlyToPlayer:Bool;
	public function new(player:BattlePlayer, type:String, value:Dynamic = null, broadcastOnlyToPlayer:Bool = false):Void {
		this.player = player;
		this.type = type;
		this.value = value;
		this.broadcastOnlyToPlayer = broadcastOnlyToPlayer;
	}
	
	public function generateNetworkObject(p:BattlePlayer) {
		if (broadcastOnlyToPlayer && player != p) return null;
		return {
			player: player != null ? player.id : null,
			type: type,
			value: Reflect.isFunction(value) ? value(this, p) : value
		};
	}
}