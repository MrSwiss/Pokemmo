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
		
		if(clients.length >= MAX_CLIENTS){
			console.log('Refusing client, server is full');
			socket.disconnect();
			return;
		}
		
		var client = {
			socket: socket,
			id: generateRandomString(16),
			username: null,
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
			respawnLocation: null,
			pokemon: [],
			lastMessage: 0,
			playerVars: {},
			speedHackChecks: [],
			retransmitChar: true,
			
			save: null,
			loaded: false,
			newAccount: false,
			
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
				playerVars: client.playerVars
				
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
			warpPlayer(destMap, destX, destY, destDir);
			socket.emit('setInfo', {id: client.id, pokemon: client.pokemon.map(function(v){return v.ownerInfo;})});
			
			console.log('Client connected to '+client.map+'#'+client.mapInstance);
			console.log(clients.length+' clients connected');
			
			socket.on('disconnect', function(){
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
						socket.disconnect();
						return;
					}
				}
				
				if(!client.inBattle){
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
			}
			
			function getClientMapInstance(){
				return mapInstances[client.map][client.mapInstance];
			}
		}
	});
};

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
		instance.cremoved.push(client.id);
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