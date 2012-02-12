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

io.sockets.on('connection', function (socket) {
	/*socket.emit('news', { hello: 'world' });
	socket.on('my other event', function (data) {
	console.log(data);
	});*/

	var client = {
		id: generateRandomString(16),
		map: 'pallet',
		char: {
			get id(){return client.id},
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
		}else{
			client.lastAckMove = +new Date();
			socket.emit('invalidMove', {ack:client.lastAckMove, x: client.char.x, y: client.char.y});
		}
	});
	
	socket.on('turn', function(data){
		client.char.direction = data.dir % 4;
	});
	
	function sendUpdate(){
		socket.volatile.emit('update', {chars:maps[client.map].chars});
	}
});


function PlayerPokemon(id, level){
	var self = this;
	self.id = String(id);
	self.level = Math.min(Math.max(2, level), 100);
	
	self.calculateExpGain = function(isTrainer){
		return ((isTrainer ? 1.5 : 1) * pokemonData[self.id].baseExp * self.level) / 7;
	}
}

function generateRandomString(len){
	var i = len;
	var str = '';
	var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	while(i--) str += chars[Math.floor(Math.random()*chars.length)];
	return str;
}