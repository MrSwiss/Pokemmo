function TWildPokemon(id, x, y, dir, chr){
	var self = this;
	
	var pok = new TPokemon(x, y, id);
	var initTick;
	
	self.x = pok.x;
	self.y = pok.y;
	self.randInt =  Math.floor(Math.random() * 100);
	
	self.init = function(){
		gameObjects.push(self);
		initTick = numRTicks;
	}
	
	self.destroy = function(){
		gameObjects.remove(self);
	}
	
	self.tick = function(){
		if(!chr.inBattle){
			self.destroy();
			return;
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
	
	self.render = function(ctx){
		if(chr.id == myId && !drawPlayerChar) return;
		ctx.save();
		pok.canDrawGrass = numRTicks - initTick < 5;
		if(numRTicks - initTick < 10){
			ctx.translate(0, -(Math.floor(-7 / 50 * (numRTicks - initTick) * (numRTicks - initTick) + 7 / 5 * (numRTicks - initTick)) * 8));
		}
		
		pok.render(ctx);
		
		ctx.restore();
		
		/*
		if(numRTicks - initTick > 10){
			ctx.save();
			var ly = 0;
			
			ly = ((numRTicks + self.randInt) % 31) / 30;
			ly *= 2;
			
			if(ly > 1) ly = 1 - (ly - 1);
			ly *= ly;
			ly *= 10;
			
			ctx.translate(pok.x * curMap.tilewidth + 16 + getRenderOffsetX(), pok.y * curMap.tileheight - 16 + getRenderOffsetY() + Math.round(ly));
			ctx.rotate(((numRTicks + self.randInt) % 11) / 10 * Math.PI * 2);
			ctx.drawImage(res.uiCharInBattle, -10, -10);
			ctx.restore();
		}
		*/
	}
	
	self.init();
}