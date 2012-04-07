package pokemmo_s;
import pokemmo_s.MasterConnector;

/**
 * ...
 * @author Matheus28
 */

class Client {
	public var socket:SocketConnection;
	public var disconnected:Bool;
	
	public var username:String;
	public var accountLevel:Int;
	public var newAccount:Bool;
	
	public var character:ClientCharacter;
	
	public function new(socket:SocketConnection) {
		this.socket = socket;
		
		disconnected = false;
		
		socket.on('login', msg_login);
	}
	
	private function initCharacter(save:ClientCharacterSave):Void {
		character = new ClientCharacter(this, save);
	}
	
	public function msg_login(data:Dynamic):Void {
		if (MacroUtils.verifyStructure(data, {
			var username:String;
			var password:String;
		})) {
			socket.emit('loginFail', 'invalidData');
			return;
		}
		
		if (GameServer.getClientCount() > ServerConst.MAX_CLIENTS) {
			Main.log('Refusing client, server is full');
			socket.emit('loginFail', 'serverFull');
			return;
		}
		
		
		MasterConnector.loginUser(data.username, data.password, function(result:String, username:String):Void {
			if (result != "success") {
				socket.emit('loginFail', result);
				return;
			}
			
			this.username = username;
			
			accountLevel = GameData.getAdminLevel(username);
			
			socket.on('disconnect', onDisconnect);
			
			MasterConnector.loadCharacter(username, function(success:Bool, save:ClientCharacterSave):Void {
				if (!success) {
					socket.emit('loginFail', "internalError");
					return;
				}
				
				if (save == null) {
					newAccount = true;
					socket.emit('newGame', {username: username, starters: ServerConst.pokemonStarters, characters:ServerConst.characterSprites} );
					socket.on('newGame', e_newGame);
				}else {
					
					socket.emit('startGame', { username: username } );
					socket.on('startGame', function(data:Dynamic):Void{
						initCharacter(save);
					});
				}
			});
		});
	}
	
	public function kick():Void {
		if (character != null) {
			character.disconnect();
		}else {
			socket.disconnect();
			onDisconnect();
		}
	}
	
	public function onDisconnect(data:Dynamic = null):Void {
		if (disconnected) return;
		disconnected = true;
		MasterConnector.disconnectUser(username);
	}
	
	private function e_newGame(data:Dynamic) {
		if (!newAccount) return;
		if (MacroUtils.verifyStructure(data, {
			var starter:String;
			var character:String;
		})) {
			return;
		}
		
		if (ServerConst.pokemonStarters.indexOf(data.starter) == -1 || ServerConst.characterSprites.indexOf(data.character) == -1) {
			return;
		}
		
		newAccount = false;
		
		initCharacter( {
			map: 'pallet_hero_home_2f',
			x: 1,
			y: 3,
			direction: GameConst.DIR_DOWN,
			charType: data.character,
			money: 0,
			playerVars: {},
			respawnLocation: {
				mapName: 'pallet_hero_home_2f',
				x: 1,
				y: 3,
				direction: GameConst.DIR_DOWN
			},
			pokemon: [new Pokemon().createWild(data.starter, 5).generateSave()]
		});
	}
	
}