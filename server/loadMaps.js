console.log('Loading maps...');
start = +new Date();

(function(){

var tilesets;

function getTilesetOfTile(n){
	var i = tilesets.length;
	while(i--){
		if(n >= tilesets[i].firstgid) return tilesets[i];
	}
	return null;
}

for(var mi=0;mi<mapsNames.length;++mi){
	var sStart = +new Date();
	var mapName = mapsNames[mi];
	process.stdout.write('Loading: '+mapName+'...');
	
	var map = {};
	maps[mapName] = map;
	
	map.data = JSON.parse(fs.readFileSync('../site/resources/maps/'+mapName+'.json', 'utf8'));
	map.width = map.data.width;
	map.height = map.data.height;
	map.properties = map.data.properties;
	
	var solidData;
	tilesets = map.data.tilesets;
	
	map.encounterAreas = [];
	
	map.warps = {};
	map.points = {};
	
	
	
	for(var n=0;n<map.data.layers.length;++n){
		var layer = map.data.layers[n];
		if(layer.type == 'tilelayer'){
			if(!layer.properties || layer.properties.data_layer != '1') continue;
			var j = 0;
			
			var twidth = map.data.width;
			var theight = map.data.height;
			
			solidData = new Array(twidth);
			for(var x=0;x<twidth;++x){
				solidData[x] = new Array(theight);
				for(var y=0;y<theight;++y){
					solidData[x][y] = 0; // SD_NONE
				}
			}
			
			for(var y=0;y<theight;++y){
				for(var x=0;x<twidth;++x, ++j){
				
					var tileid = layer.data[j];
					if(!tileid) continue;
					
					var tileset = getTilesetOfTile(tileid);
					if(!tileset) throw new Error("Tileset is null");
					
					var curTilesetTileid = tileid - tileset.firstgid;
					
					if(tileset.tileproperties[curTilesetTileid]){
						if(tileset.tileproperties[curTilesetTileid].solid == '1'){
							solidData[x][y] = 1; // SD_SOLID
						}
						
						if(tileset.tileproperties[curTilesetTileid].water == '1'){
							solidData[x][y] = 2; // SD_WATER
						}
						
						if(tileset.tileproperties[curTilesetTileid].ledge == '1'){
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
					
					
				}
			}
		}else if(layer.type == 'objectgroup'){
			for(var i = 0; i < layer.objects.length; ++i){
				var obj = layer.objects[i];
				var x1 = Math.round(obj.x / map.data.tilewidth);
				var y1 = Math.round(obj.y / map.data.tileheight);
				var x2 = Math.round((obj.x + obj.width) / map.data.tilewidth);
				var y2 = Math.round((obj.y + obj.height) / map.data.tileheight);
				switch(obj.type){
				case 'tall_grass':
					var encounters = JSON.parse('{"tmp":['+ obj.properties.encounters + ']}').tmp;
					map.encounterAreas.push({x1:x1, y1:y1, x2:x2, y2:y2, encounters: encounters});
				break;
				case 'warp':
					map.warps[obj.name] = {type: obj.properties.type, destination: JSON.parse('{"tmp":'+obj.properties.destination+'}').tmp};
					break;
				case 'point':
					map.points[obj.name] = [mapName, x1, y1, obj.properties.direction || DIR_DOWN];
					break;
				}
			}
		}
	}
	
	if(solidData == null){
		console.warn('Couldn\'t find data layer!');
	}
	
	map.solidData = solidData;
	
	//recursiveFreeze(map);
	
	var sEnd = +new Date();
	process.stdout.write(' ('+(sEnd - sStart)+' ms)\n');
}

end = +new Date();
console.log('Maps loaded! ('+(end-start)+' ms)');

for(var i in maps){
	mapInstances[i] = [createInstance(i)];
}
})();