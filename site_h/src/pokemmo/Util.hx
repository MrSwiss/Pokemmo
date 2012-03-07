package pokemmo;

/**
 * ...
 * @author Matheus28
 */

class Util {
	inline static public function clamp(n:Float, min:Float, max:Float):Float {
		return n < min ? min : (n > max ? max : n);
	}
	
	inline static public function or(v1:Dynamic, v2:Dynamic):Dynamic {
		return v1 ? v1 : v2;
	}
	
	inline static public function getPokemonDisplayName(pk:Pokemon):String {
		return Util.or(pk.nickname, Game.getPokemonData(pk.id).name).toUpperCase();
	}
}