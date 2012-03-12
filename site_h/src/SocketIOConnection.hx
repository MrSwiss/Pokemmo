package ;

/**
 * ...
 * @author Matheus28
 */

extern class SocketIOConnection {
	public function disconnect():Void;
	public function on(event:String, func:Dynamic -> Void):Void;
	public function emit(event:String, data:Dynamic):Void;
}