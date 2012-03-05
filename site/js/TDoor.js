function TDoor(name, x, y){
	var self = this;
	var openStep = 0;
	
	self.name = name;
	self.x = x;
	self.y = y;
	
	gameObjects.push(self);
	
	self.renderPriority = 100;
	
	self.open = function(){
		openStep = 1;
	}
	
	self.render = function(ctx){
		if(openStep > 30) openStep = 0;
		ctx.drawImage(res.miscSprites, 64, 32 * Math.min(Math.floor(openStep / 4), 3), 32, 32, self.x * curMap.tilewidth + getRenderOffsetX(), self.y * curMap.tileheight + getRenderOffsetY(), 32, 32);
		if(openStep) ++openStep;
	}
}

function getDoorAt(x, y){
	var i = gameObjects.length;
	while(i--){
		if(gameObjects[i].x == x && gameObjects[i].y == y && gameObjects[i] instanceof TDoor){
			return gameObjects[i];
		}
	}
	
	return null;
}