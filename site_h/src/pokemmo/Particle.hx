package pokemmo;

import UserAgentContext;

/**
 * ...
 * @author Sonyp
 */

class Particle {
	public var started:Bool;
	public function new() {
		started = false;
	}
	
	public function destroy():Void {
		
	}
	
	public function start():Void {
		started = true;
	}
	
	public function end():Void {
		started = false;
	}
	
	public function render(ctx:CanvasRenderingContext2D):Void {
		
	}
}