package pokemmo.entities;
import pokemmo.CCharacter;
import pokemmo.Game;
import pokemmo.Renderer;
import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class CFollower extends CPokemon {
	public var chr:CCharacter;
	public var forceTarget:Bool;
	public var createdTick:Int;
	public function new(chr:CCharacter) {
		super(chr.follower, chr.lastX, chr.lastY);
		this.chr = chr;
		forceTarget = false;
		createdTick = Renderer.numRTicks;
		
	}
	
	override public function render(ctx:CanvasRenderingContext2D):Void {
		if(chr.follower != null){
			var src = 'resources/followers/'+chr.follower+'.png';
			if(image == null || image.obj.src != src){
				image = Game.curGame.getImage(src);
			}
		}else if(image != null){
			image = null;
		}
		
		if(chr.username == Game.username && !Game.curGame.drawPlayerFollower) return;
		if(x == chr.x && y == chr.y && !walking && !chr.walking) return;
		
		
		if(Renderer.numRTicks - createdTick < 10){
			ctx.save();
			ctx.globalAlpha = (Renderer.numRTicks - createdTick) / 10;
		}
		
		super.render(ctx);
		
		if(Renderer.numRTicks - createdTick < 10) ctx.restore();
	}
	
	override public function tick():Void {
		targetX = chr.lastX;
		targetY = chr.lastY;
		
		if(!forceTarget && chr.walking && !chr.walkingHasMoved && chr.walkingPerc >= CCharacter.CHAR_MOVE_WAIT && !chr.willMoveIntoAWall()){
			targetX = chr.x;
			targetY = chr.y;
		}
		
		super.tick();
		
		if(!walking){
			if(x < chr.x){
				direction = Game.DIR_RIGHT;
			}else if(x > chr.x){
				direction = Game.DIR_LEFT;
			}else if(y > chr.y){
				direction = Game.DIR_UP;
			}else{
				direction = Game.DIR_DOWN;
			}
		}
	}
}