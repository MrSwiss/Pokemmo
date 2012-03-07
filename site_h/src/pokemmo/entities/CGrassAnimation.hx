package pokemmo.entities;
import pokemmo.Game;
import pokemmo.GameObject;
import pokemmo.Map;
import pokemmo.Renderer;
import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class CGrassAnimation extends GameObject{
	private var createdTick:Int;
	public function new(x:Int, y:Int) {
		super(x, y);
		
		createdTick = Renderer.numRTicks;
	}
	
	override public function render(ctx:CanvasRenderingContext2D):Void {
		var tick = createdTick;
		if(Renderer.numRTicks - tick >= 16){
			destroy();
			return;
		}
		
		
		var curMap = Map.cur;
		ctx.drawImage(Game.getRes('miscSprites').obj, 32, 32 * Math.floor((Renderer.numRTicks - tick) / 4), 32, 32, x * curMap.tilewidth + Renderer.getOffsetX(), y * curMap.tileheight + Renderer.getOffsetY(), 32, 32);
	}
}