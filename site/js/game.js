(function(window){
"use strict";

var serverHost = 'http://localhost:2828';

var $q = jQuery;
var canvas, ctx;
var gameCanvas;
var gameCtx;
var onScreenCanvas;
var onScreenCtx;

var curMap;
var socket;

var ST_LOADING = 1;
var ST_MAP = 2;

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

var myId = 'player';
var keysDown = [];

var CHAR_MOVE_WAIT = 0.3;

var screenWidth = 480;
var screenHeight = 320;


var CHAR_WIDTH = 32;
var CHAR_HEIGHT = 64;

var cameraX = 0;
var cameraY = 0;


var lastAckMove = 0;
var loadedChars = false;


var isPhone = (navigator.userAgent.match(/iPhone/i)) || (navigator.userAgent.match(/iPod/i));
var isLandscape = function(){return canvas.width == 480 && canvas.height == 300};
var iOSUI;
var iOSAButtonPos = {x:430, y:200};
var iOSBButtonPos = {x:370, y:250};
var uiAButtonDown = false;
var uiBButtonDown = false;
if(isPhone){
	iOSUI = new Image();
	iOSUI.src = 'resources/ui/ios_ui.png';
}

var uiPokemon;

var miscSprites;

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
	
	for(var i = 0, len = (self.imagewidth/self.tilewidth)*(self.imageheight/self.tileheight); i<len; ++i){
		if(!self.tileproperties[i]){
			self.tileproperties[i] = {};
		}
	}
}

function Layer(data){
	this.data = data.data;
	this.width = data.width;
	this.height = data.height;
	this.x = data.x;
	this.y = data.y;
	this.properties = data.properties || {};
}

function renderMap(ctx, map){
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

function getTilesetOfTile(map, n){
	var tilesets = map.tilesets;
	var i = tilesets.length;
	while(i--){
		if(n >= tilesets[i].firstgid) return tilesets[i];
	}
	return null;
}

function drawLayer(ctx, map, layer){
	var tilesets = map.tilesets;
	var j=0;
	
	
	var initialX = Math.floor(cameraX);
	var initialY = Math.floor(cameraY);
	var offsetX = getRenderOffsetX();
	var offsetY = getRenderOffsetY();
	var finalX = initialX + Math.floor(screenWidth / curMap.tilewidth) + 1;
	var finalY = initialY + Math.floor(screenHeight / curMap.tileheight) + 1;
	
	
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
			
			try{
				ctx.drawImage(tileset.image, srcx, srcy, tileset.tilewidth, tileset.tileheight,  (x + layer.x) * tileset.tilewidth + offsetX, (y + layer.y) * tileset.tileheight + offsetY, tileset.tilewidth, tileset.tileheight);
			}catch(e){
				console.log([tileset.image, srcx, srcy, tileset.tilewidth, tileset.tileheight,  (x + layer.x) * tileset.tilewidth + offsetX, (y + layer.y) * tileset.tileheight + offsetY, tileset.tilewidth, tileset.tileheight]);
			}
		}
	}
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

function hasTileProp(map, x, y, prop){
	for(var i=0;i<map.layers.length;++i){
		var layer = map.layers[i];
		
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

function getRenderOffsetX(){return curMap.tilewidth * -cameraX;};
function getRenderOffsetY(){return curMap.tileheight * -cameraY;};

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
			ctx.drawImage(miscSprites, 0, 0, 32, 32, chr.x * curMap.tilewidth + offsetX, chr.y * curMap.tileheight + offsetY, 32, 32);
		}
		
	}
}

