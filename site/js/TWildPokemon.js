function TWildPokemon(id, x, y, dir, chr){
	var self = this;
	
	var pok = new TPokemon(x, y);
	var initTick;
	
	self.x = pok.x;
	self.y = pok.y;
	
	//pok.image.onload = function(){self.init();};
	pok.image.src = 'resources/followers/'+id+'.png';
	
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
		ctx.save();
		pok.canDrawGrass = numRTicks - initTick < 5;
		if(numRTicks - initTick < 10){
			ctx.translate(0, -(Math.floor(-7 / 50 * (numRTicks - initTick) * (numRTicks - initTick) + 7 / 5 * (numRTicks - initTick)) * 8));
		}
		
		pok.render(ctx);
		
		ctx.restore();
	}
	
	self.init();
}