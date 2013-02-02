package pokemmo_s;
import js.Node;
import pokemmo_s.Client;
import pokemmo_s.Pokemon;

/**
 * ...
 * @author Sonyp
 */

class MasterConnector {
	// Function have a callback because in the future there will
	// be a master server that will need to be contacted before returning from
	// these functions, so better make it async already
	
	
	static private var mongodb:Dynamic;
	
	static private var loggedInUsers:Array<String>;
	static private var savingUsers:Array<String>;
	static private var dbserver:Dynamic;
	static private var dbclient:Dynamic;
	static private var dbaccounts:Dynamic;
	static private var dbchars:Dynamic;
	
	static public function connect(func:Void->Void):Void {
		loggedInUsers = [];
		savingUsers = [];
		
		mongodb = Node.require('mongodb');
		
		var tmongodb = mongodb;
		
		dbserver = untyped __js__("new tmongodb.Server('127.0.0.1', 27017, { } )");
		
		var tdbserver = dbserver;
		
		untyped __js__("new tmongodb.Db('pokemmo', tdbserver, {})").open(function (error, client) {
			if(error) throw error;
			var tdbclient = dbclient = client;
			
			dbclient.createCollection('accounts', function(){
				dbaccounts = untyped __js__("new tmongodb.Collection(tdbclient, 'accounts')");
				dbaccounts.ensureIndex({username: 1}, {unique:true}, function(){});
				dbaccounts.ensureIndex({lcusername: 1}, {unique:true}, function(){});
				
				dbclient.createCollection('characters', function(){
					dbchars = untyped __js__("new tmongodb.Collection(tdbclient, 'characters')");
					dbchars.ensureIndex({username: 1}, {unique:true}, function(){});
					func();
				});
			});
			
		}, { strict:true } );
	}
	
	static inline function isUser(username:String, func:Bool->Void):Void {
		func(Lambda.indexOf(savingUsers, username) != -1);
	}
	
	static public function loginUser(username:String, password:String, func:String->String->Void):Void {
		if (Lambda.indexOf(savingUsers, username) != -1 || Lambda.indexOf(loggedInUsers, username) != -1) {
			func("loggedInAlready", null);
			return;
		}
		
		dbaccounts.find({lcusername: username.toLowerCase()}, {limit:1}).toArray(function(err, docs:Array<Dynamic>) {
			if(err || docs.length == 0){
				func("wrongUsername", null);
				return;
			}
			
			var username = docs[0].username;
			var hashedpass = docs[0].password;
			var salt = docs[0].salt;
			
			loggedInUsers.push(username);
			func(Utils.sha512(password, salt) == hashedpass ? "success" : "wrong_password", docs[0].username);
		});
		
	}
	
	static public function disconnectUser(username:String):Void {
		loggedInUsers.remove(username);
	}
	
	static public function loadCharacter(username:String, func:Bool->ClientCharacterSave->Void) {
		dbchars.find({username: username}, {limit:1}).toArray(function(err:Dynamic, docs:Array<ClientCharacterSave>) {
			if(err){
				Node.console.warn('Error while trying to load client char: ' + err.message);
				func(false, null);
				return;
			}
			
			if (docs.length > 0) {
				func(true, docs[0]);
			}else {
				func(true, null);
			}
		});
	}
	
	static public function saveCharacter(username:String, data:ClientCharacterSave):Void {
		if (Lambda.indexOf(savingUsers, username) != -1) return;
		
		savingUsers.push(username);
		
		dbchars.update({username: username}, untyped __js__('{$set:data}'), {safe:true, upsert:true}, function(err){
			savingUsers.remove(username);
			if(err != null) Main.warn('Error while saving client character: '+err.message);
		});
	}
}

typedef ClientCharacterSave = {
	var map:String;
	var x:Int;
	var y:Int;
	var direction:Int;
	var charType:String;
	var pokemon:Array<PokemonSave>;
	var respawnLocation:Location;
	var money:Int;
	
	var playerVars:Dynamic;
}

typedef Location = {
	var mapName:String;
	var x:Int;
	var y:Int;
	var direction:Int;
}