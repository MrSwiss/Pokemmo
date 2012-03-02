"use strict";

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
	var client = {
		socket: socket,
		id: generateRandomString(16),
		username: generateRandomString(5),
		map: 'pallet',
		char: {
			get id(){return client.id},
			get inBattle(){return client.inBattle},
			type: 'red',
			//x: 16,
			//y: 56,
			x: 16,
			y: 56,
			lastX: 0,
			lastY: 0,
			direction: DIR_DOWN,
			get follower(){return client.pokemon[0].id}
		},
		lastAckMove: 0,
		inBattle: false,
		battle: null,
		respawnLocation: ["pallet", 16, 56],
		pokemon: [],
		messageQueue: [],
		lastMessage: 0,
		playerVars: {},
		
		restorePokemon: function(){
			for(var i=0;i<client.pokemon.length;++i){
				client.pokemon[i].restore();
			}
		},
		
		moveToSpawn: function(){
			client.map = client.respawnLocation[0];
			client.char.x = client.respawnLocation[1];
			client.char.y = client.respawnLocation[2];
		}
	};
	
	
	clients.push(client);
	
	client.pokemon.push(new Pokemon(Math.floor(Math.random()*3)*3+1+"", 5));
	/*
	client.pokemon.push(new Pokemon("1", 5));
	client.pokemon.push(new Pokemon("1", 5));
	client.pokemon.push(new Pokemon("1", 5));
	client.pokemon.push(new Pokemon("1", 5));
	client.pokemon.push(new Pokemon("1", 5));
	*/
	
	client.char.lastX = client.char.x;
	client.char.lastY = client.char.y;
	
	maps[client.map].chars.push(client.char);
	
	socket.emit('setInfo', {id: client.id, pokemon: client.pokemon.map(function(v){return v.ownerInfo;})});
	socket.emit('loadMap', {mapid: client.map});
	socket.emit('createChars', {arr:maps[client.map].chars});
	
	socket.on('disconnect', function(){
		var i = maps[client.map].chars.indexOf(client.char);
		if(i != -1){
			maps[client.map].chars.splice(i, 1);
		}else{
			console.log("Couldn't remove character!");
		}
		
		i = clients.indexOf(client);
		if(i != -1){
			clients.splice(i, 1);
		}else{
			console.log("Couldn't remove client!");
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
	
	socket.on('sendMessage', function(data) {
		if(client.inBattle) return;
		
		var t = new Date().getTime();
		var str = data.str.substr(0, 128);
		if(t - client.lastMessage > 100 && str != '') {
			for (var i=0;i<clients.length;++i) {
				if (clients[i].map == client.map){
					// queue new messages for each client in map
					clients[i].messageQueue.push({username: client.username, str: str, x: client.char.x, y: client.char.y});
				}
			}
			client.lastMessage = t;
		}
	});
	
	client.sendUpdate = function(){
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

setInterval(function(){
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


function generateRandomString(len){
	var i = len;
	var str = '';
	var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	while(i--) str += chars[Math.floor(Math.random()*chars.length)];
	return str;
}