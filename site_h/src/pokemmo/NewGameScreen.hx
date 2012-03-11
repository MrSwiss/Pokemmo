package pokemmo;

import pokemmo.entities.CPokemon;
import pokemmo.transitions.FadeIn;
import pokemmo.transitions.FadeOut;
import pokemmo.ui.UIButton;
import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class NewGameScreen {
	static private var starters:Array<String>;
	static private var chars:Array<String>;
	static private var charsImage:Array<ImageResource>;
	static private var startersFollowerImage:Array<ImageResource>;
	static private var startersSpriteImage:Array<ImageResource>;
	
	static private var border128:ImageResource;
	static private var arrows:ImageResource;
	
	static private var pendingLoad:Int = 0;
	
	static private var curChar:Int;
	static private var curStarter:Int;
	
	static private var confirmBtn:UIButton;
	static private var cancelBtn:UIButton;
	
	static private var arrowPokLeft:UIButton;
	static private var arrowPokRight:UIButton;
	
	static private var arrowCharLeft:UIButton;
	static private var arrowCharRight:UIButton;
	
	
	static public function init(starters:Array<String>, chars:Array<String>):Void {
		NewGameScreen.starters = starters;
		NewGameScreen.chars = chars;
		
		pendingLoad = starters.length * 2 + chars.length;
		startersFollowerImage = [];
		startersSpriteImage = [];
		charsImage = [];
		
		curChar = Math.floor(Math.random() * chars.length);
		curStarter = Math.floor(Math.random() * starters.length);
		
		++pendingLoad;
		border128 = new ImageResource('resources/ui/border_128.png', onImageLoad, onImageError);
		
		++pendingLoad;
		arrows = new ImageResource('resources/ui/arrows.png', onImageLoad, onImageError);
		
		
		for (i in starters) {
			startersFollowerImage.push(new ImageResource('resources/followers/'+i+'.png', onImageLoad, onImageError));
			startersSpriteImage.push(new ImageResource('resources/sprites/'+i+'.png', onImageLoad, onImageError));
		}
		
		for (i in chars) {
			charsImage.push(new ImageResource('resources/chars/'+i+'.png', onImageLoad, onImageError));
		}
		
		confirmBtn = new UIButton(340, 490, 130, 30);
		confirmBtn.drawIdle = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(TitleScreen.titleButtons.obj, 200, 0, 150, 50, confirmBtn.x - 15, confirmBtn.y - 15, 150, 50);
		};
		confirmBtn.drawHover = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(TitleScreen.titleButtons.obj, 200, 50, 150, 50, confirmBtn.x - 15, confirmBtn.y - 15, 150, 50);
		};
		confirmBtn.drawDown = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(TitleScreen.titleButtons.obj, 200, 100, 150, 50, confirmBtn.x - 15, confirmBtn.y - 15, 150, 50);
		};
		confirmBtn.drawDisabled = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(TitleScreen.titleButtons.obj, 200, 150, 150, 50, confirmBtn.x - 15, confirmBtn.y - 15, 150, 50);
		};
		confirmBtn.onSubmit = onConfirm;
		UI.pushInput(confirmBtn);
		
		function createArrow(x:Int, y:Int, dir:Int, func:Void->Void):UIButton {
			var arrow = new UIButton(x, y, 32, 32);
			arrow.drawIdle = function(ctx:CanvasRenderingContext2D):Void {
				ctx.drawImage(arrows.obj, dir * 32, 0, 32, 32, arrow.x, arrow.y, 32, 32);
			};
			arrow.drawHover = function(ctx:CanvasRenderingContext2D):Void {
				ctx.drawImage(arrows.obj, dir * 32, 32, 32, 32, arrow.x, arrow.y, 32, 32);
			};
			arrow.drawDown = function(ctx:CanvasRenderingContext2D):Void {
				ctx.drawImage(arrows.obj, dir * 32, 64, 32, 32, arrow.x, arrow.y, 32, 32);
			};
			arrow.onSubmit = func;
			UI.pushInput(arrow);
			return arrow;
		}
		
		arrowPokLeft = createArrow(260, 430, Game.DIR_LEFT, function():Void {
			if (--curStarter < 0) curStarter += starters.length;
		});
		arrowPokRight = createArrow(305, 430, Game.DIR_RIGHT, function():Void {
			if (++curStarter >= starters.length) curStarter -= starters.length;
		});
		
		arrowCharLeft = createArrow(468, 430, Game.DIR_LEFT, function():Void {
			if (--curChar < 0) curChar += chars.length;
		});
		arrowCharRight = createArrow(513, 430, Game.DIR_RIGHT, function():Void {
			if (++curChar >= chars.length) curChar -= chars.length;
		});
		
	}
	
	static private function onImageLoad():Void {
		--pendingLoad;
		
		if (pendingLoad == 0) {
			Renderer.startTransition(new FadeIn(10));
		}
	}
	
	static private function onImageError():Void {
		// TODO
	}
	
	static private function onConfirm():Void {
		Renderer.startTransition(new FadeOut(10)).onComplete = function():Void {
			destroy();
			Game.state = ST_LOADING;
			Connection.socket.emit('newGame', {starter: starters[curStarter], character: chars[curChar]});
		}
	}
	
	static public function destroy():Void {
		UI.removeInput(confirmBtn);
		UI.removeInput(arrowPokLeft);
		UI.removeInput(arrowPokRight);
		UI.removeInput(arrowCharLeft);
		UI.removeInput(arrowCharRight);
	}
	
	static public function render(ctx:CanvasRenderingContext2D):Void {
		if (pendingLoad > 0) {
			ctx.fillStyle = '#000000';
			ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			ctx.fillStyle = '#FFFFFF';
			ctx.font = '12pt Courier New';
			ctx.fillText("Loading... "+pendingLoad, 10, 30);
			return;
		}
		ctx.save();
		ctx.drawImage(TitleScreen.titleLogo.obj, 117, 80);
		ctx.fillStyle = '#000000';
		ctx.font = '21px Font3';
		ctx.textAlign = 'center';
		ctx.fillText("Choose your character and starter Pokémon", 400, 250);
		ctx.drawImage(border128.obj, 200, 250);
		ctx.drawImage(border128.obj, 408, 250);
		ctx.drawImage(startersSpriteImage[curStarter].obj, 232, 282);
		//Math.floor(((Renderer.numRTicks) % 100)/25) * CPokemon.POKEMON_WIDTH
		ctx.drawImage(startersFollowerImage[curStarter].obj, Game.DIR_RIGHT * CPokemon.POKEMON_WIDTH, Math.floor(((Renderer.numRTicks) % 10)/5) * CPokemon.POKEMON_HEIGHT, CPokemon.POKEMON_WIDTH, CPokemon.POKEMON_HEIGHT, 449, 302, CPokemon.POKEMON_WIDTH, CPokemon.POKEMON_HEIGHT);
		ctx.drawImage(charsImage[curChar].obj, Game.DIR_RIGHT * CCharacter.CHAR_WIDTH, Math.floor(((Renderer.numRTicks + 3) % 20) / 5) * CCharacter.CHAR_HEIGHT, CCharacter.CHAR_WIDTH, CCharacter.CHAR_HEIGHT, 508, 302, CCharacter.CHAR_WIDTH, CCharacter.CHAR_HEIGHT);
		ctx.restore();
	}
}