package pokemmo;

import UserAgentContext;

/**
 * ...
 * @author Sonyp
 */

class GameObject {
	public var x:Int;
	public var y:Int;
	public var direction:Int;
	public var randInt:Int;
	public var renderPriority:Int;
	
	public var isTemporary:Bool;
	
	
	public function new(x_:Int, y_:Int, direction_:Int = Game.DIR_DOWN) {
		x = x_;
		y = y_;
		direction = direction_;
		renderPriority = 0;
		randInt = Math.floor(Math.random() * 100000);
		isTemporary = false;
		
		Game.curGame.gameObjects.push(this);
	}
	
	public function destroy():Void {
		Game.curGame.gameObjects.remove(this);
	}
	
	public function tick():Void {
		
	}
	
	public function render(ctx:CanvasRenderingContext2D):Void {
		
	}
}