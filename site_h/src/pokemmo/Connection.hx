package pokemmo;

import pokemmo.entities.CDoor;
import pokemmo.entities.CWarp;
import pokemmo.entities.CWarpArrow;
import pokemmo.Main;
import pokemmo.Game;
import pokemmo.CCharacter;
import pokemmo.Pokemon;
import pokemmo.transitions.BattleTransition001;
import pokemmo.Chat;

/**
 * ...
 * @author Matheus28
 */

class Connection {
	static public var SERVER_HOST:String = "http://localhost:2828";
	
	static public var socket:SocketIOConnection;
	static public var lastAckMove:Int = 0;
	
	
	static public function setup():Void {
		socket = (untyped io.connect)(SERVER_HOST);
		
		socket.on('connect', function(data:Dynamic):Void {
			Main.log('Connected');
		});
		
		socket.on('disconnect', function(data:Dynamic){
			Game.state = ST_DISCONNECTED;
			Game.curGame = null;
		});
		
		socket.on('setInfo', function(data:Dynamic){
			Main.log('setInfo: '+data.id);
			Game.myId = data.id;
			Game.setPokemonParty(data.pokemon);
		});
		
		socket.on('loadMap', function(data:Dynamic){
			if(Game.curGame != null && Game.curGame.queueLoadMap){
				Game.curGame.queuedMap = data.mapid;
				Game.curGame.queuedChars = data.chars;
				return;
			}
			Game.loadMap(data.mapid, data.chars);
		});
		
		socket.on('invalidMove', function(data){
			lastAckMove = data.ack;
			var chr = Game.curGame.getPlayerChar();
			
			chr.x = data.x;
			chr.y = data.y;
			chr.walking = false;
			chr.tick();
			
			Main.log('Invalid move!');
		});
		
		socket.on('update', function(data: {
				var map:String;
				var chars:Array<CCharacterData>;
				var messages:Array<ChatLogEntry>;
				var cremoved:Array<String>;
				var warpsUsed:Array<{
					var id:String;
					var warpName:String;
					var x:Int;
					var y:Int;
					var direction:Int;
				}>;
			}){
			//
			
			if (Std.is(data, String)) data = JSON.parse(untyped data);
			if (Game == null) return;
			if (!Game.curGame.loaded) return;
			if (data.map != Game.curGame.map.id) return;
			
			// The server doesn't trasmit some messages if there's nothing in them,
			// create the arrays so the script below doesn't fail
			if (data.chars == null) data.chars = [];
			if (data.messages == null) data.messages = [];
			if (data.cremoved == null) data.cremoved = [];
			if (data.warpsUsed == null) data.warpsUsed = [];
			
			var cremoved = data.cremoved;
			
			for(i in 0...data.warpsUsed.length){
				var warp = data.warpsUsed[i];
				cremoved.remove(warp.id);
				if(warp.id == Game.myId) continue;
				
				(function(warp){
					var chr = Game.curGame.getCharById(warp.id);
					
					
					var tmpWarp = CWarp.getWarpByName(data.warpsUsed[i].warpName);
					chr.canUpdate = false;
					
					var animation = function(){
						chr.direction = warp.direction;
						if(Std.is(tmpWarp, CDoor)){
							chr.enterDoor(cast tmpWarp);
							
						}else if(Std.is(tmpWarp, CWarpArrow)){
							chr.enterWarpArrow(cast tmpWarp);
						}
					};
					
					if(chr.x != data.warpsUsed[i].x || chr.y != data.warpsUsed[i].y || chr.walking){
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
				
				var chr = Game.curGame.getCharById(charData.id);
				
				if(chr != null){
					chr.follower = charData.follower;
				}
				
				if(charData.id == Game.myId){
					var src = 'resources/chars_sprites/'+charData.type+'.png';
					if (Game.getRes('playerBacksprite') == null || Game.getRes('playerBacksprite').obj.src != src) {
						Game.setRes('playerBacksprite', new ImageResource('resources/chars_sprites/'+charData.type+'.png'));
					}
					continue;
				}
				
				
				if(chr != null){
					if (!chr.canUpdate) continue;
						
					chr.inBattle = charData.inBattle;
					chr.battleEnemy = charData.battleEnemy;
					chr.targetX = charData.x;
					chr.targetY = charData.y;
					chr.targetDirection = charData.direction;
					
					//if(!chr.walking){
						chr.lastX = charData.lastX;
						chr.lastY = charData.lastY;
					//}
					
					if(chr.x == charData.x && chr.y == charData.y){
						chr.direction = charData.direction;
					}else if((Math.abs(chr.x - charData.x) <= 1 && Math.abs(chr.y - charData.y) <= 1)
					|| chr.x - 2 == charData.x && chr.y == charData.y
					|| chr.x + 2 == charData.x && chr.y == charData.y
					|| chr.x == charData.x && chr.y - 2 == charData.y
					|| chr.x == charData.x && chr.y + 2 == charData.y){
						// Let the bot move the character
					}else{
						// Character too far to be moved by the bot, move him manually
						chr.direction = charData.direction;
						chr.x = charData.x;
						chr.y = charData.y;
					}
				}else{
					chr = new CCharacter(charData);
				}
			}
			
			for (i in 0...cremoved.length) {
				var chr = Game.curGame.getCharById(cremoved[i]);
				if (chr != null) chr.destroy();
			}
			
			for(i in 0...data.messages.length){
				var m = data.messages[i];
				m.timestamp = Date.now().getTime();
				Chat.pushMessage(m);
			}
			
		});
		
		socket.on('battleWild', function(data: {
				var x:Int;
				var y:Int;
				var battle:{
					var curPokemon:PokemonOwned;
					var enemy:Pokemon;
				};
			}) {
			
			var battle = Game.curGame.initBattle(Battle.BATTLE_WILD);
			battle.x = data.x;
			battle.y = data.y;
			battle.background = Game.curGame.getImage('resources/ui/battle_background1.png');
			
			var enemy = data.battle.enemy;
			
			
			battle.enemyPokemon = enemy;
			battle.enemyPokemon.sprite = Game.curGame.getImage('resources/sprites' + (battle.enemyPokemon.shiny ? '_shiny' : '') + '/'+battle.enemyPokemon.id+'.png');
			
			battle.curPokemon = data.battle.curPokemon;
			battle.curPokemon.backsprite = Game.curGame.getImage('resources/back' + (battle.curPokemon.shiny ? '_shiny' : '') + '/'+battle.curPokemon.id+'.png');
			
			var chr = Game.curGame.getPlayerChar();
			if(chr != null){
				chr.inBattle = true;
				chr.battleEnemy = battle.enemyPokemon.id;
			}
			
			Renderer.startTransition(new BattleTransition001()).step = -1;
		});
		
		socket.on('battleTurn', function(data){
			Game.curGame.battle.resultQueue = Game.curGame.battle.resultQueue.concat(data.results);
			Game.curGame.battle.runQueue();
		});
	}
}