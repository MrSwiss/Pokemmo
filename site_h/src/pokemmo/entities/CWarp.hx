package pokemmo.entities;
import pokemmo.CCharacter;
import pokemmo.Game;
import pokemmo.GameObject;

/**
 * ...
 * @author Matheus28
 */

class CWarp extends GameObject{
	public var name:String;
	public var disable:Bool;
	public function new(name:String, x:Int, y:Int) {
		super(x, y);
		this.name = name;
		
		disable = false;
	}
	
	public function canWarp(obj:CCharacter):Bool {
		return true;
	}
	
	static public function getWarpAt(x:Int, y:Int):CWarp {
		for (i in Game.curGame.gameObjects) {
			if (i.x == x && i.y == y && Std.is(i, CWarp)) return untyped i;
		}
		return null;
	}
	
	static public function getWarpByName(str:String):CWarp {
		for (i in Game.curGame.gameObjects) {
			if (Std.is(i, CWarp) && untyped i.name == str) return untyped i;
		}
		return null;
	}
}