function Map(data){
	this.width = data.width;
	this.height = data.height;
	this.tilesets = [];
	this.layers = [];
	this.tilewidth = data.tilewidth;
	this.tileheight = data.tileheight;
	
	for(var i = 0; i< data.tilesets.length; ++i){
		this.tilesets.push(new Tileset(data.tilesets[i]));
	}
	
	for(var i = 0; i< data.layers.length; ++i){
		this.layers.push(new Layer(data.layers[i]));
	}
}

function loadMap(id){
	state = ST_LOADING;
	curMap = null;
	
	characters = [];
	loadedChars = false;
	
	var pending = 0;
	var completed = 0;
	var error = false;
	
	++pending;
	miscSprites = new Image();
	miscSprites.onload = function(){--pending;++completed;};
	miscSprites.onerror = function(){--pending;error = true;refresh();};
	miscSprites.src = 'resources/tilesets/misc.png';
	
	++pending;
	uiPokemon = new Image();
	uiPokemon.onload = function(){--pending;++completed;};
	uiPokemon.onerror = function(){--pending;error = true;refresh();};
	uiPokemon.src = 'resources/ui/pokemon.png';
	
	++pending;
	uiChat = new Image();
	uiChat.onload = function(){--pending;++completed;};
	uiChat.onerror = function(){--pending;error = true;refresh();};
	uiChat.src = 'resources/ui/chat.png';
	
	++pending;
	$q.ajax('resources/data/pokemon.json', {
		'cache': true,
		'dataType': 'json',
		'success': function(data, textStatus, jqXHR){
			--pending;
			++completed;
			pokemonData = data;
		},
		'error': function(jqXHR, textStatus, errorThrown){
			--pending;
			error = true;
			refresh();
		}
	});
	
	++pending;
	$q.ajax('resources/maps/'+id+'.json', {
		'dataType': 'json',
		'success': function(data, textStatus, jqXHR){
			--pending;
			++completed;
			var map = parseMap(data);
			
			
			for(var i=0;i<map.tilesets.length;++i){
				var tileset = map.tilesets[i];
				if(tileset.loaded){
					++completed;
				}else if(tileset.error){
					error = true;
					break;
				}else{
					++pending;
					tileset.onload = function(tileset){
						--pending;
						refresh();
					}
					
					tileset.onerror = function(tileset){
						error = true;
						refresh();
					}
				}
			}
			
			curMap = map;
			
			refresh();
		},
		'error': function(jqXHR, textStatus, errorThrown){
			--pending;
			error = true;
			refresh();
		}
	});
	
	function refresh(){
		if(state != ST_LOADING) return;
		
		ctx.fillStyle = 'rgb(0,0,0)';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		if(error){
			console.log('Error loading map');
		}else{
			if(pending == 0){
				console.log('Map loaded');
				state = ST_MAP;
				render();
			}else{
				console.log('Pending: '+pending);
			}
		}
		
	}
	
	loadingMapRender = refresh;
	render();
}