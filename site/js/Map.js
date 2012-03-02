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
	curMapId = id;
	
	characters = [];
	loadedChars = false;
	
	var pending = 0;
	var completed = 0;
	var error = false;
	
	loadImage('miscSprites', 'resources/tilesets/misc.png');
	loadImage('uiPokemon', 'resources/ui/pokemon.png');
	loadImage('uiChat', 'resources/ui/chat.png');
	loadImage('uiCharInBattle', 'resources/ui/char_in_battle.png');
	loadImage('battleTextBackground', 'resources/ui/battle_text.png');
	loadImage('battleMoveMenu', 'resources/ui/battle_move_menu.png');
	loadImage('battleTrainerStatus', 'resources/ui/battle_trainer_status.png');
	loadImage('battleMisc', 'resources/ui/battle_misc.png');
	loadImage('battlePokeballs', 'resources/ui/battle_pokeballs.png');
	loadImage('battleActionMenu', 'resources/ui/battle_action_menu.png');
	loadImage('types', 'resources/ui/types.png');
	loadImage('battlePokemonBar', 'resources/ui/battle_pokemon_bar.png');
	loadImage('battleHealthBar', 'resources/ui/battle_healthbar.png');
	loadImage('battleEnemyBar', 'resources/ui/battle_enemy_bar.png');
	
	loadJSON('data/pokemon.json', function(data){pokemonData = data});
	loadJSON('resources/maps/'+id+'.json', function(data){
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
					--pending;
					error = true;
					refresh();
				}
			}
		}
		
		curMap = map;
		
		refresh();
	});
	
	function loadImage(name, src){
		++pending;
		res[name] = new Image();
		res[name].onload = function(){--pending;++completed;};
		res[name].onerror = function(){--pending;error = true;refresh();};
		res[name].src = src;
	}
	
	function loadJSON(src, onload){
		++pending;
		$q.ajax(src, {
			'cache': true,
			'dataType': 'json',
			'success': function(data, textStatus, jqXHR){
				--pending;
				++completed;
				onload(data);
			},
			'error': function(jqXHR, textStatus, errorThrown){
				--pending;
				error = true;
				refresh();
			}
		});
	}
	
	function refresh(){
		if(state != ST_LOADING) return;
		
		ctx.fillStyle = 'rgb(0,0,0)';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		ctx.fillStyle = 'rgb(255,255,255)';
		ctx.font = '12pt Courier New';
		
		if(error){
			console.log('Error loading map');
			ctx.fillText('Failed loading files', 10, 30);
		}else{
			if(pending == 0){
				console.log('Map loaded');
				state = ST_MAP;
				
				var step = 0;
				var func = function(){
					ctx.fillStyle = '#000000';
					ctx.globalAlpha = 1 - (step / 8);
					ctx.fillRect(0, 0, canvas.width, canvas.height);
					ctx.globalAlpha = 1;
					++step;
					if(step >= 8){
						unHookRender(func);
					}
				}
				
				hookRender(func);
				
				render();
			}else{
				console.log('Pending: '+pending);
				ctx.fillText('Loading... ' + pending, 10, 30);
			}
		}
		
	}
	
	loadingMapRender = refresh;
	render();
}