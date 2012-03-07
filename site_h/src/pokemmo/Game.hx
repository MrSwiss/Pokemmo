package pokemmo;

import pokemmo.entities.CDoor;
import pokemmo.entities.CFollower;
import pokemmo.entities.CGrassAnimation;
import pokemmo.entities.CWarpArrow;
import pokemmo.Pokemon;
import pokemmo.CCharacter;
import UserAgentContext;


/**
 * ...
 * @author Matheus28
 */

class Game {
	inline static public var DIR_DOWN:Int = 0;
	inline static public var DIR_LEFT:Int = 1;
	inline static public var DIR_UP:Int = 2;
	inline static public var DIR_RIGHT:Int = 3;
	
	static public var state:GameState;
	static public var myId:String;
	
	static public var curGame:Game;
	
	static public var pokemonParty:Array<PokemonOwned>;
	
	static public var pendingLoad:Int = 0;
	static public var loadError:Bool;
	
	static private var res:Dynamic;
	static private var pokemonData:Dynamic;
	
	static public function setup():Void {
		loadError = false;
		state = ST_UNKNOWN;
		
	}
	
	static public function setPokemonParty(arr:Array<PokemonOwned>):Void {
		for (i in 0...arr.length) {
			arr[i].icon = curGame.getImage('resources/picons/' + arr[i].id + '_1.png');
			
			// Preload pokemon images
			curGame.getImage('resources/back/' + arr[i].id + '.png');
			curGame.getImage('resources/followers/' + arr[i].id + '.png');
		}
		
		pokemonParty = arr;
	}
	
	static public function loadMap(id:String, chars:Array<CCharacterData>):Void {
		var g = curGame = new Game();
		Game.state = ST_LOADING;
		
		if (res == null) {
			res = untyped __js__("({})");
			loadImageResource('miscSprites', 'resources/tilesets/misc.png');
			loadImageResource('uiPokemon', 'resources/ui/pokemon.png');
			loadImageResource('uiChat', 'resources/ui/chat.png');
			loadImageResource('uiCharInBattle', 'resources/ui/char_in_battle.png');
			loadImageResource('battleTextBackground', 'resources/ui/battle_text.png');
			loadImageResource('battleMoveMenu', 'resources/ui/battle_move_menu.png');
			loadImageResource('battleTrainerStatus', 'resources/ui/battle_trainer_status.png');
			loadImageResource('battleMisc', 'resources/ui/battle_misc.png');
			loadImageResource('battlePokeballs', 'resources/ui/battle_pokeballs.png');
			loadImageResource('battleActionMenu', 'resources/ui/battle_action_menu.png');
			loadImageResource('types', 'resources/ui/types.png');
			loadImageResource('battlePokemonBar', 'resources/ui/battle_pokemon_bar.png');
			loadImageResource('battleHealthBar', 'resources/ui/battle_healthbar.png');
			loadImageResource('battleEnemyBar', 'resources/ui/battle_enemy_bar.png');
			loadImageResource('battleIntroPokeball', 'resources/ui/battle_intro_pokeball.png');
			
			loadJSON('data/pokemon.json', function(data:Dynamic):Void {
				pokemonData = data;
			});
		}
		
		loadJSON('resources/maps/'+id+'.json', function(data:Dynamic){
			var map = new Map(id, data);
			for(i in 0...map.tilesets.length){
				var tileset = map.tilesets[i];
				if(!tileset.loaded){
					if(tileset.error){
						loadError = true;
						throw "loadError";
						return;
					}else{
						++pendingLoad;
						tileset.onload = function(){
							--pendingLoad;
						}
						
						tileset.onerror = function(){
							--pendingLoad;
							loadError = true;
							throw "loadError";
						}
					}
				}
			}
			
			if(map.properties.preload_pokemon != null){
				var arr = map.properties.preload_pokemon.split(',');
				for(i in 0...arr.length){
					curGame.getImage('resources/followers/'+arr[i]+'.png');
					curGame.getImage('resources/sprites/'+arr[i]+'.png');
				}
			}
			
			
			curGame.loaded = true;
			curGame.map = map;
			curGame.parseMapObjects();
			
			var arr = chars;
			for(i in 0...arr.length){
				var chr = new CCharacter(arr[i]);
			}
		});
	}
	
	static private function loadImageResource(id:String, src:String):Void {
		++pendingLoad;
		res[untyped id] = new ImageResource(src, function():Void {
			--pendingLoad;
		},function():Void {
			--pendingLoad;
			loadError = true;
			throw "loadError";
		});
	}
	
	static private function loadJSON(src:String, onload:Dynamic->Void):Void {
		++pendingLoad;
		var obj:Dynamic = untyped __js__("({})");
		obj.cache = true;
		obj.dataType = 'text';
		obj.success = function(data:Dynamic, textStatus, jqXHR):Void {
			--pendingLoad;
			onload(JSON.parse(data));
		};
		obj.error = function(jqXHR, textStatus, errorThrown):Void {
			--pendingLoad;
			loadError = true;
			throw "loadError";
		};
		Main.jq.ajax(src, obj);
	}
	
