package pokemmo;

/**
 * ...
 * @author Sonyp
 */

class ImageResource {
	public var obj:Dynamic;
	
	public var loaded:Bool;
	public var error:Bool;
	private var loadHooks:Array<Void -> Void>;
	private var errorHooks:Array<Void -> Void>;
	public function new(src:String, onload:Void -> Void = null, onerror:Void -> Void = null) {
		loaded = false;
		error = false;
		
		loadHooks = [];
		errorHooks = [];
		
		if (onload != null) loadHooks.push(onload);
		if (onerror != null) errorHooks.push(onerror);
		
		obj = untyped __js__("new Image()");
		obj.onload = onLoad;
		obj.src = src;
	}
	
	public function addLoadHook(func:Void->Void):Void {
		if (func == null) return;
		if (loaded) {
			untyped __js__("setTimeout")(func, 0);
		}else {
			loadHooks.push(func);
		}
	}
	
	public function addErrorHook(func:Void->Void):Void {
		if (func == null) return;
		if (error) {
			untyped __js__("setTimeout")(func, 0);
		}else {
			errorHooks.push(func);
		}
	}
	
	private function onLoad():Void {
		loaded = true;
		for (i in 0...loadHooks.length) {
			loadHooks[i]();
		}
		
		loadHooks = null;
	}
	
	private function onError():Void {
		error = true;
		for (i in 0...errorHooks.length) {
			errorHooks[i]();
		}
		
		errorHooks = null;
	}
}