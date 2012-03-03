
// Adds Array.filter if the browser doesn't support it
Array.prototype.filter||(Array.prototype.filter=function(b,e){var f=this.length;if("function"!=typeof b)
throw new TypeError;for(var c=[],a=0;a<f;a++)if(a in this){var d=this[a];b.call(e,d,a,this)&&c.push(d)}return c});

Array.prototype.remove = function(e){
	var i = 0;
	var arr = this;
	
	while((i = arr.indexOf(e, i)) != -1){
		arr.splice(i, 1);
		--i;
	}
};

(function(window, $q){
"use strict";

var serverHost = 'http://localhost:2828';

var isPhone = (navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i));
var isLandscape = function(){return canvas.width == 480 && canvas.height == 300};

var canvas, ctx;
var gameCanvas;
var gameCtx;
var onScreenCanvas;
var onScreenCtx;
var tmpCanvas = document.createElement('canvas');
var tmpCtx = tmpCanvas.getContext('2d');

var curMapId;
var curMap;
var socket;

/** @const */
var ST_LOADING = 1,
	ST_MAP = 2;

var inBattle = false;

/** @const */
var DIR_DOWN = 0,
	DIR_LEFT = 1,
	DIR_UP = 2,
	DIR_RIGHT = 3;

/** @const */
var TYPE = {
	NORMAL: 0,
	FIRE: 1,
	WATER: 2,
	ICE: 3,
	ELECTRIC: 4,
	GRASS: 5,
	GROUND: 6,
	ROCK: 7,
	FIGHT: 8,
	STEEL: 9,
	DARK: 10,
	PSYCHIC: 11,
	FLYING: 12,
	BUG: 13,
	POISON: 14,
	GHOST: 15,
	DRAGON: 16,
	UNKNOWN: 17
};

var state;

var loadingMapRender;

var characters = [];
var objects = [];
var pokemonParty = [];

var pokemonData;

var myId = null;
var keysDown = [];

var CHAR_MOVE_WAIT = 0.3;

var screenWidth = isPhone ? 480 : 780;
var screenHeight = isPhone ? 320 : 540;

var CHAR_WIDTH = 32;
var CHAR_HEIGHT = 64;

var cameraX = 0;
var cameraY = 0;

var chatBox;
var chatLog = [];
var inChat = false;

var lastAckMove = 0;
var loadedChars = false;
var drawPlayerChar = true;

var numRTicks = 0;

var moves = {};

var iOSUI;
var iOSAButtonPos = {x:430, y:200};
var iOSBButtonPos = {x:370, y:250};
var uiAButtonDown = false;
var uiBButtonDown = false;
if(isPhone){
	iOSUI = new Image();
	iOSUI.src = 'resources/ui/ios_ui.png';
}

var battleBackground;

var AButtonHooks = [];
var BButtonHooks = [];
var dirButtonHooks = [];
var fireAHooks = false;
var fireBHooks = false;
var fireDirHooks = false;
var arrowKeysPressed = [];
var renderHooks = [];
var gameRenderHooks = [];
var gameObjects = [];


var battle;

var res = {};
res.playerBacksprite = new Image();

function isKeyDown(n){return !!keysDown[n];};

function parseMap(data){
	return new Map(data);
}

function Map(data){
	this.width = data.width;
	this.height = data.height;
	this.tilesets = [];
	this.layers = [];
	this.tilewidth = data.tilewidth;
	this.tileheight = data.tileheight;
	
	for(var i = 0; i< data.tilesets.length; ++i){
		this.tilesets.push(new Tileset(data.tilesets[i]));
	}
	
	for(var i = 0; i< data.layers.length; ++i){
		this.layers.push(new Layer(data.layers[i]));
	}
}

function loadMap(id){
	state = ST_LOADING;
	curMap = null;
	curMapId = id;
	
	characters = [];
	gameObjects = [];
	loadedChars = false;
	
	var pending = 0;
	var completed = 0;
	var error = false;
	
	loadImage('miscSprites', 'resources/tilesets/misc.png');
	loadImage('uiPokemon', 'resources/ui/pokemon.png');
	loadImage('uiChat', 'resources/ui/chat.png');
	loadImage('uiCharInBattle', 'resources/ui/char_in_battle.png');
	loadImage('battleTextBackground', 'resources/ui/battle_text.png');
	loadImage('battleMoveMenu', 'resources/ui/battle_move_menu.png');
	loadImage('battleTrainerStatus', 'resources/ui/battle_trainer_status.png');
	loadImage('battleMisc', 'resources/ui/battle_misc.png');
	loadImage('battlePokeballs', 'resources/ui/battle_pokeballs.png');
	loadImage('battleActionMenu', 'resources/ui/battle_action_menu.png');
	loadImage('types', 'resources/ui/types.png');
	loadImage('battlePokemonBar', 'resources/ui/battle_pokemon_bar.png');
	loadImage('battleHealthBar', 'resources/ui/battle_healthbar.png');
	loadImage('battleEnemyBar', 'resources/ui/battle_enemy_bar.png');
	
	loadJSON('data/pokemon.json', function(data){pokemonData = data});
	loadJSON('resources/maps/'+id+'.json', function(data){
		var map = parseMap(data);
		for(var i=0;i<map.tilesets.length;++i){
			var tileset = map.tilesets[i];
			if(tileset.loaded){
				++completed;
			}else if(tileset.error){
				error = true;
				break;
			}else{
				++pending;
				tileset.onload = function(tileset){
					--pending;
					refresh();
				}
				
				tileset.onerror = function(tileset){
					--pending;
					error = true;
					refresh();
				}
			}
		}
		
		curMap = map;
		
		refresh();
	});
	
	function loadImage(name, src){
		++pending;
		res[name] = new Image();
		res[name].onload = function(){--pending;++completed;};
		res[name].onerror = function(){--pending;error = true;refresh();};
		res[name].src = src;
	}
	
	function loadJSON(src, onload){
		++pending;
		$q.ajax(src, {
			'cache': true,
			'dataType': 'json',
			'success': function(data, textStatus, jqXHR){
				--pending;
				++completed;
				onload(data);
			},
			'error': function(jqXHR, textStatus, errorThrown){
				--pending;
				error = true;
				refresh();
			}
		});
	}
	
	function refresh(){
		if(state != ST_LOADING) return;
		
		ctx.fillStyle = 'rgb(0,0,0)';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = 'rgb(255,255,255)';
		ctx.font = '12pt Courier New';
		
		if(error){
			console.log('Error loading map');
			ctx.fillText('Failed loading files', 10, 30);
		}else{
			if(pending == 0){
				console.log('Map loaded');
				state = ST_MAP;
				
				var step = 0;
				var func = function(){
					ctx.fillStyle = '#000000';
					ctx.globalAlpha = 1 - (step / 8);
					ctx.fillRect(0, 0, canvas.width, canvas.height);
					ctx.globalAlpha = 1;
					++step;
					if(step >= 8){
						unHookRender(func);
					}
				}
				
				hookRender(func);
				
				render();
			}else{
				console.log('Pending: '+pending);
				ctx.fillText('Loading... ' + pending, 10, 30);
			}
		}
		
	}
	
	loadingMapRender = refresh;
	render();
}
function Tileset(data){
	var self = this;
	
	self.firstgid = data.firstgid;
	self.image = new Image();
	self.loaded = false;
	self.error = false;
	
	this.image.onload = function(){
		self.loaded = true;
		if(self.onload) self.onload(self);
	}
	
	this.image.onerror = function(){
		self.error = true;
		if(self.onerror) self.onerror(self);
	}
	
	self.onload = null;
	self.onerror = null;
	
	self.image.src = 'resources/'+data.image.slice(3);
	
	self.imagewidth = data.imagewidth;
	self.imageheight = data.imageheight;
	self.tilewidth = data.tilewidth;
	self.tileheight = data.tileheight;
	self.tileproperties = [];
	for(var i in data.tileproperties){
		if(!data.tileproperties.hasOwnProperty(i)) continue;
		self.tileproperties[i] = data.tileproperties[i];
	}
	
	for(var i = 0, len = (self.imagewidth / self.tilewidth) * (self.imageheight / self.tileheight); i < len; ++i){
		if(!self.tileproperties[i]){
			self.tileproperties[i] = {};
		}
	}
}

function getTilesetOfTile(map, n){
	var tilesets = map.tilesets;
	var i = tilesets.length;
	while(i--){
		if(n >= tilesets[i].firstgid) return tilesets[i];
	}
	return null;
}

function isTileSolid(map, x, y){
	return hasTileProp(map, x, y, 'solid');
}

function isTileWater(map, x, y){
	return hasTileProp(map, x, y, 'water');
}

function isTileGrass(map, x, y){
	return hasTileProp(map, x, y, 'grass');
}

function isTileLedge(map, x, y){
	return hasTileProp(map, x, y, 'ledge');
}

function hasTileProp(map, x, y, prop){
	for(var i=0;i<map.layers.length;++i){
		var layer = map.layers[i];
		
		if(layer.type != 'tilelayer') continue;
		
		if(layer.properties.solid == '0') continue;
		
		var j = y * layer.width + x;
		
		var tileid = layer.data[j];
		if(!tileid) continue;
		
		var tileset = getTilesetOfTile(map, tileid);
		
		if(!tileset) throw new Error("Tileset is null");
		
		var curTilesetTileid = tileid - tileset.firstgid;
		
		if(tileset.tileproperties[curTilesetTileid][prop] == '1') return true;
	}
	
	return false;
}
function Layer(data){
	this.data = data.data;
	this.width = data.width;
	this.height = data.height;
	this.x = data.x;
	this.y = data.y;
	this.type = data.type;
	this.properties = data.properties || {};
}
var transitionStep = 0;
var battleIntroPokeball = new Image();
battleIntroPokeball.src = 'resources/ui/battle_intro_pokeball.png';

function renderMap(ctx, map){
	ctx.fillStyle = 'rgb(0,0,0)';
	ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	for(var i=0;i<map.layers.length;++i){
		var layer = map.layers[i];
		
		if(layer.properties.overchars) continue;
		
		drawLayer(ctx, map, layer);
	}
}

function renderMapOver(ctx, map){
	for(var i=0;i<map.layers.length;++i){
		var layer = map.layers[i];
		
		if(!layer.properties.overchars) continue;
		
		drawLayer(ctx, map, layer);
	}
}

function drawLayer(ctx, map, layer){
	if(layer.type != 'tilelayer') return;
	
	var tilesets = map.tilesets;
	var j=0;
	
	if(layer.x != 0 || layer.y != 0) throw new Error("Assertion failed");
	
	var initialX = Math.max(Math.floor(cameraX), layer.x);
	var initialY = Math.max(Math.floor(cameraY), layer.y);
	var offsetX = getRenderOffsetX();
	var offsetY = getRenderOffsetY();
	var finalX = Math.min(initialX + Math.ceil(screenWidth / curMap.tilewidth) + 1, layer.width);
	var finalY = Math.min(initialY + Math.ceil(screenHeight / curMap.tileheight) + 1, layer.height);
	
	
	j += initialY * layer.width;
	for(var y = initialY; y < finalY; ++y){
		j += initialX;
		for(var x = initialX; x < layer.width; ++x, ++j){
			if(x >= finalX){
				j += layer.width - finalX;
				break;
			}
			
			var tileid = layer.data[j];
			if(!tileid) continue;
			
			var tileset = getTilesetOfTile(map, tileid);
			
			if(!tileset) throw new Error("Tileset is null");
			
			var curTilesetTileid = tileid - tileset.firstgid;
			var numTilesX = Math.floor(tileset.imagewidth / tileset.tilewidth);
			
			var srcx = (curTilesetTileid % numTilesX) * tileset.tilewidth;
			var srcy = Math.floor(curTilesetTileid / numTilesX) * tileset.tileheight;
			
			ctx.drawImage(tileset.image, srcx, srcy, tileset.tilewidth, tileset.tileheight,  (x + layer.x) * tileset.tilewidth + offsetX, (y + layer.y) * tileset.tileheight + offsetY, tileset.tilewidth, tileset.tileheight);
			
		}
	}
}

function renderObjects(ctx){
	gameObjects.sort(function(a, b){
		if(a instanceof Character && a.id == myId){
			if(b instanceof TGrass) return -1;
			return 1;
		}
		if(b instanceof Character && b.id == myId){
			if(a instanceof TGrass) return 1;
			return -1;
		}
		if(a.y < b.y) return -1;
		if(a.y == b.y){
			if(a instanceof TGrass) return 1;
			if(b instanceof TGrass) return -1;
			
			if(a instanceof Character && b instanceof Follower){
				return 1;
			}else if(b instanceof Character && a instanceof Follower){
				return -1;
			}
			return 0;
		}
		if(a.y > b.y) return 1;
		console.log(a, b);
		tick = function(){};
		render = function(){};
		throw new Error('Assertion failed');
	});
	
	
	for(var i=0;i<gameObjects.length;++i){
		var obj = gameObjects[i];
		if(typeof obj.render == 'function') obj.render(ctx);
	}
}

function drawPokemonParty(){
	if(isPhone) return;
	
	clearTmpCanvas();
	var x = 10;
	var y = 10;
	var deltaY = 48;
	if(!pokemonParty || !pokemonData) return;
	
	for(var i=0;i<pokemonParty.length;++i){
		tmpCtx.save();
		tmpCtx.shadowOffsetX = 4;
		tmpCtx.shadowOffsetY = 4;
		tmpCtx.shadowBlur = 0;
		tmpCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
		tmpCtx.drawImage(res.uiPokemon, x, y);
		tmpCtx.restore();
		
		if(pokemonParty[i].icon.width){
			tmpCtx.drawImage(pokemonParty[i].icon, x + 8, y + 8);
		}
		
		
		tmpCtx.font = '12pt Font1';
		tmpCtx.fillStyle = 'rgb(255, 255, 255)';
		
		// Name
		drawStyleText((pokemonParty[i].nickname || pokemonData[pokemonParty[i].id].name).toUpperCase(), 45, 21);
		
		// Level
		var lvWidth = tmpCtx.measureText('Lv '+pokemonParty[i].level).width;
		drawStyleText('Lv '+pokemonParty[i].level, 45, 35);
		tmpCtx.font = '12pt Font1';
		
		var hp = pokemonParty[i].hp  +'/' +pokemonParty[i].maxHp;
		var barWidth = tmpCtx.measureText(hp).width;
		drawStyleText(hp, 280 - barWidth, 35);
		
		
		var sx = x + 60 + lvWidth;
		
		tmpCtx.save();
		tmpCtx.translate(-0.5, -0.5);
		tmpCtx.lineWidth = 2;
		// Exp bar
		tmpCtx.save();
		tmpCtx.beginPath();
		tmpCtx.moveTo(0, y + 32);
		tmpCtx.lineTo(tmpCanvas.width, y + 32);
		tmpCtx.lineTo(tmpCanvas.width, y + 45);
		tmpCtx.lineTo(0, y + 45);
		tmpCtx.lineTo(0, y + 32);
		tmpCtx.clip();
		
		tmpCtx.strokeStyle = 'rgb(0, 0, 0)';
		
		tmpCtx.fillStyle = 'rgb(0, 0, 0)';
		tmpCtx.fillRect(sx + 5, y + 30, (190 - barWidth - lvWidth), 5);
		
		tmpCtx.fillStyle = 'rgb(64,200,248)';
		tmpCtx.fillRect(sx + 5, y + 30, Math.ceil((190 - barWidth - lvWidth) * (pokemonParty[i].experience / pokemonParty[i].experienceNeeded)), 5);
		tmpCtx.strokeRect(sx + 5, y + 30, (190 - barWidth - lvWidth), 5);
		tmpCtx.restore();
		
		// Hp bar
		
		tmpCtx.fillStyle = 'rgb(0, 200, 0)';
		tmpCtx.strokeStyle = 'rgb(0, 0, 0)';
		
		tmpCtx.fillRect(sx, y + 27, Math.ceil((200 - barWidth - lvWidth) * (pokemonParty[i].hp / pokemonParty[i].maxHp)), 5);
		tmpCtx.strokeRect(sx, y + 27, (200 - barWidth - lvWidth), 5);
		
		tmpCtx.restore();
		y += deltaY;
	}
	
	function drawStyleText(str, $x, $y){
		tmpCtx.fillStyle = 'rgb(0, 0, 0)';
		tmpCtx.fillText(str, x + $x + 2, y + $y + 2);
		
		tmpCtx.fillStyle = 'rgb(255, 255, 255)';
		tmpCtx.fillText(str, x + $x, y + $y);
	}
	
	ctx.globalAlpha = 0.8;
	ctx.drawImage(tmpCanvas, 480, 0);
	ctx.globalAlpha = 1;
}

function drawChat() {
	if(inChat && chatBox.value.length > 0) filterChatText();
	
	var x = 20;
	var y = 335;
	
	ctx.font = '12pt Font1';
	
	if(inChat){
		ctx.globalAlpha = 0.5;
		ctx.drawImage(res.uiChat, x, y);
	}
	
	ctx.globalAlpha = 1;
	ctx.fillStyle = 'rgb(0, 0, 0)';
	
	var str = chatBox.value;
	while(true){
		var w = ctx.measureText(str).width;
		if(w < 440){
			ctx.fillText(str, x + 8, 528);
			if(inChat){
				if(+new Date()%1000 < 500){
					ctx.fillRect(x + 10 + w, 516, 10, 14);
				}
			}
			break;
		}else{
			str = str.slice(1);
		}
	}
	
	
	var i = chatLog.length;
	var now = +new Date();
	for(var i = Math.max(chatLog.length - 12, 0); i< chatLog.length; ++i){
		if(!inChat) ctx.globalAlpha = clamp(3 - (now - chatLog[i].timestamp)/1000 + 2, 0, 1);
		var str;

		str = chatLog[i].username + ': ';
		ctx.fillStyle = 'rgb(0, 0, 0)';
		ctx.fillText(str, x + 12, y + 182 - (14 * (chatLog.length - i)));
		
		ctx.fillStyle = 'rgb(255, 255, 0)';
		ctx.fillText(str, x + 10, y + 180 - (14 * (chatLog.length - i)));
		
		var usernameWidth = ctx.measureText(str).width;
		
		str = chatLog[i].str;
		
		ctx.fillStyle = 'rgb(0, 0, 0)';
		ctx.fillText(str, x + 12 + usernameWidth, y + 182 - (14 * (chatLog.length - i)));
		
		
		ctx.fillStyle = 'rgb(255, 255, 255)';
		ctx.fillText(str, x + 10 + usernameWidth, y + 180 - (14 * (chatLog.length - i)));
		
		
	}
	
	ctx.globalAlpha = 1;
}

function getRenderOffsetX(){return curMap.tilewidth * -cameraX;};
function getRenderOffsetY(){return curMap.tileheight * -cameraY;};

function battleTransition(){
	transitionStep = -1;
}

function renderBattleTransition(){
	if(transitionStep < 0) return;
	ctx.fillStyle = '#000000';
	switch(battle.startTransition){
	case 0:
		var BAR_HEIGHT = 80;
		
		if(transitionStep >= 50){
			renderBattle();
		}
		
		if(transitionStep < 20){
		
		}else if(transitionStep < 38){
			var h = (transitionStep - 20) * (transitionStep - 20);
			ctx.fillRect(0, 0, canvas.width, h);
			ctx.fillRect(0, canvas.height - h, canvas.width, h);
		}else if(transitionStep < 50){
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			drawPlayerChar = false;
		}else if(transitionStep < 70){
			var perc = ((transitionStep - 50) / 20);
			if(perc > 1) perc = 1;
			perc *= perc;
			
			ctx.fillRect(0, canvas.height / 2 - BAR_HEIGHT / 2, canvas.width, BAR_HEIGHT);
			
			var h = (canvas.height / 2 - BAR_HEIGHT / 2) * (1 - perc);
			ctx.fillRect(0, (canvas.height / 2 - BAR_HEIGHT / 2) - h, canvas.width, h);
			ctx.fillRect(0, (canvas.height / 2 + BAR_HEIGHT / 2), canvas.width, h);
			
			ctx.save();
			
			ctx.translate(canvas.width / 2, canvas.height / 2);
			ctx.rotate(Math.PI * 2 * perc);
			ctx.scale(perc, perc);
			
			ctx.drawImage(battleIntroPokeball, -60, -60);
			ctx.restore();
		}else if(transitionStep < 100){
			var perc = ((transitionStep - 80) / 20);
			
			clearTmpCanvas();
			
			tmpCtx.fillStyle = 'rgb(0, 0, 0)';
			tmpCtx.fillRect(0, canvas.height / 2 - BAR_HEIGHT / 2, canvas.width, BAR_HEIGHT);
			tmpCtx.drawImage(battleIntroPokeball, canvas.width / 2 - 60, canvas.height / 2 - 60);
			
			
			ctx.globalAlpha = clamp(1 - perc, 0, 1);
			ctx.drawImage(tmpCanvas, 0, 0);
			ctx.globalAlpha = 1;
		}else{
			battle.step = 1;
		}
		break;
	case 1:
		//TODO
		
		break;
	}
	
	++transitionStep;
}

var willRender = false;


function render(forceNoTransition, onlyRender){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	//ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
	ctx.fillStyle = '#66BBFF';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	
	var realRender = function(){
		
		willRender = false;
		
		switch(state){
			case ST_MAP:
				if(curMap){
					
					gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
					
					var chr = getPlayerChar();
					if(chr){
						var charRenderPos = chr.getRenderPos();
						cameraX = charRenderPos.x / curMap.tilewidth + 1 - (screenWidth / curMap.tilewidth) / 2;
						cameraY = charRenderPos.y / curMap.tileheight - (screenHeight / curMap.tileheight) / 2;
					}
					
					renderMap(gameCtx, curMap);
					renderObjects(gameCtx);
					renderMapOver(gameCtx, curMap);
					
					for(var i=0;i<gameRenderHooks.length;++i) gameRenderHooks[i]();
					
					if(isPhone){
						ctx.drawImage(gameCanvas, 0, -10, screenWidth, screenHeight);
					}else{
						ctx.drawImage(gameCanvas, 10, 10);
					}
					
					if(inBattle && battle.step == 0){
						renderBattleTransition();
					}else if(inBattle){
						renderBattle();
					}
					
				}else{
					throw new Error('No map in memory');
				}
				
				if(!isPhone && !inBattle){
					drawPokemonParty();
					drawChat();
				}
			break;
			case ST_LOADING:
				loadingMapRender();
			break;
		}
		
		if(isPhone){
			ctx.drawImage(iOSUI, 0, 0);
		}
		
		for(var i=0;i<renderHooks.length;++i) renderHooks[i]();
	
		if(!onlyRender){
			onScreenCtx.clearRect(0, 0, onScreenCanvas.width, onScreenCanvas.height);
			onScreenCtx.drawImage(canvas, 0, 0);
			
			++numRTicks;
		}
	}
	
	if(!willRender){
		willRender = true;
		
		if(window.requestAnimationFrame){
			window.requestAnimationFrame(realRender);
		}else if(window.mozRequestAnimationFrame){
			window.mozRequestAnimationFrame(realRender);
		}else if(window.msRequestAnimationFrame){
			window.msRequestAnimationFrame(realRender);
		}else if(window.webkitRequestAnimationFrame){
			window.webkitRequestAnimationFrame(realRender);
		}else if(window.oRequestAnimationFrame){
			window.oRequestAnimationFrame(realRender);
		}else{
			realRender();
		}
	}
}

function createGrassAnimation(x, y){
	gameObjects.push(new TGrass(x, y));
}

function TGrass(x, y){
	var self = this;
	var tick = numRTicks;
	self.x = x;
	self.y = y;
	self.render = function(ctx){
		if(numRTicks - tick >= 16){
			gameObjects.remove(self);
			return;
		}
		
		ctx.drawImage(res.miscSprites, 32, 32 * Math.floor((numRTicks - tick) / 4), 32, 32, x * curMap.tilewidth + getRenderOffsetX(), y * curMap.tileheight + getRenderOffsetY(), 32, 32);
	}
}
function Character(data){
	var self = this;
	
	self.id = data.id || '???';
	
	self.x = data.x || 0;
	self.y = data.y || 0;
	self.targetX = self.x;
	self.targetY = self.y;
	self.direction = data.direction || DIR_DOWN;
	self.targetDirection = self.direction;
	self.animationStep = 0;
	self.loaded = false;
	self.walking = false;
	self.walkingPerc = 0.0;
	self.walkingHasMoved = false;
	self.inBattle = data.inBattle || false;
	self.randInt = Math.floor(Math.random() * 100);
	self.follower = data.follower || null;
	self.lastMoveTick = 0;
	
	var followerObj = new Follower(this);
	
	var wildPokemon;
	var battleHasWalkedBack = false;
	var battleX, battleY;
	var battleLastX, battleLastY;
	var battleFolX, battleFolY;
	
	self.battleEnemy = null;
	
	self.lastX = self.x;
	self.lastY = self.y;
	
	self.image = new Image();
	self.image.onload = function(){
		self.loaded = true;
		render();
	}
	self.image.src = 'resources/chars/'+data.type+'.png';
	
	self.lockDirection = -1;
	
	self.init = function(){
		characters.push(self);
		gameObjects.push(self);
		
		followerObj.init();
	}
	
	self.destroy = function(){
		characters.remove(self);
		gameObjects.remove(self);
		self.inBattle = false;
		followerObj.destroy();
		if(wildPokemon) wildPokemon.destroy();
	}
	
	function isControllable(){
		return self.id == myId && !inBattle;
	}
	
	self.getRenderPos = function(){
		if(!self.walking) return {x: self.x * curMap.tilewidth, y: self.y * curMap.tileheight - CHAR_HEIGHT/2};
		var destX = self.x * curMap.tilewidth;
		var destY = self.y * curMap.tileheight - CHAR_HEIGHT/2;
		var perc = (self.walkingPerc - CHAR_MOVE_WAIT) * (1.0/(1.0-CHAR_MOVE_WAIT));
		if(self.walkingPerc >= CHAR_MOVE_WAIT){
			if(self.walkingHasMoved){
				switch(self.direction){
					case DIR_LEFT: destX += (curMap.tilewidth) * (1-perc); break;
					case DIR_RIGHT: destX -= (curMap.tilewidth) * (1-perc); break;
					case DIR_UP: destY += (curMap.tileheight) * (1-perc); break;
					case DIR_DOWN: destY -= (curMap.tileheight) * (1-perc); break;
				}
			}else{
				switch(self.direction){
					case DIR_LEFT: destX -= (curMap.tilewidth) * perc; break;
					case DIR_RIGHT: destX += (curMap.tilewidth) * perc; break;
					case DIR_UP: destY -= (curMap.tileheight) * perc; break;
					case DIR_DOWN: destY += (curMap.tileheight) * perc; break;
				}
			}
		}
		return {x:Math.floor(destX), y:Math.floor(destY)};
	}
	
	self.tick = function(){
		if(!self.walking){
			self.walkingHasMoved = false;
			self.walkingPerc = 0.0;
			
			if(self.id == myId){
				if (!inChat && !inBattle) {
					if(isKeyDown(37)){ // Left
						self.walking = true;
						if(self.direction == DIR_LEFT) self.walkingPerc = CHAR_MOVE_WAIT;
						self.direction = DIR_LEFT;
					}else if(isKeyDown(40)){ // Down
						self.walking = true;
						if(self.direction == DIR_DOWN) self.walkingPerc = CHAR_MOVE_WAIT;
						self.direction = DIR_DOWN;
					}else if(isKeyDown(39)){ // Right
						self.walking = true;
						if(self.direction == DIR_RIGHT) self.walkingPerc = CHAR_MOVE_WAIT;
						self.direction = DIR_RIGHT;
					}else if(isKeyDown(38)){ // Up
						self.walking = true;
						if(self.direction == DIR_UP) self.walkingPerc = CHAR_MOVE_WAIT;
						self.direction = DIR_UP;
					}
				}
			}else{
				tickBot();
			}
		}
		
		if(self.walking){
			if(isControllable()){
				switch(self.direction){
					case DIR_LEFT:
						if(!isKeyDown(37)){
							if(self.walkingPerc < CHAR_MOVE_WAIT){
								self.walking = false;
								socket.emit('turn', {'dir':self.direction});
								return;
							}
						}
					break;
					case DIR_DOWN:
						if(!isKeyDown(40)){
							if(self.walkingPerc < CHAR_MOVE_WAIT){
								self.walking = false;
								socket.emit('turn', {'dir':self.direction});
								return;
							}
						}
					break;
					case DIR_RIGHT:
						if(!isKeyDown(39)){
							if(self.walkingPerc < CHAR_MOVE_WAIT){
								self.walking = false;
								socket.emit('turn', {'dir':self.direction});
								return;
							}
						}
					break;
					case DIR_UP:
						if(!isKeyDown(38)){
							if(self.walkingPerc < CHAR_MOVE_WAIT){
								self.walking = false;
								socket.emit('turn', {'dir':self.direction});
								return;
							}
						}
					break;
				}
			}
			self.walkingPerc += 0.10;
			self.animationStep += 0.20;
			if(self.animationStep > 4.0) self.animationStep -= 4.0;
			if(self.walkingPerc >= (1.0-CHAR_MOVE_WAIT)/2 && !self.walkingHasMoved){
				if(self.id == myId){
					if(willMoveIntoAWall()){
						socket.emit('turn', {'dir':self.direction});
						self.walking = false;
						//TODO: Play block sound
						return;
					}
				}
				
				if(!self.inBattle || self.id != myId){
					self.lastX = self.x;
					self.lastY = self.y;
				}
				
				switch(self.direction){
					case DIR_LEFT: self.x -= 1; break;
					case DIR_RIGHT: self.x += 1; break;
					case DIR_UP: self.y -= 1; break;
					case DIR_DOWN: self.y += 1; break;
				}
				
				self.lastMoveTick = numRTicks;
				self.walkingHasMoved = true;
				
				if(isTileGrass(curMap, self.x, self.y)){
					createGrassAnimation(self.x, self.y);
				}
				
				if(self.id == myId){
					socket.emit('walk', {ack: lastAckMove, x: self.x, y: self.y, dir:self.direction});
				}
			}
			
			if(self.walkingPerc >= 1.0){
				if(self.id == myId){
					if(!inBattle && !willMoveIntoAWall() && ((self.direction == DIR_LEFT && isKeyDown(37))
					|| (self.direction == DIR_DOWN && isKeyDown(40))
					|| (self.direction == DIR_RIGHT && isKeyDown(39))
					|| (self.direction == DIR_UP && isKeyDown(38)))){
						self.walkingHasMoved = false;
						self.walkingPerc = CHAR_MOVE_WAIT + 0.10;
					}else{
						self.walking = false;
					}
				}else{
					self.walkingHasMoved = false;
					self.walkingPerc = CHAR_MOVE_WAIT + 0.10;
					self.walking = false;
					tickBot();
				}
			}
		}else{
			self.animationStep = 0;
		}
		
		if(self.id == myId){
			if(self.inBattle){
				var tmpX, tmpY;
				if(!wildPokemon && self.battleEnemy && !self.walking){
					if(battleHasWalkedBack){
						var tmpDir;
						tmpX = battleX;
						tmpY = battleY;
						if(self.walking && !self.walkingHasMoved){
							switch(self.direction){
								case DIR_LEFT: tmpX -= 1;; break;
								case DIR_RIGHT: tmpX += 1; break;
								case DIR_UP: tmpY -= 1; break;
								case DIR_DOWN: tmpY += 1; break;
							}
						}
							
						wildPokemon = new TWildPokemon(self.battleEnemy, tmpX, tmpY, tmpDir, self);
						
						transitionStep = 7;
					}else{
						battleX = self.x;
						battleY = self.y;
						
						self.lockDirection = self.direction;
						self.direction = (self.direction + 2) % 4;
						self.walking = true;
						self.walkingHasMoved = false;
						self.walkingPerc = 0.0;
						
						battleHasWalkedBack = true;
						
						tmpX = battleX;
						tmpY = battleY;
						
						switch(self.direction){
							case DIR_LEFT: tmpX -= 1; break;
							case DIR_RIGHT: tmpX += 1; break;
							case DIR_UP: tmpY -= 1; break;
							case DIR_DOWN: tmpY += 1; break;
						}
						
						battleLastX = tmpX;
						battleLastY = tmpY;
						
						tmpX = battleX;
						tmpY = battleY;
						
						switch(self.direction){
							case DIR_LEFT: tmpX -= 2; break;
							case DIR_RIGHT: tmpX += 2; break;
							case DIR_UP: tmpY -= 2; break;
							case DIR_DOWN: tmpY += 2; break;
						}
						if(isTileSolid(curMap, tmpX, tmpY) || isTileWater(curMap, tmpX, tmpY)){
							tmpX = battleX;
							tmpY = battleY;
							switch(self.direction){
								case DIR_LEFT: tmpX -= 1; break;
								case DIR_RIGHT: tmpX += 1; break;
								case DIR_UP: tmpY -= 1; break;
								case DIR_DOWN: tmpY += 1; break;
							}
						}
						
						battleFolX = tmpX;
						battleFolY = tmpY;
					}
				}
				
				
				followerObj.forceTarget = true;
				self.lastX = battleFolX;
				self.lastY = battleFolY;
				
				
			}else{
				followerObj.forceTarget = false;
				
				if(wildPokemon){
					wildPokemon.destroy();
					wildPokemon = null;
				}
				
				if(self.lockDirection != -1){
					self.direction = self.lockDirection;
					self.lockDirection = -1;
					self.lastX = battleLastX;
					self.lastY = battleLastY;
				}
				
				battleHasWalkedBack = false
			}
		}
	}
	
	function willMoveIntoAWall(){
		switch(self.direction){
			case DIR_LEFT: return isTileSolid(curMap, self.x - 1, self.y) || isTileWater(curMap, self.x - 1, self.y); break;
			case DIR_RIGHT: return isTileSolid(curMap, self.x + 1, self.y) || isTileWater(curMap, self.x + 1, self.y); break;
			case DIR_UP: return isTileSolid(curMap, self.x, self.y - 1) || isTileWater(curMap, self.x, self.y - 1); break;
			case DIR_DOWN: return isTileSolid(curMap, self.x, self.y + 1) || isTileWater(curMap, self.x, self.y + 1); break;
		}
		
		return false;
	}
	
	function tickBot(){
		if(self.walking) return;
		self.walking = self.x != self.targetX || self.y != self.targetY;
		if(!self.walking) return;
		
		var lastDirection = self.direction;
		
		if(Math.abs(self.x - self.targetX) > 0 && self.y == self.targetY){
			self.direction = self.x < self.targetX ? DIR_RIGHT : DIR_LEFT;
		}else if(Math.abs(self.y - self.targetY) > 0 && self.x == self.targetX){
			self.direction = self.y < self.targetY ? DIR_DOWN : DIR_UP;
		}else{
			self.direction = (self.targetY < self.y) ? DIR_UP : DIR_DOWN;
		}
		
		if(lastDirection != self.direction){
			self.walkingPerc = 0.0;
		}
	}
	
	self.render = function(ctx){
		if(!self.loaded) return;
		
		if(self.id == myId && !drawPlayerChar) return;
		
		var offsetX = getRenderOffsetX();
		var offsetY = getRenderOffsetY();
		
		if(self.follower){
			var src = 'resources/followers/'+self.follower+'.png';
			if(followerObj.pok.image.src != src){
				followerObj.pok.image.src = src;
			}
		}else{
			followerObj.pok.image.src = '';
		}
		var renderPos = self.getRenderPos();
		
		var dirId = self.direction * CHAR_WIDTH;
		if(self.lockDirection != -1) dirId = self.lockDirection * CHAR_WIDTH;
		ctx.drawImage(self.image, dirId, Math.floor(self.animationStep) * CHAR_HEIGHT, CHAR_WIDTH, CHAR_HEIGHT, renderPos.x + offsetX, renderPos.y + offsetY, CHAR_WIDTH, CHAR_HEIGHT);
		
		
		if(isTileGrass(curMap, self.x, self.y) && !self.walking){
			ctx.drawImage(res.miscSprites, 0, 0, 32, 32, self.x * curMap.tilewidth + offsetX, self.y * curMap.tileheight + offsetY, 32, 32);
		}
		
		if(self.inBattle && self.id != myId){
			ctx.save();
			var ly = 0;
			
			ly = ((numRTicks + self.randInt) % 31) / 30;
			ly *= 2;
			
			if(ly > 1) ly = 1 - (ly - 1);
			ly *= ly;
			ly *= 10;
			
			ctx.translate(renderPos.x + offsetX + 16, renderPos.y + offsetY + 2 + Math.round(ly));
			ctx.rotate(((numRTicks + self.randInt) % 11) / 10 * Math.PI * 2);
			ctx.drawImage(res.uiCharInBattle, -10, -10);
			ctx.restore();
		}
	}
}
var POKEMON_WIDTH = 64;
var POKEMON_HEIGHT = 64;

function TPokemon(x, y){
	var self = this;
	
	
	var randInt = Math.floor(Math.random() * 100);
	
	self.image = new Image();
	self.direction = DIR_DOWN;
	self.x = x || 0;
	self.y = y || 0;
	self.walking = false;
	self.walkingPerc = 0.0;
	self.walkingHasMoved = false;
	
	self.canDrawGrass = true;
	
	self.targetX = self.x;
	self.targetY = self.y;
	
	self.init = function(){
		gameObjects.push(self);
	}
	
	self.destroy = function(){
		gameObjects.remove(self);
	}
	
	self.render = function(ctx){
		var offsetX = getRenderOffsetX();
		var offsetY = getRenderOffsetY();
		var renderPos = self.getRenderPos();
		
		ctx.save();
		ctx.drawImage(self.image, POKEMON_WIDTH * self.direction, Math.floor(((numRTicks + randInt) % 10)/5) * POKEMON_HEIGHT, POKEMON_WIDTH, POKEMON_HEIGHT, renderPos.x + offsetX, renderPos.y + offsetY, POKEMON_WIDTH, POKEMON_HEIGHT);
		ctx.restore();
		
		if(self.canDrawGrass && isTileGrass(curMap, self.x, self.y) && !self.walking){
			ctx.drawImage(res.miscSprites, 0, 0, 32, 32, self.x * curMap.tilewidth + offsetX, self.y * curMap.tileheight + offsetY, 32, 32);
		}
	}
	
	self.tick = function(){
		if(!self.walking){
			self.walkingHasMoved = false;
			self.walkingPerc = 0.0;
			
			tickBot();
		}else{
			self.walkingPerc += 0.10;
			self.animationStep += 0.20;
			if(self.walkingPerc >= (1-CHAR_MOVE_WAIT)/2 && !self.walkingHasMoved){
				switch(self.direction){
					case DIR_LEFT: self.x -= 1; break;
					case DIR_RIGHT: self.x += 1; break;
					case DIR_UP: self.y -= 1; break;
					case DIR_DOWN: self.y += 1; break;
				}
				
				self.walkingHasMoved = true;
				
				if(isTileGrass(curMap, self.x, self.y)){
					createGrassAnimation(self.x, self.y);
				}
			}
			
			if(self.walkingPerc >= 1.0){
				self.walkingHasMoved = false;
				self.walkingPerc = CHAR_MOVE_WAIT + 0.10;
				self.walking = false;
				tickBot();
			}
		}
	}
	
	self.getRenderPos = function(){
		if(!self.walking) return {x: self.x * curMap.tilewidth - POKEMON_WIDTH/4, y: self.y * curMap.tileheight - POKEMON_HEIGHT/2};
		var destX = self.x * curMap.tilewidth - POKEMON_WIDTH/4;
		var destY = self.y * curMap.tileheight - POKEMON_HEIGHT/2;
		var perc = (self.walkingPerc - CHAR_MOVE_WAIT) / (1-CHAR_MOVE_WAIT);
		
		if(self.walkingPerc > CHAR_MOVE_WAIT){
			if(self.walkingHasMoved){
				switch(self.direction){
					case DIR_LEFT: destX += (curMap.tilewidth) * (1-perc); break;
					case DIR_RIGHT: destX -= (curMap.tilewidth) * (1-perc); break;
					case DIR_UP: destY += (curMap.tileheight) * (1-perc); break;
					case DIR_DOWN: destY -= (curMap.tileheight) * (1-perc); break;
				}
			}else{
				switch(self.direction){
					case DIR_LEFT: destX -= (curMap.tilewidth) * perc; break;
					case DIR_RIGHT: destX += (curMap.tilewidth) * perc; break;
					case DIR_UP: destY -= (curMap.tileheight) * perc; break;
					case DIR_DOWN: destY += (curMap.tileheight) * perc; break;
				}
			}
		}
		
		return {x:Math.floor(destX), y:Math.floor(destY)};
	}
	
	function tickBot(){
		if(self.walking) return;
		
		if(Math.abs(self.x - self.targetX) + Math.abs(self.y - self.targetY) > 2){
			self.x = self.targetX;
			self.y = self.targetY;
			return;
		}
		
		self.walking = self.x != self.targetX || self.y != self.targetY;
		
		if(!self.walking) return;
		
		
		var lastDirection = self.direction;
		
		if(Math.abs(self.x - self.targetX) > 0 && self.y == self.targetY){
			self.direction = self.x < self.targetX ? DIR_RIGHT : DIR_LEFT;
		}else if(Math.abs(self.y - self.targetY) > 0 && self.x == self.targetX){
			self.direction = self.y < self.targetY ? DIR_DOWN : DIR_UP;
		}else{
			self.direction = (self.targetY < self.y) ? DIR_UP : DIR_DOWN;
		}
		
		if(lastDirection != self.direction){
			self.walkingPerc = 0.0;
		}
	}
}
function Follower(chr){
	var self = this;
	var pok = new TPokemon(chr.lastX || chr.x, chr.lastY || chr.y);
	self.pok = pok;
	self.x = pok.x;
	self.y = pok.y;
	self.forceTarget = false;
	self.init = function(){
		gameObjects.push(self);
	}
	
	self.destroy = function(){
		gameObjects.remove(self);
	}
	
	self.render = function(ctx){
		if(chr.id == myId && !drawPlayerChar) return;
		pok.render(ctx);
	}
	
	self.tick = function(){
		pok.targetX = chr.lastX;
		pok.targetY = chr.lastY;
		
		if(!self.forceTarget && chr.walking && !chr.walkingHasMoved && chr.walkingPerc >= CHAR_MOVE_WAIT){
			pok.targetX = chr.x;
			pok.targetY = chr.y;
		}
		
		pok.tick();
		
		if(!pok.walking){
			if(pok.x < chr.x){
				pok.direction = DIR_RIGHT;
			}else if(pok.x > chr.x){
				pok.direction = DIR_LEFT;
			}else if(pok.y > chr.y){
				pok.direction = DIR_UP;
			}else{
				pok.direction = DIR_DOWN;
			}
		}
		
		self.x = pok.x;
		self.y = pok.y;
	}
}
var moveStartTime = 0;

var BATTLE_WILD = 0;
var BATTLE_TRAINER = 1;

var BATTLE_STEP_TRANSITION = 0;
var BATTLE_STEP_POKEMON_APPEARED_TMP = 1;
var BATTLE_STEP_POKEMON_APPEARED = 2;
var BATTLE_STEP_GO_POKEMON = 3;
var BATTLE_STEP_ACTION_MENU = 4;
var BATTLE_STEP_FIGHT_MENU = 5;
var BATTLE_STEP_TURN = 6;

function initBattle(){
	battle = {};
	battle.text = '';
	battle.textTime = 0;
	battle.textNeedPress = 0;
	battle.step = BATTLE_STEP_TRANSITION;
	battle.renderVars = {};
	battle.resultQueue = [];
	battle.runningQueue = false;
	battle.randInt = Math.floor(Math.random() * 1000);
	battle.startTransition = 0;//Math.floor(Math.random() * 2);
}

function renderBattle(){
	var now = +new Date();
	
	ctx.save();
	ctx.translate(isPhone ? 0 : 160, isPhone ? 0 : 140);
	ctx.lineWidth = 2;
	ctx.strokeStyle = 'rgb(0,0,0)';
	ctx.strokeRect(-1, -1, 482, 226);
	if(battle.background.width != 0){
		ctx.drawImage(battle.background, 0, 0);
	}
	
	if(battle.step != BATTLE_STEP_FIGHT_MENU){
		ctx.drawImage(res.battleTextBackground, 2, 228);
		
		if(battle.text != ''){
			var str = battle.text.slice(0, (now - battle.textTime) / 30);
			
			
			ctx.font = '24px Font2';
			
			
			var maxWidth = (battle.step == BATTLE_STEP_ACTION_MENU ? 150 : 420);
			if(ctx.measureText(str).width > maxWidth){
				var firstLine = str;
				var secondLine = '';
				do{
					var arr = firstLine.split(' ');
					secondLine = arr.pop() + ' ' + secondLine;
					firstLine = arr.join(' ');
				} while(ctx.measureText(firstLine).width > maxWidth);
				
				ctx.fillStyle = 'rgb(104,88,112)';
				ctx.fillText(firstLine, 26, 266);
				ctx.fillText(secondLine, 26, 294);
				ctx.fillText(firstLine, 24, 268);
				ctx.fillText(secondLine, 24, 296);
				ctx.fillText(firstLine, 26, 268);
				ctx.fillText(secondLine, 26, 296);
				
				ctx.fillStyle = 'rgb(255,255,255)';
				ctx.fillText(firstLine, 24, 266);
				ctx.fillText(secondLine, 24, 294);
				
			}else{
				ctx.fillStyle = 'rgb(104,88,112)';
				ctx.fillText(str, 24, 268);
				ctx.fillText(str, 26, 266);
				ctx.fillText(str, 26, 268);
				
				ctx.fillStyle = 'rgb(255,255,255)';
				ctx.fillText(str, 24, 266);
			}
			
			if(str == battle.text){
				if(!battle.textCompleted){
					battle.textCompleted = true;
					battle.textCompletedTime = now;
					
					if(battle.textDelay != -1){
						setTimeout(battle.textOnComplete, battle.textDelay);
					}else{
						hookAButton(battle.textOnComplete);
					}
					
				}else if(battle.textDelay == -1 && now - battle.textCompletedTime > 100){
					var tmp = Math.floor((now % 1000) / 250);
					if(tmp == 3) tmp = 1;
					tmp *= 2;
					ctx.drawImage(res.battleMisc, 0, 0, 32, 32, 24 + ctx.measureText(str).width, 240 + tmp, 32, 32);
				}
			}
		}
		
		if(battle.step == BATTLE_STEP_ACTION_MENU){
			ctx.drawImage(res.battleActionMenu, 246, 226);
			
			var x1 = 252 + Math.floor((now % 1000) / 500) * 2;
			var y1 = 246;
			var x2 = x1 + 112;
			var y2 = y1 + 30;
			
			switch(battle.selectedAction){
				case 0:
					ctx.drawImage(res.battleMisc, 96, 0, 32, 32, x1, y1, 32, 32);
				break;
				case 1:
					ctx.drawImage(res.battleMisc, 96, 0, 32, 32, x2, y1, 32, 32);
				break;
				case 2:
					ctx.drawImage(res.battleMisc, 96, 0, 32, 32, x1, y2, 32, 32);
				break;
				case 3:
					ctx.drawImage(res.battleMisc, 96, 0, 32, 32, x2, y2, 32, 32);
				break;
			}
			
		}
	}
	
	if(battle.step == BATTLE_STEP_FIGHT_MENU){
		ctx.drawImage(res.battleMoveMenu, 2, 228);
		
		var x1 = 40;
		var y1 = 268;
		
		var n = battle.curPokemon.moves[0].toUpperCase();
		ctx.font = '24px Font2';
		ctx.fillStyle = 'rgb(208,208,208)';
		ctx.fillText(n, x1, y1 + 2);
		ctx.fillText(n, x1 + 2, y1);
		
		ctx.fillStyle = 'rgb(72,72,72)';
		ctx.fillText(n, x1, y1);
		
		ctx.drawImage(res.battleMisc, 96, 0, 32, 32, x1 - 28 + Math.floor((now % 1000) / 500) * 2, y1 - 22, 32, 32);
		
		
		ctx.drawImage(res.types, 0, 24 * TYPE.NORMAL, 64, 24, 390, 284, 64, 24);
	}
	
	if(!battle.renderVars.dontRenderEnemy){
		if(battle.renderVars.enemyFainted){
			if(numRTicks - battle.renderVars.enemyFaintedTick <= 5){
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(290, 30);
				ctx.lineTo(418, 30);
				ctx.lineTo(418, 158);
				ctx.lineTo(290, 158);
				ctx.lineTo(290, 30);
				ctx.clip();
				ctx.drawImage(battle.enemyPokemon.sprite, 290, 30 + (numRTicks - battle.renderVars.enemyFaintedTick) * 30);
				ctx.restore();
			}
		}else{
			ctx.drawImage(battle.enemyPokemon.sprite, 290, 30);
		}
	}
	
	if(battle.step < BATTLE_STEP_GO_POKEMON){
		ctx.drawImage(res.playerBacksprite, 0, 0, 128, 128, 60, 96, 128, 128);
	}else if(battle.step == BATTLE_STEP_GO_POKEMON){
		if(battle.animStep >= 4 && battle.animStep < 25){
			var ballAnimation = [
				[60, 179, 1, 0],
				[62, 175, 1, 0],
				
				[70, 168, 1, 0],
				[75, 165, 1, 0],
				
				[83, 160, 1, 0],
				[86, 160, 1, 0],
				
				[95, 161, 1, 0],
				[97, 164, 1, 0],
				
				[105, 170, 1, 0],
				
				[110, 175, 1, 0],
				[111, 178, 1, 0],
				[113, 183, 1, 0],
				[114, 185, 1, 0],
				[115, 190, 1, 0],
				[117, 192, 1, 0],
				[120, 195, 1, 0, 0.95],
				[123, 200, 1, 1, 0.9],
				[124, 205, 1.05, 1, 0.8],
				[125, 200, 1.1, 1, 0.6],
				[126, 192, 1.15, 1, 0.3],
				[127, 192, 1.2, 1, 0.1]
			];
			
			ctx.save();
			ctx.globalAlpha = ballAnimation[battle.animStep-4][4];
			ctx.translate(ballAnimation[battle.animStep-4][0], ballAnimation[battle.animStep-4][1]);
			ctx.scale(ballAnimation[battle.animStep-4][2], ballAnimation[battle.animStep-4][2]);
			ctx.rotate(battle.animStep / 17 * Math.PI * 2);
			
			ctx.drawImage(res.battlePokeballs, 64, 32 * ballAnimation[battle.animStep-4][3], 32, 32, -16, -16, 32, 32);
			ctx.restore();
		}
		
		if(Math.floor(battle.animStep / 4) < 5){
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(480, 0);
			ctx.lineTo(480, 320);
			ctx.lineTo(0, 320);
			ctx.lineTo(0, 0);
			ctx.clip();
			
			ctx.globalAlpha = clamp(1 - (battle.animStep / 20), 0, 1);
			
			ctx.drawImage(res.playerBacksprite, 128 * Math.floor(battle.animStep / 4), 0, 128, 128, 60 - battle.animStep * 5, 96, 128, 128);
			ctx.restore();
		}
		
		if(battle.animStep > 21 && battle.animStep < 35){
			var perc = Math.min((battle.animStep - 21) / 10, 1);
			
			clearTmpCanvas();
			tmpCtx.save();
			tmpCtx.fillStyle = '#FFFFFF';
			tmpCtx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
			tmpCtx.globalCompositeOperation = "destination-atop";
			tmpCtx.translate(124, 192);
			tmpCtx.scale(perc, perc);
			tmpCtx.drawImage(battle.curPokemon.backsprite, -64, -96);
			tmpCtx.restore();
			
			
			ctx.save();
			ctx.translate(124, 192);
			ctx.scale(perc, perc);
			ctx.drawImage(battle.curPokemon.backsprite, -64, -96);
			
			
			ctx.restore();
			
			ctx.globalAlpha = clamp(1 - Math.max(0, perc * perc - 0.5) * 2, 0, 1);
			ctx.drawImage(tmpCanvas, 0, 0);
			ctx.globalAlpha = 1;
		}else if(battle.animStep >= 35){
			battle.selectedAction = 0;
			battleOpenActionMenu();
		}
		
		
		++battle.animStep;
	}else{
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(60, 96);
		ctx.lineTo(188, 96);
		ctx.lineTo(188, 224);
		ctx.lineTo(60, 224);
		ctx.lineTo(60, 96);
		ctx.clip();
		if(!battle.renderVars.dontRenderPokemon){
			if(battle.renderVars.pokemonFainted){
				if(numRTicks - battle.renderVars.pokemonFaintedTick <= 5){
					ctx.drawImage(battle.curPokemon.backsprite, 60, 96 + (numRTicks - battle.renderVars.pokemonFaintedTick) * 30);
				}
			}else{
				ctx.drawImage(battle.curPokemon.backsprite, 60, 96 + ((battle.step == BATTLE_STEP_ACTION_MENU || battle.step == BATTLE_STEP_FIGHT_MENU) && ((now + battle.randInt) % 600) < 300 ? 2 : 0));
				
			}
			
		}
		
		ctx.restore();
	}
	
	{
		ctx.save();
		if(battle.renderVars.shakeEnemyStatus && numRTicks % 2 == 0) ctx.translate(0, 2);
		ctx.drawImage(res.battleEnemyBar, 26, 32);
		ctx.drawImage(res.battleHealthBar, 0, 0, 1, 6, 104, 66, 96, 6);
		
		var hpPerc = battle.enemyPokemon.hp / battle.enemyPokemon.maxHp;
		if(hpPerc > 0.50){
			ctx.drawImage(res.battleHealthBar, 0, 6, 1, 6, 104, 66, Math.floor(48 * hpPerc) * 2, 6);
		}else if(hpPerc >= 0.20){
			ctx.drawImage(res.battleHealthBar, 0, 12, 1, 6, 104, 66, Math.floor(48 * hpPerc) * 2, 6);
		}else{
			ctx.drawImage(res.battleHealthBar, 0, 18, 1, 6, 104, 66, Math.ceil(48 * hpPerc) * 2, 6);
		}
		
		var pokemonName = (battle.enemyPokemon.nickname || pokemonData[battle.enemyPokemon.id].name).toUpperCase();
		var pokemonLevel = 'Lv'+battle.enemyPokemon.level.toString();
		var lvlX = 168 - (battle.enemyPokemon.level < 10 ? 0 : (battle.enemyPokemon.level < 100) ? 8 : 16);
		
		ctx.font = '21px Font2';
		ctx.fillStyle = 'rgb(216,208,176)';
		ctx.fillText(pokemonName, 42, 56);
		ctx.fillText(pokemonName, 40, 58);
		ctx.fillText(pokemonName, 42, 58);
		ctx.fillText(pokemonLevel, lvlX + 2, 56);
		ctx.fillText(pokemonLevel, lvlX, 58);
		ctx.fillText(pokemonLevel, lvlX + 2, 58);
		
		ctx.fillStyle = 'rgb(64,64,64)';
		ctx.fillText(pokemonName, 40, 56);
		ctx.fillText(pokemonLevel, lvlX, 56);
		
		
		var tmpX = ctx.measureText(pokemonName).width + 40;
		if(battle.enemyPokemon.gender == 1){
			ctx.drawImage(res.battleMisc, 64, 0, 10, 16, tmpX, 42, 10, 16);
		}else if(battle.enemyPokemon.gender == 2){
			ctx.drawImage(res.battleMisc, 74, 0, 10, 16, tmpX, 42, 10, 16);
		}
		ctx.restore();
	}
	if(battle.step >= BATTLE_STEP_ACTION_MENU){
		ctx.save();
		var tmp = 0;
		if(battle.step == BATTLE_STEP_ACTION_MENU || battle.step == BATTLE_STEP_FIGHT_MENU){
			ctx.translate(0, (now % 600) < 300 ? 0 : 2);
		}
		
		if(battle.renderVars.shakePokemonStatus && numRTicks % 2 == 0) ctx.translate(0, 2);
		
		ctx.drawImage(res.battlePokemonBar, 252, 148);
		
		ctx.drawImage(res.battleHealthBar, 0, 0, 1, 6, 348, 182, 96, 6);
		
		
		var hpPerc = battle.curPokemon.hp / battle.curPokemon.maxHp;
		if(hpPerc > 0.50){
			ctx.drawImage(res.battleHealthBar, 0, 6, 1, 6, 348, 182, Math.floor(48 * hpPerc) * 2, 6);
		}else if(hpPerc >= 0.20){
			ctx.drawImage(res.battleHealthBar, 0, 12, 1, 6, 348, 182, Math.floor(48 * hpPerc) * 2, 6);
		}else{
			ctx.drawImage(res.battleHealthBar, 0, 18, 1, 6, 348, 182, Math.ceil(48 * hpPerc) * 2, 6);
		}
		
		ctx.fillStyle = 'rgb(64,200,248)';
		ctx.fillRect(316, 214, Math.floor(battle.curPokemon.experience / battle.curPokemon.experienceNeeded * 64) * 2, 4);
		
		
		var pokemonName = (battle.curPokemon.nickname || pokemonData[battle.curPokemon.id].name).toUpperCase();
		var pokemonLevel = 'Lv'+battle.curPokemon.level.toString();
		var lvlX = 412 - (battle.curPokemon.level < 10 ? 0 : (battle.curPokemon.level < 100) ? 8 : 16);
		var maxHpX = 422 - (battle.curPokemon.maxHp >= 100 ? 8 : 0);
		
		ctx.font = '21px Font2';
		ctx.fillStyle = 'rgb(216,208,176)';
		ctx.fillText(pokemonName, 286, 172);
		ctx.fillText(pokemonName, 284, 174);
		ctx.fillText(pokemonName, 286, 174);
		ctx.fillText(pokemonLevel, lvlX + 2, 172);
		ctx.fillText(pokemonLevel, lvlX, 174);
		ctx.fillText(pokemonLevel, lvlX + 2, 174);
		ctx.fillText(battle.curPokemon.maxHp, maxHpX + 2, 208);
		ctx.fillText(battle.curPokemon.maxHp, maxHpX, 210);
		ctx.fillText(battle.curPokemon.maxHp, maxHpX + 2, 210);
		
		
		ctx.fillStyle = 'rgb(64,64,64)';
		ctx.fillText(pokemonName, 284, 172);
		ctx.fillText(pokemonLevel, lvlX, 172);
		ctx.fillText(battle.curPokemon.maxHp, maxHpX, 208);
		
		
		var tmpX = ctx.measureText(pokemonName).width + 284;
		if(battle.curPokemon.gender == 1){
			ctx.drawImage(res.battleMisc, 64, 0, 10, 16, tmpX, 158, 10, 16);
		}else if(battle.curPokemon.gender == 2){
			ctx.drawImage(res.battleMisc, 74, 0, 10, 16, tmpX, 158, 10, 16);
		}
		
		ctx.restore();
	}
	
	
	
	
	if(battle.step == BATTLE_STEP_POKEMON_APPEARED_TMP){
		battle.step = BATTLE_STEP_POKEMON_APPEARED;
		setBattleText('Wild ' + pokemonData[battle.enemyPokemon.id].name.toUpperCase() +' appeared!', -1, function(){
			setBattleText("Go! " + pokemonData[battle.curPokemon.id].name.toUpperCase() + "!");
			battle.step = BATTLE_STEP_GO_POKEMON;
			battle.animStep = 0;
			battle.selectedMove = 0;
		});
	}
	
	ctx.restore();
}

function battleOpenActionMenu(){
	battle.runningQueue = false;
	battle.step = BATTLE_STEP_ACTION_MENU;
	
	setBattleText('What will '+pokemonData[battle.curPokemon.id].name.toUpperCase()+' do?');
	
	hookAButton(function(){
		
		// Ignore actions other than attack for now
		if(battle.selectedAction != 0){
			battleOpenActionMenu();
			return;
		}
		
		switch(battle.selectedAction){
		case 0:
			battleOpenFightMenu();
			break;
		}
	});
}

function battleOpenFightMenu(){
	battle.step = BATTLE_STEP_FIGHT_MENU;
	
	var aAction = function(){
		
		unHookBButton(bAction);
		setBattleText(null);
		battle.step = BATTLE_STEP_TURN;
		socket.emit('battleMove', {move: battle.selectedMove});
	};
	
	var bAction = function(){
		unHookAButton(aAction);
		battleOpenActionMenu();
		battle.textTime = 0;
	};
	
	hookAButton(aAction);
	hookBButton(bAction);
}

function battleRunQueue(force){
	if(!force && battle.runningQueue) return;
	battle.runningQueue = true;
	if(battle.resultQueue.length == 0){
		battleOpenActionMenu();
		return;
	}
	
	var action = battle.resultQueue.shift();
	battle.curAction = action;
	
	console.log('Action: '+action.type, action);
	
	switch(action.type){
	case "moveAttack":
		setBattleText((action.player == 0 ? (battle.curPokemon.nickname || pokemonData[battle.curPokemon.id].name) : (battle.enemyPokemon.nickname || pokemonData[battle.enemyPokemon.id].name)).toUpperCase()+" used "+action.value.move.toUpperCase()+"!");
		setTimeout(function(){
			moveStartTime = +new Date();
			if(moves[action.value.move]){
				moves[action.value.move]();
			}else{
				moves['def']();
			}
		}, 1000);
		break;
	case "moveMiss":
		setBattleText((action.player == 0 ? (battle.curPokemon.nickname || pokemonData[battle.curPokemon.id].name) : (battle.enemyPokemon.nickname || pokemonData[battle.enemyPokemon.id].name)).toUpperCase()+" used "+action.value.toUpperCase()+"!");
		setTimeout(function(){
			setBattleText('But it missed!');
			setTimeout(function(){battleRunQueue(true)}, 1000);
		}, 1000);
		break;
	case "pokemonDefeated":
		var attacker;
		var defeated;
		if(action.player == 0){
			attacker = battle.curPokemon;
			defeated = battle.enemyPokemon;
			battle.renderVars.enemyFainted = true;
			battle.renderVars.enemyFaintedTick = numRTicks;
		}else{
			attacker = battle.enemyPokemon;
			defeated = battle.curPokemon;
			battle.renderVars.pokemonFainted = true;
			battle.renderVars.pokemonFaintedTick = numRTicks;
		}
		
		
		
		setBattleText((battle.type == BATTLE_WILD && action.player == 0 ? 'Wild ':'')+(defeated.nickname || pokemonData[defeated.id].name).toUpperCase()+' fainted!', -1, function(){
			if(action.player == 0){
				setBattleText((attacker.nickname || pokemonData[attacker.id].name).toUpperCase() + ' gained '+action.value+' EXP. Points!', -1, function(){
					battleAnimateExp();
				});
			}else{
				battleRunQueue(true);
			}
		});
		
		break;
	case "win":
		setPokemonParty(action.value.pokemon);
		
		battle.finishX = action.value.x;
		battle.finishY = action.value.y;
		battle.finishMap = action.value.map;
		
		if(battle.type == BATTLE_WILD && action.player == 0){
			battleFinish();
			return;
		}
		
		
		battleFinish();
		
		break;
	case "switchFainted":
		if(action.player != 0){
			setBattleText('The opponent is selecting another pokemon');
			battle.runningQueue = false;
			return;
		}
		
		//TODO
		
		break;
	case "fleeFail":
		
		break;
	case "pokemonLevelup": battleRunQueue(true); break;
	}
}

function battleMoveFinish(){
	battle.renderVars.shakeEnemyStatus = false;
	battle.renderVars.shakePokemonStatus = false;
	
	var action = battle.curAction;
	if(action.type == "moveAttack"){
		if(action.value.effec == 0){
			setBattleText("It's not effective...", 0, battleAnimateHp);
		}else if(action.value.effec < 1){
			setBattleText("It's not very effective...", 0, battleAnimateHp);
		}else if(action.value.effec > 1){
			setBattleText("It's very effective!", 0, battleAnimateHp);
		}else{
			battleAnimateHp();
		}
	}else{
		battleRunQueue(true);
	}
}

function battleAnimateHp(){
	var action = battle.curAction;
	var renderFunc = function(){
		var result = action.value.resultHp;
		var pok;
		if(action.player == 1){
			pok = battle.curPokemon;
		}else{
			pok = battle.enemyPokemon;
		}
		
		var step = Math.ceil(pok.maxHp / 50);
		if(pok.hp > result){
			pok.hp -= step;
			if(pok.hp < result){
				pok.hp = result;
			}
		}else if(pok.hp < result){
			pok.hp += step;
			if(pok.hp > result){
				pok.hp = result;
			}
		}
		
		if(pok.hp == result){
			unHookRender(renderFunc);
			setTimeout(function(){battleRunQueue(true)}, 100);
		}
	};
	
	hookRender(renderFunc);
}

function battleAnimateExp(){
	var action = battle.curAction;
	if(action.player != 0 || battle.curPokemon.level >= 100){
		battleRunQueue(true);
		return;
	}
	
	battle.textDelay = 1/0;
	var expGained = action.value;
	var step = Math.ceil(expGained / 100);
	
	var renderFunc = function(){
		var pok = battle.curPokemon;
		
		if(step > expGained) step = expGained;
		pok.experience += step;
		expGained -= step;
		
		if(pok.experience >= pok.experienceNeeded){
			expGained += pok.experience - pok.experienceNeeded;
			
			var info = battle.resultQueue.shift();
			if(info.type != 'pokemonLevelup') throw new Error('Assertion failed');
			
			var backsprite = battle.curPokemon.backsprite;
			battle.curPokemon = info.value;
			battle.curPokemon.backsprite = backsprite;
			pok = battle.curPokemon;
			
			
			pok.experience = 0;
		}
		
		
		if(expGained <= 0){
			unHookRender(renderFunc);
			setTimeout(function(){battleRunQueue(true)}, 100);
		}
	};
	
	hookRender(renderFunc);
}

function battleFinish(){
	var step = 0;
	var func = function(){
		ctx.fillStyle = '#000000';
		if(step < 15){
			ctx.globalAlpha = step / 15;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.globalAlpha = 1;
		}else if(step < 20){
			ctx.globalAlpha = 1;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			if(step == 15){
				if(battle.finishMap == curMapId){
					var chr = getPlayerChar();
					if(chr){
						chr.x = battle.finishX;
						chr.y = battle.finishY;
					}
				}else{
					unHookRender(func);
					loadMap(battle.finishMap);
				}
				
				inBattle = false;
				battle = null;
				drawPlayerChar = true;
				
				var chr = getPlayerChar();
				if(chr){
					chr.inBattle = false;
				}
			}
			
		}else{
			ctx.globalAlpha = 1 - (step - 20) / 8;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.globalAlpha = 1;
			if(step >= 28){
				unHookRender(func);
			}
		}
		++step;
	}
	
	hookRender(func);
}

function battleButtonHandler(dir){
	if(!inBattle) return;
	
	
	if(battle.step == BATTLE_STEP_ACTION_MENU){
		switch(battle.selectedAction){
		case 0:
			if(dir == DIR_RIGHT){
				battle.selectedAction = 1;
			}else if(dir == DIR_DOWN){
				battle.selectedAction = 2;
			}
			break;
		case 1:
			if(dir == DIR_LEFT){
				battle.selectedAction = 0;
			}else if(dir == DIR_DOWN){
				battle.selectedAction = 3;
			}
			break;
		case 2:
			if(dir == DIR_UP){
				battle.selectedAction = 0;
			}else if(dir == DIR_RIGHT){
				battle.selectedAction = 3;
			}
			break;
		case 3:
			if(dir == DIR_UP){
				battle.selectedAction = 1;
			}else if(dir == DIR_LEFT){
				battle.selectedAction = 2;
			}
			break;
		}
	}
}
hookDirButtons(battleButtonHandler);

function setBattleText(str, delay, onComplete){
	battle.text = str || '';
	battle.textTime = +new Date();
	if(delay == null) delay = NaN;
	battle.textDelay = delay;
	battle.textOnComplete = onComplete;
	battle.textCompleted = false;
}

moves['def'] = (function(){
	function render(){
		var now = +new Date();
		
		if(battle.curAction.player == 0){
			battle.renderVars.dontRenderEnemy = (Math.floor((now - moveStartTime)/100) % 2) == 0;
			battle.renderVars.shakeEnemyStatus = true;
		}else{
			battle.renderVars.dontRenderPokemon = (Math.floor((now - moveStartTime)/100) % 2) == 0;
			battle.renderVars.shakePokemonStatus = true;
		}
		
		if(now - moveStartTime > 500){
			battle.renderVars.dontRenderEnemy = false;
			battle.renderVars.dontRenderPokemon = false;
			unHookRender(render);
			battleMoveFinish();
		}
	}
	
	return function(){
		hookRender(render);
	}
})();

function TWildPokemon(id, x, y, dir, chr){
	var self = this;
	
	var pok = new TPokemon(x, y);
	var initTick;
	
	self.x = pok.x;
	self.y = pok.y;
	self.randInt =  Math.floor(Math.random() * 100);
	
	//pok.image.onload = function(){self.init();};
	pok.image.src = 'resources/followers/'+id+'.png';
	
	self.init = function(){
		gameObjects.push(self);
		initTick = numRTicks;
	}
	
	self.destroy = function(){
		gameObjects.remove(self);
	}
	
	self.tick = function(){
		if(!chr.inBattle){
			self.destroy();
			return;
		}
		
		pok.tick();
		
		if(!pok.walking){
			if(pok.x < chr.x){
				pok.direction = DIR_RIGHT;
			}else if(pok.x > chr.x){
				pok.direction = DIR_LEFT;
			}else if(pok.y > chr.y){
				pok.direction = DIR_UP;
			}else{
				pok.direction = DIR_DOWN;
			}
		}
		
		self.x = pok.x;
		self.y = pok.y;
	}
	
	self.render = function(ctx){
		if(chr.id == myId && !drawPlayerChar) return;
		ctx.save();
		pok.canDrawGrass = numRTicks - initTick < 5;
		if(numRTicks - initTick < 10){
			ctx.translate(0, -(Math.floor(-7 / 50 * (numRTicks - initTick) * (numRTicks - initTick) + 7 / 5 * (numRTicks - initTick)) * 8));
		}
		
		pok.render(ctx);
		
		ctx.restore();
		
		/*
		if(numRTicks - initTick > 10){
			ctx.save();
			var ly = 0;
			
			ly = ((numRTicks + self.randInt) % 31) / 30;
			ly *= 2;
			
			if(ly > 1) ly = 1 - (ly - 1);
			ly *= ly;
			ly *= 10;
			
			ctx.translate(pok.x * curMap.tilewidth + 16 + getRenderOffsetX(), pok.y * curMap.tileheight - 16 + getRenderOffsetY() + Math.round(ly));
			ctx.rotate(((numRTicks + self.randInt) % 11) / 10 * Math.PI * 2);
			ctx.drawImage(res.uiCharInBattle, -10, -10);
			ctx.restore();
		}
		*/
	}
	
	self.init();
}
function filterChatText(){
	chatBox.value = chatBox.value.replace(/[^a-zA-Z0-9.,:-=\(\)\[\]\{\}\/\\ '"]/, '');
}

function generateRandomString(len){
	var i = len;
	var str = '';
	var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	while(i--) str += chars[Math.floor(Math.random()*chars.length)];
	return str;
}

function getPlayerChar(){
	return getCharById(myId);
}

function getCharById(id){
	for(var i=0;i<characters.length;++i){
		if(characters[i].id == id) return characters[i];
	}
	return null;
}

function clamp(n, min, max){
	if(min > max){
		var tmp = max;
		max = min;
		min = tmp;
	}
	if(n < min) n = min;
	if(n > max) n = max;
	return n;
}

function hookAButton(func){
	if(AButtonHooks.indexOf(func) != -1) return;
	AButtonHooks.push(func);
}

function hookBButton(func){
	if(BButtonHooks.indexOf(func) != -1) return;
	BButtonHooks.push(func);
}

function unHookAButton(func){
	var i = AButtonHooks.indexOf(func);
	if(i != -1){
		AButtonHooks.splice(i, 1);
	}
}

function unHookBButton(func){
	var i = BButtonHooks.indexOf(func);
	if(i != -1){
		BButtonHooks.splice(i, 1);
	}
}

function hookDirButtons(func){
	if(dirButtonHooks.indexOf(func) != -1) return;
	dirButtonHooks.push(func);
}

function unHookDirButtons(func){
	var i = dirButtonHooks.indexOf(func);
	if(i != -1) dirButtonHooks.splice(i, 1);
}

function hookRender(func){
	if(renderHooks.indexOf(func) != -1) return;
	renderHooks.push(func);
}

function unHookRender(func){
	var i = renderHooks.indexOf(func);
	if(i != -1) renderHooks.splice(i, 1);
}

function hookGameRender(func){
	if(gameRenderHooks.indexOf(func) != -1) return;
	gameRenderHooks.push(func);
}

function unHookGameRender(func){
	var i = gameRenderHooks.indexOf(func);
	if(i != -1) gameRenderHooks.splice(i, 1);
}

function tick(){
	
	if(state == ST_MAP){
		
		for(var i=0;i<gameObjects.length;++i){
			if(typeof gameObjects[i].tick == 'function') gameObjects[i].tick();
		}
		
	}
	
	if(fireAHooks){
		fireAHooks = false;
		var arr = AButtonHooks.concat();
		AButtonHooks.length = 0;
		
		for(var i=0;i<arr.length;++i){
			arr[i]();
		}
	}
	
	if(fireBHooks){
		fireBHooks = false;
		var arr = BButtonHooks.concat();
		BButtonHooks.length = 0;
		
		
		for(var i=0;i<arr.length;++i){
			arr[i]();
		}
	}
	
	for(var i=0;i<arrowKeysPressed.length;++i){
		for(var j=0;j<dirButtonHooks.length;++j){
			dirButtonHooks[j](arrowKeysPressed[i]);
		}
	}
	arrowKeysPressed.length = 0;
	
	render();
}

var justSentMessage;
function sendMessage() {
	filterChatText();
	socket.emit('sendMessage', {'username':myId, 'str':chatBox.value});
	chatBox.value = '';
	inChat = false;
	justSentMessage = true;
	$q(chatBox).blur();
	$q(onScreenCanvas).focus();
}

function clearTmpCanvas(){
	tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
}

function setPokemonParty(arr){
	pokemonParty = arr;
	
	for(var i=0;i<pokemonParty.length;++i){
		pokemonParty[i].icon = new Image();
		pokemonParty[i].icon.src = 'resources/picons/'+pokemonParty[i].id+'_1.png';
	}
}

window.initGame = function($canvas, $container){
	onScreenCanvas = $canvas;
	onScreenCtx = onScreenCanvas.getContext('2d');
	
	gameCanvas = document.createElement('canvas');
	gameCanvas.width = screenWidth;
	gameCanvas.height = screenHeight;
	gameCanvas.style.position = 'relative';
	gameCtx = gameCanvas.getContext('2d');
	
	canvas = document.createElement('canvas');
	ctx = canvas.getContext('2d');
	
	var canvasContainer = $container;
	
	if (!isPhone) {
		chatBox = document.createElement("input");
		chatBox.type = "text";
		chatBox.style.opacity = '0';
		chatBox.style.position = 'fixed';
		chatBox.maxLength = 128;
		chatBox.onblur = function() {
			inChat = false;
			
			// Force the messages to fade out again, a little faster though
			var now = +new Date();
			for(var i = Math.max(chatLog.length - 12, 0); i< chatLog.length; ++i){
				chatLog[i].timestamp = Math.max(now - 2500, chatLog[i].timestamp);
			}
		}
		
		chatBox.onkeydown = function(e) {
			e = window.event || e;
			if (e.keyCode == 13) {
				sendMessage();
			}
		}
		
		document.body.appendChild(chatBox);
	}
	
	$q(document).on('touchstart',	function(e){e.preventDefault();return false;});
	$q(document).on('touchmove',	function(e){e.preventDefault();return false;});

	$(onScreenCanvas).on('touchstart', function(e){
		var pressX = event.pageX;
		var pressY = event.pageY;
		if((iOSAButtonPos.x - pressX) * (iOSAButtonPos.x - pressX) + (iOSAButtonPos.y - pressY) * (iOSAButtonPos.y - pressY) < 1200){
			uiAButtonDown = true;
		}
		
		if((iOSBButtonPos.x - pressX) * (iOSBButtonPos.x - pressX) + (iOSBButtonPos.y - pressY) * (iOSBButtonPos.y - pressY) < 1200){
			uiBButtonDown = true;
		}
		
		//keysDown[38] = true;
	});
	
	$(onScreenCanvas).on('touchend', function(e){
		uiAButtonDown = false;
		uiBButtonDown = false;
	});
	
	$q(window).blur(function(){
		for(var i=0;i<keysDown.length;++i){
			keysDown[i] = false;
		}
	});
	
	$q(window).keydown(function(e){
		
		if (e.keyCode == 13 && !inChat && !justSentMessage) {
			inChat = true;
			$q(chatBox).focus();
		}
		
		if(!inChat && !keysDown[e.keyCode]){
			keysDown[e.keyCode] = true;
			if(e.keyCode == 90){
				uiAButtonDown = true;
				fireAHooks = true;
			}else if(e.keyCode == 88){
				uiBButtonDown = true;
				fireBHooks = true;
			}else if(e.keyCode == 37){
				arrowKeysPressed.push(DIR_LEFT);
			}else if(e.keyCode == 40){
				arrowKeysPressed.push(DIR_DOWN);
			}else if(e.keyCode == 39){
				arrowKeysPressed.push(DIR_RIGHT);
			}else if(e.keyCode == 38){
				arrowKeysPressed.push(DIR_UP);
			}
		}
	});
	
	$q(window).keyup(function(e){
		keysDown[e.keyCode] = false;
		if(e.keyCode == 13){
			justSentMessage = false;
		}else if(e.keyCode == 90){
			uiAButtonDown = false;
		}else if(e.keyCode == 88){
			uiBButtonDown = false;
		}
	});
	
	setInterval(tick, 1000 / 30);
	
	$q(window).resize(function(){
		if(isPhone){
			canvas.width = $q(window).width();
			canvas.height = $q(window).height();
			
		}else{
			canvas.width = 800;
			canvas.height = 600;
			$q(canvasContainer).css({'top':'50%','left':'50%','position':'fixed','margin-top':'-300px','margin-left':'-400px'});
		}
		canvasContainer.width = tmpCanvas.width = onScreenCanvas.width = canvas.width;
		canvasContainer.height = tmpCanvas.height = onScreenCanvas.height = canvas.height;
		
		render();
	}).resize();
	
	$q(window).on('orientationchange', function(){
		window.scrollTo(0, 0);
	});
	
	socket = io.connect(serverHost);
	socket.on('connect', function(){
		console.log('Connected');
	});
	
	socket.on('setInfo', function(data){
		console.log('setInfo: '+data.id);
		myId = data.id;
		setPokemonParty(data.pokemon);
	});
	
	socket.on('loadMap', function(data){
		console.log('loadMap: '+data.mapid);
		loadMap(data.mapid);
	});
	
	
	socket.on('createChars', function(data){
		loadedChars = true;
		var arr = data.arr;
		for(var i=0;i<arr.length;++i){
			var chr = new Character(arr[i]);
			chr.init();
		}
	});
	
	
	socket.on('invalidMove', function(data){
		lastAckMove = data.ack;
		var chr = getPlayerChar();
		
		chr.x = data.x;
		chr.y = data.y;
		chr.walking = false;
		chr.tick();
		
		console.log('Invalid move!');
	});
	
	socket.on('update', function(data){
		if(!loadedChars) return;
		var chars = data.chars;
		
		var charsNotUpdated = [];
		for(var i=0;i<characters.length;++i){
			charsNotUpdated.push(characters[i].id);
		}
		
		for(var i=0;i<chars.length;++i){
			var charData = chars[i];
			
			var tmp = charsNotUpdated.indexOf(charData.id);
			if(tmp != -1){
				charsNotUpdated.splice(tmp, 1);
			}
			
			var chr = getCharById(charData.id);
			
			if(chr){
				chr.follower = charData.follower;
			}
			
			if(charData.id == myId){
				var src = 'resources/chars_sprites/'+charData.type+'.png';
				if(res.playerBacksprite.src != src) res.playerBacksprite.src = 'resources/chars_sprites/'+charData.type+'.png';
				continue;
			}
			
			
			if(chr){
				chr.inBattle = charData.inBattle;
				chr.battleEnemy = charData.battleEnemy;
				chr.targetX = charData.x;
				chr.targetY = charData.y;
				chr.targetDirection = charData.direction;
				
				if(!chr.moving){
					chr.lastX = charData.lastX;
					chr.lastY = charData.lastY;
				}
				
				if(chr.x == charData.x && chr.y == charData.y){
					chr.direction = charData.direction;
				}else if((Math.abs(chr.x - charData.x) <= 1 && Math.abs(chr.y - charData.y) <= 1)
				|| chr.x - 2 == charData.x && chr.y == charData.y
				|| chr.x + 2 == charData.x && chr.y == charData.y
				|| chr.x == charData.x && chr.y - 2 == charData.y
				|| chr.x == charData.x && chr.y + 2 == charData.y){
					// Let the bot move the character
				}else{
					// Character too far to be moved by the bot, move him manually
					chr.direction = charData.direction;
					chr.x = charData.x;
					chr.y = charData.y;
				}
			}else{
				chr = new Character(charData);
				chr.init();
			}
		}
		
		for(var i=0;i<charsNotUpdated.length;++i){
			for(var j=0;j<characters.length;++j){
				if(characters[j].id == charsNotUpdated[i]){
					characters[j].destroy();
					
					break;
				}
			}
		}
		
		chatLog = chatLog.slice(-64 + data.messages.length);
		for(var i = 0; i < data.messages.length;++i){
			var m = data.messages[i];
			m.timestamp = +new Date();
			chatLog.push(m);
		}
		
	});
	
	socket.on('battleWild', function(data){
		inBattle = true;
		
		initBattle();
		battle.x = data.x;
		battle.y = data.y;
		battle.type = BATTLE_WILD;
		battle.background = new Image();
		battle.background.src = 'resources/ui/battle_background1.png';
		
		var enemy = data.battle.enemy;
		
		
		battle.enemyPokemon = enemy;
		battle.enemyPokemon.sprite = new Image();
		battle.enemyPokemon.sprite.src = 'resources/sprites' + (battle.enemyPokemon.shiny ? '_shiny' : '') + '/'+battle.enemyPokemon.id+'.png';
		
		battle.curPokemon = data.battle.curPokemon;
		battle.curPokemon.backsprite = new Image();
		battle.curPokemon.backsprite.src = 'resources/back' + (battle.curPokemon.shiny ? '_shiny' : '') + '/'+battle.curPokemon.id+'.png';
		
		var chr = getPlayerChar();
		if(chr){
			chr.inBattle = true;
			chr.battleEnemy = battle.enemyPokemon.id;
		}
		
		battleTransition();
	});
	
	socket.on('battleTurn', function(data){
		battle.resultQueue = battle.resultQueue.concat(data.results);
		battleRunQueue();
	});
}



})(window, jQuery);