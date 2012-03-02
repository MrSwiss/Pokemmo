function Follower(chr){
	var self = this;
	var FOLLOWER_WIDTH = 64;
	var FOLLOWER_HEIGHT = 64;
	
	console.log('new follower');
	
	var randInt = Math.floor(Math.random() * 100);
	
	self.image = new Image();
	self.direction = DIR_DOWN;
	self.x = chr.lastX || chr.x;
	self.y = chr.lastY || chr.y;
	self.walking = false;
	self.walkingPerc = 0.0;
	self.walkingHasMoved = false;
	
	self.targetX = chr.lastX;
	self.targetY = chr.lastY;
	
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
		ctx.drawImage(self.image, FOLLOWER_WIDTH * self.direction, Math.floor(((numRTicks + randInt) % 10)/5) * FOLLOWER_HEIGHT, FOLLOWER_WIDTH, FOLLOWER_HEIGHT, renderPos.x + offsetX, renderPos.y + offsetY, FOLLOWER_WIDTH, FOLLOWER_HEIGHT);
		ctx.restore();
	}
	
	self.tick = function(){
		self.targetX = chr.lastX;
		self.targetY = chr.lastY;
		
		if(chr.walking && !chr.walkingHasMoved && chr.walkingPerc >= CHAR_MOVE_WAIT){
			self.targetX = chr.x;
			self.targetY = chr.y;
		}
		
		if(!self.walking){
			self.walkingHasMoved = false;
			self.walkingPerc = 0.0;
			
			tickBot();
			
			if(!self.walking){
				if(this.x < chr.x){
					self.direction = DIR_RIGHT;
				}else if(this.x > chr.x){
					self.direction = DIR_LEFT;
				}else if(this.y > chr.y){
					self.direction = DIR_UP;
				}else{
					self.direction = DIR_DOWN;
				}
			}
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
		if(!self.walking) return {x: self.x * curMap.tilewidth - FOLLOWER_WIDTH/4, y: self.y * curMap.tileheight - FOLLOWER_HEIGHT/2};
		var destX = self.x * curMap.tilewidth - FOLLOWER_WIDTH/4;
		var destY = self.y * curMap.tileheight - FOLLOWER_HEIGHT/2;
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