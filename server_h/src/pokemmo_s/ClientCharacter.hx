package pokemmo_s;

import pokemmo_s.MasterConnector;
import pokemmo_s.Map;

/**
 * ...
 * @author Sonyp
 */

class ClientCharacter {
	private static inline var SPEED_HACK_N = 12;
	
	public var client:Client;
	private var disconnected:Bool;
	
	
	public var money:Int;
	public var pokemon:Array<Pokemon>;
	
	public var mapInstance:MapInstance;
	
	public var retransmit:Bool;
	public var x:Int;
	public var y:Int;
	public var direction:Int;
	public var lastX:Int;
	public var lastY:Int;
	public var type:String;
	
	public var surfing:Bool;
	public var usingBike:Bool;
	
	public var respawnLocation:Location;
	
	public var playerVars:Dynamic;
	
	public var battle:Battle;
	
	public var lastAckMove:Int;
	
	private var speedHackChecks:Array<Float>;
	private var lastMessage:Float;
	
	public function new(client:Client, save:ClientCharacterSave) {
		this.client = client;
		
		speedHackChecks = [];
		lastMessage = 0;
		
		surfing = false;
		usingBike = false;
		
		retransmit = true;
		money = save.money;
		pokemon = [];
		for (psave in save.pokemon) pokemon.push(new Pokemon().loadFromSave(psave));
		
		playerVars = save.playerVars;
		type = save.charType;
		respawnLocation = save.respawnLocation;
		
		client.socket.emit('setInfo', { pokemon: generatePokemonNetworkObject(), accountLevel: client.accountLevel } );
		
		warp(save.map, save.x, save.y, save.direction);
		
		client.socket.on('disconnect', e_disconnect);
		client.socket.on('walk', e_walk);
		client.socket.on('useLedge', e_useLedge);
		client.socket.on('turn', e_turn);
		client.socket.on('sendMessage', e_sendMessage);
		client.socket.on('useWarp', e_useWarp);
		
		if (client.accountLevel >= 30) {
			client.socket.on('kickPlayer', function(data:Dynamic){
				GameServer.kickPlayer(data.username);
			});
		}
		
		if (client.accountLevel >= 70) {
			client.socket.on('adminSetPokemon', function(data){
				if(GameData.getPokemonData(data.id) == null) return;
				pokemon[0].id = data.id;
				retransmit = true;
			});
			
			client.socket.on('adminSetLevel', function(data){
				if (!Std.is(data.level, Int)) return;
				var n:Int = data.level;
				if(n != n) return;
				if(n < 2) return;
				if(n > n) return;
				pokemon[0].level = n;
				pokemon[0].calculateStats();
				retransmit = true;
			});
			
			client.socket.on('adminTestLevelup', function(data) {
				pokemon[0].experience = pokemon[0].experienceNeeded - 1;
			});
			
			client.socket.on('adminTeleport', function(data) {
				warp(data.map, data.x, data.y, untyped data.dir || 0);
			});
		}
		
	}
	
	public function disconnect():Void {
		onDisconnect();
		client.socket.disconnect();
	}
	
	private function onDisconnect():Void {
		if (disconnected) return;
		disconnected = true;
		
		if (battle != null) {
			battle.playerSurrendered(battle.getPlayerOfClient(client));
		}
		
		MasterConnector.saveCharacter(client.username, generateCharacterSave());
		mapInstance.removeChar(this);
		
		client.onDisconnect();
	}
	
	private function e_disconnect(data:Dynamic) {
		onDisconnect();
	}
	
	public function generateCharacterSave():ClientCharacterSave {
		return {
			map: mapInstance.map.id,
			x: x,
			y: y,
			direction: direction,
			charType: type,
			pokemon: Lambda.array(Lambda.map(pokemon, function(p:Pokemon) { return p.generateSave(); } )),
			respawnLocation: respawnLocation,
			money: money,
			playerVars: playerVars
		};
	}
	
