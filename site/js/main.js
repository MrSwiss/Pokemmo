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

var uiPokemon;
var uiChat;
var uiCharInBattle;

var battleBackground;


var battle;


var miscSprites;

function isKeyDown(n){return !!keysDown[n];};

function parseMap(data){
	return new Map(data);
}

// #include "Map.js"

// #include "Tileset.js"

// #include "Layer.js"

// #include "render.js"

// #include "Character.js"

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