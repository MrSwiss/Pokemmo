package pokemmo_s;
import js.Node;

/**
 * ...
 * @author Matheus28
 */

class MapInstance {
	public var map:Map;
	public var id:String;
	
	public var chars:Array<ClientCharacter>;
	
	public var networkObjectData:String;
	public var messages:Array<{
		var username:String;
		var str:String;
		var x:Int;
		var y:Int;
	}>;
	private var cremoved:Array<String>;
	public var warpsUsed:Array<{
		var username:String;
		var warpName:String;
		var x:Int;
		var y:Int;
		var direction:Int;
	}>;
	
	public function new(map:Map, id:String) {
		this.map = map;
		chars = [];
		messages = [];
		cremoved = [];
		warpsUsed = [];
		
		++map.numInstances;
		GameData.mapsInstaces.push(this);
	}
	
	public function destroy():Void {
		map.instances.remove(id);
		--map.numInstances;
		GameData.mapsInstaces.remove(this);
	}
	
	public function addChar(char:ClientCharacter):Void {
		chars.push(char);
		
		cremoved.remove(char.client.username);
	}
	
	public function removeChar(char:ClientCharacter):Void {
		chars.remove(char);
		
		if (chars.length == 0 && map.numInstances > 1) {
			destroy();
		}
		
		cremoved.push(char.client.username);
	}
	
	public inline function getCharCount():Int {
		return chars.length;
	}
	
	public function generateFullCharNetworkObject() {
		var arr = [];
		for (c in chars) {
			arr.push(c.generateNetworkObject());
		}
		return arr;
	}
	
	public function generateNetworkObjectData():String {
		var obj:Dynamic = {
			map: map.id
		};
		
		var charArr = [];
		for (c in chars) {
			if (c.retransmit) {
				c.retransmit = false;
				charArr.push(c.generateNetworkObject());
			}
		}
		
		if (charArr.length > 0) obj.chars = charArr;
		if (messages.length > 0) obj.messages = messages;
		if (warpsUsed.length > 0) obj.warpsUsed = warpsUsed;
		if (cremoved.length > 0) obj.cremoved = cremoved;
		
		var data = Node.stringify(obj);
		
		untyped {
			messages.length = 0;
			warpsUsed.length = 0;
			cremoved.length = 0;
		}
		
		networkObjectData = data;
		return data;
	}
}