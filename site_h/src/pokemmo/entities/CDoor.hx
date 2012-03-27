package pokemmo.entities;
import pokemmo.CCharacter;
import pokemmo.Game;
import pokemmo.GameObject;
import pokemmo.Map;
import pokemmo.Renderer;
import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class CDoor extends CWarp {
	private var openStep:Int;
	public function new(name:String, x:Int, y:Int) {
		super(name, x, y);
		
		renderPriority = 100;
		openStep = 0;
	}
	
	public function open():Void {
		openStep = 1;
	}
	
	override public function canWarp(obj:CCharacter):Bool {
		return super.canWarp(obj);
	}
	
	override public function render(ctx:CanvasRenderingContext2D):Void {
		if (disable) openStep = 0;
		if (openStep > 30) openStep = 0;
		var curMap = Map.cur;
		ctx.drawImage(Game.getRes('miscSprites').obj, 64, 32 * Math.min(Math.floor(openStep / 4), 3), 32, 32, x * curMap.tilewidth + Renderer.getOffsetX(), y * curMap.tileheight + Renderer.getOffsetY(), 32, 32);
		if(openStep > 0) ++openStep;
	}
}