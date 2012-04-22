package pokemmo;

import pokemmo.Battle;
import UserAgentContext;

/**
 * ...
 * @author Sonyp
 */

class Renderer {
	static private var willRender:Bool;
	static public var numRTicks = 0;
	static public var cameraX:Float;
	static public var cameraY:Float;
	
	static private var renderHooks:Array < Void -> Void > ;
	static private var gameRenderHooks:Array < Void -> Void > ;
	
	static public var curTransition:Transition;
	
	static public function setup():Void {
		resetHooks();
	}
	
	static public function render():Void {
		if (willRender) return;
		willRender = true;
		
		var func:(Void -> Void) -> Void = untyped __js__("window.requestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame");
		if (func == null) func = function(tmp:Void->Void):Void { (untyped __js__("setTimeout"))(realRender, 1); };
		
		func(realRender);
		
	}
	
	static public function getOffsetX():Int {
		return Math.floor(Game.curGame.map.tilewidth * -cameraX);
	}
	
	static public function getOffsetY():Int {
		return Math.floor(Game.curGame.map.tileheight * -cameraY);
	}
	
	static public function hookRender(func:Void->Void):Void {
		if(renderHooks.indexOf(func) != -1) return;
		renderHooks.push(func);
	}
	
	static public function unHookRender(func:Void->Void):Void {
		var i = renderHooks.indexOf(func);
		if(i != -1) renderHooks.splice(i, 1);
	}
	
	static public function resetHooks():Void {
		renderHooks = [];
		gameRenderHooks = [];
	}
	
	static private function realRender():Void {
		willRender = false;
		var ctx = Main.ctx;
		var canvas = Main.canvas;
		var onScreenCtx = Main.onScreenCtx;
		var onScreenCanvas = Main.onScreenCanvas;
		var tmpCtx = Main.tmpCtx;
		var tmpCanvas = Main.tmpCanvas;
		
		
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		//ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
		ctx.fillStyle = '#66BBFF';
		ctx.fillRect(0, 0, canvas.width, canvas.height);
		
		
		var g = Game.curGame;
		
		switch(Game.state) {
		case ST_UNKNOWN:
			ctx.fillStyle = '#000000';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
		case ST_MAP:
			if (g == null) return;
			var map = g.map;
			if(map == null) throw 'No map in memory';
			
			var chr = g.getPlayerChar();
			if(chr != null){
				cameraX = chr.getRenderPosX() / map.tilewidth + 1 - (Main.screenWidth / map.tilewidth) / 2;
				cameraY = chr.getRenderPosY() / map.tileheight - (Main.screenHeight / map.tileheight) / 2;
			}
			
			map.render(ctx);
			map.renderAnimated(ctx);
			Game.curGame.renderObjects(ctx);
			map.renderOver(ctx);
			
			for(hk in gameRenderHooks) hk();
			
			Chat.renderBubbles(ctx);
			
			if (g.inBattle && g.battle.step != BATTLE_STEP_TRANSITION) {
				g.battle.render(ctx);
			}
		
			Chat.render(ctx);
			
			if(!g.inBattle){
				UI.renderPokemonParty(ctx);
			}
			
			if (renderHooks.length > 0) {
				var arr = renderHooks.copy();
				for (i in 0...arr.length) arr[i]();
			}
		case ST_LOADING:
			ctx.fillStyle = '#000000';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = '#FFFFFF';
			ctx.font = '12pt Courier New';
			
			if(Game.loadError){
				ctx.fillText('Failed loading files', 10, 30);
			}else{
				if(Game.pendingLoad == 0){
					Game.state = ST_MAP;
					
					var step = 0;
					var func:Void->Void = null;
					func = function() {
						ctx.fillStyle = '#000000';
						ctx.globalAlpha = 1 - (step / 8);
						ctx.fillRect(0, 0, canvas.width, canvas.height);
						ctx.globalAlpha = 1;
						++step;
						if(step >= 8){
							unHookRender(func);
						}
					}
					
					hookRender(func);
					
					render();
				}else{
					ctx.fillText('Loading... ' + Game.pendingLoad, 10, 30);
				}
			}
			
		case ST_DISCONNECTED:
			ctx.fillStyle = '#000000';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.fillStyle = '#FFFFFF';
			ctx.font = '12pt Courier New';
			ctx.fillText("Disconnected from the server", 10, 30);
		case ST_TITLE:
			TitleScreen.render(ctx);
		case ST_REGISTER:
			RegisterScreen.render(ctx);
		case ST_NEWGAME:
			NewGameScreen.render(ctx);
		}
		
		UI.render(ctx);
		if (isInTransition()) curTransition.render(ctx);
		
		onScreenCtx.clearRect(0, 0, onScreenCanvas.width, onScreenCanvas.height);
		onScreenCtx.drawImage(canvas, 0, 0);
		
		++numRTicks;
	}
	
	static public function drawOverlay(ctx:CanvasRenderingContext2D, x:Int, y:Int, width:Int, height:Int, drawFunc:CanvasRenderingContext2D->Void):Void {
		var tmpCtx = Main.tmpCtx;
		var overlayWidth:Int = width + 4;
		var overlayHeight:Int = height + 4;
		
		
		tmpCtx.clearRect(0, 0, overlayWidth, overlayHeight);
		tmpCtx.save();
		tmpCtx.fillStyle = '#FFFF00';
		tmpCtx.fillRect(0, 0, overlayWidth, overlayHeight);
		tmpCtx.globalCompositeOperation = "destination-atop";
		drawFunc(tmpCtx);
		tmpCtx.restore();
		
		ctx.drawImage(Main.tmpCanvas, 0, 0, width, height, x - 2, y, width, height);
		ctx.drawImage(Main.tmpCanvas, 0, 0, width, height, x, y - 2, width, height);
		ctx.drawImage(Main.tmpCanvas, 0, 0, width, height, x, y + 2, width, height);
		ctx.drawImage(Main.tmpCanvas, 0, 0, width, height, x + 2, y, width, height);
	}
	
	inline static public function drawShadowText2(ctx:CanvasRenderingContext2D, str:String, x:Int, y:Int, color:String, shadowColor:String):Void {
		ctx.fillStyle = shadowColor;
		ctx.fillText(str, x + 2, y);
		ctx.fillText(str, x, y + 2);
		ctx.fillText(str, x + 2, y + 2);
		ctx.fillStyle = color;
		ctx.fillText(str, x, y);
	}
	
	static public function startTransition(t:Transition):Transition {
		curTransition = t;
		return t;
	}
	
	static public function stopTransition():Void {
		curTransition = null;
	}
	
	static inline public function isInTransition():Bool {
		return curTransition != null;
	}
}