	public function generateNetworkObject() {
		return {
			username: client.username,
			inBattle: battle != null,
			x: x,
			y: y,
			lastX: lastX,
			lastY: lastY,
			type: type,
			direction: direction,
			follower: pokemon[0].id,
			folShiny: pokemon[0].shiny
		};
	}
	
	public function generatePokemonNetworkObject() {
		var arr = [];
		for (i in pokemon) {
			arr.push(i.generateNetworkObject(true));
		}
		return arr;
	}
	
	private function putInMap(str:String):Void {
		var map = GameData.getMap(str);
		if (map == null) return;
		
		if (mapInstance != null) {
			mapInstance.removeChar(this);
		}
		
		for (i in map.instances) {
			if (map.playersPerInstance > 0 && i.getCharCount() >= map.playersPerInstance) {
				continue;
			}
			
			i.addChar(this);
			mapInstance = i;
			return;
		}
		
		mapInstance = map.createInstance();
		mapInstance.addChar(this);
	}
	
	public function warp(map:String, x:Int, y:Int, dir:Int = GameConst.DIR_DOWN):Void {
		this.x = x;
		this.y = y;
		direction = dir;
		putInMap(map);
		
		lastX = x;
		lastY = y;
		
		retransmit = true;
		
		client.socket.emit('loadMap', {mapid: map, chars: mapInstance.generateFullCharNetworkObject()});
	}
	
	public inline function warpToLocation(loc:Location):Void {
		warp(loc.mapName, loc.x, loc.y, loc.direction);
	}
	
	public function restorePokemon():Void {
		for (p in pokemon) p.restore();
	}
	
	public function moveToSpawn():Void {
		warpToLocation(respawnLocation);
	}
	
	private function sendInvalidMove():Void {
		lastAckMove = Math.floor(Date.now().getTime() * 1000 + Math.random() * 1000);
		client.socket.emit('invalidMove', {ack: lastAckMove, x: x, y: y});
	}
	
	private function onWalk():Void {
		if (battle != null) return;
		
		var destSolid = mapInstance.map.solidData[x][y];
		
		retransmit = true;
		
		if (speedHackChecks.length >= SPEED_HACK_N) speedHackChecks.shift();
		speedHackChecks.push(Date.now().getTime());
		if (speedHackChecks.length >= SPEED_HACK_N) {
			var avgWalkTime = 0.0;
			for (i in 1...SPEED_HACK_N) {
				avgWalkTime += speedHackChecks[i] - speedHackChecks[i - 1];
			}
			
			avgWalkTime /= SPEED_HACK_N - 1;
			if (avgWalkTime < 200) {
				Main.log('Speed hack detected, kicking client ' + client.username);
				disconnect();
				return;
			}
		}
		
		var encounterAreas = mapInstance.map.getEncounterAreasAt(x, y);
		for (area in encounterAreas) {
			if (checkEncounters(area.encounters)) return;
		}
		
		if (destSolid == Map.SD_GRASS && mapInstance.map.grassEncounters != null) {
			if (checkEncounters(mapInstance.map.grassEncounters)) return;
		}
	}
	
	private function checkEncounters(encounters:Array<EncounterData>):Bool {
		if (Math.random() > 1 / 18.5) return false;
		
		var chance = 0.0;
		var n = Math.random();
		for (encounter in encounters) {
			if (n >= (chance += encounter.chance)) continue;
			
			var level = Utils.randInt(encounter.min_level, encounter.max_level);
			var enemy = encounter.id;
			
			battle = new BattleWild(client, new Pokemon().createWild(enemy, level));
			battle.init();
			return true;
		}
		
		return false;
	}
	
	private inline function canWalkOnTileType(type:Int):Bool {
		return surfing ? (type == Map.SD_WATER) : (type == Map.SD_NONE || type == Map.SD_GRASS);
	}
	
