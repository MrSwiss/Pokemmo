"use strict";

var MAX_CLIENTS = 250;

var fs = require('fs');
var util = require('util');
var mongodb = require('mongodb');
var crypto = require('crypto');

var mapsNames = [
	'pallet',
	'pallet_hero_home_1f',
	'pallet_hero_home_2f',
	'pallet_oaklab',
	'pallet_rival_home'
];

var clients = [];
var maps = {};
var mapInstances = {};

var start, end;

var SD_NONE = 0;
var SD_SOLID = 1;
var SD_WATER = 2;

var DIR_DOWN = 0;
var DIR_LEFT = 1;
var DIR_UP = 2;
var DIR_RIGHT = 3;

var STATUS_NONE = 0;
var STATUS_SLEEP = 1;
var STATUS_FREEZE = 2;
var STATUS_PARALYZE = 3;
var STATUS_POISON = 4;
var STATUS_BURN = 5;

var GENDER_UNKNOWN = 0;
var GENDER_MALE = 1;
var GENDER_FEMALE = 2;

var BALL_MULT = 0;
var BALL_ADD = 1;

var SPEED_HACK_N = 12;

Array.prototype.remove = function(e){
	var i = 0;
	var arr = this;
	
	while((i = arr.indexOf(e, i)) != -1){
		arr.splice(i, 1);
		return true;
	}
	
	return false;
};

var pokemonStarters = ["1", "4", "7", "10", "13", "16", "25", "29", "32", "43", "60", "66", "69", "74", "92", "133"];
var characterSprites = ["red", "red_-135", "JZJot"];

var VIRUS_NONE = 0;
var VIRUS_POKERUS = 1;


var NATURE_NONE = 0;

// NATURE_{stat increased}_{stat_decreased}
var NATURE_ATK_DEF = 1;
var NATURE_ATK_SPATK = 2;
var NATURE_ATK_SPDEF = 3;
var NATURE_ATK_SPEED = 4;

var NATURE_DEF_ATK = 5;
var NATURE_DEF_SPATK = 6;
var NATURE_DEF_SPDEF = 7;
var NATURE_DEF_SPEED = 8;

var NATURE_SPATK_ATK = 9;
var NATURE_SPATK_DEF = 10;
var NATURE_SPATK_SPDEF = 11;
var NATURE_SPATK_SPEED = 12;

var NATURE_SPDEF_ATK = 13;
var NATURE_SPDEF_DEF = 14;
var NATURE_SPDEF_SPATK = 15;
var NATURE_SPDEF_SPEED = 16;

var NATURE_SPEED_ATK = 17;
var NATURE_SPEED_DEF = 18;
var NATURE_SPEED_SPATK = 19;
var NATURE_SPEED_SPDEF = 20;

// NATURE_NONE_{stat_neutral}
var NATURE_NONE_ATK = 21;
var NATURE_NONE_DEF = 22;
var NATURE_NONE_SPATK = 23;
var NATURE_NONE_SPDEF = 24;
var NATURE_NONE_SPEED = 25;


