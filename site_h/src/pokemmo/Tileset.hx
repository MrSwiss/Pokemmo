package pokemmo;

/**
 * ...
 * @author Matheus28
 */

class Tileset {
	public var loaded:Bool;
	public var error:Bool;
	public var onload:Void -> Void;
	public var onerror:Void -> Void;
	
	public var image:Dynamic;
	public var firstgid:Int;
	public var imagewidth:Int;
	public var imageheight:Int;
	public var tilewidth:Int;
	public var tileheight:Int;
	public var tileproperties:Array<Dynamic>;
	
	
	public function new(data:Dynamic) {
		loaded = false;
		error = false;
		tileproperties = [];
		
		imagewidth = data.imagewidth;
		imageheight = data.imageheight;
		tilewidth = data.tilewidth;
		tileheight = data.tileheight;
		
		firstgid = data.firstgid;
		image = untyped __js__("new Image()");
		image.onload = function():Void {
			if (onload != null) onload();
		}
		
		image.onerror = function():Void {
			if (onerror != null) onerror();
		}
		
		
		image.src = 'resources/' + data.image.slice(3);
		
		for(i in Reflect.fields(data.tileproperties)){
			if(!data.tileproperties.hasOwnProperty(i)) continue;
			untyped tileproperties[i] = data.tileproperties[i];
		}
		
		for(i in 0...Math.floor((imagewidth / tilewidth) * (imageheight / tileheight))){
			if(!tileproperties[i]){
				tileproperties[i] = {};
			}
		}
	}
	
	inline static public function getTilesetOfTile(map:Map, n:Int):Tileset {
		/*
		var tilesets = map.tilesets;
		var i = tilesets.length;
		while(i-- > 0){
			if(n >= tilesets[i].firstgid) return tilesets[i];
		}
		return null;*/
		
		var tilesets = map.tilesets;
		var i = tilesets.length;
		var f = null;
		while(i-- > 0){
			if (n >= tilesets[i].firstgid) {
				f = tilesets[i];
				break;
			}
		}
		return f;
	}
}