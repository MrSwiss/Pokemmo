package pokemmo.entities;
import pokemmo.CCharacter;
import pokemmo.Game;
import pokemmo.GameObject;
import pokemmo.ImageResource;
import pokemmo.Main;
import pokemmo.Map;
import pokemmo.Point;
import pokemmo.Renderer;
import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class CPokemon extends GameObject {
	inline public static var POKEMON_WIDTH = 64;
	inline public static var POKEMON_HEIGHT = 64;
	
	public var image:ImageResource;
	
	public var canDrawGrass:Bool;
	
	public var walking:Bool;
	public var walkingPerc:Float;
	public var walkingHasMoved:Bool;
	public var jumping:Bool;
	
	public var targetX:Int;
	public var targetY:Int;
	
	public var renderOffsetX:Float;
	public var renderOffsetY:Float;
	
	public function new(id:String, x:Int, y:Int, dir:Int = Game.DIR_DOWN) {
		super(x, y, dir);
		
		image = id == null ? null : Game.curGame.getImage('resources/followers/' + id + '.png');
		
		canDrawGrass = true;
		
		walking = false;
		walkingPerc = 0.0;
		walkingHasMoved = false;
		jumping = false;
		
		renderOffsetX = 0;
		renderOffsetY = 0;
		
		
		targetX = x;
		targetY = y;
	}
	
	override public function render(ctx:CanvasRenderingContext2D):Void {
		var offsetX = Renderer.getOffsetX();
		var offsetY = Renderer.getOffsetY();
		var renderPos = getRenderPos();
		var map = Map.cur;
		
		if(image != null && image.loaded){
			ctx.save();
			ctx.drawImage(image.obj, POKEMON_WIDTH * direction, Math.floor(((Renderer.numRTicks + randInt) % 10)/5) * POKEMON_HEIGHT, POKEMON_WIDTH, POKEMON_HEIGHT, renderPos.x + offsetX, renderPos.y + offsetY, POKEMON_WIDTH, POKEMON_HEIGHT);
			ctx.restore();
			
			if(canDrawGrass && map.isTileGrass(x, y) && !walking){
				ctx.drawImage(Game.getRes('miscSprites').obj, 0, 0, 32, 32, x * map.tilewidth + offsetX, y * map.tileheight + offsetY, 32, 32);
			}
		}
	}
	
	override public function tick():Void {
		if (!walking) {
			walkingHasMoved = false;
			walkingPerc = 0.0;
			
			tickBot();
		}else {
			walkingPerc += 0.1;
			if (walkingPerc >= (1 - CCharacter.CHAR_MOVE_WAIT) / 2 && !walkingHasMoved) {
				var frontPosition = getFrontPosition();
				if (Map.cur.isTileLedge(frontPosition.x, frontPosition.y) && Map.cur.getLedgeDir(frontPosition.x, frontPosition.y) == direction) {
					useLedge();
				}
				
				switch(direction){
					case Game.DIR_LEFT: x -= 1;
					case Game.DIR_RIGHT: x += 1;
					case Game.DIR_UP: y -= 1;
					case Game.DIR_DOWN: y += 1;
				}
				
				walkingHasMoved = true;
				
				if (Map.cur.isTileGrass(x, y)) {
					new CGrassAnimation(x, y);
				}
			}
			
			if(walkingPerc >= 1.0){
				walkingHasMoved = false;
				walkingPerc = CCharacter.CHAR_MOVE_WAIT + 0.10;
				walking = false;
				tickBot();
			}
		}
	}
	
	public function getRenderPos():Point {
		var curMap = Map.cur;
		if(!walking) return {x: Math.floor(x * curMap.tilewidth - POKEMON_WIDTH/4 + renderOffsetX), y: Math.floor(y * curMap.tileheight - POKEMON_HEIGHT/2 + renderOffsetY)};
		var destX:Float = x * curMap.tilewidth - POKEMON_WIDTH/4;
		var destY:Float = y * curMap.tileheight - POKEMON_HEIGHT/2;
		var perc = (walkingPerc - CCharacter.CHAR_MOVE_WAIT) / (1-CCharacter.CHAR_MOVE_WAIT);
		
		if(walkingPerc > CCharacter.CHAR_MOVE_WAIT){
			if(walkingHasMoved){
				switch(direction){
					case Game.DIR_LEFT: destX += (curMap.tilewidth) * (1-perc);
					case Game.DIR_RIGHT: destX -= (curMap.tilewidth) * (1-perc);
					case Game.DIR_UP: destY += (curMap.tileheight) * (1-perc);
					case Game.DIR_DOWN: destY -= (curMap.tileheight) * (1-perc);
				}
			}else{
				switch(direction){
					case Game.DIR_LEFT: destX -= (curMap.tilewidth) * perc;
					case Game.DIR_RIGHT: destX += (curMap.tilewidth) * perc;
					case Game.DIR_UP: destY -= (curMap.tileheight) * perc;
					case Game.DIR_DOWN: destY += (curMap.tileheight) * perc;
				}
			}
		}
		
		return {x:Math.floor(destX + renderOffsetX), y:Math.floor(destY + renderOffsetY)};
	}
	
	public function useLedge():Void {
		var front = getFrontPosition();
		var dest = getFrontPosition(2);
		var dir = direction;
		
		walking = true;
		jumping = true;
		
		var tmpCount = 0;
		var renderFunc:Void->Void = null;
		renderFunc = function() {
			++tmpCount;
			
			if(x != dest.x || y != dest.y) walking = true;
			direction = dir;
			
			renderOffsetY = Math.min(Math.round((8/15 * (tmpCount * tmpCount)) + (-8 * tmpCount)), 0);
			
			if (tmpCount == 18) {
				new CLedgeSmoke(x, y);
			}
			
			if (tmpCount >= 20) {
				renderOffsetY = 0;
				walking = false;
				walkingPerc = 0.0;
				walkingHasMoved = false;
				jumping = false;
				x = dest.x;
				y = dest.y;
				
				Renderer.unHookRender(renderFunc);
			}
		};
		
		Renderer.hookRender(renderFunc);
	}
	
	private function getFrontPosition(n:Int = 1):Point{
		switch(direction){
			case Game.DIR_LEFT: return {x: x - n, y: y};
			case Game.DIR_RIGHT: return {x: x + n, y: y};
			case Game.DIR_UP: return {x: x, y: y - n};
			case Game.DIR_DOWN: return {x: x, y: y + n};
		}
		return null;
	}
	
	private function tickBot():Void {
		if(jumping) return;
		if(walking) return;
		
		if(Math.abs(x - targetX) + Math.abs(y - targetY) > 2){
			x = targetX;
			y = targetY;
			return;
		}
		
		walking = x != targetX || y != targetY;
		
		if(!walking) return;
		
		
		var lastDirection = direction;
		
		if(Math.abs(x - targetX) > 0 && y == targetY){
			direction = x < targetX ? Game.DIR_RIGHT : Game.DIR_LEFT;
		}else if(Math.abs(y - targetY) > 0 && x == targetX){
			direction = y < targetY ? Game.DIR_DOWN : Game.DIR_UP;
		}else{
			direction = (targetY < y) ? Game.DIR_UP : Game.DIR_DOWN;
		}
		
		if(lastDirection != direction){
			walkingPerc = 0.0;
		}
	}
}