function Pokemon(arg1, arg2){
	var self = this;
	
	var MAX_EV = 510;
	var MAX_INDIVIDUAL_EV = 255;
	
	self.loadSaveObject = function(obj){
		for(var i in obj){
			self[i] = obj[i];
		}
	}
	
	self.battleStats = {};
	
	if(arg1 && arg2 == null){
		self.loadSaveObject(arg1);
	}else{
		self.id = String(arg1);
		self.level = Math.min(Math.max(2, arg2), 100);
		
		self.unique = generateRandomString(16);
		
		self.nickname = null;
		self.gender = GENDER_UNKNOWN;
		
		if(Number(pokemonData[self.id].genderRatio) != -1){
			self.gender = (Math.random() < Number(pokemonData[self.id].genderRatio)) ? GENDER_MALE : GENDER_FEMALE;
		}
		
		self.hp = 0;
		self.maxHp = 0;
		self.atk = 0;
		self.def = 0;
		self.spAtk = 0;
		self.spDef = 0;
		self.speed = 0;
		
		self.ability = 0;
		self.nature = 1 + Math.floor(Math.random() * 25)
		
		// If it has 2 available abilities, choose one of them randomly
		if(pokemonData[self.id].ability2){
			self.ability = Math.floor(Math.random() * 2) + 1;
		}else if(pokemonData[self.id].ability1){
			self.ability = 1;
		}
		
		self.experience = 0;
		self.experienceNeeded = 0;
		
		self.evHp = 0;
		self.evAtk = 0;
		self.evDef = 0;
		self.evSpAtk = 0;
		self.evSpDef = 0;
		self.evSpeed = 0;
		
		self.ivHp = Math.floor(Math.random() * 32);
		self.ivAtk = Math.floor(Math.random() * 32);
		self.ivDef = Math.floor(Math.random() * 32);
		self.ivSpAtk = Math.floor(Math.random() * 32);
		self.ivSpDef = Math.floor(Math.random() * 32);
		self.ivSpeed = Math.floor(Math.random() * 32);
		
		self.status = STATUS_NONE;
		
		self.virus = VIRUS_NONE;
		
		self.shiny = (1/8192 > Math.random());
		self.moves = [null, null, null, null];
		self.movesPP = [0, 0, 0, 0];
		self.movesMaxPP = [0, 0, 0, 0];
		// Make it learn the 4 highest level moves for his level
		var j = 0;
		var learnset = pokemonData[self.id].learnset;
		for(var i=0;i<learnset.length;++i){
			if(movesData[learnset[i].move] == null){
				console.warn('Move "'+learnset[i].move+'" doesn\'t exist for '+pokemonData[self.id].name);
				continue;
			}
			if(learnset[i].level > self.level) continue;
			self.moves[j] = learnset[i].move;
			self.movesMaxPP[j] = self.movesPP[j] = Number(movesData[learnset[i].move].pp);
			
			j = (j+1) % 4;
		}
		
	}
	
	
	// Data to be sent to clients battling this pokemon
	self.publicInfo = {
		get id(){return self.id},
		get level(){return self.level},
		get hp(){return self.hp},
		get maxHp(){return self.maxHp},
		get unique(){return self.unique},
		get shiny(){return self.shiny},
		get gender(){return self.gender},
		get nickname(){return self.nickname},
		get status(){return self.status}
	};
	
	// Information available to the pokemon owner
	self.ownerInfo = {
		get id(){return self.id},
		get level(){return self.level},
		get hp(){return self.hp},
		get maxHp(){return self.maxHp},
		get unique(){return self.unique},
		get shiny(){return self.shiny},
		get gender(){return self.gender},
		get nickname(){return self.nickname},
		get status(){return self.status},
		
		get experience(){return self.experience},
		get experienceNeeded(){return self.experienceNeeded},
		get atk(){return self.atk},
		get def(){return self.def},
		get spAtk(){return self.spAtk},
		get spDef(){return self.spDef},
		get speed(){return self.speed},
		get ability(){return self.ability},
		get nature(){return self.nature},
		get moves(){return self.moves},
		get movesPP(){return self.movesPP},
		get movesMaxPP(){return self.movesMaxPP},
		get training(){return (self.evHp + self.evAtk + self.evDef + self.evSpAtk + self.evSpDef + self.evSpeed) / MAX_EV},
		get virus(){return self.virus}
	};
	
	self.getSaveObject = function(){
		return {
			id: self.id,
			level: self.level,
			unique: self.unique,
			gender: self.gender,
			ability: self.ability,
			experience: self.experience,
			nature: self.nature,
			status: self.status,
			virus: self.virus,
			shiny: self.shiny,
			moves: self.moves,
			movesPP: self.movesPP,
			movesMaxPP: self.movesMaxPP,
			
			hp: self.hp,
			
			evHp: self.evHp,
			evAtk: self.evAtk,
			evDef: self.evDef,
			evSpAtk: self.evSpAtk,
			evSpDef: self.evSpDef,
			evSpeed: self.evSpeed,
			
			ivHp: self.ivHp,
			ivAtk: self.ivAtk,
			ivDef: self.ivDef,
			ivSpAtk: self.ivSpAtk,
			ivSpDef: self.ivSpDef,
			ivSpeed: self.ivSpeed
		};
	}
	
	
	self.calculateExpGain = function(isTrainer){
		return Math.ceil(((isTrainer ? 1.5 : 1) * pokemonData[self.id].baseExp * self.level) / 7);
	}
	
	self.addEV = function(data){
		var total = self.evHp + self.evAtk + self.evDef + self.SpAtk + self.evSpDef + self.evSpeed;
		var tmp;
		if(total >= MAX_EV) return;
		
		var evs = [
			['hp', 'evHp'],
			['atk', 'evAtk'],
			['def', 'evDef'],
			['spAtk', 'evSpAtk'],
			['spDef', 'evSpDef'],
			['speed', 'evSpeed']
		];
		
		for(var i in evs){
			if(data[evs[i][0]]){
				tmp = data[evs[i][0]];
				// If adding this ev will exceed the max total ev, lower the amount of given EV
				if(total + tmp > MAX_EV) tmp = MAX_EV - total;
				
				// Do not let it go over the maximum individual EV
				self[evs[i][1]] = Math.min(self[evs[i][1]] + tmp, MAX_INDIVIDUAL_EV);
				
				total += tmp;
				if(total >= MAX_EV) return;
			}
		}
	}
	
	self.calculateStats = function(){
		function calculateSingleStat(base, iv, ev){
			return (iv + (2 * base) + (ev / 4)) * self.level / 100 + 5;
		}
		
		self.maxHp = Math.floor((((self.ivHp + (2 * pokemonData[self.id].baseStats.hp)) + (self.evHp / 4) + 100) * self.level) / 100 + 10);
		self.atk = calculateSingleStat(pokemonData[self.id].baseStats.atk, self.ivAtk, self.evAtk);
		self.def = calculateSingleStat(pokemonData[self.id].baseStats.def, self.ivDef, self.evDef);
		self.spAtk = calculateSingleStat(pokemonData[self.id].baseStats.spAtk, self.ivSpAtk, self.evSpAtk);
		self.spDef = calculateSingleStat(pokemonData[self.id].baseStats.spDef, self.ivSpDef, self.evSpDef);
		self.speed = calculateSingleStat(pokemonData[self.id].baseStats.speed, self.ivSpeed, self.evSpeed);
		
		switch(self.nature){
			case NATURE_ATK_DEF: self.atk *= 1.1; self.def *= 0.9; break;
			case NATURE_ATK_SPATK: self.atk *= 1.1; self.spAtk *= 0.9; break;
			case NATURE_ATK_SPDEF: self.atk *= 1.1; self.spDef *= 0.9; break;
			case NATURE_ATK_SPEED: self.atk *= 1.1; self.speed *= 0.9; break;

			case NATURE_DEF_ATK: self.def *= 1.1; self.atk *= 0.9; break;
			case NATURE_DEF_SPATK: self.def *= 1.1; self.spAtk *= 0.9; break;
			case NATURE_DEF_SPDEF: self.def *= 1.1; self.spDef *= 0.9; break;
			case NATURE_DEF_SPEED: self.def *= 1.1; self.speed *= 0.9; break;

			case NATURE_SPATK_ATK: self.spAtk *= 1.1; self.atk *= 0.9; break;
			case NATURE_SPATK_DEF: self.spAtk *= 1.1; self.def *= 0.9; break;
			case NATURE_SPATK_SPDEF: self.spAtk *= 1.1; self.spDef *= 0.9; break;
			case NATURE_SPATK_SPEED: self.spAtk *= 1.1; self.speed *= 0.9; break;

			case NATURE_SPDEF_ATK: self.spDef *= 1.1; self.atk *= 0.9; break;
			case NATURE_SPDEF_DEF: self.spDef *= 1.1; self.def *= 0.9; break;
			case NATURE_SPDEF_SPATK: self.spDef *= 1.1; self.spAtk *= 0.9; break;
			case NATURE_SPDEF_SPEED: self.spDef *= 1.1; self.speed *= 0.9; break;

			case NATURE_SPEED_ATK: self.speed *= 1.1; self.atk *= 0.9; break;
			case NATURE_SPEED_DEF: self.speed *= 1.1; self.def *= 0.9; break;
			case NATURE_SPEED_SPATK: self.speed *= 1.1; self.spAtk *= 0.9; break;
			case NATURE_SPEED_SPDEF: self.speed *= 1.1; self.spDef *= 0.9; break;
		}
		
		self.atk = Math.floor(self.atk);
		self.def = Math.floor(self.def);
		self.spAtk = Math.floor(self.spAtk);
		self.spDef = Math.floor(self.spDef);
		self.speed = Math.floor(self.speed);
		
		if(self.level >= 100){
			self.experienceNeeded = 0;
		}else{
			self.experienceNeeded = experienceRequired[pokemonData[self.id].experienceCurve][self.level + 1];
		}
	}
	
	self.levelUp = function(){
		self.level += 1;
		self.calculateStats();
	}
	
	self.getAbility = function(){
		if(self.ability == 0) return '';
		return pokemonData[self.id]['ability'+self.ability];
	}
	
	self.calculateCatch = function(ballValue, ballType){
		var chance = (3 * self.maxHp - 2 * self.hp) * pokemonData[self.id].catchRate;
		switch(ballType){
			case BALL_MULT:
				chance *= ballValue;
			break;
			case BALL_ADD:
				chance += ballValue;
			break;
		}
		chance /= 3 * self.maxHp;
		switch(self.status){
			case STATUS_SLEEP:
			case STATUS_FREEZE:
				chance *= 2;
			break;
			case STATUS_PARALYZE:
			case STATUS_POISON:
			case STATUS_BURN:
				chance *= 1.5;
			break;
		}
		
		return chance;
	}
	
	self.restore = function(){
		self.hp = self.maxHp;
		for(var i = 0; i < 4; ++i){
			self.movesPP[i] = self.movesMaxPP[i];
		}
	}
	
	self.getUsableMoves = function(){
		var list = [];
		for(var i=0;i<self.moves.length;++i){
			if(self.moves[i] == null) continue;
			if(self.movesPP[i] <= 0) continue;
			list.push(i);
		}
		return list;
	}
	
	self.calculateStats();
	
	if(!arg1 | arg2 != null){
		self.hp = self.maxHp;
	}
}
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
var movesFunctions = {};

