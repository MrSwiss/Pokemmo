package pokemmo_s;
import haxe.macro.Type;
import js.Node;

using pokemmo_s.exts.StringExt;

/**
 * ...
 * @author Sonyp
 */

class Utils {
	static public function createRandomString(len:Int):String {
		var i = len;
		var str = '';
		while (i-- > 0) {
			str += '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'.getRandomChar();
		}
		
		return str;
	}
	
	
	/// Generates a random int in the range [min, max]
	static inline public function randInt(min:Int, max:Int):Int {
		return min + Math.floor((max - min + 1) * Math.random());
	}
	
	static public function recursiveFreeze(obj:Dynamic):Dynamic {
		var rec = recursiveFreeze;
		untyped __js__("for(var i in obj)if(typeof obj[i] == 'object')rec(obj[i]);Object.freeze(obj);");
		return obj;
	}
	
	static public function sha512(pass:String, salt:String = null):String {
		var hasher = Node.crypto.createHash('sha512');
		if (salt == null) {
			hasher.update(pass, 'ascii');
		}else {
			hasher.update(pass+'#'+salt, 'ascii');
		}
		
		return hasher.digest('base64');
	}
	
	static public function clamp(n:Int, min:Int, max:Int):Int {
		return (n < min ? min : (n > max ? max : n));
	}
}