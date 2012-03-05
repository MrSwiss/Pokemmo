function Follower(chr){
	var self = this;
	var pok = new TPokemon(chr.lastX || chr.x, chr.lastY || chr.y, chr.follower ? chr.follower : null);
	self.pok = pok;
	self.x = pok.x;
	self.y = pok.y;
	self.forceTarget = false;
	self.randInt = Math.floor(Math.random() * 10000);
	
	var createdTick = numRTicks;
	
	
	self.init = function(){
		gameObjects.push(self);
	}
	
	self.destroy = function(){
		gameObjects.remove(self);
	}
	
	self.render = function(ctx){
		if(chr.follower){
			var src = 'resources/followers/'+chr.follower+'.png';
			if(!pok.image || pok.image.src != src){
				pok.image = getImage(src);
			}
		}else if(pok.image){
			pok.image = null;
		}
		
		if(chr.id == myId && !drawPlayerFollower) return;
		if(pok.x == chr.x && pok.y == chr.y && !pok.walking && !chr.walking) return;
		
		
		if(numRTicks - createdTick < 10){
			ctx.save();
			ctx.globalAlpha = (numRTicks - createdTick) / 10;
		}
		pok.render(ctx);
		
		if(numRTicks - createdTick < 10) ctx.restore();
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