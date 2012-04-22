package pokemmo_s;
import js.Node;
import pokemmo_s.MasterConnector;

/**
 * ...
 * @author Sonyp
 */

class Map {
	static inline public var SD_NONE:Int = 0;
	static inline public var SD_SOLID:Int = 1;
	static inline public var SD_WATER:Int = 2;
	static inline public var SD_LEDGE_DOWN:Int = 3;
	static inline public var SD_LEDGE_LEFT:Int = 4;
	static inline public var SD_LEDGE_UP:Int = 5;
	static inline public var SD_LEDGE_RIGHT:Int = 6;
	static inline public var SD_GRASS:Int = 7;
	
	static inline private var LAYER_TILELAYER = "tilelayer";
	static inline private var LAYER_OBJECTGROUP = "objectgroup";
	
	public var id:String;
	
	private var data:MapFileData;
	
	public var width:Int;
	public var height:Int;
	
	public var solidData:Array<Array<Int>>;
	
	public var encounterAreas:Array<MapEncounterArea>;
	
	public var warps:Hash<MapWarp>;
	public var points:Hash<Location>;
	
	public var instances:Hash<MapInstance>;
	public var numInstances:Int;
	
	public var playersPerInstance:Int;
	public var grassEncounters:Array<EncounterData>;
	
	public function new(id:String) {
		this.id = id;
		
		numInstances = 0;
		
		Node.process.stdout.write('Loading: '+id+'...');
		
		var sStart:Float = Date.now().getTime();
		
		encounterAreas = [];
		warps = new Hash();
		points = new Hash();
		instances = new Hash();
		
		data = Node.parse(Node.fs.readFileSync('../site/resources/maps/' + id + '.json', 'utf8'));
		
		width = data.width;
		height = data.height;
		
		if (data.properties.players_per_instance == null) {
			playersPerInstance = 0;
		}else{
			playersPerInstance = Std.parseInt(data.properties.players_per_instance);
		}
		
		if (data.properties.grass_encounters != null) {
			grassEncounters = Node.parse('{"tmp":['+ data.properties.grass_encounters + ']}').tmp;
		}
		
		for (layer in data.layers) {
			if (layer.type == LAYER_TILELAYER) {
				if (layer.properties == null || layer.properties.data_layer != '1') continue;
				
				var j = 0;
				
				var twidth = data.width;
				var theight = data.height;
				
				solidData = untyped __js__("new Array(twidth)");
				for (x in 0...twidth) {
					solidData[x] = untyped __js__("new Array(theight)");
					for (y in 0...theight) {
						solidData[x][y] = SD_NONE;
					}
				}
				
				for (y in 0...theight) {
					for (x in 0...twidth) {
						var tileid = layer.data[j];
						if (tileid == null || tileid == 0) {
							++j;
							continue;
						}
						
						var tileset = getTilesetOfTile(tileid);
						if (tileset == null) "Tileset is null";
						
						var curTilesetTileid = tileid - tileset.firstgid;
					
						if(tileset.tileproperties[curTilesetTileid] != null){
							if(tileset.tileproperties[curTilesetTileid].solid == '1'){
								solidData[x][y] = SD_SOLID;
							}else if(tileset.tileproperties[curTilesetTileid].water == '1'){
								solidData[x][y] = SD_WATER;
							}else if(tileset.tileproperties[curTilesetTileid].grass == '1'){
								solidData[x][y] = SD_GRASS;
							}else if(tileset.tileproperties[curTilesetTileid].ledge == '1'){
								solidData[x][y] = SD_LEDGE_DOWN;
								if(tileset.tileproperties[curTilesetTileid].ledge_dir == '1'){
									solidData[x][y] = SD_LEDGE_LEFT;
								}else if(tileset.tileproperties[curTilesetTileid].ledge_dir == '2'){
									solidData[x][y] = SD_LEDGE_UP;
								}else if(tileset.tileproperties[curTilesetTileid].ledge_dir == '3'){
									solidData[x][y] = SD_LEDGE_RIGHT;
								}
							}
						}
						
						++j;
					}
				}
			}else if(layer.type == LAYER_OBJECTGROUP){
				for(obj in layer.objects){
					var x1 = Math.round(obj.x / data.tilewidth);
					var y1 = Math.round(obj.y / data.tileheight);
					var x2 = Math.round((obj.x + obj.width) / data.tilewidth);
					var y2 = Math.round((obj.y + obj.height) / data.tileheight);
					switch(obj.type){
					case 'tall_grass':
						var encounters = Node.parse('{"tmp":['+ obj.properties.encounters + ']}').tmp;
						encounterAreas.push( { x1:x1, y1:y1, x2:x2, y2:y2, encounters: encounters } );
					case 'warp':
						warps.set(obj.name, {x: x1, y:y1, type: obj.properties.type, destination: Node.parse(obj.properties.destination)});
					case 'point':
						points.set(obj.name, {mapName: id, x: x1, y: y1, direction: obj.properties.direction == null ? GameConst.DIR_DOWN : obj.properties.direction});
					}
				}
			}
		}
		
		if (solidData == null) {
			Main.warn("Couldn't find data layer!");
		}
		
		
		var sEnd:Float = Date.now().getTime();
		Node.process.stdout.write(' ('+(sEnd - sStart)+' ms)\n');
	}
	
