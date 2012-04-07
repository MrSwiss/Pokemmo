package pokemmo_s;

/**
 * ...
 * @author Matheus28
 */

extern class SocketConnection {
	var volatile:{
		function emit(message:String, data:Dynamic):Void;
	};
	
	function disconnect():Void;
	function on(message:String, func:Dynamic->Void):Void;
	function once(message:String, func:Dynamic->Void):Void;
	function emit(message:String, data:Dynamic):Void;
	function removeListener(message:String, func:Dynamic->Void):Void;
}