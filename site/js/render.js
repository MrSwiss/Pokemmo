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