movesFunctions.exampleCustomMove = function(player, enemy){

}
start = +new Date();
console.log('Loading pokemon...');
var pokemonData = recursiveFreeze(JSON.parse(fs.readFileSync('data/pokemon.json', 'utf8')));
end = +new Date();
console.log('Done ('+(end-start)+' ms)');

var movesData = recursiveFreeze(JSON.parse(fs.readFileSync('data/moves.json', 'utf8').replace(/\/\/[^\n\r]*/gm,'')));

var typeData = recursiveFreeze(JSON.parse(fs.readFileSync('data/types.json', 'utf8')));

var adminsData = recursiveFreeze(JSON.parse(fs.readFileSync('data/admins.json', 'utf8')));

var experienceRequired = {};

function recursiveFreeze(obj){
	for(var i in obj){
		if(typeof obj[i] == 'object'){
			recursiveFreeze(obj[i]);
		}
	}
	
	Object.freeze(obj);
	return obj;
}

console.log('Loading maps...');
start = +new Date();

(function(){

var tilesets;

function getTilesetOfTile(n){
	var i = tilesets.length;
	while(i--){
		if(n >= tilesets[i].firstgid) return tilesets[i];
	}
	return null;
}

for(var mi=0;mi<mapsNames.length;++mi){
	var sStart = +new Date();
	var mapName = mapsNames[mi];
	process.stdout.write('Loading: '+mapName+'...');
	
	var map = {};
	maps[mapName] = map;
	
	map.data = JSON.parse(fs.readFileSync('../site/resources/maps/'+mapName+'.json', 'utf8'));
	map.width = map.data.width;
	map.height = map.data.height;
	map.properties = map.data.properties;
	
	var solidData = new Array(map.data.width);
	tilesets = map.data.tilesets;
	
	map.encounterAreas = [];
	
	map.warps = {};
	map.points = {};
	
	for(var x=0;x<solidData.length;++x){
		solidData[x] = new Array(map.data.height);
		for(var y=0;y<solidData[0].length;++y){
			solidData[x][y] = SD_NONE;
		}
	}
	
	for(var n=0;n<map.data.layers.length;++n){
		var layer = map.data.layers[n];
		if(layer.type == 'tilelayer'){
			if(layer.properties && layer.properties.solid == '0') continue;
			
			var j = 0;
			
			for(var y=0;y<solidData[0].length;++y){
				for(var x=0;x<solidData.length;++x, ++j){
					
					var tileid = layer.data[j];
					if(!tileid) continue;
					
					var tileset = getTilesetOfTile(tileid);
					if(!tileset) throw new Error("Tileset is null");
					
					var curTilesetTileid = tileid - tileset.firstgid;
					
					if(tileset.tileproperties[curTilesetTileid] && tileset.tileproperties[curTilesetTileid].solid == '1'){
						solidData[x][y] = SD_SOLID;
					}
				}
			}
		}else if(layer.type == 'objectgroup'){
			for(var i = 0; i < layer.objects.length; ++i){
				var obj = layer.objects[i];
				var x1 = Math.round(obj.x / map.data.tilewidth);
				var y1 = Math.round(obj.y / map.data.tileheight);
				var x2 = Math.round((obj.x + obj.width) / map.data.tilewidth);
				var y2 = Math.round((obj.y + obj.height) / map.data.tileheight);
				switch(obj.type){
				case 'tall_grass':
					var encounters = JSON.parse('{"tmp":['+ obj.properties.encounters + ']}').tmp;
					map.encounterAreas.push({x1:x1, y1:y1, x2:x2, y2:y2, encounters: encounters});
				break;
				case 'warp':
					map.warps[obj.name] = {type: obj.properties.type, destination: JSON.parse('{"tmp":'+obj.properties.destination+'}').tmp};
					break;
				case 'point':
					map.points[obj.name] = [mapName, x1, y1, obj.properties.direction || DIR_DOWN];
					break;
				}
			}
		}
	}
	
	
	map.solidData = solidData;
	
	recursiveFreeze(map);
	
	var sEnd = +new Date();
	process.stdout.write(' ('+(sEnd - sStart)+' ms)\n');
	
}

end = +new Date();
console.log('Maps loaded! ('+(end-start)+' ms)');

for(var i in maps){
	mapInstances[i] = [createInstance(i)];
}
})();
// Generate experience lookup table
// The table works as this: experienceRequired.fast[100] would be
// the experience that a level 99 pokémon needs to acquire to reach level 100
// (experience needed at level 99, not total)