function drawPokemonParty(){
	var x = 500;
	var y = 10;
	var deltaY = 74;
	if(!pokemonParty || !pokemonData) return;
	
	for(var i=0;i<pokemonParty.length;++i){
		ctx.drawImage(uiPokemon, x, y);
		
		if(pokemonParty[i].imageSmall.width){
			ctx.drawImage(pokemonParty[i].imageSmall, x + 8, y + 8);
		}
		
		
		ctx.font = '12pt Font1';
		
		// Name
		drawStyleText(pokemonData[pokemonParty[i].id].name.toUpperCase(), 45, 21);
		
		// Level
		drawStyleText('Lv '+pokemonParty[i].level, 45, 35);
		ctx.font = '12pt Font1';
		var hp = pokemonParty[i].hp+'/'+pokemonParty[i].maxHp;
		drawStyleText(hp, 280 - ctx.measureText(hp).width, 35);
		
		ctx.fillStyle = 'rgb(0, 200, 0)';
		ctx.strokeStyle = 'rgb(0, 0, 0)';
		
		ctx.fillRect(x + 110, y + 27, 100 * Math.ceil(pokemonParty[i].hp/pokemonParty[i].maxHp), 7);
		ctx.strokeRect(x + 110, y + 27, 100, 7);
		
		
		y += deltaY;
	}
	
	function drawStyleText(str, $x, $y){
		ctx.fillStyle = 'rgb(0, 0, 0)';
		ctx.fillText(str, x + $x + 1, y + $y + 1);
		
		ctx.fillStyle = 'rgb(255, 255, 255)';
		ctx.fillText(str, x + $x, y + $y);
	}
}

