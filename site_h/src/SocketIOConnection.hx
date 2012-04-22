package ;

/**
 * ...
 * @author Sonyp
 */

extern class SocketIOConnection {
	public function disconnect():Void;
	public function on(event:String, func:Dynamic -> Void):Void;
	public function once(event:String, func:Dynamic -> Void):Void;
	public function emit(event:String, ?data:Dynamic):Void;
}