	public function getEncounterAreasAt(x:Int, y:Int) {
		var arr = [];
		for (e in encounterAreas) {
			if (x >= e.x1 && y >= e.y1 && x < e.x2 && y < e.y2) {
				arr.push(e);
			}
		}
		
		return arr;
	}
	
	public function createInstance():MapInstance {
		var id:String;
		do {
			id = Utils.createRandomString(6);
		}while (instances.exists(id));
		
		var i = new MapInstance(this, id);
		instances.set(id, i);
		return i;
	}
	
	private function getTilesetOfTile(n:Int):MapTileset {
		var i = data.tilesets.length;
		while (i-- > 0) {
			if (n >= data.tilesets[i].firstgid) return data.tilesets[i];
		}
		return null;
	}
	
	public inline function getWarp(name:String) {
		return warps.get(name);
	}
}

typedef MapFileData = {
	var width:Int;
	var height:Int;
	var tilewidth:Int;
	var tileheight:Int;
	var version:Int;
	
	var layers:Array<{
		var x:Int;
		var y:Int;
		var width:Int;
		var height:Int;
		var visible:Bool;
		var opacity:Float;
		var name:String;
		var type:String;
		var properties:{
			var animated:String;
			var overchars:String;
			var data_layer:String;
		};
		
		// tilelayer
		var data:Array<Int>;
		
		
		// objectgroup
		var objects:Array<{
			var x:Int;
			var y:Int;
			var width:Int;
			var height:Int;
			var name:String;
			var type:String;
			var properties:Dynamic;
		}>;
	}>;
	
	var orientation:String;
	
	var properties:{
		var preload_pokemon:String;
		var players_per_instance:String;
		var grass_encounters:String;
	};
	
	var tilesets:Array<MapTileset>;
}

typedef MapTileset = {
	var firstgid:Int;
	var image:String;
	var imagewidth:Int;
	var imageheight:Int;
	var margin:Int;
	var name:String;
	var properties:Dynamic;
	var spacing:Int;
	var tilewidth:Int;
	var tileheight:Int;
	var tileproperties:Array<{
		var solid:String;
		var water:String;
		var ledge:String;
		var ledge_dir:String;
		var grass:String;
	}>;
};

typedef MapEncounterArea = {
	var x1:Int;
	var y1:Int;
	var x2:Int;
	var y2:Int;
	var encounters:Array<EncounterData>;
};

typedef EncounterData = {
	var id:String;
	var min_level:Int;
	var max_level:Int;
	var chance:Float;
}

typedef MapWarp = {
	var x:Int;
	var y:Int;
	var type:String;
	var destination:Location;
}