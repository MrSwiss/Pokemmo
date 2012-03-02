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
	self.follower = data.follower || null;
	self.lastMoveTick = 0;
	
	var followerObj = new Follower(this);
	
	self.lastX = self.x;
	self.lastY = self.y;
	
	self.image = new Image();
	self.image.onload = function(){
		self.loaded = true;
		render();
	}
	self.image.src = 'resources/chars/'+data.type+'.png';
	
	self.init = function(){
		characters.push(self);
		gameObjects.push(self);
		
		followerObj.init();
	}
	
	self.destroy = function(){
		characters.remove(self);
		gameObjects.remove(self);
		followerObj.destroy();
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
				
				self.lastX = self.x;
				self.lastY = self.y;
				
				switch(self.direction){
					case DIR_LEFT: self.x -= 1; break;
					case DIR_RIGHT: self.x += 1; break;
					case DIR_UP: self.y -= 1; break;
					case DIR_DOWN: self.y += 1; break;
				}
				
				self.lastMoveTick = numRTicks;
				self.walkingHasMoved = true;
				
				if(isTileGrass(curMap, self.x, self.y)){
					var grass = {
						x: self.x,
						y: self.y,
						tick: numRTicks,
						render: function(ctx){
							if(numRTicks - grass.tick >= 20){
								gameObjects.remove(grass);
								return;
							}
							
							ctx.drawImage(res.miscSprites, 32, 32 * Math.floor((numRTicks - grass.tick) / 5), 32, 32, grass.x * curMap.tilewidth + getRenderOffsetX(), grass.y * curMap.tileheight + getRenderOffsetY(), 32, 32);
						}
					};
					
					gameObjects.push(grass);
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
		
		followerObj.tick();
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
		
		if(self.id == myId && inBattle && (battle.step > 0 || transitionStep >= 18)) return;
		
		var offsetX = getRenderOffsetX();
		var offsetY = getRenderOffsetY();
		
		if(self.follower){
			var src = 'resources/followers/'+self.follower+'.png';
			if(followerObj.image.src != src){
				followerObj.image.src = src;
			}
		}else{
			followerObj.image.src = '';
		}
		var renderPos = self.getRenderPos();
		ctx.drawImage(self.image, self.direction * CHAR_WIDTH, Math.floor(self.animationStep) * CHAR_HEIGHT, CHAR_WIDTH, CHAR_HEIGHT, renderPos.x + offsetX, renderPos.y + offsetY, CHAR_WIDTH, CHAR_HEIGHT);
		
		
		if(isTileGrass(curMap, self.x, self.y)){
			if(!self.walking){
				//TODO Actually make it look like how it is in game
				ctx.drawImage(res.miscSprites, 0, 0, 32, 32, self.x * curMap.tilewidth + offsetX, self.y * curMap.tileheight + offsetY, 32, 32);
			}
		}
		
		if(self.inBattle){
			ctx.save();
			var ly = 0;
			
			ly = ((numRTicks + self.randInt) % 31) / 30;
			ly *= 2;
			
			if(ly > 1) ly = 1 - (ly - 1);
			ly *= ly;
			ly *= 10;
			
			ctx.translate(renderPos.x + offsetX + 16, renderPos.y + offsetY + 2 + ly);
			ctx.rotate(((numRTicks + self.randInt) % 11) / 10 * Math.PI * 2);
			ctx.drawImage(res.uiCharInBattle, -10, -10);
			ctx.restore();
		}
	}
}