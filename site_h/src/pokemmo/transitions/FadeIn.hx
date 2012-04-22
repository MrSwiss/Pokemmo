package pokemmo.transitions;
import pokemmo.Transition;
import UserAgentContext;

/**
 * ...
 * @author Sonyp
 */

class FadeIn extends Transition{
	private var fadeTime:Int;
	public function new(frames:Int) {
		super();
		
		fadeTime = frames;
	}
	override public function render(ctx:CanvasRenderingContext2D):Void {
		ctx.fillStyle = 'rgba(0,0,0,' + Util.clamp(1 - step / fadeTime, 0, 1) + ')';
		ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		
		++step;
		
		if (step >= fadeTime) {
			complete();
			return;
		}
	}
}