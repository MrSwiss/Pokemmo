
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

// #include "Map.js"

// #include "Tileset.js"

// #include "Layer.js"

// #include "render.js"

// #include "Character.js"

// #include "TPokemon.js"

// #include "Follower.js"

// #include "Battle.js"

// #include "moves.js"

// #include "TWildPokemon.js"

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