function Character(data){
	var self = this;
	
	self.id = data.id || '???';
	console.log('new char for '+self.id);
	
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
	self.image = new Image();
	self.image.onload = function(){
		self.loaded = true;
		console.log('Character sprite loaded');
		render();
	}
	self.image.src = 'resources/chars/'+data.type+'.png';
	self.tickRender = function(){
		
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
			}else{
				tickBot();
			}
		}
		
		if(self.walking){
			if(self.id == myId){
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
					if((self.direction == DIR_LEFT && isKeyDown(65))
					|| (self.direction == DIR_DOWN && isKeyDown(83))
					|| (self.direction == DIR_RIGHT && isKeyDown(68))
					|| (self.direction == DIR_UP && isKeyDown(87))){
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
		}
		
		if(lastDirection != self.direction){
			self.walkingPerc = 0.0;
		}
	}
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

function loadMap(id){
	state = ST_LOADING;
	curMap = null;
	
	characters = [];
	loadedChars = false;
	
	var pending = 0;
	var completed = 0;
	var error = false;
	
	++pending;
	miscSprites = new Image();
	miscSprites.onload = function(){--pending;++completed;};
	miscSprites.onerror = function(){--pending;error = true;refresh();};
	miscSprites.src = 'resources/tilesets/misc.png';
	
	++pending;
	uiPokemon = new Image();
	uiPokemon.onload = function(){--pending;++completed;};
	uiPokemon.onerror = function(){--pending;error = true;refresh();};
	uiPokemon.src = 'resources/ui/pokemon.png';
	
	++pending;
	$q.ajax('resources/data/pokemon.json', {
		'cache': true,
		'dataType': 'json',
		'success': function(data, textStatus, jqXHR){
			--pending;
			++completed;
			pokemonData = data;
		},
		'error': function(jqXHR, textStatus, errorThrown){
			--pending;
			error = true;
			refresh();
		}
	});
	
	++pending;
	$q.ajax('resources/maps/'+id+'.json', {
		'dataType': 'json',
		'success': function(data, textStatus, jqXHR){
			--pending;
			++completed;
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
		},
		'error': function(jqXHR, textStatus, errorThrown){
			--pending;
			error = true;
			refresh();
		}
	});
	
	function refresh(){
		if(state != ST_LOADING) return;
		
		ctx.fillStyle = 'rgb(0,0,0)';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		if(error){
			console.log('Error loading map');
		}else{
			if(pending == 0){
				console.log('Map loaded');
				state = ST_MAP;
				render();
			}else{
				console.log('Pending: '+pending);
			}
		}
		
	}
	
	loadingMapRender = refresh;
	render();
}

var willRender = false;


function render(){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	
	var realRender = function(){
		willRender = false;
		//console.time('render');
		//console.log('Rendering state '+state);
		switch(state){
			case ST_MAP:
				if(curMap){
					
					gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
					
					var chr = getPlayerChar();
					if(chr){
						var charRenderPos = chr.getRenderPos();
						cameraX = Math.max(0, charRenderPos.x / curMap.tilewidth - (screenWidth / curMap.tilewidth) / 2);
						cameraY = Math.max(0, charRenderPos.y / curMap.tileheight - (screenHeight / curMap.tileheight) / 2);
						
						if(cameraX > 0 && cameraX + (screenWidth / curMap.tilewidth) > curMap.width) cameraX = curMap.width - screenWidth / curMap.tilewidth;
						if(cameraY > 0 && cameraY + (screenHeight / curMap.tileheight) > curMap.height) cameraY = curMap.height - screenHeight / curMap.tileheight;
					}
					
					renderMap(gameCtx, curMap);
					renderChars(gameCtx);
					renderMapOver(gameCtx, curMap);
					
					if(isPhone){
						ctx.drawImage(gameCanvas, 0, -10, screenWidth, screenHeight);
					}else{
						ctx.drawImage(gameCanvas, 10, 10);
					}
				}else{
					throw new Error('No map in memory');
				}
				
				drawPokemonParty();
			break;
			case ST_LOADING:
				loadingMapRender();
			break;
		}
		
		if(isPhone){
			ctx.drawImage(iOSUI, 0, 0);
		}
		//console.timeEnd('render');
		
		onScreenCtx.clearRect(0, 0, onScreenCanvas.width, onScreenCanvas.height);
		onScreenCtx.drawImage(canvas, 0, 0);
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

function tick(){
	
	if(state == ST_MAP){
		
		for(var i=0;i<characters.length;++i){
			characters[i].tick();
		}
		
	}
	
	render();
}

window.initGame = function($canvas){
	onScreenCanvas = $canvas;
	onScreenCtx = onScreenCanvas.getContext('2d');
	
	gameCanvas = document.createElement('canvas');
	gameCanvas.width = screenWidth;
	gameCanvas.height = screenHeight;
	gameCtx = gameCanvas.getContext('2d');
	
	canvas = document.createElement('canvas');
	ctx = canvas.getContext('2d');
	
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
	});
	
	$q(window).keyup(function(e){
		keysDown[e.keyCode] = false;
	});
	
	setInterval(tick, 1000 / 30);
	
	$q(window).resize(function(){
		if(isPhone){
			onScreenCanvas.width = canvas.width = $q(window).width();
			onScreenCanvas.height = canvas.height = $q(window).height();
			
		}else{
			onScreenCanvas.width = canvas.width = 800;
			onScreenCanvas.height = canvas.height = 600;
			$q(onScreenCanvas).css({'top':'50%','left':'50%','position':'fixed','margin-top':'-300px','margin-left':'-400px'});
		}
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
			pokemonParty[i].imageSmall = new Image();
			pokemonParty[i].imageSmall.src = 'resources/sprites/'+pokemonParty[i].id+'_small.png';
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
				chr.targetX = charData.x;
				chr.targetY = charData.y;
				if(chr.x == charData.x && chr.y == charData.y){
					chr.direction = charData.direction;
				}else if((Math.abs(chr.x - charData.x) <= 1 && Math.abs(chr.y - charData.y) <= 1)
				|| chr.x - 2 == charData.x && chr.y == charData.y
				|| chr.x + 2 == charData.x && chr.y == charData.y
				|| chr.x == charData.x && chr.y - 2 == charData.y
				|| chr.x == charData.x && chr.y + 2 == charData.y){
					// WOW! It's fucking nothing!
				}else{
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
	});
}



})(window);