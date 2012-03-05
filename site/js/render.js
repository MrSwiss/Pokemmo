var transitionStep = 0;
var battleIntroPokeball = getImage('resources/ui/battle_intro_pokeball.png');

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
	/** @const */
	var A_FIRST = -1,
		B_FIRST = 1;
	gameObjects.sort(function(a, b){
		if(a instanceof Character && a.id == myId){
			if(b instanceof TGrass) return A_FIRST;
			return B_FIRST;
		}
		if(b instanceof Character && b.id == myId){
			if(a instanceof TGrass) return B_FIRST;
			return A_FIRST;
		}
		
		if(a instanceof Character && b instanceof Follower){
			return B_FIRST;
		}
		
		if(b instanceof Character && a instanceof Follower){
			return A_FIRST;
		}
		
		if(a.y < b.y){
			return A_FIRST;
		}
		
		if(a.y > b.y){
			return B_FIRST;
		}
		
		if(a.y == b.y){
			if((a.renderPriority || 0) > (b.renderPriority || 0)) return B_FIRST;
			if((b.renderPriority || 0) > (a.renderPriority || 0)) return A_FIRST;
			
			
			if(a instanceof TGrass) return B_FIRST;
			if(b instanceof TGrass) return A_FIRST;
			
			if(a instanceof Character && b instanceof Follower){
				return B_FIRST;
			}else if(b instanceof Character && a instanceof Follower){
				return A_FIRST;
			}
			
			if(a.randInt){
				if(b.randInt){
					if(a.randInt > b.randInt) return B_FIRST;
					if(a.randInt < b.randInt) return A_FIRST;
					return 0;
				}
				return B_FIRST;
			}else if(b.randInt){
				return A_FIRST;
			}
			return 0;
		}
		
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
	
	ctx.font = '12px Font2';
	
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
		if(!inChat) ctx.globalAlpha = clamp(5 - (now - chatLog[i].timestamp)/1000 + 2, 0, 1);
		var str;
		
		if(!inChat){
			ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
			ctx.fillRect(x + 6, y + 169 - (14 * (chatLog.length - i)), ctx.measureText(chatLog[i].username + ': ' + chatLog[i].str).width + 6, 14);
		}
		
		str = chatLog[i].username + ': ';
		ctx.fillStyle = 'rgb(0, 0, 0)';
		ctx.fillText(str, x + 11, y + 181 - (14 * (chatLog.length - i)));
		
		ctx.fillStyle = 'rgb(255, 255, 0)';
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
			drawPlayerFollower = false;
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
	
	var realRender = function(){
		willRender = false;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		//ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
		ctx.fillStyle = '#66BBFF';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
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
						ctx.drawImage(gameCanvas, 0, 0);
					}
					
					if(inBattle && battle.step == 0){
						renderBattleTransition();
					}else if(inBattle){
						renderBattle();
					}
					
				}else{
					throw new Error('No map in memory');
				}
				
				if(!isPhone){
					drawChat();
				}
				if(!isPhone && !inBattle){
					drawPokemonParty();
				}
				
				for(var i=0;i<renderHooks.length;++i) renderHooks[i]();
			break;
			case ST_LOADING:
				loadingMapRender();
			break;
			case ST_DISCONNECTED:
				ctx.fillStyle = '#000000';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.fillStyle = '#FFFFFF';
				ctx.font = '12pt Courier New';
				ctx.fillText("Disconnected from the server", 10, 30);
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

function getImage(src, onload, onerror){
	if(!src) return new Image();
	if(loadedResources[src]){
		if(onload) setTimeout(onload, 4);
		return loadedResources[src];
	}
	
	var img = new Image();
	if(onload) img.onload = onload;
	if(onerror) img.onerror = onerror;
	img.src = src;
	return loadedResources[src] = img;
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