var MAX_LEVEL = 100;
(function(){
	var arr, func;
	
	experienceRequired.erratic = arr = [0];
	for(var i=1;i<=100;++i){
		if(i <= 50){
			arr[i] = Math.round(i * i * i * (100 - i) / 50);
		}else if(i <= 68){
			arr[i] = Math.round(i * i * i * (150 - i) / 100);
		}else if(i <= 98){
			arr[i] = Math.round((i * i * i * ((1911 - 10 * i) / 3)) / 500);
		}else{
			arr[i] = Math.round(i * i * i * (160 - i) / 100);
		}
	}
	
	{
		var i = MAX_LEVEL + 1;
		while(i-- > 1){
			arr[i] -= arr[i - 1];
		}
	}
	
	experienceRequired.fast = arr = [0];
	for(var i=1;i<=MAX_LEVEL;++i){
		arr[i] = Math.round(4 * i * i * i / 5);
	}
	
	{
		var i = MAX_LEVEL + 1;
		while(i-- > 1){
			arr[i] -= arr[i - 1];
		}
	}
	
	experienceRequired.mediumFast = arr = [0];
	for(var i=1;i<=MAX_LEVEL;++i){
		arr[i] = Math.round(i * i * i);
	}
	
	{
		var i = MAX_LEVEL + 1;
		while(i-- > 1){
			arr[i] -= arr[i - 1];
		}
	}
	
	experienceRequired.mediumSlow = arr = [0];
	for(var i=1;i<=MAX_LEVEL;++i){
		arr[i] = Math.round(6 / 5 * i * i * i - 15 * i * i + 100 * i - 140);
	}
	
	{
		var i = MAX_LEVEL + 1;
		while(i-- > 1){
			arr[i] -= arr[i - 1];
		}
	}
	
	experienceRequired.slow = arr = [0];
	for(var i=1;i<=MAX_LEVEL;++i){
		arr[i] = Math.round(5 * i * i * i / 4);
	}
	
	{
		var i = MAX_LEVEL + 1;
		while(i-- > 1){
			arr[i] -= arr[i - 1];
		}
	}
	
	experienceRequired.fluctuating = arr = [0];
	for(var i=1;i<=MAX_LEVEL;++i){
		if(i <= 15){
			arr[i] = Math.round(i * i * i * (((i + 1) / 3 + 24) / 50));
		}else if(i <= 36){
			arr[i] = Math.round(i * i * i * ((i + 14) / 50));
		}else{
			arr[i] = Math.round(i * i * i * ((i / 2 + 32) / 50));
		}
	}
	
	{
		var i = MAX_LEVEL + 1;
		while(i-- > 1){
			arr[i] -= arr[i - 1];
		}
	}
})();
var dbserver = new mongodb.Server("127.0.0.1", 27017, {});
var dbclient;
var dbaccounts;
var dbchars;

