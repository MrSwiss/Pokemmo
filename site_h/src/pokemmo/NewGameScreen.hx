package pokemmo;

import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class NewGameScreen {
	
	static public function init():Void {
		
	}
	
	static public function destroy():Void {
		
	}
	
	static public function render(ctx:CanvasRenderingContext2D):Void {
		ctx.drawImage(TitleScreen.titleLogo.obj, 117, 80);
	}
}