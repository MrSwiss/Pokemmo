var io = require('socket.io').listen(2828).configure({'close timeout':0});
var fs = require('fs');

var mapsNames = ['pallet'];
var clients = [];
var maps = {};

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

function Pokemon(id, level){
	var self = this;
	
	var MAX_EV = 510;
	var MAX_INDIVIDUAL_EV = 255;
	
	self.id = String(id);
	self.level = Math.min(Math.max(2, level), 100);
	
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
	
	self.shiny = (1/8192 > Math.random());
	self.moves = [null, null, null, null];
	self.movesPP = [0, 0, 0, 0];
	self.movesMaxPP = [0, 0, 0, 0];
	
	
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
		get training(){return (self.evHp + self.evAtk + self.evDef + self.SpAtk + self.evSpDef + self.evSpeed) / MAX_EV}
	};
	
	
	self.calculateExpGain = function(isTrainer){
		return ((isTrainer ? 1.5 : 1) * pokemonData[self.id].baseExp * self.level) / 7;
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
			return Math.floor((iv + (2 * base) + (ev / 4)) * self.level / 100 + 5);
		}
		
		self.maxHp = Math.floor((((self.ivHp + (2 * pokemonData[self.id].baseStats.hp)) + (self.evHp / 4) + 100) * self.level) / 100 + 10);
		self.atk = calculateSingleStat(pokemonData[self.id].baseStats.atk, self.ivAtk, self.evAtk);
		self.def = calculateSingleStat(pokemonData[self.id].baseStats.def, self.ivDef, self.evDef);
		self.spAtk = calculateSingleStat(pokemonData[self.id].baseStats.spAtk, self.ivSpAtk, self.evSpAtk);
		self.spDef = calculateSingleStat(pokemonData[self.id].baseStats.spDef, self.ivSpDef, self.evSpDef);
		self.speed = calculateSingleStat(pokemonData[self.id].baseStats.speed, self.ivSpeed, self.evSpeed);
		
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
			self.moves[i] = self.movesMaxPP[i];
		}
	}
	
	self.getUsableMoves = function(){
		var list = [];
		for(var i=0;i<moves.length;++i){
			if(moves[i] == null) continue;
			if(movesPP[i] <= 0) continue;
			list.push(i);
		}
		return list;
	}
	
	// Make it learn the 4 highest level moves for his level
	var j = 0;
	var learnset = pokemonData[self.id].learnset;
	for(var i=0;i<learnset.length;++i){
		if(movesData[learnset[i].move] == null) continue;
		if(learnset[i].level > self.level) break;
		self.moves[j] = learnset[i].move;
		self.movesMaxPP[j] = self.movesPP[j] = Number(movesData[learnset[i].move].pp);
		
		j = (j+1) % 4;
	}
	
	self.calculateStats();
	self.hp = self.maxHp;
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
	var pendingMoves = 0;
	
	var player1 = {}, player2 = {};
	
	var runAttempts = 0;
	
	var winner;
	
	switch(type){
	case BATTLE_WILD:
		var client = player1.client = arg1;
		player1.pokemon = client.pokemon[0];
		player1.pokemonList = client.pokemon;
		
		player2.pokemon = arg2;
		player2.pokemonList = [arg2];
		break;
	}
	
	self.wildInfo = {
		get curPokemon(){return player1.pokemon.ownerInfo},
		get enemy(){return arg2;}
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
var movesFunctions = {};

movesFunctions.exampleCustomMove = function(player, enemy){

}
start = +new Date();
console.log('Loading pokemon...');
var pokemonData = JSON.parse(fs.readFileSync('data/pokemon.json', 'utf8'));
end = +new Date();
console.log('Done ('+(end-start)+' ms)');

var movesData = JSON.parse(fs.readFileSync('data/moves.json', 'utf8'));

var typeData = JSON.parse(fs.readFileSync('data/types.json', 'utf8'));

var experienceRequired = {};

console.log('Loading maps...');
start = +new Date();
for(var i=0;i<mapsNames.length;++i){
	var mapName = mapsNames[i];
	console.log('Loading: '+mapName+'...');
	
	var map = {};
	maps[mapName] = map;
	
	map.data = JSON.parse(fs.readFileSync('../site/resources/maps/'+mapName+'.json', 'utf8'));
	map.chars = [];
	
	
	
	var solidData = new Array(map.data.width);
	var tilesets = map.data.tilesets;
	
	map.encounterAreas = [];
	
	
	function getTilesetOfTile(n){
		var i = tilesets.length;
		while(i--){
			if(n >= tilesets[i].firstgid) return tilesets[i];
		}
		return null;
	}
	
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
				}
			}
		}
	}
	
	
	
	map.solidData = solidData;
}

