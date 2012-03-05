function TWarpArrow(name, x, y){
	var self = this;
	
	self.name = name;
	self.x = x;
	self.y = y;
	self.disable = false;
	
	gameObjects.push(self);
	
	self.render = function(ctx){
		if(self.disable) return;
		var chr = getPlayerChar();
		if(!chr) return;
		
		if(Math.abs(chr.x - self.x) + Math.abs(chr.y - self.y) > 1) return;
		
		var dir;
		if(chr.x < self.x){
			dir = DIR_RIGHT;
		}else if(chr.x > self.x){
			dir = DIR_LEFT;
		}else if(chr.y < self.y){
			dir = DIR_DOWN;
		}else{
			dir = DIR_UP;
		}
		
		if(dir != chr.direction) return;
		
		ctx.save();
		ctx.translate(self.x * curMap.tilewidth + getRenderOffsetX() + 16, self.y * curMap.tileheight + getRenderOffsetY() + 16);
		
		ctx.rotate(Math.PI / 2 * dir);
		if((numRTicks % 30) < 15){
			ctx.translate(0, 4);
		}
		
		ctx.drawImage(res.miscSprites, 0, 32, 32, 32, -16, -16, 32, 32);
		ctx.restore();
	}
}

function getWarpArrowAt(x, y){
	var i = gameObjects.length;
	while(i--){
		if(gameObjects[i].x == x && gameObjects[i].y == y && gameObjects[i] instanceof TWarpArrow){
			return gameObjects[i];
		}
	}
	
	return null;
}