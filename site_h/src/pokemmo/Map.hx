package pokemmo;

import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class Map {
	static public var cur(getCurMap, null):Map;
	static private function getCurMap():Map { return Game.curGame.map; }
	
	public var id:String;
	public var game:Game;
	public var properties: {
		var preload_pokemon:String;
	};
	
	public var tilesets:Array<Tileset>;
	public var layers:Array<Layer>;
	
	public var dataLayer:Layer;
	
	public var width:Int;
	public var height:Int;
	public var tilewidth:Int;
	public var tileheight:Int;
	
	public var cacheMap:Map;
	private var cacheOffsetX:Int;
	private var cacheOffsetY:Int;
	
	public function new(id:String, data:Dynamic) {
		this.id = id;
		
		tilesets = [];
		layers = [];
		
		width = data.width;
		height = data.height;
		tilesets = [];
		layers = [];
		tilewidth = data.tilewidth;
		tileheight = data.tileheight;
		properties = data.properties;
		
		for (i in 0...data.tilesets.length) {
			tilesets.push(new Tileset(data.tilesets[i]));
		}
		
		for (i in 0...data.layers.length) {
			var layer = new Layer(data.layers[i]);
			if (layer.properties.data_layer == '1') {
				dataLayer = layer;
			}else{
				layers.push(layer);
			}
		}
	}
	
	public function render(ctx:CanvasRenderingContext2D):Void {
		if(cacheMap != this || cacheOffsetX != Renderer.getOffsetX() || cacheOffsetY != Renderer.getOffsetY()){
			Main.mapCacheCtx.fillStyle = '#000000';
			Main.mapCacheCtx.fillRect(0, 0, Main.mapCacheCanvas.width, Main.mapCacheCanvas.height);
			for(layer in layers){
				if (layer.properties.overchars == '1') continue;
				if(layer.properties.animated == '1') continue;
				layer.render(Main.mapCacheCtx, this);
			}
			
			ctx.drawImage(Main.mapCacheCanvas, 0, 0);
			
			cacheMap = this;
			cacheOffsetX = Renderer.getOffsetX();
			cacheOffsetY = Renderer.getOffsetY();
		}else {
			ctx.drawImage(Main.mapCacheCanvas, 0, 0);
		}
	}
	
	public function renderAnimated(ctx:CanvasRenderingContext2D):Void {
		for(layer in layers){
			if (layer.properties.animated != '1') continue;
			layer.render(ctx, this);
		}
	}
	
	public function renderOver(ctx:CanvasRenderingContext2D):Void {
		for(layer in layers){
			if(layer.properties.overchars != '1') continue;
			layer.render(ctx, this);
		}
	}
	
	public function isTileSolid(x:Int, y:Int):Bool {
		return hasTileProp(x, y, 'solid');
	}
	
	public function isTileWater(x:Int, y:Int):Bool {
		return hasTileProp(x, y, 'water');
	}
	
	public function isTileGrass(x:Int, y:Int):Bool {
		return hasTileProp(x, y, 'grass');
	}
	
	public function isTileLedge(x:Int, y:Int):Bool {
		return hasTileProp(x, y, 'ledge');
	}
	
	public function getLedgeDir(x:Int, y:Int):Int {
		var layer = dataLayer;
		
		var j = y * layer.width + x;
		
		var tileid = layer.data[j];
		if (tileid == null || tileid == 0) return -1;
		
		var tileset = Tileset.getTilesetOfTile(this, tileid);
		
		if (tileset == null) throw "Tileset is null";
		
		if (tileset.tileproperties[tileid - tileset.firstgid].ledge == '1') {
			return untyped Number(tileset.tileproperties[tileid - tileset.firstgid].ledge_dir) || Game.DIR_DOWN;
		}
		return -1;
	}
	
	public function hasTileProp(x:Int, y:Int, prop:String):Bool {
		var layer = dataLayer;
		
		var j = y * layer.width + x;
		
		var tileid = layer.data[j];
		if (tileid == null || tileid == 0) return false;
		
		var tileset = Tileset.getTilesetOfTile(this, tileid);
		
		if (tileset == null) throw "Tileset is null";
		
		if(tileset.tileproperties[tileid - tileset.firstgid][untyped prop] == '1') return true;
		
		return false;
	}
}