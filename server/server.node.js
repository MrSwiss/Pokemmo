var io = require('socket.io').listen(2828).configure({'close timeout':0});
var fs = require('fs');

var mapsNames = ['pallet'];
var clients = {};
var maps = {};

var start, end;

var SD_NONE = 0;
var SD_SOLID = 1;
var SD_WATER = 2;

var DIR_DOWN = 0;
var DIR_LEFT = 1;
var DIR_UP = 2;
var DIR_RIGHT = 3;

var pokemonData = JSON.parse(fs.readFileSync('data/pokemon.json', 'utf8'));
var movesData = JSON.parse(fs.readFileSync('data/moves.json', 'utf8'));

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
		if(layer.type != 'tileLayer') continue;
		
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
	}
	
	map.solidData = solidData;
}

end = +new Date();
console.log('Maps loaded! ('+(end-start)+' ms)');

// Generate experience lookup table
// The table works as this: experienceRequired.fast[100] would be
// the experience that a level 99 pokémon needs to acquire to reach level 100
// (experience needed at level 99, not total)
(function(){
	var arr;
	
	experienceRequired.erratic = arr = [0];
	for(var i=1;i<=100;++i){
		if(i <= 50){
			arr[i] = i * i * i * (100 - i) / 50;
		}else if(n <= 68){
			arr[i] = i * i * i * (150 - i) / 100;
		}else if(n <= 98){
			arr[i] = i * i * i * ((1911 - 10 * i) / 3) / 500
		}else{
			arr[i] = i * i * i * (160 - n) / 100;
		}
	}
	
	experienceRequired.fast = arr = [0];
	for(var i=1;i<=100;++i){
		arr[i] = 4 * i * i * i / 5 - arr[i - 1];
		
		arr[i] = Math.floor(arr[i]);
	}
	
	experienceRequired.mediumFast = arr = [0];
	for(var i=1;i<=100;++i){
		arr[i] = i * i * i - arr[i - 1];
		
		arr[i] = Math.floor(arr[i]);
	}
	
	experienceRequired.mediumSlow = arr = [0];
	for(var i=1;i<=100;++i){
		arr[i] = 6 / 5 * i * i * i - 15 * i * i + 100 * i - 140 - arr[i - 1];
		
		arr[i] = Math.floor(arr[i]);
	}
	
	experienceRequired.slow = arr = [0];
	for(var i=1;i<=100;++i){
		arr[i] = 5 * i * i * i / 4 - arr[i - 1];
		
		arr[i] = Math.floor(arr[i]);
	}
	
	experienceRequired.fluctuating = arr = [0];
	for(var i=1;i<=100;++i){
		if(n <= 15){
			arr[i] = i * i * i * (((n + 1) / 3 + 24) / 50);
		}else if(n <= 36){
			arr[i] = i * i * i * ((n + 14) / 50);
		}else{
			arr[i] = i * i * i * ((n / 2 + 32) / 50)
		}
		
		arr[i] = Math.floor(arr[i]);
	}
})();

io.sockets.on('connection', function (socket) {
	var client = {
		id: generateRandomString(16),
		map: 'pallet',
		char: {
			get id(){return client.id},
			get inBattle(){return client.inBattle},
			type: 'red',
			x: 6,
			y: 48,
			direction: DIR_DOWN
		},
		lastAckMove: 0,
		inBattle: false,
		lastPokecenter: ["pallet", 6, 48],
		pokemon: []
	};
	
	client.pokemon.push(new PlayerPokemon("1", 5));
	client.pokemon.push(new PlayerPokemon("1", 5));
	client.pokemon.push(new PlayerPokemon("1", 5));
	client.pokemon.push(new PlayerPokemon("1", 5));
	client.pokemon.push(new PlayerPokemon("1", 5));
	client.pokemon.push(new PlayerPokemon("1", 5));
	
	maps[client.map].chars.push(client.char);
	
	socket.emit('setInfo', {id: client.id, pokemon: client.pokemon});
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
		if(data.ack != client.lastAckMove) return;
		
		var chr = client.char;
		
		if(chr.x - 1 == data.x && chr.y == data.y){
			chr.x -= 1;
			chr.direction = DIR_LEFT;
		}else if(chr.x + 1== data.x && chr.y == data.y){
			chr.x += 1;
			chr.direction = DIR_RIGHT;
		}else if(chr.x == data.x && chr.y - 1 == data.y){
			chr.y -= 1;
			chr.direction = DIR_UP;
		}else if(chr.x == data.x && chr.y + 1 == data.y){
			chr.y += 1;
			chr.direction = DIR_DOWN;
		}
		
		chr.direction = data.dir;
		
		if(chr.x == data.x && chr.y == data.y || ((Math.abs(chr.x - data.x) <= 1 && Math.abs(chr.y - data.y) <= 1)
		|| chr.x - 2 == data.x && chr.y == data.y
		|| chr.x + 2 == data.x && chr.y == data.y
		|| chr.x == data.x && chr.y - 2 == data.y
		|| chr.x == data.x && chr.y + 2 == data.y)){
			// WOW! It's fucking nothing!
			// The player isn't far enough to be considerated an invalid move
			// Maybe one of his 'walk' messages is delayed
		}else{
			client.lastAckMove = +new Date();
			socket.emit('invalidMove', {ack:client.lastAckMove, x: client.char.x, y: client.char.y});
		}
	});
	
	socket.on('turn', function(data){
		if(data.dir == null || isNaN(data.dir) || data.dir < 0 || data.dir >= 4) return;
		client.char.direction = data.dir
	});
	
	function sendUpdate(){
		socket.volatile.emit('update', {chars:maps[client.map].chars});
	}
});


function PlayerPokemon(id, level){
	var self = this;
	
	var MAX_EV = 510;
	var MAX_INDIVIDUAL_EV = 255;
	
	self.id = String(id);
	self.level = Math.min(Math.max(2, level), 100);
	
	self.unique = generateRandomString(16);
	
	self.nickname = null;
	
	self.hp = 0;
	self.maxHp = 0;
	self.atk = 0;
	self.def = 0;
	self.spAtk = 0;
	self.spDef = 0;
	self.speed = 0;
	
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
	
	self.shiny = (1/8192 > Math.random());
	self.moves = [null, null, null, null];
	self.movesPP = [0, 0, 0, 0];
	self.movesMaxPP = [0, 0, 0, 0];
	
	self.calculateExpGain = function(isTrainer){
		return ((isTrainer ? 1.5 : 1) * pokemonData[self.id].baseExp * self.level) / 7;
	}
	
	self.addEV = function(data){
		var total = self.evHp + self.evAtk + self.evDef + self.SpAtk + self.evSpDef + self.evSpeed;
		var tmp;
		if(total > 510) return;
		
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
<<<<<<< HEAD
		
		self.experience = Math.floor((self.experienceNeeded-1) * Math.random());
=======
>>>>>>> 78086bfb578d51b653428242fa5e854ebbd34f2c
	}
	
	
	// Make it learn the 4 highest level moves for his level
	var j = 0;
	var learnset = pokemonData[self.id].learnset;
	for(var i=0;i<learnset.length;++i){
		if(learnset[i].level > self.level) break;
		self.moves[j] = learnset[i].move;
		self.movesMaxPP[j] = self.movesPP[j] = Number(movesData[learnset[i].move].pp);
		
		j = (j+1) % 4;
	}
	
	self.calculateStats();
	self.hp = self.maxHp;
}

function generateRandomString(len){
	var i = len;
	var str = '';
	var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	while(i--) str += chars[Math.floor(Math.random()*chars.length)];
	return str;
}