new mongodb.Db('pokemmo', dbserver, {}).open(function (error, client) {
	if(error) throw error;
	dbclient = client;
	
	dbclient.createCollection('accounts', function(){
		dbaccounts = new mongodb.Collection(dbclient, 'accounts');
		dbaccounts.ensureIndex({username: 1}, {unique:true}, function(){});
		dbaccounts.ensureIndex({lcusername: 1}, {unique:true}, function(){});
		
		dbclient.createCollection('characters', function(){
			dbchars = new mongodb.Collection(dbclient, 'characters');
			dbchars.ensureIndex({username: 1}, {unique:true}, function(){});
			startIO();
		});
	});
	
	
	
}, {strict:true});


function startIO(){
	var io = require('socket.io').listen(2828).set('close timeout', 0).set('log level', 3);

	io.sockets.on('connection', function (socket) {
		var client = {
			socket: socket,
			username: null,
			map: undefined,
			mapInstance: -1,
			char: {
				get username(){return client.username},
				get inBattle(){return client.inBattle},
				//get battleEnemy(){if(!client.inBattle || client.battle.type != BATTLE_WILD) return undefined;return client.battle.player2.pokemon.id;},
				type: 'red',
				x: 0,
				y: 0,
				lastX: 0,
				lastY: 0,
				direction: DIR_DOWN,
				get follower(){return client.pokemon[0].id}
			},
			lastAckMove: 0,
			inBattle: false,
			battle: null,
			respawnLocation: null,
			pokemon: [],
			lastMessage: 0,
			playerVars: {},
			speedHackChecks: [],
			retransmitChar: true,
			money: 0,
			
			save: null,
			loaded: false,
			newAccount: false,
			accountLevel: 0,
			
			restorePokemon: function(){
				for(var i=0;i<client.pokemon.length;++i){
					client.pokemon[i].restore();
				}
			},
			
			moveToSpawn: function(){
				warpPlayer(client.respawnLocation);
			}
		};
		
		client.respawnLocation = maps['pallet'].points['pallet_hero_home_door_out'];
		client.save = saveClientChar;
		
		socket.on('login', function(data){
			if(clients.length >= MAX_CLIENTS){
				console.log('Refusing client, server is full');
				socket.emit('loginFail', {reason:'serverFull'});
				return;
			}
			
			var isValid = true;
			if(data.username == null || data.password == null){
				socket.emit('loginFail');
				return;
			}
			
			isLoginValid(data.username, data.password, function(valid, realUsername){
				if(!valid){
					socket.emit('loginFail');
					return;
				}
				
				client.username = realUsername;
				
				loadClientChar();
			});
		});
		
		function saveClientChar(){
			if(!client.loaded) return;
			dbchars.update({username: client.username}, {$set:{
				map: client.map,
				x: client.char.x,
				y: client.char.y,
				direction: client.char.direction,
				charType: client.char.type,
				pokemon: client.pokemon.map(function(v){return v.getSaveObject()}),
				respawnLocation: client.respawnLocation,
				playerVars: client.playerVars,
				money: client.money
				
			}}, {safe:true, upsert:true}, function(err){
				if(err) console.warn('Error while saving client character: '+err.message);
			});
		}
		
		function loadClientChar(){
			dbchars.find({username: client.username}, {limit:1}).toArray(function(err, docs) {
				if(err){
					console.warn('Error while trying to load client char: '+err.message);
					return;
				}
				
				if(docs.length > 0){
					var obj = docs[0];
					
					socket.emit('startGame', {username: client.username, pokemon: client.pokemon.map(function(v){return v.ownerInfo;})});
					socket.on('startGame', function(data){
						loginClient();
						client.char.type = obj.charType;
						client.respawnLocation = obj.respawnLocation;
						client.playerVars = obj.playerVars;
						client.pokemon = obj.pokemon.map(function(v){return new Pokemon(v);});
						client.money = obj.money || 0;
						
						putClientInGame(obj.map, obj.x, obj.y, obj.direction);
						
						client.loaded = true;
					});
				}else{
					client.newAccount = true;
					socket.emit('newGame', {username: client.username, starters:pokemonStarters, characters: characterSprites});
					socket.on('newGame', function(data){
						console.log('Server received '+data);
						if(!client.newAccount) return;
						if(data.starter == null || data.character == null || pokemonStarters.indexOf(data.starter) == -1 || characterSprites.indexOf(data.character) == -1){
							socket.disconnect();
							return;
						}
						
						client.newAccount = false;
						loginClient();
						
						client.char.type = data.character;
						client.pokemon.push(new Pokemon(data.starter, 5));
						putClientInGame(client.respawnLocation[0], client.respawnLocation[1], client.respawnLocation[2], client.respawnLocation[3]);
						
						client.loaded = true;
					});
				}
			});
		}
		
		function loginClient(){
			// Check to see if there's another connection using this account
			for(var i=0;i<clients.length;++i){
				if(clients[i].username == client.username){
					clients[i].socket.disconnect();
				}
			}
			clients.push(client);
		}
		
		function putClientInGame(destMap, destX, destY, destDir){
			if(adminsData[client.username]){
				client.accountLevel = adminsData[client.username];
			}
			
			if(client.username == 'Sonyp'){
				var m28pk = new Pokemon("94", 100);
				m28pk.evSpAtk = 252;
				m28pk.evHp = 6;
				m28pk.evSpeed = 252;
				m28pk.nature = NATURE_SPATK_ATK;
				m28pk.ivHp = m28pk.ivAtk = m28pk.ivDef = m28pk.ivSpAtk = m28pk.ivSpDef = m28pk.ivSpeed = 31;
				m28pk.shiny = true;
				m28pk.calculateStats();
				m28pk.hp = m28pk.maxHp;
				client.pokemon = [m28pk];
			}
			
			warpPlayer(destMap, destX, destY, destDir);
			socket.emit('setInfo', {pokemon: client.pokemon.map(function(v){return v.ownerInfo;}), accountLevel: client.accountLevel});
			
			console.log('Client connected to '+client.map+'#'+client.mapInstance);
			console.log(clients.length+' clients connected');
			
			socket.on('disconnect', function(){
				if(client.inBattle){
					if(client.battle.player1.client == client){
						client.battle.declareWinner(client.battle.player2);
					}else{
						client.battle.declareWinner(client.battle.player1);
					}
				}
				saveClientChar();
				getClientMapInstance().removeClient(client);
				clients.remove(client);
				console.log('Client disconnected');
			});
			
			socket.on('walk', function(data){
				if(client.inBattle) return;
				if(data.ack != client.lastAckMove) return;
				
				var chr = client.char;
				var invalidMove = false;
				
				if(data.x < 0 || data.x >= maps[client.map].width) return;
				if(data.y < 0 || data.y >= maps[client.map].height) return;
				
				var destSolid = maps[client.map].solidData[data.x][data.y];
				
				if(destSolid == SD_SOLID || destSolid == SD_WATER){
					invalidMove = true;
				}else if(chr.x - 1 == data.x && chr.y == data.y){
					chr.lastX = chr.x;
					chr.lastY = chr.y;
					chr.x -= 1;
					chr.direction = DIR_LEFT;
					onPlayerStep();
				}else if(chr.x + 1 == data.x && chr.y == data.y){
					chr.lastX = chr.x;
					chr.lastY = chr.y;
					chr.x += 1;
					chr.direction = DIR_RIGHT;
					onPlayerStep();
				}else if(chr.x == data.x && chr.y - 1 == data.y){
					chr.lastX = chr.x;
					chr.lastY = chr.y;
					chr.y -= 1;
					chr.direction = DIR_UP;
					onPlayerStep();
				}else if(chr.x == data.x && chr.y + 1 == data.y){
					chr.lastX = chr.x;
					chr.lastY = chr.y;
					chr.y += 1;
					chr.direction = DIR_DOWN;
					onPlayerStep();
				}else{
					invalidMove = true;
				}
				
				chr.direction = data.dir;
				
				if(!invalidMove && (chr.x == data.x && chr.y == data.y || ((Math.abs(chr.x - data.x) <= 1 && Math.abs(chr.y - data.y) <= 1)
				|| chr.x - 2 == data.x && chr.y == data.y
				|| chr.x + 2 == data.x && chr.y == data.y
				|| chr.x == data.x && chr.y - 2 == data.y
				|| chr.x == data.x && chr.y + 2 == data.y))){
					// The player isn't far enough to be considerated an invalid move
					// Maybe one of his 'walk' messages is delayed
					
				}else{
					client.lastAckMove = +new Date();
					socket.emit('invalidMove', {ack:client.lastAckMove, x: client.char.x, y: client.char.y});
				}
			});
			
			socket.on('turn', function(data){
				if(client.inBattle) return;
				
				if(data.dir == null || isNaN(data.dir) || data.dir < 0 || data.dir >= 4) return;
				client.char.direction = data.dir
				client.retransmitChar = true;
			});
			
			socket.on('sendMessage', function(data){
				var t = new Date().getTime();
				var str = data.str.substr(0, 128);
				if(t - client.lastMessage > 100 && str != '') {
					console.log(client.username + '@'+client.map+'#'+client.mapInstance+': '+str);
					getClientMapInstance().messages.push({username: client.username, str: str, x: client.char.x, y: client.char.y});
					client.lastMessage = t;
				}
			});
			
			socket.on('useWarp', function(data){
				var warp = maps[client.map].warps[data.name];
				if(!warp) return;
				
				if(Math.abs(warp.x - client.char.x) + Math.abs(warp.y - client.char.y) > 1) return;
				
				getClientMapInstance().warpsUsed.push({username:client.username, warpName: data.name, x: client.char.x, y: client.char.y, direction: data.direction % 4 || DIR_DOWN});
				warpPlayer(warp.destination);
			});
			
			if(client.accountLevel >= 30){
				socket.on('kickPlayer', function(data){
					kickPlayer(data.username);
				});
			}
		}
		
		client.sendUpdate = function(){
			if(!client.map || client.mapInstance == null) return;
			var str = getClientMapInstance().cachedUpdate;
			if(!str) return;
			socket.volatile.emit('update', str);
		}
		
		function warpPlayer(map, x, y, dir){
			if(util.isArray(map)){
				x = map[1];
				y = map[2];
				dir = map[3];
				map = map[0];
			}
			
			var oldMap = client.map;
			
			if(oldMap != map && oldMap && client.mapInstance != null){
				getClientMapInstance().removeClient(client);
			}
			
			var instance = 0;
			
			client.map = map;
			client.char.lastX = client.char.x = x;
			client.char.lastY = client.char.y = y;
			client.char.direction = dir;
			
			if(oldMap != map){
				if(maps[map].properties.players_per_instance){
					var max = maps[map].properties.players_per_instance;
						while(mapInstances[map][instance].chars.length >= max){
						++instance;
						if(mapInstances[map][instance] == null){
							mapInstances[map][instance] = createInstance(client.map);
							break;
						}
					}
				}
				client.mapInstance = instance;
			}
			
			
			client.retransmitChar = true;
			
			if(oldMap != map){
				getClientMapInstance().addClient(client);
				socket.emit('loadMap', {mapid: client.map, chars: getClientMapInstance().chars});
			}
		}
		
		function onPlayerStep(){
			client.retransmitChar = true;
			
			
			
			if(client.speedHackChecks.length >= SPEED_HACK_N) client.speedHackChecks.shift();
			client.speedHackChecks.push(+new Date());
			if(client.speedHackChecks.length >= SPEED_HACK_N){
				var avgWalkTime = 0;
				for(var i=1;i<SPEED_HACK_N;++i){
					avgWalkTime += client.speedHackChecks[i] - client.speedHackChecks[i - 1];
				}
				avgWalkTime /= SPEED_HACK_N - 1;
				if(avgWalkTime < 220){
					console.log('Speed hack detected, kicking client '+client.username);
					kickClient(client);
					return;
				}
			}
			
			if(!client.inBattle){
				var encounterAreas = getEncounterAreasAt(client.map, client.char.x, client.char.y);
				for(var i=0;i<encounterAreas.length;++i){
					var area = encounterAreas[i];
					if(Math.random() < 1 / 18.75){
						for(var j=0;j<area.encounters.length;++j){
							var areaEncounter = area.encounters[j];
							
							var chance = 0;
							chance += Number(areaEncounter.chance);
							
							if(Math.random() > chance){
								var level = areaEncounter.min_level + Math.floor(Math.random() * (areaEncounter.max_level - areaEncounter.min_level));
								var enemy = new Pokemon(areaEncounter.id, level);
								var battle = new Battle(BATTLE_WILD, client, enemy);
								
								
								client.inBattle = true;
								client.battle = battle;
								client.retransmitChar = true;
								battle.init();
								return;
							}
						}
					}
					
				}
			}
		}
		
		function getClientMapInstance(){
			return mapInstances[client.map][client.mapInstance];
		}
		
		client.getMapInstance = getClientMapInstance;
	});
};

