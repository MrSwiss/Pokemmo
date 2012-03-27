package pokemmo;

import pokemmo.ui.UIButton;
import pokemmo.ui.UIInput;
import UserAgentContext;
import pokemmo.Game;
import pokemmo.Chat;
import pokemmo.ui.TextInput;

/**
 * ...
 * @author Matheus28
 */

class UI {
	static public var keysDown:Array<Bool> = [];
	
	static public var uiAButtonDown:Bool = false;
	static public var uiBButtonDown:Bool = false;
	static public var mouseDown:Bool = false;
	static public var mouseWasDown:Bool = false;
	static private var mouseDownFuture:Bool = false;
	
	static public var fireAHooks:Bool = false;
	static public var fireBHooks:Bool = false;
	static public var fireEnterHooks:Bool = false;
	static public var arrowKeysPressed = { new Array<Int>(); };
	static public var AButtonHooks:Array<Void->Void>;
	static public var BButtonHooks:Array<Void->Void>;
	static public var enterButtonHooks:Array<Void->Void>;
	static public var dirButtonHooks:Array<Int->Void>;
	
	static public var mouseX:Int;
	static public var mouseY:Int;
	
	static public var inputs:Array<UIInput>;
	static public var selectedInput:UIInput;
	static public var lastSelectedInput:UIInput;
	static public var hiddenInput:HTMLInputElement;
	
