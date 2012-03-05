var POKEMON_WIDTH = 64;
var POKEMON_HEIGHT = 64;

function TPokemon(x, y, id){
	var self = this;
	
	
	var randInt = Math.floor(Math.random() * 100);
	
	self.image = id ? getImage('resources/followers/'+id+'.png') : null;
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
		
		if(self.image){
			ctx.save();
			ctx.drawImage(self.image, POKEMON_WIDTH * self.direction, Math.floor(((numRTicks + randInt) % 10)/5) * POKEMON_HEIGHT, POKEMON_WIDTH, POKEMON_HEIGHT, renderPos.x + offsetX, renderPos.y + offsetY, POKEMON_WIDTH, POKEMON_HEIGHT);
			ctx.restore();
			
			if(self.canDrawGrass && isTileGrass(curMap, self.x, self.y) && !self.walking){
				ctx.drawImage(res.miscSprites, 0, 0, 32, 32, self.x * curMap.tilewidth + offsetX, self.y * curMap.tileheight + offsetY, 32, 32);
			}
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