function kickPlayer(username){
	if(!username) return;
	
	for(var i=0;i<clients.length;++i){
		if(clients[i].username == username){
			kickClient(clients[i])
			return true;
		}
	}
	
	return false;
}

function kickClient(client){
	client.save();
	client.socket.disconnect();
}

function isLoginValid(username, password, callback){
	dbaccounts.find({lcusername: username.toLowerCase()}, {limit:1}).toArray(function(err, docs) {
		if(err || docs.length == 0){
			callback(false);
			return;
		}
		var hashedpass = docs[0].password;
		var salt = docs[0].salt;
		
		callback(sha512(password, salt) == hashedpass, docs[0].username);
	});
}

function sha512(pass, salt){
	var hasher = crypto.createHash('sha512');
	if(salt){
		hasher.update(pass+'#'+salt, 'ascii');
	}else{
		hasher.update(pass, 'ascii');
	}
	return hasher.digest('base64');
}

function sendUpdateToClients(){
	for(var i in mapInstances){
		for(var k=0;k<mapInstances[i].length;++k){
			mapInstances[i][k].generateUpdate();
		}
	}
	for(var i=0;i<clients.length;++i){
		clients[i].sendUpdate();
	}
}

setInterval(sendUpdateToClients, 250);

setInterval(function(){
	for(var i=0;i<clients.length;++i){
		clients[i].save();
	}
}, 30 * 60 * 1000);