	static public function setup():Void {
		AButtonHooks = [];
		BButtonHooks = [];
		dirButtonHooks = [];
		enterButtonHooks = [];
		inputs = [];
		
		mouseX = mouseY = 0;
		
		var w = Main.window;
		
		hiddenInput = untyped document.createElement('input');
		hiddenInput.type = 'text';
		untyped hiddenInput.style.opacity = '0';
		hiddenInput.style.position = 'fixed';
		
		untyped __js__("document").body.appendChild(hiddenInput);
		
		Main.jq(w).keydown(function(e:KeyboardEvent) {
			if (!Chat.inChat && e.keyCode == 68 && e.shiftKey && selectedInput == null) {
				Main.printDebug();
				e.preventDefault();
				return;
			}
			
			if (e.keyCode == 13) { // ENTER
				if (Game.state == ST_MAP) {
					if (!Chat.inChat && !Chat.justSentMessage) {
						Chat.inChat = true;
						Main.jq(Chat.chatBox).focus();
					}
				}else {
					fireEnterHooks = true;
				}
				e.preventDefault();
			}else if (e.keyCode == 9) { // TAB
				selectNextInput();
				e.preventDefault();
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
		
		Main.jq(w).keyup(function(e:KeyboardEvent){
			UI.keysDown[e.keyCode] = false;
			if(e.keyCode == 13){
				Chat.justSentMessage = false;
				
			}else if(e.keyCode == 90){
				UI.uiAButtonDown = false;
			}else if(e.keyCode == 88){
				UI.uiBButtonDown = false;
			}
			
			if (e.keyCode == 13 || e.keyCode == 32) {
				if (selectedInput != null && Std.is(selectedInput, UIButton)) {
					var b:UIButton = cast selectedInput;
					if (b.instantSubmit) {
						b.submit();
					}
				}
			}
		});
		
		Main.jq(w).blur(function():Void {
			for (i in 0...UI.keysDown.length) {
				UI.keysDown[i] = false;
			}
			
			mouseDown = false;
		});
		
		Main.jq(w).mousedown(function(e:MouseEvent):Void {
			mouseDownFuture = true;
			
			var selectedAny = false;
			
			for (i in 0...inputs.length) {
				if (inputs[i].isUnderMouse()) {
					inputs[i].select();
					selectedAny = true;
				}
			}
			
			if (!selectedAny && selectedInput != null) {
				lastSelectedInput = selectedInput;
				selectedInput.blur();
			}
			
			e.preventDefault();
		});
		
		Main.jq(w).mouseup(function():Void {
			mouseDownFuture = false;
			
			if (selectedInput != null && selectedInput.isUnderMouse() && Std.is(selectedInput, UIButton)) {
				var b:UIButton = cast selectedInput;
				if (b.instantSubmit) {
					b.submit();
				}
			}
		});
	}
	
	static public function selectNextInput() {
		if (inputs.length <= 1) return;
		
		if (selectedInput != null) {
			inputs[(inputs.indexOf(selectedInput) + 1) % inputs.length].select();
		}else if(lastSelectedInput != null){
			inputs[(inputs.indexOf(lastSelectedInput) + 1) % inputs.length].select();
		}else if(inputs.length > 0){
			inputs[0].select();
		}
		
		if (selectedInput != null && selectedInput.disabled) {
			var i = inputs.indexOf(selectedInput);
			for (j in i...inputs.length) {
				if (!inputs[j].disabled) {
					inputs[j].select();
					return;
				}
			}
			for (j in 0...i) {
				if (!inputs[j].disabled) {
					inputs[j].select();
					return;
				}
			}
		}
	}
	
	static public function tick():Void {
		setCursor('auto');
		
		mouseWasDown = mouseDown;
		mouseDown = mouseDownFuture;
		
		if(hiddenInput.selected){
			hiddenInput.selectionStart = hiddenInput.value.length;
			hiddenInput.selectionEnd =  hiddenInput.value.length;
		}
		
		for (i in 0...inputs.length) {
			inputs[i].tick();
		}
		
		if(fireAHooks){
			fireAHooks = false;
			var arr = AButtonHooks.copy();
			AButtonHooks = [];
			
			if(!Renderer.isInTransition()) for(e in arr) e();
		}
		
		if(fireBHooks){
			fireBHooks = false;
			var arr = BButtonHooks.copy();
			BButtonHooks = [];
			
			if(!Renderer.isInTransition()) for(e in arr) e();
		}
		
		if(fireEnterHooks){
			fireEnterHooks = false;
			var arr = enterButtonHooks.copy();
			enterButtonHooks = [];
			
			if(!Renderer.isInTransition()) for(e in arr) e();
		}
		
		if(!Renderer.isInTransition()){
			for (i in 0...arrowKeysPressed.length) {
				for (j in 0...dirButtonHooks.length) {
					dirButtonHooks[j](arrowKeysPressed[i]);
				}
			}
		}
		
		arrowKeysPressed = [];
	}
	
	static public function render(ctx:CanvasRenderingContext2D):Void {
		for (i in 0...inputs.length) {
			inputs[i].render(ctx);
		}
	}
	
	inline static public function hookAButton(func:Void->Void):Void {
		AButtonHooks.push(func);
	}
	
	inline static public function hookBButton(func:Void->Void):Void {
		BButtonHooks.push(func);
	}
	
	inline static public function hookEnterButton(func:Void->Void):Void {
		enterButtonHooks.push(func);
	}
	
	inline static public function unHookAButton(func:Void->Void):Void {
		AButtonHooks.remove(func);
	}
	
	inline static public function unHookBButton(func:Void->Void):Void {
		BButtonHooks.remove(func);
	}
	
	inline static public function unHookABButtons():Void {
		AButtonHooks = [];
		BButtonHooks = [];
	}
	
	inline static public function unHookAllAButton():Void {
		BButtonHooks = [];
	}
	
	inline static public function unHookAllBButton():Void {
		BButtonHooks = [];
	}
	
	inline static public function unHookEnterButton(func:Void->Void):Void {
		AButtonHooks.remove(func);
	}
	
	inline static public function hookDirButtons(func:Int->Void):Void {
		dirButtonHooks.push(func);
	}
	
	inline static public function unHookDirButtons(func:Int->Void):Void {
		dirButtonHooks.remove(func);
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
	
	static public function createTextInput(x:Int, y:Int, width:Int):TextInput {
		var ti = new TextInput(x, y, width);
		inputs.push(ti);
		return ti;
	}
	
	static inline public function pushInput(i:UIInput):Void {
		inputs.push(i);
	}
	
	static inline public function removeInput(i:UIInput):Void {
		if (selectedInput == i) i.blur();
		inputs.remove(i);
	}
	
	static inline public function removeAllInputs():Void {
		while(inputs.length > 0) {
			removeInput(inputs[0]);
		}
	}
	
	inline static public function setCursor(str:String):Void {
		Main.onScreenCanvas.style.cursor = str;
	}
}