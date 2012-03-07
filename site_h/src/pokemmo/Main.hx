package pokemmo;

import js.Lib;
import UserAgentContext;
import SocketIOConnection;

/**
 * ...
 * @author Matheus28
 */
 
class Main {
	inline static public var window = { untyped __js__("window"); };
	inline static public var document = { untyped __js__("document"); };
	
	static public var isPhone:Bool;
	static public var screenWidth:Int;
	static public var screenHeight:Int;
	
	static public var onScreenCanvas:HTMLCanvasElement;
	static public var onScreenCtx:CanvasRenderingContext2D;
	
	static public var tmpCanvas:HTMLCanvasElement;
	static public var tmpCtx:CanvasRenderingContext2D;
	
	static public var mapCacheCanvas:HTMLCanvasElement;
	static public var mapCacheCtx:CanvasRenderingContext2D;
	
	
	static public var canvas:HTMLCanvasElement;
	static public var ctx:CanvasRenderingContext2D;
	
	static public var jq:Dynamic = { untyped __js__("jQuery"); };
	
	
	
	static function main() {
		untyped __js__("Array.prototype.remove = function(e){
			var i = 0;
			var arr = this;
			
			if((i = arr.indexOf(e, i)) != -1){
				arr.splice(i, 1);
				return true;
			}
			return false;
		};");
		
		isPhone = (~/(iPhone|iPod)/i).match(Lib.window.navigator.userAgent);
		screenWidth = isPhone ? 480 : 800;
		screenHeight = isPhone ? 320 : 600;
		
		untyped Lib.window.initGame = initGame;
	}
	
	static public function tick():Void {
		UI.tick();
		if (Game.curGame != null) Game.curGame.tick();
		
		Renderer.render();
	}
	
	static public function log(obj:Dynamic):Void {
		untyped console.log(obj);
	}
	
	static public function initGame(canvas_:HTMLCanvasElement, container:HTMLDivElement):Void {
		onScreenCanvas = canvas_;
		onScreenCtx = onScreenCanvas.getContext('2d');
		//onScreenCanvas.style.position = 'relative';
		
		canvas = untyped Lib.document.createElement('canvas');
		ctx = canvas.getContext('2d');
		
		tmpCanvas = untyped Lib.document.createElement('canvas');
		tmpCtx = tmpCanvas.getContext('2d');
		
		mapCacheCanvas = untyped Lib.document.createElement('canvas');
		mapCacheCtx = mapCacheCanvas.getContext('2d');
		
		jq(window).mousemove(function(e:MouseEvent):Void {
			var offset = jq(onScreenCanvas).offset();
			UI.mouseX = untyped e.pageX - offset.left;
			UI.mouseY = untyped e.pageY - offset.top;
		});
		
		if (!isPhone) {
			Chat.setup();
		}
		
		jq(window).blur(function():Void {
			for (i in 0...UI.keysDown.length) {
				UI.keysDown[i] = false;
			}
		});
		
		jq(window).keydown(function(e:KeyboardEvent){
			if (e.keyCode == 13 && !Chat.inChat && !Chat.justSentMessage) {
				Chat.inChat = true;
				jq(Chat.chatBox).focus();
			}
			
			if(!Chat.inChat && !UI.keysDown[e.keyCode]){
				UI.keysDown[e.keyCode] = true;
				if(e.keyCode == 90){
					UI.uiAButtonDown = true;
					UI.fireAHooks = true;
				}else if(e.keyCode == 88){
					UI.uiBButtonDown = true;
					UI.fireBHooks = true;
				}else if(e.keyCode == 37){
					UI.arrowKeysPressed.push(Game.DIR_LEFT);
				}else if(e.keyCode == 40){
					UI.arrowKeysPressed.push(Game.DIR_DOWN);
				}else if(e.keyCode == 39){
					UI.arrowKeysPressed.push(Game.DIR_RIGHT);
				}else if(e.keyCode == 38){
					UI.arrowKeysPressed.push(Game.DIR_UP);
				}
			}
		});
		
		jq(window).keyup(function(e:KeyboardEvent){
			UI.keysDown[e.keyCode] = false;
			if(e.keyCode == 13){
				Chat.justSentMessage = false;
			}else if(e.keyCode == 90){
				UI.uiAButtonDown = false;
			}else if(e.keyCode == 88){
				UI.uiBButtonDown = false;
			}
		});
		
		var tickFunc = tick;
		untyped __js__("setInterval(tickFunc, 1000/30)");
		
		jq(window).resize(function(){
			if(isPhone){
				canvas.width = jq(window).width();
				canvas.height = jq(window).height();
				
			}else{
				canvas.width = 800;
				canvas.height = 600;
				
				container.style.top = '50%';
				container.style.left = '50%';
				container.style.position = 'fixed';
				container.style.marginTop = '-300px';
				container.style.marginLeft = '-400px';
				
			}
			container.width = mapCacheCanvas.width = tmpCanvas.width = onScreenCanvas.width = canvas.width;
			container.height = mapCacheCanvas.height = tmpCanvas.height = onScreenCanvas.height = canvas.height;
			
			if(Game.curGame != null && Map.cur != null) Map.cur.cacheMap = null;
			Renderer.render();
		}).resize();
		
		jq(window).bind('orientationchange', function() {
			window.scrollTo(0, 0);
		});
		
		UI.setup();
		Game.setup();
		Renderer.setup();
		Connection.setup();
	}
	
	inline static public function setTimeout(func:Void->Void, delay:Float):Void {
		untyped __js__("setTimeout")(func, delay);
	}
	
	inline static public function clearTmpCanvas():Void {
		tmpCtx.clearRect(0, 0, tmpCanvas.width, tmpCanvas.height);
	}
}