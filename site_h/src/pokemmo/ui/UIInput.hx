package pokemmo.ui;
import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class UIInput {
	public var x:Int;
	public var y:Int;
	public var selected:Bool;
	public var selectedTime:Float;
	public var disabled:Bool;
	
	public function new(x:Int, y:Int) {
		this.x = x;
		this.y = y;
		disabled = false;
	}
	
	public function select():Void {
		if (selected) return;
		if (UI.selectedInput != null) {
			UI.selectedInput.blur();
		}
		
		UI.selectedInput = this;
		selected = true;
		selectedTime = Date.now().getTime();
	}
	
	public function blur():Void {
		if (!selected) return;
		selected = false;
		UI.selectedInput = null;
	}
	
	public function tick():Void {
		
	}
	
	public function render(ctx:CanvasRenderingContext2D):Void {
		
	}
	
	public function isUnderMouse():Bool {
		return false;
	}
}