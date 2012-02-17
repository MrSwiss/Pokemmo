function Tileset(data){
	var self = this;
	
	self.firstgid = data.firstgid;
	self.image = new Image();
	self.loaded = false;
	self.error = false;
	
	this.image.onload = function(){
		self.loaded = true;
		if(self.onload) self.onload(self);
	}
	
	this.image.onerror = function(){
		self.error = true;
		if(self.onerror) self.onerror(self);
	}
	
	self.onload = null;
	self.onerror = null;
	
	self.image.src = 'resources/'+data.image.slice(3);
	
	self.imagewidth = data.imagewidth;
	self.imageheight = data.imageheight;
	self.tilewidth = data.tilewidth;
	self.tileheight = data.tileheight;
	self.tileproperties = [];
	for(var i in data.tileproperties){
		if(!data.tileproperties.hasOwnProperty(i)) continue;
		self.tileproperties[i] = data.tileproperties[i];
	}
	
	for(var i = 0, len = (self.imagewidth / self.tilewidth) * (self.imageheight / self.tileheight); i < len; ++i){
		if(!self.tileproperties[i]){
			self.tileproperties[i] = {};
		}
	}
}

function getTilesetOfTile(map, n){
	var tilesets = map.tilesets;
	var i = tilesets.length;
	while(i--){
		if(n >= tilesets[i].firstgid) return tilesets[i];
	}
	return null;
}

function isTileSolid(map, x, y){
	return hasTileProp(map, x, y, 'solid');
}

function isTileWater(map, x, y){
	return hasTileProp(map, x, y, 'water');
}

function isTileGrass(map, x, y){
	return hasTileProp(map, x, y, 'grass');
}

function isTileLedge(map, x, y){
	return hasTileProp(map, x, y, 'ledge');
}

function hasTileProp(map, x, y, prop){
	for(var i=0;i<map.layers.length;++i){
		var layer = map.layers[i];
		
		if(layer.type != 'tilelayer') continue;
		
		if(layer.properties.solid == '0') continue;
		
		var j = y * layer.width + x;
		
		var tileid = layer.data[j];
		if(!tileid) continue;
		
		var tileset = getTilesetOfTile(map, tileid);
		
		if(!tileset) throw new Error("Tileset is null");
		
		var curTilesetTileid = tileid - tileset.firstgid;
		
		if(tileset.tileproperties[curTilesetTileid][prop] == '1') return true;
	}
	
	return false;
}