	private function e_walk(data:Dynamic) {
		if (battle != null) return;
		
		if (MacroUtils.verifyStructure(data, {
			var x:Int;
			var y:Int;
			var dir:Int;
		})) {
			return;
		}
		
		if (data.x < 0 || data.x >= mapInstance.map.width) return;
		if (data.y < 0 || data.y >= mapInstance.map.height) return;
		
		var destSolid = mapInstance.map.solidData[data.x][data.y];
		if (destSolid == null) return;
		
		var invalidMove = false;
		
		direction = Math.floor(Math.abs(data.dir) % 4);
		
		if (!canWalkOnTileType(destSolid)) {
			invalidMove = true;
		}else if (x - 1 == data.x && y == data.y) {
			lastX = x;
			lastY = y;
			x -= 1;
			direction = GameConst.DIR_LEFT;
			onWalk();
		}else if (x + 1 == data.x && y == data.y) {
			lastX = x;
			lastY = y;
			x += 1;
			direction = GameConst.DIR_RIGHT;
			onWalk();
		}else if (x == data.x && y - 1 == data.y) {
			lastX = x;
			lastY = y;
			y -= 1;
			direction = GameConst.DIR_UP;
			onWalk();
		}else if (x == data.x && y + 1 == data.y) {
			lastX = x;
			lastY = y;
			y += 1;
			direction = GameConst.DIR_DOWN;
			onWalk();
		}else {
			invalidMove = true;
		}
		
		if (invalidMove) {
			sendInvalidMove();
		}
	}
	
	private function e_useLedge(data:Dynamic) {
		if (battle != null) return;
		if (MacroUtils.verifyStructure(data, {
			var x:Int;
			var y:Int;
		})) {
			return;
		}
		
		if (data.x < 0 || data.x >= mapInstance.map.width) return;
		if (data.y < 0 || data.y >= mapInstance.map.height) return;
		
		var destSolid = mapInstance.map.solidData[data.x][data.y];
		if (destSolid == null) return;
		
		switch(destSolid){
		case Map.SD_LEDGE_DOWN:
			if(x != data.x || y + 1 != data.y){
				sendInvalidMove();
				return;
			}
			direction = GameConst.DIR_DOWN;
			y += 2;
			lastY = y;
			retransmit = true;
		case Map.SD_LEDGE_LEFT:
			if(x - 1 != data.x || y != data.y){
				sendInvalidMove();
				return;
			}
			direction = GameConst.DIR_LEFT;
			x -= 2;
			lastX = x;
			retransmit = true;
		case Map.SD_LEDGE_UP:
			if(x != data.x || y - 1 != data.y){
				sendInvalidMove();
				return;
			}
			direction = GameConst.DIR_UP;
			y -= 2;
			lastY = y;
			retransmit = true;
		case Map.SD_LEDGE_RIGHT:
			if(x + 1 != data.x || y != data.y){
				sendInvalidMove();
				return;
			}
			direction = GameConst.DIR_RIGHT;
			x += 2;
			lastX = x;
			retransmit = true;
		}
	}
	
	private function e_turn(data:Dynamic) {
		if (battle != null) return;
		if (!Std.is(data.dir, Int)) return;
		direction = Math.floor(Math.abs(data.dir) % 4);
		retransmit = true;
	}
	
	private function e_sendMessage(data:Dynamic) {
		if (!Std.is(data.str, String)) return;
		var t = Date.now().getTime();
		if (t - lastMessage < 100) return;
		var str:String = filterChatText(data.str.substr(0, 128));
		if (str.length == 0) return;
		
		mapInstance.messages.push( { username: client.username, str: str, x: x, y: y } );
		lastMessage = t;
		
	}
	
	private function e_useWarp(data:Dynamic) {
		var warp = mapInstance.map.getWarp(data.name);
		if (warp == null) return;
		
		// If the client isn't right next to the warp, ignore him
		// TODO: check direction
		if (Math.abs(warp.x - x) + Math.abs(warp.y - y) > 1) return;
		
		mapInstance.warpsUsed.push( { username: client.username, warpName: data.name, x: x, y: y, direction: direction } );
		warpToLocation(warp.destination);
	}
	
	static private var chatFilterRegex:EReg;
	static inline private function filterChatText(str):String {
		if (chatFilterRegex == null) chatFilterRegex = new EReg("[^\\u0020-\\u007F\\u0080-\\u00FF]", "");
		return chatFilterRegex.replace(str, '');
	}
}