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

function drawLayer(ctx, map, layer){
	if(layer.type != 'tilelayer') return;
	
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
			ctx.drawImage(miscSprites, 0, 0, 32, 32, chr.x * curMap.tilewidth + offsetX, chr.y * curMap.tileheight + offsetY, 32, 32);
		}
		
	}
}

function drawPokemonParty(){
	var x = 500;
	var y = 10;
	var deltaY = 48;
	if(!pokemonParty || !pokemonData) return;
	
	for(var i=0;i<pokemonParty.length;++i){
		ctx.save();
		ctx.shadowOffsetX = 4;
		ctx.shadowOffsetY = 4;
		ctx.shadowBlur = 0;
		ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
		ctx.drawImage(uiPokemon, x, y);
		ctx.restore();
		
		if(pokemonParty[i].imageSmall.width){
			ctx.drawImage(pokemonParty[i].imageSmall, x + 8, y + 8);
		}
		
		
		ctx.font = '12pt Font1';
		ctx.fillStyle = 'rgb(255, 255, 255)';
		
		// Name
		drawStyleText((pokemonParty[i].nickname || pokemonData[pokemonParty[i].id].name).toUpperCase(), 45, 21);
		
		// Level
		var lvWidth = ctx.measureText('Lv '+pokemonParty[i].level).width;
		drawStyleText('Lv '+pokemonParty[i].level, 45, 35);
		ctx.font = '12pt Font1';
		
		var hp = pokemonParty[i].hp  +'/' +pokemonParty[i].maxHp;
		var barWidth = ctx.measureText(hp).width;
		drawStyleText(hp, 280 - barWidth, 35);
		
		
		var sx = x + 60 + lvWidth;
		
		// Exp bar
		
		
		ctx.strokeStyle = 'rgb(0, 0, 0)';
		
		ctx.fillStyle = 'rgb(0, 0, 0)';
		ctx.fillRect(sx + 5, y + 30, (190 - barWidth - lvWidth), 5);
		
		ctx.fillStyle = 'rgb(0, 0, 200)';
		ctx.fillRect(sx + 5, y + 30, Math.ceil((190 - barWidth - lvWidth) * (pokemonParty[i].experience / pokemonParty[i].experienceNeeded)), 5);
		ctx.strokeRect(sx + 5, y + 30, (190 - barWidth - lvWidth), 5);
		
		// Hp bar
		
		ctx.fillStyle = 'rgb(0, 200, 0)';
		ctx.strokeStyle = 'rgb(0, 0, 0)';
		
		ctx.fillRect(sx, y + 27, Math.ceil((200 - barWidth - lvWidth) * (pokemonParty[i].hp / pokemonParty[i].maxHp)), 5);
		ctx.strokeRect(sx, y + 27, (200 - barWidth - lvWidth), 5);
		
		
		y += deltaY;
	}
	
	function drawStyleText(str, $x, $y){
		ctx.fillStyle = 'rgb(0, 0, 0)';
		ctx.fillText(str, x + $x + 1, y + $y + 1);
		
		ctx.fillStyle = 'rgb(255, 255, 255)';
		ctx.fillText(str, x + $x, y + $y);
	}
}

function drawChat() {
	if(inChat && chatBox.value.length > 0) filterChatText();
	
	var x = 10;
	var y = 335;
	
	ctx.font = '12pt Font1';
	ctx.drawImage(uiChat, x, y);
	
	ctx.fillStyle = 'rgb(0, 0, 0)';
	
	var str = chatBox.value;
	while(true){
		var w = ctx.measureText(str).width;
		if(w < 440){
			ctx.fillText(str, 18, 528);
			if(inChat){
				if(+new Date()%1000 < 500){
					ctx.fillRect(20 + w, 516, 10, 14);
				}
			}
			break;
		}else{
			str = str.slice(1);
		}
	}
	
	
	var i = chatLog.length;
	for(var i = Math.max(chatLog.length - 12, 0); i< chatLog.length; ++i){
		var str;

		str = chatLog[i].username + ': ';
		ctx.fillStyle = 'rgb(0, 0, 0)';
		ctx.fillText(str, x + 11, y + 181 - (14 * (chatLog.length - i)));
		
		ctx.fillStyle = 'rgb(200, 200, 200)';
		ctx.fillText(str, x + 10, y + 180 - (14 * (chatLog.length - i)));
		
		var usernameWidth = ctx.measureText(str).width;
		
		str = chatLog[i].str;
		
		ctx.fillStyle = 'rgb(0, 0, 0)';
		ctx.fillText(str, x + 10 + usernameWidth, y + 180 - (14 * (chatLog.length - i)));
	}
}

