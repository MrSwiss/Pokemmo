package pokemmo_s;
import js.Node;

/**
 * ...
 * @author Sonyp
 */

class GameServer {
	static private var clients:Array<Client>;
	
	static public function start():Void {
		clients = [];
		
		var io = Node.require('socket.io').listen(2828).set('close timeout', 0).set('log level', 3);
		
		io.sockets.on('connection', function(socket:SocketConnection):Void {
			clients.push(new Client(socket));
		});
		
		Node.setInterval(sendUpdates, 250);
	}
	
	static public function kickPlayer(username:String):Void {
		for (c in clients) {
			if (c.username == username) {
				c.kick();
			}
		}
	}
	
	static public function sendUpdates():Void {
		for (ins in GameData.mapsInstaces) {
			if (ins.getCharCount() == 0) continue;
			var d = ins.generateNetworkObjectData();
			
			for (c in ins.chars) {
				c.client.socket.volatile.emit('update', d);
			}
		}
		
	}
	
	static inline public function getClientCount():Int {
		return clients.length;
	}
}