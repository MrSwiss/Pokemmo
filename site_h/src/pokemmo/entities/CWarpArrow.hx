package pokemmo.entities;
import pokemmo.Game;
import pokemmo.Main;
import pokemmo.Map;
import pokemmo.Renderer;
import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class CWarpArrow extends CWarp{

	public function new(name:String, x:Int, y:Int) {
		super(name, x, y);
	}
	
	override public function render(ctx:CanvasRenderingContext2D):Void {
		if(disable) return;
		var chr = Game.curGame.getPlayerChar();
		if(chr == null) return;
		
		if(Math.abs(chr.x - x) + Math.abs(chr.y - y) > 1) return;
		
		var dir;
		if(chr.x < x){
			dir = Game.DIR_RIGHT;
		}else if(chr.x > x){
			dir = Game.DIR_LEFT;
		}else if(chr.y < y){
			dir = Game.DIR_DOWN;
		}else{
			dir = Game.DIR_UP;
		}
		
		if(dir != chr.direction) return;
		
		var curMap = Map.cur;
		
		ctx.save();
		ctx.translate(x * curMap.tilewidth + Renderer.getOffsetX() + 16, y * curMap.tileheight + Renderer.getOffsetY() + 16);
		
		ctx.rotate(Math.PI / 2 * dir);
		if((Renderer.numRTicks % 30) < 15){
			ctx.translate(0, 4);
		}
		
		ctx.drawImage(Game.getRes('miscSprites').obj, 0, 32, 32, 32, -16, -16, 32, 32);
		ctx.restore();
	}
}