package pokemmo;

import pokemmo.entities.CDoor;
import pokemmo.entities.CStairs;
import pokemmo.entities.CWarp;
import pokemmo.entities.CWarpArrow;
import pokemmo.Main;
import pokemmo.Game;
import pokemmo.CCharacter;
import pokemmo.Pokemon;
import pokemmo.transitions.BattleTransition001;
import pokemmo.Chat;
import pokemmo.transitions.BlackScreen;
import pokemmo.transitions.FadeIn;
import pokemmo.transitions.FadeOut;
import pokemmo.Battle;

/**
 * ...
 * @author Matheus28
 */

class Connection {
	inline static public var SERVER_HOST:String = "http://localhost:2828";
	inline static public var REGSERVER_HOST:String = "http://localhost:2827";
	
	//inline static public var SERVER_HOST:String = "http://pokemmo.net:2828";
	//inline static public var REGSERVER_HOST:String = "http://pokemmo.net:2827";
	
	
	static public var socket:SocketIOConnection;
	static public var lastAckMove:Int = 0;
	
	
	static public function setup():Void {
		socket = (untyped io.connect)(SERVER_HOST);
		
		socket.on('connect', onConnect);
		socket.on('disconnect', onDisconnect);
		socket.on('setInfo', onSetInfo);
		socket.on('loadMap', onLoadMap);
		socket.on('invalidMove', onInvalidMove);
		socket.on('update', onUpdate);
		socket.on('battleInit', onBattleInit);
		socket.on('battleWild', onBattleWild);
		socket.on('battleTurn', onBattleTurn);
		socket.on('loginFail', onLoginFail);
		socket.on('newGame', onNewGame);
		socket.on('startGame', onStartGame);
	}
	
	static private function onConnect(data:Dynamic) {
		Main.log('Connected');
	}
	
	static private function onDisconnect(data:Dynamic) {
		Game.state = ST_DISCONNECTED;
		Game.curGame = null;
		UI.removeAllInputs();
		socket.disconnect();
	}
	
	static private function onSetInfo(data: {
		var pokemon:Array<PokemonOwned>;
		var accountLevel:Int;
	}) {
		Game.setPokemonParty(data.pokemon);
		Game.accountLevel = data.accountLevel;
	}
	
	static private function onLoadMap(data: {
		var mapid:String;
		var chars:Array<CCharacterData>;
	}) {
		if(Game.curGame != null && Game.curGame.queueLoadMap){
			Game.curGame.queuedMap = data.mapid;
			Game.curGame.queuedChars = data.chars;
			return;
		}
		Game.loadMap(data.mapid, data.chars);
	}
	
	static private function onInvalidMove(data: {
		var ack:Int;
		var x:Int;
		var y:Int;
	}) {
		lastAckMove = data.ack;
		var chr = Game.curGame.getPlayerChar();
		
		chr.x = data.x;
		chr.y = data.y;
		chr.walking = false;
		chr.walkingPerc = 0.0;
		chr.tick();
		
		Main.log('Invalid move!');
		
		if(chr.freezeTicks < 5) chr.freezeTicks = 5;
	}
	
