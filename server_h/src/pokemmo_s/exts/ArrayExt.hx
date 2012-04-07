package pokemmo_s.exts;

/**
 * ...
 * @author Matheus28
 */

class ArrayExt {
	static public function random<A>(arr:Array<A>):A {
		return arr[Math.floor(arr.length * Math.random())];
	}
}