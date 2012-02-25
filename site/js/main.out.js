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

var curMap;
var socket;

var ST_LOADING = 1;
var ST_MAP = 2;

var inBattle = false;

var DIR_DOWN = 0;
var DIR_LEFT = 1;
var DIR_UP = 2;
var DIR_RIGHT = 3;

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

var numRTicks = 0;

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


var battle;

var res = {};

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
	
	characters = [];
	loadedChars = false;
	
	var pending = 0;
	var completed = 0;
	var error = false;
	
	loadImage('miscSprites', 'resources/tilesets/misc.png');
	loadImage('uiPokemon', 'resources/ui/pokemon.png');
	loadImage('uiChat', 'resources/ui/chat.png');
	loadImage('uiCharInBattle', 'resources/ui/char_in_battle.png');
	
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
var inBattleTransition = false;
var transitionStep = 0;
var battleTextBackground = new Image();
battleTextBackground.src = 'resources/ui/battle_text.png';
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

function renderChars(ctx){
	var offsetX = getRenderOffsetX();
	var offsetY = getRenderOffsetY();
	
	for(var i=0;i<characters.length;++i){
		var chr = characters[i];
		renderChar(chr);
	}
	
	
	function renderChar(chr){
		if(!chr) return;
		if(!chr.loaded) return;
		
		chr.tickRender();
		
		var renderPos = chr.getRenderPos();
		ctx.drawImage(chr.image, chr.direction * CHAR_WIDTH, Math.floor(chr.animationStep) * CHAR_HEIGHT, CHAR_WIDTH, CHAR_HEIGHT, renderPos.x + offsetX, renderPos.y + offsetY, CHAR_WIDTH, CHAR_HEIGHT);
		
		
		if(!chr.walking && isTileGrass(curMap, chr.x, chr.y)){
			//TODO Actually make it look like how it is in game
			ctx.drawImage(res.miscSprites, 0, 0, 32, 32, chr.x * curMap.tilewidth + offsetX, chr.y * curMap.tileheight + offsetY, 32, 32);
		}
		
		if(chr.inBattle){
			ctx.save();
			var ly = 0;
			
			ly = ((numRTicks + chr.randInt) % 31) / 30;
			ly *= 2;
			
			if(ly > 1) ly = 1 - (ly - 1);
			ly *= ly;
			ly *= 10;
			
			ctx.translate(renderPos.x + offsetX + 16, renderPos.y + offsetY + 2 + ly);
			ctx.rotate(((numRTicks + chr.randInt) % 11) / 10 * Math.PI * 2);
			ctx.drawImage(res.uiCharInBattle, -10, -10);
			ctx.restore();
		}
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
		
		// Exp bar
		tmpCtx.strokeStyle = 'rgb(0, 0, 0)';
		
		tmpCtx.fillStyle = 'rgb(0, 0, 0)';
		tmpCtx.fillRect(sx + 5, y + 30, (190 - barWidth - lvWidth), 5);
		
		tmpCtx.fillStyle = 'rgb(0, 0, 200)';
		tmpCtx.fillRect(sx + 5, y + 30, Math.ceil((190 - barWidth - lvWidth) * (pokemonParty[i].experience / pokemonParty[i].experienceNeeded)), 5);
		tmpCtx.strokeRect(sx + 5, y + 30, (190 - barWidth - lvWidth), 5);
		
		// Hp bar
		
		tmpCtx.fillStyle = 'rgb(0, 200, 0)';
		tmpCtx.strokeStyle = 'rgb(0, 0, 0)';
		
		tmpCtx.fillRect(sx, y + 27, Math.ceil((200 - barWidth - lvWidth) * (pokemonParty[i].hp / pokemonParty[i].maxHp)), 5);
		tmpCtx.strokeRect(sx, y + 27, (200 - barWidth - lvWidth), 5);
		
		
		y += deltaY;
	}
	
	function drawStyleText(str, $x, $y){
		tmpCtx.fillStyle = 'rgb(0, 0, 0)';
		tmpCtx.fillText(str, x + $x + 1, y + $y + 1);
		
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
		ctx.fillText(str, x + 11, y + 181 - (14 * (chatLog.length - i)));
		
		ctx.fillStyle = 'rgb(200, 200, 200)';
		ctx.fillText(str, x + 10, y + 180 - (14 * (chatLog.length - i)));
		
		var usernameWidth = ctx.measureText(str).width;
		
		str = chatLog[i].str;
		
		ctx.fillStyle = 'rgb(0, 0, 0)';
		ctx.fillText(str, x + 11 + usernameWidth, y + 181 - (14 * (chatLog.length - i)));
		
		
		ctx.fillStyle = 'rgb(255, 255, 255)';
		ctx.fillText(str, x + 10 + usernameWidth, y + 180 - (14 * (chatLog.length - i)));
		
		
	}
	
	ctx.globalAlpha = 1;
}

function getRenderOffsetX(){return curMap.tilewidth * -cameraX;};
function getRenderOffsetY(){return curMap.tileheight * -cameraY;};