	static private function onUpdate(data: {
			var map:String;
			var chars:Array<CCharacterData>;
			var messages:Array<ChatLogEntry>;
			var cremoved:Array<String>;
			var warpsUsed:Array<{
				var username:String;
				var warpName:String;
				var x:Int;
				var y:Int;
				var direction:Int;
			}>;
		}){
		//
		
		if (Std.is(data, String)) data = JSON.parse(untyped data);
		if (Game.curGame == null) return;
		if (!Game.curGame.loaded) return;
		if (data.map != Game.curGame.map.id) return;
		
		// The server doesn't trasmit some messages if there's nothing in them,
		// create the arrays so the script below doesn't fail
		if (data.chars == null) data.chars = [];
		if (data.messages == null) data.messages = [];
		if (data.cremoved == null) data.cremoved = [];
		if (data.warpsUsed == null) data.warpsUsed = [];
		
		var cremoved = data.cremoved;
		
		for(warp in data.warpsUsed){
			cremoved.remove(warp.username);
			if(warp.username == Game.username) continue;
			
			(function(warp){
				var chr = Game.curGame.getCharByUsername(warp.username);
				
				
				var tmpWarp = CWarp.getWarpByName(warp.warpName);
				chr.canUpdate = false;
				
				var animation = function(){
					chr.direction = warp.direction;
					if(Std.is(tmpWarp, CDoor)){
						chr.enterDoor(cast tmpWarp);
					}else if(Std.is(tmpWarp, CWarpArrow)){
						chr.enterWarpArrow(cast tmpWarp);
					}else if (Std.is(tmpWarp, CStairs)) {
						chr.enterStairs(cast tmpWarp);
					}
				};
				
				if(chr.x != warp.x || chr.y != warp.y || chr.walking){
					chr.targetX = warp.x;
					chr.targetY = warp.y;
					chr.onTarget = animation;
				}else{
					animation();
				}
			})(warp);
		}
		
		var chars = data.chars;
		
		for (i in 0...chars.length) {
			var charData = chars[i];
			
			var chr = Game.curGame.getCharByUsername(charData.username);
			
			if(chr != null){
				chr.update(charData);
			}else{
				chr = new CCharacter(charData);
			}
		}
		
		for (i in 0...cremoved.length) {
			var chr = Game.curGame.getCharByUsername(cremoved[i]);
			if (chr != null) chr.destroy();
		}
		
		for(m in data.messages){
			m.timestamp = Date.now().getTime();
			Chat.pushMessage(m);
		}
		
	}
	
	static private function onBattleInit(data:BattleInitData) {
		var battle = Game.curGame.initBattle(new Battle(data));
		
		var chr = Game.curGame.getPlayerChar();
		if(chr != null){
			chr.inBattle = true;
			chr.battleEnemy = battle.enemyPokemon.id;
			chr.battleEnemyShiny = battle.enemyPokemon.shiny;
		}
		
		Renderer.startTransition(new BattleTransition001()).step = -1;
	}
	
	static private function onBattleWild(data: {
			var x:Int;
			var y:Int;
			var battle:{
				var curPokemon:PokemonOwned;
				var enemy:Pokemon;
			};
		}){
		/*
		var battle = Game.curGame.initBattle(Battle.BATTLE_WILD);
		battle.x = data.x;
		battle.y = data.y;
		battle.background = Game.curGame.getImage('resources/ui/battle_background1.png');
		
		var enemy = data.battle.enemy;
		
		
		battle.enemyPokemon = enemy;
		battle.enemyPokemon.sprite = Game.curGame.getImage('resources/sprites' + (battle.enemyPokemon.shiny ? '_shiny' : '') + '/'+battle.enemyPokemon.id+'.png');
		
		battle.setCurPokemon(data.battle.curPokemon);
		
		var chr = Game.curGame.getPlayerChar();
		if(chr != null){
			chr.inBattle = true;
			chr.battleEnemy = battle.enemyPokemon.id;
			chr.battleEnemyShiny = battle.enemyPokemon.shiny;
		}
		
		Renderer.startTransition(new BattleTransition001()).step = -1;*/
	}
	
	static private function onBattleTurn(data: {
		var results:Array<BattleTurnResult>;
	}):Void {
		Game.curGame.battle.resultQueue = Game.curGame.battle.resultQueue.concat(data.results);
		Game.curGame.battle.runQueue();
	}
	
	static private function onLoginFail(data:Dynamic) {
		TitleScreen.loginFailed();
	}
	
	static private function onNewGame(data: {
		var username:String;
		var starters:Array<String>;
		var characters:Array<String>;
	}) {
		Game.username = data.username;
		Renderer.startTransition(new FadeOut(10)).onComplete = function():Void {
			TitleScreen.destroy();
			Game.state = ST_NEWGAME;
			NewGameScreen.init(data.starters, data.characters);
		};
	}
	
	static private function onStartGame(data: {
		var username:String;
		var pokemon:Array<PokemonOwned>;
	}) {
		Game.username = data.username;
		Renderer.startTransition(new FadeOut(10)).onComplete = function():Void {
			TitleScreen.destroy();
			Game.state = ST_UNKNOWN;
			socket.emit('startGame', {});
		};
	}
}

typedef BattleInitData = {
	var type:Int;
	var x:Int;
	var y:Int;
	var id:Int;
	var team:Int;
	var info:{
		var players:Array<BattlePlayer>;
	};
}

typedef BattlePlayer = {
	var pokemon:Pokemon;
}