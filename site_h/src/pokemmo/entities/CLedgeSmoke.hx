package pokemmo.entities;
import pokemmo.GameObject;
import pokemmo.Main;
import pokemmo.Map;
import UserAgentContext;

/**
 * ...
 * @author Sonyp
 */

class CLedgeSmoke extends GameObject{
	private var step:Int;
	public function new(x:Int, y:Int) {
		super(x, y);
		step = 0;
		renderPriority = -100;
	}
	
	override public function render(ctx:CanvasRenderingContext2D):Void {
		var map = Map.cur;
		ctx.drawImage(Game.getRes('miscSprites').obj, 96, Math.floor(step / 3) * 32, 32, 32, x * map.tilewidth + Renderer.getOffsetX(), y * map.tileheight + Renderer.getOffsetY(), 32, 32);
		
		++step;
		if (step >= 9) {
			destroy();
		}
	}
}