function getRenderOffsetX(){return curMap.tilewidth * -cameraX;};
function getRenderOffsetY(){return curMap.tileheight * -cameraY;};

function renderTransition(){
	
	
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	if(transitionStep < 70){
		if(isPhone){
			ctx.drawImage(gameCanvas, 0, -10, screenWidth, screenHeight);
		}else{
			ctx.drawImage(gameCanvas, 10, 10);
		}
		ctx.globalAlpha = 1.0;
		ctx.fillStyle = 'rgba(0, 0, 0, ' + Math.min(transitionStep/50, 1) + ')';
		if(isPhone){
			ctx.fillRect(0, -10, screenWidth, screenHeight);
		}else{
			ctx.fillRect(10, 10, screenWidth, screenHeight);
		}
	}else if(transitionStep < 100){
		if(transitionStep == 70){
			render(true, true);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}
		
		if(isPhone){
			ctx.drawImage(gameCanvas, 0, -10, screenWidth, screenHeight);
		}else{
			ctx.drawImage(gameCanvas, 10, 10);
		}
		
		ctx.fillStyle = 'rgba(0, 0, 0, ' + ((30 - (transitionStep - 70)) / 30) + ')';
		if(isPhone){
			ctx.fillRect(0, -10, screenWidth, screenHeight);
		}else{
			ctx.fillRect(10, 10, screenWidth, screenHeight);
		}
	}else{
		inTransition = false;
		if(transitionOnComplete) transitionOnComplete();
		return;
	}
	
	
	transitionStep += 2;
	
	if(transitionDrawParty && !isPhone){
		drawPokemonParty();
	}
}

var willRender = false;


function render(forceNoTransition, onlyRender){
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	//ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
	ctx.fillStyle = '#66BBFF';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	
	
	var realRender = function(){
		willRender = false;
		
		if(inTransition && !forceNoTransition){
			renderTransition();
		}else{
			switch(state){
				case ST_MAP:
					if(curMap){
						
						gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
						
						var chr = getPlayerChar();
						if(chr){
							var charRenderPos = chr.getRenderPos();
							cameraX = Math.max(0, charRenderPos.x / curMap.tilewidth + 1 - (screenWidth / curMap.tilewidth) / 2);
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
					
					if(!isPhone){
						drawPokemonParty();
						drawChat();
					}
				break;
				case ST_LOADING:
					loadingMapRender();
				break;
				case ST_BATTLE:
					gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
					
					if(battleBackground.width != 0){
						gameCtx.drawImage(battleBackground, 0, 0);
					}
					
					if(battleTextBackground.width != 0){
						gameCtx.drawImage(battleTextBackground, 2, 228);
					}
					
					gameCtx.drawImage(battleCurPokemonSprite, 60, 96);
					
					gameCtx.drawImage(battleEnemyPokemonSprite, 290, 30);
					
					if(isPhone){
						ctx.drawImage(gameCanvas, 0, -10, screenWidth, screenHeight);
					}else{
						ctx.drawImage(gameCanvas, 10, 10);
					}
					
					if(!isPhone){
						drawPokemonParty();
					}
				break;
			}
			
			if(isPhone){
				ctx.drawImage(iOSUI, 0, 0);
			}
		}
		
		if(!onlyRender){
			onScreenCtx.clearRect(0, 0, onScreenCanvas.width, onScreenCanvas.height);
			onScreenCtx.drawImage(canvas, 0, 0);
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