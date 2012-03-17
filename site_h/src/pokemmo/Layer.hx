package pokemmo;

import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class Layer {
	public var data:Dynamic;
	public var width:Int;
	public var height:Int;
	public var x:Int;
	public var y:Int;
	public var type:String;
	public var properties: {
		var solid:String;
		var overchars:String;
		var animated:String;
		var data_layer:String;
	};
	
	public var objects:Array<Dynamic>;
	
	public function new(data:Dynamic) {
		this.data = data.data;
		
		width = data.width;
		height = data.height;
		x = data.x;
		y = data.y;
		type = data.type;
		properties = data.properties;
		objects = data.objects;
		if (properties == null) properties = {solid: '1', overchars: '0', animated: '0', data_layer: '0'};
	}
	
	public function render(ctx:CanvasRenderingContext2D, map:Map):Void {
		if (type != 'tilelayer') return;
		var tilesets = map.tilesets;
		var j = 0;
		
		if(x != 0 || y != 0) throw "Assertion failed";
		
		var map = Game.curGame.map;
		
		var initialX:Int = Math.floor(Math.max(Math.floor(Renderer.cameraX), x));
		var initialY:Int = Math.floor(Math.max(Math.floor(Renderer.cameraY), y));
		var offsetX:Int = Renderer.getOffsetX();
		var offsetY:Int = Renderer.getOffsetY();
		var finalX:Int = Math.floor(Math.min(initialX + Math.ceil(Main.screenWidth / map.tilewidth) + 1, width));
		var finalY:Int = Math.floor(Math.min(initialY + Math.ceil(Main.screenHeight / map.tileheight) + 1, height));
		
		
		
		j += initialY * width;
		for(py in initialY...finalY){
			j += initialX;
			for(px in initialX...width){
				if(px >= finalX){
					j += width - finalX;
					break;
				}
				
				var tileid = data[j];
				if (tileid == 0 || tileid == null) {
					++j;
					continue;
				}
				
				var tileset = Tileset.getTilesetOfTile(map, tileid);
				
				if(tileset == null) throw "Tileset is null";
				
				var curTilesetTileid = tileid - tileset.firstgid;
				
				if (tileset.tileproperties[curTilesetTileid] != null && tileset.tileproperties[curTilesetTileid].animated != null) {
					var id = (untyped __js__("Number"))(tileset.tileproperties[curTilesetTileid].animated);
					var numFrames = (untyped __js__("Number"))(tileset.tileproperties[curTilesetTileid].numFrames);
					var animDelay = (untyped __js__("Number"))(tileset.tileproperties[curTilesetTileid].animDelay);
					if (Math.isNaN(animDelay)) animDelay = 0;
					ctx.drawImage(Game.getRes('animatedTileset').obj, tileset.tilewidth * Math.floor(((Renderer.numRTicks + animDelay) / 8) % numFrames), id * tileset.tileheight, tileset.tilewidth, tileset.tileheight, (px + x) * tileset.tilewidth + offsetX, (py + y) * tileset.tileheight + offsetY, tileset.tilewidth, tileset.tileheight);
				}else{
					var numTilesX = Math.floor(tileset.imagewidth / tileset.tilewidth);
					
					var srcx = (curTilesetTileid % numTilesX) * tileset.tilewidth;
					var srcy = Math.floor(curTilesetTileid / numTilesX) * tileset.tileheight;
					
					ctx.drawImage(tileset.image, srcx, srcy, tileset.tilewidth, tileset.tileheight, (px + x) * tileset.tilewidth + offsetX, (py + y) * tileset.tileheight + offsetY, tileset.tilewidth, tileset.tileheight);
				}
				++j;
			}
		}
	}
}