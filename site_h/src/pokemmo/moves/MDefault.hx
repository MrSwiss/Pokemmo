package pokemmo.moves;
import pokemmo.Battle;
import pokemmo.Move;
import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class MDefault extends Move{
	public function new():Void {
		super();
	}
	
	override public function render(ctx:CanvasRenderingContext2D, battle:Battle):Void {
		var now:Float = battle.now;
		
		if(battle.curAction.player == 0){
			battle.canRenderEnemy = (Math.floor((now - battle.moveStartTime)/100) % 2) == 1;
			battle.shakeEnemyStatus = true;
		}else{
			battle.canRenderPlayerPokemon = (Math.floor((now - battle.moveStartTime) / 100) % 2) == 1;
			battle.shakePokemonStatus = true;
		}
		
		if(now - battle.moveStartTime > 500){
			battle.canRenderEnemy = true;
			battle.canRenderPlayerPokemon = true;
			battle.moveFinished();
		}
	}
}