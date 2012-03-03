function Follower(chr){
	var self = this;
	var pok = new TPokemon(chr.lastX || chr.x, chr.lastY || chr.y);
	self.pok = pok;
	self.x = pok.x;
	self.y = pok.y;
	self.forceTarget = false;
	self.init = function(){
		gameObjects.push(self);
	}
	
	self.destroy = function(){
		gameObjects.remove(self);
	}
	
	self.render = function(ctx){
		if(chr.id == myId && !drawPlayerChar) return;
		pok.render(ctx);
	}
	
	self.tick = function(){
		pok.targetX = chr.lastX;
		pok.targetY = chr.lastY;
		
		if(!self.forceTarget && chr.walking && !chr.walkingHasMoved && chr.walkingPerc >= CHAR_MOVE_WAIT){
			pok.targetX = chr.x;
			pok.targetY = chr.y;
		}
		
		pok.tick();
		
		if(!pok.walking){
			if(pok.x < chr.x){
				pok.direction = DIR_RIGHT;
			}else if(pok.x > chr.x){
				pok.direction = DIR_LEFT;
			}else if(pok.y > chr.y){
				pok.direction = DIR_UP;
			}else{
				pok.direction = DIR_DOWN;
			}
		}
		
		self.x = pok.x;
		self.y = pok.y;
	}
}