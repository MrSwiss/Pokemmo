package pokemmo_s;

/**
 * ...
 * @author Matheus28
 */

class BattleWild extends Battle {
	public function new(client:Client, wildPokemon:Pokemon) {
		super();
		isTrainerBattle = false;
		addPlayer(client, client.character.pokemon);
		addPlayer(null, [wildPokemon]);
	}
	
	override public function destroy():Void {
		super.destroy();
	}
	
	override public function initTurn():Void {
		super.initTurn();
	}
}