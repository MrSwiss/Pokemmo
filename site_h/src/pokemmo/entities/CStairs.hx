package pokemmo.entities;
import pokemmo.CCharacter;

/**
 * ...
 * @author Sonyp
 */

class CStairs extends CWarp {
	public var fromDir:Int;
	public function new(name:String, x:Int, y:Int, direction:Int, fromDir:Int) {
		super(name, x, y);
		
		this.direction = direction;
		this.fromDir = fromDir;
	}
	
	
	override public function canWarp(chr:CCharacter):Bool {
		return chr.direction == fromDir;
	}
}