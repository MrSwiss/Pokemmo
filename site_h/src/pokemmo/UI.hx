package pokemmo;

import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class UI {
	static public var keysDown:Array<Bool> = [];
	
	static public var uiAButtonDown:Bool = false;
	static public var uiBButtonDown:Bool = false;
	
	static public var fireAHooks:Bool = false;
	static public var fireBHooks:Bool = false;
	static public var arrowKeysPressed = { new Array<Int>(); };
	static public var AButtonHooks:Array<Void->Void>;
	static public var BButtonHooks:Array<Void->Void>;
	static public var dirButtonHooks:Array<Int->Void>;
	
	static public var mouseX:Int ;
	static public var mouseY:Int;
	
	static public function setup():Void {
		AButtonHooks = [];
		BButtonHooks = [];
		dirButtonHooks = [];
		
		mouseX = mouseY = 0;
	}
	
	static public function tick():Void {
		if(fireAHooks){
			fireAHooks = false;
			var arr = AButtonHooks.copy();
			while(AButtonHooks.length > 0) AButtonHooks.pop();
			
			for(i in 0...arr.length){
				arr[i]();
			}
		}
		
		if(fireBHooks){
			fireBHooks = false;
			var arr = BButtonHooks.copy();
			while(BButtonHooks.length > 0) BButtonHooks.pop();
			
			for(i in 0...arr.length){
				arr[i]();
			}
		}
		
		for (i in 0...arrowKeysPressed.length) {
			for (j in 0...dirButtonHooks.length) {
				dirButtonHooks[j](arrowKeysPressed[i]);
			}
		}
		
		while(arrowKeysPressed.length > 0) arrowKeysPressed.pop();
	}
	
	inline static public function hookAButton(func:Void->Void):Void {
		AButtonHooks.push(func);
	}
	
	inline static public function hookBButton(func:Void->Void):Void {
		BButtonHooks.push(func);
	}
	
	inline static public function unHookAButton(func:Void->Void):Void {
		AButtonHooks.remove(func);
	}
	
	inline static public function unHookBButton(func:Void->Void):Void {
		BButtonHooks.remove(func);
	}
	
	inline static public function isKeyDown(n:Int):Bool {
		return !!keysDown[n];
	}
	
	inline static public function isMouseInRect(x1:Float, y1:Float, x2:Float, y2:Float):Bool {
		return mouseX >= x1 && mouseY >= y1 && mouseX < x2 && mouseY < y2;
	}
	
	static public function renderPokemonParty(ctx:CanvasRenderingContext2D):Void {
		if (Main.isPhone) return;
		
		Main.clearTmpCanvas();
		var x = 10;
		var y = 10;
		var deltaY = 48;
		var pokemonParty = Game.pokemonParty;
		var tmpCtx = Main.tmpCtx;
		var tmpCanvas = Main.tmpCanvas;
		
		
		if(pokemonParty == null) return;
		
		function drawStyleText(str, x_, y_){
			tmpCtx.fillStyle = 'rgb(0, 0, 0)';
			tmpCtx.fillText(str, x + x_ + 2, y + y_ + 2);
			
			tmpCtx.fillStyle = 'rgb(255, 255, 255)';
			tmpCtx.fillText(str, x + x_, y + y_);
		}
		
		for (i in 0...pokemonParty.length) {
			
			tmpCtx.save();
			tmpCtx.shadowOffsetX = 4;
			tmpCtx.shadowOffsetY = 4;
			tmpCtx.shadowBlur = 0;
			tmpCtx.shadowColor = 'rgba(0, 0, 0, 0.5)';
			tmpCtx.drawImage(Game.getRes('uiPokemon').obj, x, y);
			tmpCtx.restore();
			
			if(pokemonParty[i].icon.loaded){
				tmpCtx.drawImage(pokemonParty[i].icon.obj, x + 8, y + 8);
			}
			
			
			tmpCtx.font = '12pt Font1';
			tmpCtx.fillStyle = 'rgb(255, 255, 255)';
			
			// Name
			drawStyleText(Util.getPokemonDisplayName(pokemonParty[i]), 45, 21);
			
			// Level
			var lvWidth = tmpCtx.measureText('Lv '+pokemonParty[i].level).width;
			drawStyleText('Lv '+pokemonParty[i].level, 45, 35);
			tmpCtx.font = '12pt Font1';
			
			var hp = pokemonParty[i].hp  +'/' +pokemonParty[i].maxHp;
			var barWidth:Int = Math.ceil(tmpCtx.measureText(hp).width);
			drawStyleText(hp, 280 - barWidth, 35);
			
			
			var sx = x + 60 + lvWidth;
			
			tmpCtx.save();
			tmpCtx.translate(-0.5, -0.5);
			tmpCtx.lineWidth = 2;
			// Exp bar
			tmpCtx.save();
			tmpCtx.beginPath();
			tmpCtx.moveTo(0, y + 32);
			tmpCtx.lineTo(tmpCanvas.width, y + 32);
			tmpCtx.lineTo(tmpCanvas.width, y + 45);
			tmpCtx.lineTo(0, y + 45);
			tmpCtx.lineTo(0, y + 32);
			tmpCtx.clip();
			
			tmpCtx.strokeStyle = 'rgb(0, 0, 0)';
			
			tmpCtx.fillStyle = 'rgb(0, 0, 0)';
			tmpCtx.fillRect(sx + 5, y + 30, (190 - barWidth - lvWidth), 5);
			
			tmpCtx.fillStyle = 'rgb(64,200,248)';
			tmpCtx.fillRect(sx + 5, y + 30, Math.ceil((190 - barWidth - lvWidth) * (pokemonParty[i].experience / pokemonParty[i].experienceNeeded)), 5);
			tmpCtx.strokeRect(sx + 5, y + 30, (190 - barWidth - lvWidth), 5);
			tmpCtx.restore();
			
			// Hp bar
			
			tmpCtx.fillStyle = 'rgb(0, 200, 0)';
			tmpCtx.strokeStyle = 'rgb(0, 0, 0)';
			
			tmpCtx.fillRect(sx, y + 27, Math.ceil((200 - barWidth - lvWidth) * (pokemonParty[i].hp / pokemonParty[i].maxHp)), 5);
			tmpCtx.strokeRect(sx, y + 27, (200 - barWidth - lvWidth), 5);
			
			tmpCtx.restore();
			y += deltaY;
		}
		
		ctx.globalAlpha = 0.8;
		ctx.drawImage(tmpCanvas, 480, 0);
		ctx.globalAlpha = 1;
	}
}