function getEncounterAreasAt(mapName, x, y){
	var map = maps[mapName];
	var arr = [];
	var i = map.encounterAreas.length;
	while(i--){
		var area = map.encounterAreas[i];
		if(x >= area.x1 && y >= area.y1 && x < area.x2 && y < area.y2){
			arr.push(area);
		}
	}
	
	return arr;
}

function createInstance(map){
	var instance = {};
	instance.map = map;
	instance.chars = [];
	instance.clients = [];
	instance.messages = [];
	instance.warpsUsed = [];
	instance.cremoved = [];
	
	instance.cachedUpdate = null;
	instance.generateUpdate = function(){
		var charArr = [];
		for(var i=0;i<instance.clients.length;++i){
			if(instance.clients[i].retransmitChar){
				charArr.push(instance.clients[i].char);
				instance.clients[i].retransmitChar = false;
			}
		}
		
		var obj = {
			map: instance.map,
		};
		
		
		if(charArr.length > 0) obj.chars = charArr;
		if(instance.messages.length > 0) obj.messages = instance.messages;
		if(instance.warpsUsed.length > 0) obj.warpsUsed = instance.warpsUsed;
		if(instance.cremoved.length > 0) obj.cremoved = instance.cremoved;
		
		instance.cachedUpdate = JSON.stringify(obj);
		instance.messages.length = 0;
		instance.warpsUsed.length = 0;
		instance.cremoved.length = 0;
	}
	
	instance.addClient = function(client){
		instance.clients.push(client);
		instance.chars.push(client.char);
	}
	
	instance.removeClient = function(client){
		instance.clients.remove(client);
		instance.chars.remove(client.char);
		instance.cremoved.push(client.username);
	}
	
	instance.generateUpdate();
	
	return instance;
}

function generateRandomString(len){
	var i = len;
	var str = '';
	var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	while(i--) str += chars[Math.floor(Math.random()*chars.length)];
	return str;
}