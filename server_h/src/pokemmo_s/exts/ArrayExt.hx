package pokemmo_s.exts;

/**
 * ...
 * @author Sonyp
 */

class ArrayExt {
	static public function random<A>(arr:Array<A>):A {
		return arr[Math.floor(arr.length * Math.random())];
	}
}