function renderBattle(){
	var x = isPhone ? 0 : 160;
	var y = isPhone ? 0 : 140;
	
	ctx.lineWidth = 2;
	ctx.strokeStyle = 'rgb(0,0,0)';
	ctx.strokeRect(x - 1, y - 1, 482, 226);
	if(battle.background.width != 0){
		ctx.drawImage(battle.background, x, y);
	}
	
	if(battleTextBackground.width != 0){
		ctx.drawImage(battleTextBackground, x + 2, y + 228);
	}
	
	ctx.drawImage(battle.curPokemon.backsprite, x + 60, y + 96);
	ctx.drawImage(battle.enemyPokemon.sprite, x + 290, y + 30);
}

function battleTransition(){
	inBattleTransition = true;
	transitionStep = 0;
}

function renderBattleTransition(){
	var BAR_HEIGHT = 80;
	
	ctx.fillStyle = 'rgb(0,0,0)';
	
	if(transitionStep >= 30){
		renderBattle();
	}
	
	
	
	if(transitionStep < 18){
		var h = transitionStep * transitionStep;
		ctx.fillRect(0, 0, canvas.width, h);
		ctx.fillRect(0, canvas.height - h, canvas.width, h);
	}else if(transitionStep < 30){
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		if(transitionStep == 18){
			var chr = getPlayerChar();
			if(chr){
				chr.x = battle.x;
				chr.y = battle.y;
				chr.walking = false;
			}
		}
	}else if(transitionStep < 50){
		var perc = ((transitionStep - 30) / 20);
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
	}else if(transitionStep < 80){
		var perc = ((transitionStep - 60) / 20);
		
		clearTmpCanvas();
		
		tmpCtx.fillStyle = 'rgb(0, 0, 0)';
		tmpCtx.fillRect(0, canvas.height / 2 - BAR_HEIGHT / 2, canvas.width, BAR_HEIGHT);
		tmpCtx.drawImage(battleIntroPokeball, canvas.width / 2 - 60, canvas.height / 2 - 60);
		
		
		ctx.globalAlpha = clamp(1 - perc, 0, 1);
		ctx.drawImage(tmpCanvas, 0, 0);
		ctx.globalAlpha = 1;
	}else{
		inBattleTransition = false;
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
					renderChars(gameCtx);
					renderMapOver(gameCtx, curMap);
					
					if(isPhone){
						ctx.drawImage(gameCanvas, 0, -10, screenWidth, screenHeight);
					}else{
						ctx.drawImage(gameCanvas, 10, 10);
					}
					
					if(inBattleTransition){
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
function Character(data){
	var self = this;
	
	self.id = data.id || '???';
	
	self.x = data.x || 0;
	self.y = data.y || 0;
	self.targetX = self.x;
	self.targetY = self.y;
	self.direction = data.direction || DIR_DOWN;
	self.animationStep = 0;
	self.loaded = false;
	self.walking = false;
	self.walkingPerc = 0.0;
	self.walkingHasMoved = false;
	self.inBattle = false;
	self.randInt = Math.floor(Math.random() * 100);
	
	self.image = new Image();
	self.image.onload = function(){
		self.loaded = true;
		console.log('Character sprite loaded');
		render();
	}
	self.image.src = 'resources/chars/'+data.type+'.png';
	self.tickRender = function(){
		
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
					if(isKeyDown(65)){ // A
						self.walking = true;
						if(self.direction == DIR_LEFT) self.walkingPerc = CHAR_MOVE_WAIT;
						self.direction = DIR_LEFT;
					}else if(isKeyDown(83)){ // S
						self.walking = true;
						if(self.direction == DIR_DOWN) self.walkingPerc = CHAR_MOVE_WAIT;
						self.direction = DIR_DOWN;
					}else if(isKeyDown(68)){ // D
						self.walking = true;
						if(self.direction == DIR_RIGHT) self.walkingPerc = CHAR_MOVE_WAIT;
						self.direction = DIR_RIGHT;
					}else if(isKeyDown(87)){ // W
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
						if(!isKeyDown(65)){
							if(self.walkingPerc < CHAR_MOVE_WAIT){
								self.walking = false;
								socket.emit('turn', {'dir':self.direction});
								return;
							}
						}
					break;
					case DIR_DOWN:
						if(!isKeyDown(83)){
							if(self.walkingPerc < CHAR_MOVE_WAIT){
								self.walking = false;
								socket.emit('turn', {'dir':self.direction});
								return;
							}
						}
					break;
					case DIR_RIGHT:
						if(!isKeyDown(68)){
							if(self.walkingPerc < CHAR_MOVE_WAIT){
								self.walking = false;
								socket.emit('turn', {'dir':self.direction});
								return;
							}
						}
					break;
					case DIR_UP:
						if(!isKeyDown(87)){
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
					// Check to see if it hit a wall
					var invalid = false;
					switch(self.direction){
						case DIR_LEFT: invalid = isTileSolid(curMap, self.x - 1, self.y) || isTileWater(curMap, self.x - 1, self.y); break;
						case DIR_RIGHT: invalid = isTileSolid(curMap, self.x + 1, self.y) || isTileWater(curMap, self.x + 1, self.y); break;
						case DIR_UP: invalid = isTileSolid(curMap, self.x, self.y - 1) || isTileWater(curMap, self.x, self.y - 1); break;
						case DIR_DOWN: invalid = isTileSolid(curMap, self.x, self.y + 1) || isTileWater(curMap, self.x, self.y + 1); break;
					}
					
					if(invalid){
						socket.emit('turn', {'dir':self.direction});
						self.walking = false;
						//TODO: Play block sound
						return;
					}
				}
				
				switch(self.direction){
					case DIR_LEFT: self.x -= 1; break;
					case DIR_RIGHT: self.x += 1; break;
					case DIR_UP: self.y -= 1; break;
					case DIR_DOWN: self.y += 1; break;
				}
				
				self.walkingHasMoved = true;
				
				if(self.id == myId){
					socket.emit('walk', {ack: lastAckMove, x: self.x, y: self.y, dir:self.direction});
				}
			}
			
			if(self.walkingPerc >= 1.0){
				if(self.id == myId){
					if(!inBattle && ((self.direction == DIR_LEFT && isKeyDown(65))
					|| (self.direction == DIR_DOWN && isKeyDown(83))
					|| (self.direction == DIR_RIGHT && isKeyDown(68))
					|| (self.direction == DIR_UP && isKeyDown(87)))){
						self.walkingHasMoved = false;
						self.walkingPerc = CHAR_MOVE_WAIT;
					}else{
						self.walking = false;
					}
				}else{
					self.walkingHasMoved = false;
					self.walkingPerc = CHAR_MOVE_WAIT;
					self.walking = false;
					tickBot();
				}
			}
		}else{
			self.animationStep = 0;
		}
	}
	
	function tickBot(){
		if(self.walking) return;
		self.walking = self.x != self.targetX || self.y != self.targetY;
		if(!self.walking) return;
		
		var lastDirection = self.direction;
		
		if(Math.abs(self.x - self.targetX) == 1 && self.y == self.targetY){
			self.direction = self.x < self.targetX ? DIR_RIGHT : DIR_LEFT;
		}else if(Math.abs(self.y - self.targetY) == 1 && self.x == self.targetX){
			self.direction = self.y < self.targetY ? DIR_DOWN : DIR_UP;
		}else{
			self.direction = (self.targetY < self.y) ? DIR_UP : DIR_DOWN;
		}
		
		if(lastDirection != self.direction){
			self.walkingPerc = 0.0;
		}
	}
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

function tick(){
	
	if(state == ST_MAP){
		
		for(var i=0;i<characters.length;++i){
			characters[i].tick();
		}
		
	}
	
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
		keysDown[e.keyCode] = true;
		if (e.keyCode == 13 && !inChat && !justSentMessage) {
			inChat = true;
			$q(chatBox).focus();
		}
	});
	
	$q(window).keyup(function(e){
		keysDown[e.keyCode] = false;
		if(e.keyCode == 13){
			justSentMessage = false;
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
		pokemonParty = data.pokemon;
		
		for(var i=0;i<pokemonParty.length;++i){
			pokemonParty[i].icon = new Image();
			pokemonParty[i].icon.src = 'resources/picons/'+pokemonParty[i].id+'_1.png';
		}
	});
	
	socket.on('loadMap', function(data){
		console.log('loadMap: '+data.mapid);
		loadMap(data.mapid);
	});
	
	
	socket.on('createChars', function(data){
		loadedChars = true;
		var arr = data.arr;
		for(var i=0;i<arr.length;++i){
			characters.push(new Character(arr[i]));
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
			
			if(charData.id == myId) continue;
			
			var chr = getCharById(charData.id);
			if(chr){
				chr.inBattle = charData.inBattle;
				chr.targetX = charData.x;
				chr.targetY = charData.y;
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
				characters.push(chr);
			}
		}
		
		for(var i=0;i<charsNotUpdated.length;++i){
			for(var j=0;j<characters.length;++j){
				if(characters[j].id == charsNotUpdated[i]){
					characters.splice(j, 1);
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
		
		
		battle = {};
		battle.x = data.x;
		battle.y = data.y;
		battle.background = new Image();
		battle.background.src = 'resources/ui/battle_background1.png';
		
		var enemy = data.battle.enemy;
		
		battle.enemyPokemon = enemy;
		battle.enemyPokemon.sprite = new Image();
		battle.enemyPokemon.sprite.src = 'resources/sprites' + (battle.enemyPokemon.shiny ? '_shiny' : '') + '/'+battle.enemyPokemon.id+'.png';
		
		battle.curPokemon = data.battle.curPokemon;
		battle.curPokemon.backsprite = new Image();
		battle.curPokemon.backsprite.src = 'resources/back' + (battle.enemyPokemon.shiny ? '_shiny' : '') + '/'+battle.curPokemon.id+'.png';
		
		battleTransition();
	});
}



})(window, jQuery);