	inline static public function getRes(id:String):ImageResource {
		return res[untyped id];
	}
	
	inline static public function setRes(id:String, v:ImageResource):Void {
		res[untyped id] = v;
	}
	
	inline static public function getPokemonData(id:String):PokemonData {
		return pokemonData[untyped id];
	}
	
	///////////////////////////////////////////////////
	
	public var gameObjects:Array<GameObject>;
	public var characters:Array<CCharacter>;
	public var cachedImages:Hash<ImageResource>;
	
	public var queueLoadMap:Bool;
	public var queuedMap:String;
	public var queuedChars:Array<CCharacterData>;
	
	public var loaded:Bool;
	public var inBattle:Bool;
	public var battle:Battle;
	public var map:Map;
	
	public var playerCanMove:Bool;
	public var drawPlayerChar:Bool;
	public var drawPlayerFollower:Bool;
	
	public function new() {
		loaded = false;
		loadError = false;
		inBattle = false;
		queueLoadMap = false;
		gameObjects = [];
		characters = [];
		cachedImages = new Hash<ImageResource>();
		playerCanMove = true;
		
		drawPlayerChar = true;
		drawPlayerFollower = true;
		
		Renderer.resetHooks();
	}
	
	public function initBattle(type:Int):Battle {
		inBattle = true;
		battle = new Battle(type);
		
		return battle;
	}
	
	public function tick():Void {
		var arr = gameObjects.copy();
		for (i in 0...arr.length) {
			arr[i].tick();
		}
	}
	
	public function renderObjects(ctx:CanvasRenderingContext2D):Void {
		
		var A_FIRST = -1;
		var B_FIRST = 1;
		gameObjects.sort(function(a:GameObject, b:GameObject):Int {
			if(Std.is(a, CCharacter) && untyped a.id == myId){
				if(Std.is(b, CGrassAnimation)) return A_FIRST;
				return B_FIRST;
			}
			if(Std.is(b, CCharacter) && untyped b.id == myId){
				if(Std.is(a, CGrassAnimation)) return B_FIRST;
				return A_FIRST;
			}
			
			if(Std.is(a, CCharacter) && Std.is(b, CFollower)){
				return B_FIRST;
			}
			
			if(Std.is(b, CCharacter) && Std.is(a, CFollower)){
				return A_FIRST;
			}
			
			if(a.y < b.y){
				return A_FIRST;
			}
			
			if(a.y > b.y){
				return B_FIRST;
			}
			
			if(a.y == b.y){
				if(a.renderPriority > b.renderPriority) return A_FIRST;
				if(b.renderPriority > a.renderPriority) return B_FIRST;
				
				
				if(Std.is(a, CGrassAnimation)) return B_FIRST;
				if(Std.is(b, CGrassAnimation)) return A_FIRST;
				
				if(Std.is(a, CCharacter) && Std.is(b, CFollower)){
					return B_FIRST;
				}else if(Std.is(b, CCharacter) && Std.is(a, CFollower)){
					return A_FIRST;
				}
				
				if(a.randInt > b.randInt) return B_FIRST;
				if(a.randInt < b.randInt) return A_FIRST;
				return 0;
			}
			return 0;
		});
		
		var arr = gameObjects.copy();
		for (i in 0...arr.length) {
			arr[i].render(ctx);
		}
	}
	
	public function getPlayerChar():CCharacter {
		return getCharById(myId);
	}
	
	public function getCharById(id:String):CCharacter {
		for (i in 0...characters.length) {
			if (characters[i].id == id) return characters[i];
		}
		return null;
	}
	
	public function getImage(src:String, onload:Void->Void = null, onerror:Void->Void = null):ImageResource {
		var res;
		if (cachedImages.exists(src)) {
			res = cachedImages.get(src);
			res.addLoadHook(onload);
			res.addErrorHook(onerror);
			return res;
		}
		res = new ImageResource(src, onload, onerror);
		cachedImages.set(src, res);
		return res;
	}
	
	private function parseMapObjects():Void {
		for(i in 0...map.layers.length){
			if(map.layers[i].type != 'objectgroup') continue;
			var objects = map.layers[i].objects;
			for(k in 0...objects.length){
				var obj = objects[k];
				switch(obj.type){
				case "warp":
					if(obj.properties.type == 'door'){
						new CDoor(obj.name, Math.floor(obj.x / map.tilewidth), Math.floor(obj.y / map.tileheight));
					}else if(obj.properties.type == 'arrow'){
						new CWarpArrow(obj.name, Math.floor(obj.x / map.tilewidth), Math.floor(obj.y / map.tileheight));
					}
					break;
				}
			}
		}
	}
}

enum GameState {
	ST_UNKNOWN;
	ST_LOADING;
	ST_MAP;
	ST_DISCONNECTED;
}