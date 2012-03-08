"use strict";

var MAX_CLIENTS = 250;

var io = require('socket.io').listen(2828).set('close timeout', 0).set('log level', 3);
var fs = require('fs');
var util = require('util');

var mapsNames = ['pallet', 'pallet_hero_home_1f'];
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
		--i;
	}
};

// var starters = [1, 4, 7, 10, 13, 16, 25, 29, 32, 43, 60, 66, 69, 74, 92, 133];

// #include "Pokemon.js"

// #include "Battle.js"

// #include "movesFunctions.js"

start = +new Date();
console.log('Loading pokemon...');
var pokemonData = recursiveFreeze(JSON.parse(fs.readFileSync('data/pokemon.json', 'utf8')));
end = +new Date();
console.log('Done ('+(end-start)+' ms)');

var movesData = recursiveFreeze(JSON.parse(fs.readFileSync('data/moves.json', 'utf8')));

var typeData = recursiveFreeze(JSON.parse(fs.readFileSync('data/types.json', 'utf8')));

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

// #include "loadMaps.js"

// #include "loadExperience.js"



io.sockets.on('connection', function (socket) {
	if(clients.length >= MAX_CLIENTS){
		console.log('Refusing client, server is full');
		socket.disconnect();
		return;
	}
	
	var client = {
		socket: socket,
		id: generateRandomString(16),
		username: generateRandomString(5),
		map: undefined,
		mapInstance: -1,
		char: {
			get id(){return client.id},
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
		respawnLocation: ["pallet", 16, 56, DIR_DOWN],
		pokemon: [],
		lastMessage: 0,
		playerVars: {},
		speedHackChecks: [],
		
		restorePokemon: function(){
			for(var i=0;i<client.pokemon.length;++i){
				client.pokemon[i].restore();
			}
		},
		
		moveToSpawn: function(){
			warpPlayer(client.respawnLocation);
		}
	};
	
	
	client.pokemon.push(new Pokemon(Math.floor(Math.random()*3)*3+1+"", 5));
	
	client.respawnLocation = maps['pallet'].points['pallet_hero_home_door_out'];
	client.moveToSpawn();
	
	clients.push(client);
	console.log('Client connected to '+client.map+'#'+client.mapInstance);
	console.log(clients.length+' clients connected');
	
	socket.emit('setInfo', {id: client.id, pokemon: client.pokemon.map(function(v){return v.ownerInfo;})});
	
	
	socket.on('disconnect', function(){
		getClientMapInstance().chars.remove(client.char);
		clients.remove(client);
		console.log('Client disconnected');
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
		
		getClientMapInstance().warpsUsed.push({id: client.id, warpName: data.name, x: client.char.x, y: client.char.y, direction: data.direction % 4 || DIR_DOWN});
		warpPlayer(warp.destination);
	});
	
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
			getClientMapInstance().chars.remove(client.char);
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
		
		
		if(oldMap != map){
			getClientMapInstance().chars.push(client.char);
			socket.emit('loadMap', {mapid: client.map, chars: getClientMapInstance().chars});
		}
	}
	
	function onPlayerStep(){
		if(client.inBattle) return;
		
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
				socket.disconnect();
				return;
			}
		}
		
		
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
	
	function getClientMapInstance(){
		return mapInstances[client.map][client.mapInstance];
	}
});

setInterval(function(){
	for(var i in mapInstances){
		for(var k=0;k<mapInstances[i].length;++k){
			mapInstances[i][k].generateUpdate();
		}
	}
	for(var i=0;i<clients.length;++i){
		clients[i].sendUpdate();
	}
}, 250);

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
	instance.messages = [];
	instance.warpsUsed = [];
	
	instance.cachedUpdate = null;
	instance.generateUpdate = function(){
		var obj = {
			map: instance.map,
			chars: instance.chars,
			messages: instance.messages,
			warpsUsed: instance.warpsUsed
		};
		instance.cachedUpdate = JSON.stringify(obj);
		instance.messages.length = 0;
		instance.warpsUsed.length = 0;
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