end = +new Date();
console.log('Maps loaded! ('+(end-start)+' ms)');
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
io.sockets.on('connection', function (socket) {
	var client = {
		socket: socket,
		id: generateRandomString(16),
		username: generateRandomString(5),
		map: 'pallet',
		char: {
			get id(){return client.id},
			get inBattle(){return client.inBattle},
			type: 'red',
			x: 16,
			y: 56,
			direction: DIR_DOWN
		},
		lastAckMove: 0,
		inBattle: false,
		battle: null,
		respawnLocation: ["pallet", 6, 48],
		pokemon: [],
		messageQueue: [],
		lastMessage: 0
	};
	
	clients.push(client);
	
	client.pokemon.push(new Pokemon("1", 5));
	client.pokemon.push(new Pokemon("1", 5));
	client.pokemon.push(new Pokemon("1", 5));
	client.pokemon.push(new Pokemon("1", 5));
	client.pokemon.push(new Pokemon("1", 5));
	client.pokemon.push(new Pokemon("1", 5));
	
	maps[client.map].chars.push(client.char);
	
	socket.emit('setInfo', {id: client.id, pokemon: client.pokemon.map(function(v){return v.ownerInfo;})});
	socket.emit('loadMap', {mapid: client.map});
	socket.emit('createChars', {arr:maps[client.map].chars});
	
	var updateInterval = setInterval(sendUpdate, 250);
	
	socket.on('disconnect', function(){
		var i = maps[client.map].chars.indexOf(client.char);
		if(i != -1){
			maps[client.map].chars.splice(i, 1);
		}else{
			console.log("Couldn't remove character!");
		}
	});
	
	socket.on('walk', function(data){
		if(client.inBattle) return;
		if(data.ack != client.lastAckMove) return;
		
		var chr = client.char;
		var invalidMove = false;
		
		var destSolid = maps[client.map].solidData[data.x][data.y];
		
		if(destSolid == SD_SOLID || destSolid == SD_WATER){
			invalidMove = true;
		}else if(chr.x - 1 == data.x && chr.y == data.y){
			chr.x -= 1;
			chr.direction = DIR_LEFT;
			onPlayerStep()
		}else if(chr.x + 1== data.x && chr.y == data.y){
			chr.x += 1;
			chr.direction = DIR_RIGHT;
			onPlayerStep()
		}else if(chr.x == data.x && chr.y - 1 == data.y){
			chr.y -= 1;
			chr.direction = DIR_UP;
			onPlayerStep()
		}else if(chr.x == data.x && chr.y + 1 == data.y){
			chr.y += 1;
			chr.direction = DIR_DOWN;
			onPlayerStep()
		}
		
		chr.direction = data.dir;
		
		if(!invalidMove && (chr.x == data.x && chr.y == data.y || ((Math.abs(chr.x - data.x) <= 1 && Math.abs(chr.y - data.y) <= 1)
		|| chr.x - 2 == data.x && chr.y == data.y
		|| chr.x + 2 == data.x && chr.y == data.y
		|| chr.x == data.x && chr.y - 2 == data.y
		|| chr.x == data.x && chr.y + 2 == data.y))){
			// WOW! It's fucking nothing!
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
	});
	
	socket.on('sendMessage', function(data) {
		if(client.inBattle) return;
		
		var t = new Date().getTime();
		var str = data.str.substr(0, 128);
		if(t - client.lastMessage > 100 && str != '') {
			for (var i=0;i<clients.length;++i) {
				if (clients[i].map == client.map){
					// queue new messages for each client in map
					clients[i].messageQueue.push({username: client.username, str: str, x: client.x, y: client.y});
				}
			}
			client.lastMessage = t;
		}
	});
	
	function sendUpdate(){
		if(client.inBattle){
			client.messageQueue.length = 0;
			return;
		}
		socket.volatile.emit('update', {chars:maps[client.map].chars, messages: client.messageQueue});
		client.messageQueue.length = 0;
	}
	
	function onPlayerStep(){
		if(client.inBattle) return;
		var encounterAreas = getEncounterAreasAt(client.map, client.char.x, client.char.y);
		for(var i=0;i<encounterAreas.length;++i){
			var area = encounterAreas[i];
			for(var j=0;j<area.encounters.length;++j){
				var areaEncounter = area.encounters[j];
				if(Math.random() < 1 / (187.5 / areaEncounter.rate)){
					var level = areaEncounter.min_level + Math.floor(Math.random() * (areaEncounter.max_level - areaEncounter.min_level));
					var enemy = new Pokemon(areaEncounter.id, level);
					var battle = new Battle(BATTLE_WILD, client, enemy);
					
					
					client.inBattle = true;
					client.battle = battle;
					battle.init();
					return;
				}
			}
		}
	}
});

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


function generateRandomString(len){
	var i = len;
	var str = '';
	var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	while(i--) str += chars[Math.floor(Math.random()*chars.length)];
	return str;
}