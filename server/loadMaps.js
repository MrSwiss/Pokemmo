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

for(var i=0;i<mapsNames.length;++i){
	var mapName = mapsNames[i];
	console.log('Loading: '+mapName+'...');
	
	var map = {};
	maps[mapName] = map;
	
	map.data = JSON.parse(fs.readFileSync('../site/resources/maps/'+mapName+'.json', 'utf8'));
	
	var solidData = new Array(map.data.width);
	tilesets = map.data.tilesets;
	
	map.encounterAreas = [];
	
	
	for(var x=0;x<solidData.length;++x){
		solidData[x] = new Array(map.data.height);
		for(var y=0;y<solidData[0].length;++y){
			solidData[x][y] = SD_NONE;
		}
	}
	
	for(var n=0;n<map.data.layers.length;++n){
		var layer = map.data.layers[n];
		if(layer.type == 'tilelayer'){
			if(layer.properties && layer.properties.solid == '0') continue;
			
			var j = 0;
			
			for(var y=0;y<solidData[0].length;++y){
				for(var x=0;x<solidData.length;++x, ++j){
					
					var tileid = layer.data[j];
					if(!tileid) continue;
					
					var tileset = getTilesetOfTile(tileid);
					if(!tileset) throw new Error("Tileset is null");
					
					var curTilesetTileid = tileid - tileset.firstgid;
					
					if(tileset.tileproperties[curTilesetTileid] && tileset.tileproperties[curTilesetTileid].solid == '1'){
						solidData[x][y] = SD_SOLID;
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
				}
			}
		}
	}
	
	
	
	map.solidData = solidData;
	
	recursiveFreeze(map);
	
}

end = +new Date();
console.log('Maps loaded! ('+(end-start)+' ms)');

for(var i in maps){
	mapInstances[i] = [createInstance(i)];
}
})();