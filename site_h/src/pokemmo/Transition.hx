package pokemmo;
import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class Transition {
	public var step:Int;
	public var onComplete:Void->Void;
	
	public function new() {
		step = 0;
	}
	
	public function render(ctx:CanvasRenderingContext2D):Void {
		
	}
	
	public function complete():Void {
		Renderer.stopTransition();
		if (onComplete != null) onComplete();
	}
}