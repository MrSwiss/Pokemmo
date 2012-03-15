package pokemmo;
import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class Util {
	inline static public function clamp(n:Float, min:Float, max:Float):Float {
		return n < min ? min : (n > max ? max : n);
	}
	
	inline static public function or(v1:Dynamic, v2:Dynamic):Dynamic {
		return v1 ? v1 : v2;
	}
	
	static public function reduceTextSize(str:String, maxWidth:Int, ctx:CanvasRenderingContext2D):Array<String> {
		var arr = str.split(' ');
		var lines = [];
		
		while (arr.length > 0) {
			var fi = findMaximumTextSize(arr, maxWidth, ctx, 0, arr.length);
			lines.push(arr.slice(0, fi).join(' '));
			arr = arr.slice(fi);
		}
		
		return lines;
	}
	
	static private function findMaximumTextSize(arr:Array<String>, maxWidth:Int, ctx:CanvasRenderingContext2D, low:Int, high:Int):Int {
		if (high < low) return -1;
		if (high - low <= 1) return high;
		var mid = Math.floor((low + high) / 2);
		var w = ctx.measureText(arr.slice(0, mid).join(' ')).width;
		if (w > maxWidth) {
			return findMaximumTextSize(arr, maxWidth, ctx, low, mid - 1);
		}else {
			if (ctx.measureText(arr.slice(0, mid + 1).join(' ')).width > maxWidth) {
				return mid;
			}else {
				return findMaximumTextSize(arr, maxWidth, ctx, mid + 1, high);
			}
		}
	}
	
	inline static public function getPokemonStatusBarName(pk:Pokemon):String {
		return Util.or(pk.nickname, Game.getPokemonData(pk.id).name).toUpperCase();
	}
	
	inline static public function getPokemonDisplayName(pk:Pokemon):String {
		var str = Util.or(pk.nickname, Game.getPokemonData(pk.id).name).toUpperCase();
		if (Game.curGame != null && Game.curGame.inBattle && Game.curGame.battle.type == Battle.BATTLE_WILD && Game.curGame.battle.enemyPokemon == pk) {
			str = 'Wild ' + str;
		}
		return str;
	}
	
	static public function drawRoundedRect(x:Int, y:Int, width:Int, height:Int, radius:Int, color:String, alpha:Float = 1.0):Void {
		var tmpCtx = Main.tmpCtx;
		var tmpCanvas = Main.tmpCanvas;
		var ctx = Main.ctx;
		tmpCtx.clearRect(0, 0, width, height);
		tmpCtx.save();
		tmpCtx.lineJoin = "round";
		tmpCtx.lineWidth = radius;
		tmpCtx.fillStyle = tmpCtx.strokeStyle = color;
		tmpCtx.strokeRect(radius / 2, radius / 2, width - radius, height - radius);
		tmpCtx.fillRect(radius / 2, radius / 2, width - radius, height - radius);
		tmpCtx.restore();
		
		ctx.save();
		ctx.globalAlpha = alpha;
		ctx.drawImage(tmpCanvas, 0, 0, width, height, x, y, width, height);
		ctx.restore();
	}
}