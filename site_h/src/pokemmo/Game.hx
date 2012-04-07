package pokemmo;

import pokemmo.entities.CDoor;
import pokemmo.entities.CFollower;
import pokemmo.entities.CGrassAnimation;
import pokemmo.entities.CStairs;
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
	static public var username:String;
	static public var accountLevel:Int;
	
	static public var curGame:Game;
	
	static public var pokemonParty:Array<PokemonOwned>;
	
	static public var pendingLoad:Int = 0;
	static public var loadError:Bool;
	
	static private var res:Dynamic;
	static private var pokemonData:Dynamic;
	static private var movesData:Dynamic;
	
	static public var playerBackspriteType:String;
	
	static private var loadedBasicUI:Bool;
	
	static public function setup():Void {
		loadError = false;
		loadedBasicUI = false;
		state = ST_UNKNOWN;
		res = untyped __js__("({})");
		
		accountLevel = 0;
	}
	
	static public function setPokemonParty(arr:Array<PokemonOwned>):Void {
		for (i in 0...arr.length) {
			arr[i].icon = curGame != null ? curGame.getImage('resources/picons/' + arr[i].id + '_1.png') : new ImageResource('resources/picons/' + arr[i].id + '_1.png');
			
			// Preload pokemon images
			if(curGame != null){
				curGame.getImage('resources/back/' + arr[i].id + '.png');
				curGame.getImage('resources/followers/' + arr[i].id + '.png');
			}else {
				(untyped __js__('new Image()')).src = 'resources/back/' + arr[i].id + '.png';
				(untyped __js__('new Image()')).src = 'resources/followers/' + arr[i].id + '.png';
			}
		}
		
		pokemonParty = arr;
	}
	
	static public function loadMap(id:String, chars:Array<CCharacterData>):Void {
		var g = curGame = new Game();
		Game.state = ST_LOADING;
		
		if (!loadedBasicUI) {
			loadedBasicUI = true;
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
			loadImageResource('animatedTileset', 'resources/tilesets/animated.png');
			loadImageResource('battleYesNo', 'resources/ui/battle_yesno.png');
			loadImageResource('battleLearnMove', 'resources/ui/battle_learnmove.png');
			loadImageResource('battleLearnMoveSelection', 'resources/ui/battle_learnmove_selection.png');
			
			loadJSON('data/pokemon.json', function(data:Dynamic):Void {
				pokemonData = data;
			});
			
			loadJSON('data/moves.json', function(data:Dynamic):Void {
				movesData = data;
			});
		}
		
		loadJSON('resources/maps/'+id+'.json', function(data:Dynamic){
			var map = new Map(id, data);
			for(tileset in map.tilesets){
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
				for(pk in arr){
					curGame.getImage('resources/followers/'+pk+'.png');
					curGame.getImage('resources/sprites/'+pk+'.png');
				}
			}
			
			
			curGame.loaded = true;
			curGame.map = map;
			curGame.parseMapObjects();
			
			var arr = chars;
			for(chrData in arr){
				var chr = new CCharacter(chrData);
				if (chr.username == username) chr.freezeTicks = 10;
			}
		});
	}
	
	static public function loadImageResource(id:String, src:String):ImageResource {
		++pendingLoad;
		return res[untyped id] = new ImageResource(src, function():Void {
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
	
	inline static public function getMoveData(id:String): {
		var type:String;
		var power:Int;
		var accuracy:Int;
		var maxPP:Int;
	}{
		return movesData[untyped id.toLowerCase()];
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
	
	public function initBattle(b:Battle):Battle {
		inBattle = true;
		battle = b;
		
		return battle;
	}
	
	public function tick():Void {
		if (state != ST_MAP) return;
		
		var arr = gameObjects.copy();
		for (i in 0...arr.length) {
			arr[i].tick();
		}
		
		if (Renderer.numRTicks % 30 * 60 * 10 == 0) {
			cachedImages = new Hash<ImageResource>();
		}
	}
	
	public function renderObjects(ctx:CanvasRenderingContext2D):Void {
		var arr = [];
		var icx = Math.floor(Renderer.cameraX);
		var icy = Math.floor(Renderer.cameraY);
		var fcx = icx + Main.screenWidth / map.tilewidth;
		var fcy = icy + Main.screenHeight / map.tileheight;
		for (i in 0...gameObjects.length) {
			if (gameObjects[i].x + 2 > icx && gameObjects[i].y + 2 > icy && gameObjects[i].x - 2 < fcx && gameObjects[i].y - 2 < fcy) {
				arr.push(gameObjects[i]);
			}
		}
		
		var A_FIRST = -1;
		var B_FIRST = 1;
		arr.sort(function(a:GameObject, b:GameObject):Int {
			if(a.y < b.y){
				return A_FIRST;
			}
			
			if(a.y > b.y){
				return B_FIRST;
			}
			
			if (a.y == b.y) {
				if (Std.is(a, CCharacter)) {
					if(untyped a.username == username && Std.is(b, CCharacter)){
						return B_FIRST;
					}
				}
				
				if (Std.is(b, CCharacter)) {
					if(untyped b.username == username && Std.is(a, CCharacter)){
						return A_FIRST;
					}
				}
				
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
		
		for (i in 0...arr.length) {
			arr[i].render(ctx);
		}
	}
	
	public function getPlayerChar():CCharacter {
		return getCharByUsername(username);
	}
	
	public function getCharByUsername(username:String):CCharacter {
		for (i in 0...characters.length) {
			if (characters[i].username == username) return characters[i];
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
		for(layer in map.layers){
			if(layer.type != 'objectgroup') continue;
			for(obj in layer.objects){
				switch(obj.type){
				case "warp":
					if(obj.properties.type == 'door'){
						new CDoor(obj.name, Math.floor(obj.x / map.tilewidth), Math.floor(obj.y / map.tileheight));
					}else if(obj.properties.type == 'arrow'){
						new CWarpArrow(obj.name, Math.floor(obj.x / map.tilewidth), Math.floor(obj.y / map.tileheight));
					}else if (obj.properties.type == 'stairs_up') {
						new CStairs(obj.name, Math.floor(obj.x / map.tilewidth), Math.floor(obj.y / map.tileheight), DIR_UP, Std.parseInt(obj.properties.from_dir));
					}else if(obj.properties.type == 'stairs_down'){
						new CStairs(obj.name, Math.floor(obj.x / map.tilewidth), Math.floor(obj.y / map.tileheight), DIR_DOWN, Std.parseInt(obj.properties.from_dir));
					}
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
	ST_TITLE;
	ST_NEWGAME;
	ST_REGISTER;
}