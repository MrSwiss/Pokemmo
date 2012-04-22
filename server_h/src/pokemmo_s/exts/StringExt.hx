package pokemmo_s.exts;

/**
 * ...
 * @author Sonyp
 */

class StringExt {
	static public function getRandomChar(str:String):String {
		return str.charAt(Math.floor(str.length * Math.random()));
	}
}