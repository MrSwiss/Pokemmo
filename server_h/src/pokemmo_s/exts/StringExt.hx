package pokemmo_s.exts;

/**
 * ...
 * @author Matheus28
 */

class StringExt {
	static public function getRandomChar(str:String):String {
		return str.charAt(Math.floor(str.length * Math.random()));
	}
}