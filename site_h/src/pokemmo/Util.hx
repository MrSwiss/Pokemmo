package pokemmo;

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
	
	inline static public function getPokemonDisplayName(pk:Pokemon):String {
		return Util.or(pk.nickname, Game.getPokemonData(pk.id).name).toUpperCase();
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