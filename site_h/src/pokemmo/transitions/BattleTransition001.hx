package pokemmo.transitions;
import pokemmo.Game;
import pokemmo.Main;
import pokemmo.Renderer;
import pokemmo.Transition;
import UserAgentContext;
import pokemmo.Battle;

/**
 * ...
 * @author Matheus28
 */

class BattleTransition001 extends Transition{
	inline static private var BAR_HEIGHT = 80;
	public function new() {
		super();
	}
	
	override public function render(ctx:CanvasRenderingContext2D):Void {
		if (step < 0) return;
		ctx.fillStyle = '#000000';
		
		var canvas = ctx.canvas;
		var tmpCtx = Main.tmpCtx;
		
		var g = Game.curGame;
		
		if(step >= 50){
			g.battle.render(ctx);
		}
		
		if(step < 20){
			// Nothing
		}else if(step < 38){
			var h = (step - 20) * (step - 20);
			ctx.fillRect(0, 0, canvas.width, h);
			ctx.fillRect(0, canvas.height - h, canvas.width, h);
		}else if(step < 50){
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			g.drawPlayerChar = false;
			g.drawPlayerFollower = false;
		}else if(step < 70){
			var perc = ((step - 50) / 20);
			if(perc > 1) perc = 1;
			perc *= perc;
			
			ctx.fillRect(0, canvas.height / 2 - BAR_HEIGHT / 2, canvas.width, BAR_HEIGHT);
			
			var h = (canvas.height / 2 - BAR_HEIGHT / 2) * (1 - perc);
			ctx.fillRect(0, (canvas.height / 2 - BAR_HEIGHT / 2) - h, canvas.width, h);
			ctx.fillRect(0, (canvas.height / 2 + BAR_HEIGHT / 2), canvas.width, h);
			
			ctx.save();
			
			ctx.translate(canvas.width / 2, canvas.height / 2);
			ctx.rotate(Math.PI * 2 * perc);
			ctx.scale(perc, perc);
			
			ctx.drawImage(Game.getRes('battleIntroPokeball').obj, -60, -60);
			ctx.restore();
		}else if(step < 100){
			var perc = ((step - 80) / 20);
			
			Main.clearTmpCanvas();
			
			tmpCtx.fillStyle = 'rgb(0, 0, 0)';
			tmpCtx.fillRect(0, canvas.height / 2 - BAR_HEIGHT / 2, canvas.width, BAR_HEIGHT);
			tmpCtx.drawImage(Game.getRes('battleIntroPokeball').obj, canvas.width / 2 - 60, canvas.height / 2 - 60);
			
			
			ctx.globalAlpha = Util.clamp(1 - perc, 0, 1);
			ctx.drawImage(Main.tmpCanvas, 0, 0);
			ctx.globalAlpha = 1;
		}else{
			g.battle.step = BATTLE_STEP_POKEMON_APPEARED_TMP;
			complete();
		}
		
		++step;
	}
}