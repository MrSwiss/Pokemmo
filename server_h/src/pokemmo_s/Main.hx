package pokemmo_s;

import js.Lib;
import js.Node;
import pokemmo_s.Client;
import pokemmo_s.GameConst;
import pokemmo_s.Pokemon;

/**
 * ...
 * @author Matheus28
 */

class Main {
	static function main() {
		GameData.init();
		
		MasterConnector.connect(GameServer.start);
	}
	
	static inline public function log(obj:Dynamic):Void {
		untyped console.log(obj);
	}
	
	static inline public function warn(obj:Dynamic):Void {
		untyped console.warn(obj);
	}
	
	static inline public function error(obj:Dynamic):Void {
		untyped console.error(obj);
	}
}