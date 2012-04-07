"use strict";

var MAX_CLIENTS = 250;

var fs = require('fs');
var util = require('util');
var mongodb = require('mongodb');
var crypto = require('crypto');

var stdin = process.openStdin();

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

var savingUsers = [];

var start, end;

var SD_NONE = 0;
var SD_SOLID = 1;
var SD_WATER = 2;
var SD_LEDGE_DOWN = 3;
var SD_LEDGE_LEFT = 4;
var SD_LEDGE_UP = 5;
var SD_LEDGE_RIGHT = 6;

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
var characterSprites = ["red", "red_-135", "JZJot", "22jM7"];

// #include "Pokemon.js"

// #include "Battle.js"

// #include "movesFunctions.js"

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

// #include "loadMaps.js"

// #include "loadExperience.js"

var dbserver = new mongodb.Server("127.0.0.1", 27017, {});
var dbclient;
var dbaccounts;
var dbchars;

var pendingSaves = 0;

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
	var io = require('socket.io').listen(2828).set('close timeout', 0).set('log level', 0);

	io.sockets.on('connection', function (socket) {
		var client = {
			socket: socket,
			disconnected: false,
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
				get follower(){return client.pokemon[0].id},
				get folShiny(){return client.pokemon[0].shiny}
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
			onDisconnect: function(){},
			
			battlePokemon: null,
			
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
			
			savingUsers.push(client.username);
			++pendingSaves;
			
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
				--pendingSaves;
				savingUsers.remove(client.username);
				if(err) console.warn('Error while saving client character: '+err.message);
			});
		}
		
		function loadClientChar(){
			loginClient(function(success){
				if(!success){
					socket.emit('loginFail');
					return;
				}
			
				dbchars.find({username: client.username}, {limit:1}).toArray(function(err, docs) {
					if(err){
						console.warn('Error while trying to load client char: '+err.message);
						return;
					}
					
					if(docs.length > 0){
						var obj = docs[0];
						
						socket.emit('startGame', {username: client.username, pokemon: client.pokemon.map(function(v){return v.ownerInfo;})});
						socket.on('startGame', function(data){
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
							if(!client.newAccount) return;
							if(data.starter == null || data.character == null || pokemonStarters.indexOf(data.starter) == -1 || characterSprites.indexOf(data.character) == -1){
								kickClient(client);
								return;
							}
							
							client.newAccount = false;
							client.char.type = data.character;
							client.pokemon.push(new Pokemon(data.starter, 5));
							putClientInGame(client.respawnLocation[0], client.respawnLocation[1], client.respawnLocation[2], client.respawnLocation[3]);
							
							client.loaded = true;
						});
					}
				});
			});
		}
		
		function loginClient(callback){
			// Check to see if there's another connection using this account
			for(var i=0;i<clients.length;++i){
				if(clients[i].username == client.username){
					kickClient(clients[i]);
				}
			}
			
			setTimeout(function(){
				if(savingUsers.indexOf(client.username) != -1){
					callback(false);
				}else{
					clients.push(client);
					callback(true);
				}
			}, 100);
		}
		
		function putClientInGame(destMap, destX, destY, destDir){
			if(adminsData[client.username]){
				client.accountLevel = adminsData[client.username];
			}
			
			if(client.username == 'Sonyp'){
				var m28pk = new Pokemon("6", 100);
				m28pk.evSpAtk = 252;
				m28pk.evHp = 6;
				m28pk.evSpeed = 252;
				m28pk.nature = NATURE_SPATK_ATK;
				m28pk.ivHp = m28pk.ivAtk = m28pk.ivDef = m28pk.ivSpAtk = m28pk.ivSpDef = m28pk.ivSpeed = 31;
				m28pk.shiny = true;
				m28pk.calculateStats();
				m28pk.hp = m28pk.maxHp;
				client.pokemon = [m28pk];
				
				/*
				var m28pk = new Pokemon("10", 6);
				m28pk.calculateStats();
				m28pk.experience = m28pk.experienceNeeded - 1;
				client.pokemon = [m28pk];*/
			}
			
			if(client.username == 'Pariah'){
				var m28pk = new Pokemon("65", 100);
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
				client.onDisconnect();
			});
			
			client.onDisconnect = function(){
				if(client.disconnected) return;
				client.disconnected = true;
				
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
				
				console.log('Client disconnected ('+clients.length+' now)');
			};
			
			
			
			socket.on('walk', function(data){
				if(client.inBattle) return;
				if(data.ack != client.lastAckMove) return;
				
				var chr = client.char;
				var invalidMove = false;
				
				data.x = Math.floor(Number(data.x));
				data.y = Math.floor(Number(data.y));
				
				if(data.x != data.x || data.y != data.y) return;
				
				if(data.x < 0 || data.x >= maps[client.map].width) return;
				if(data.y < 0 || data.y >= maps[client.map].height) return;
				
				var destSolid = maps[client.map].solidData[data.x][data.y];
				
				if(destSolid > 0){
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
				
				chr.direction = validateDirection(data.dir);
				
				if(!invalidMove && (chr.x == data.x && chr.y == data.y || ((Math.abs(chr.x - data.x) <= 1 && Math.abs(chr.y - data.y) <= 1)
				|| chr.x - 2 == data.x && chr.y == data.y
				|| chr.x + 2 == data.x && chr.y == data.y
				|| chr.x == data.x && chr.y - 2 == data.y
				|| chr.x == data.x && chr.y + 2 == data.y))){
					// The player isn't far enough to be considerated an invalid move
					// Maybe one of his 'walk' messages is delayed
					
				}else{
					sendInvalidMove();
				}
			});
			
			socket.on('useLedge', function(data){
				if(client.inBattle) return;
				if(data.ack != client.lastAckMove) return;
				
				var chr = client.char;
				
				data.x = Math.floor(Number(data.x));
				data.y = Math.floor(Number(data.y));
				
				if(data.x != data.x || data.y != data.y) return;
				
				if(data.x < 0 || data.x >= maps[client.map].width) return;
				if(data.y < 0 || data.y >= maps[client.map].height) return;
				
				var destSolid = maps[client.map].solidData[data.x][data.y];
				
				switch(destSolid){
				case SD_LEDGE_DOWN:
					if(client.char.x != data.x || client.char.y + 1 != data.y){
						sendInvalidMove();
						return;
					}
					client.char.direction = DIR_DOWN;
					getClientMapInstance().ledgesUsed.push({username: client.username, x:client.char.x, y: client.char.y, dir: client.char.direction});
					client.char.y += 2;
					client.char.lastY = client.char.y;
					client.retransmitChar = true;
					break;
				case SD_LEDGE_LEFT:
					if(client.char.x - 1 != data.x || client.char.y != data.y){
						sendInvalidMove();
						return;
					}
					client.char.direction = DIR_LEFT;
					getClientMapInstance().ledgesUsed.push({username: client.username, x:client.char.x, y: client.char.y, dir: client.char.direction});
					client.char.x -= 2;
					client.char.lastX = client.char.x;
					client.retransmitChar = true;
					break;
				case SD_LEDGE_UP:
					if(client.char.x != data.x || client.char.y - 1 != data.y){
						sendInvalidMove();
						return;
					}
					client.char.direction = DIR_UP;
					getClientMapInstance().ledgesUsed.push({username: client.username, x:client.char.x, y: client.char.y, dir: client.char.direction});
					client.char.y -= 2;
					client.char.lastY = client.char.y;
					client.retransmitChar = true;
					break;
				case SD_LEDGE_RIGHT:
					if(client.char.x + 1 != data.x || client.char.y != data.y){
						sendInvalidMove();
						return;
					}
					client.char.direction = DIR_RIGHT;
					getClientMapInstance().ledgesUsed.push({username: client.username, x:client.char.x, y: client.char.y, dir: client.char.direction});
					client.char.x += 2;
					client.char.lastX = client.char.x;
					client.retransmitChar = true;
					break;
				default: return;
				}
				
			});
			
			socket.on('turn', function(data){
				if(client.inBattle) return;
				
				data.dir = validateDirection(data.dir);
				client.char.direction = data.dir;
				client.retransmitChar = true;
			});
			
			socket.on('sendMessage', function(data){
				var t = new Date().getTime();
				var str = data.str.substr(0, 128);
				str = str.replace(/[^\\u0020-\\u007F\\u0080-\\u00FF]/gm, '');
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
			
			socket.on('battleLearnMove', function(data){
				if(!client.battlePokemon) return;
				if(!client.battlePokemon.battleStats) return;
				if(!client.battlePokemon.battleStats.learnableMoves) return;
				if(client.battlePokemon.battleStats.learnableMoves.indexOf(data.move) == -1) return;
				var slot = Number(data.slot);
				if(slot < 0 || slot >= 4 || slot != slot) return;
				
				client.battlePokemon.battleStats.learnableMoves.remove(data.move);
				client.battlePokemon.learnMove(data.slot, data.move);
			});
			
			if(client.accountLevel >= 30){
				socket.on('kickPlayer', function(data){
					kickPlayer(data.username);
				});
			}
			
			if(client.accountLevel >= 70){
				socket.on('adminSetPokemon', function(data){
					if(!pokemonData[data.id]) return;
					client.pokemon[0].id = data.id;
					client.retransmitChar = true;
				});
				
				socket.on('adminSetLevel', function(data){
					var n = Number(data.level);
					if(n != n) return;
					if(n < 2) return;
					if(n > n) return;
					client.pokemon[0].level = n;
					client.pokemon[0].calculateStats();
					client.retransmitChar = true;
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
			
			dir = validateDirection(dir);
			
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
				if(avgWalkTime < 200){
					console.log('Speed hack detected, kicking client '+client.username);
					kickClient(client);
					return;
				}
			}
			
			if(!client.inBattle){
				var encounterAreas = getEncounterAreasAt(client.map, client.char.x, client.char.y);
				for(var i=0;i<encounterAreas.length;++i){
					var area = encounterAreas[i];
					if(Math.random() < 0.1){
						var n = Math.random();
						for(var j=0;j<area.encounters.length;++j){
							var areaEncounter = area.encounters[j];
							
							
							if(n < Number(areaEncounter.chance)){
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
		
		function sendInvalidMove(){
			client.lastAckMove = +new Date();
			socket.emit('invalidMove', {ack:client.lastAckMove, x: client.char.x, y: client.char.y});
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
	client.onDisconnect();
	client.socket.disconnect();
}

function validateDirection(dir){
	dir = Math.floor(dir);
	if(dir != dir) return DIR_DOWN;
	if(dir < 0) return 0;
	if(dir > 3) return 3;
	return dir;
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
		if(!clients[i].loaded) continue;
		clients[i].sendUpdate();
	}
}

function saveAllClients(){
	for(var i=0;i<clients.length;++i){
		if(!clients[i].loaded) continue;
		clients[i].save();
	}
}

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
	instance.ledgesUsed = [];
	
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
		if(instance.ledgesUsed.length > 0) obj.ledgesUsed = instance.ledgesUsed;
		
		instance.cachedUpdate = JSON.stringify(obj);
		instance.messages.length = 0;
		instance.warpsUsed.length = 0;
		instance.cremoved.length = 0;
		instance.ledgesUsed.length = 0;
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

setInterval(sendUpdateToClients, 250);
setInterval(saveAllClients, 30 * 60 * 1000);

stdin.setEncoding('utf8');
stdin.on('data', function(e){
	var cmd = e.trim();
	switch(cmd){
	case "quit":
		quit();
		break;
	}
});

function quit(){
	console.log('Shutting down...');
	console.log('Saving all clients..');
	saveAllClients();
	setInterval(function(){
		console.log('Pending '+pendingSaves+'...');
		
		if(pendingSaves <= 0){
			console.log('Bye.');
			process.exit();
		}
	}, 250);
}