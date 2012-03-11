package pokemmo;

import pokemmo.Pokemon;
import pokemmo.CCharacter;
import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

typedef BattleTurnResult = {
	var player:Int;
	var type:String;
	var value:Dynamic;
}; 

class Battle {
	inline static public var BATTLE_WILD = 0;
	inline static public var BATTLE_TRAINER = 1;
	inline static public var BATTLE_VERSUS = 2;
	
	inline static public var PLAYER_SELF = 0;
	inline static public var PLAYER_ENEMY = 1;
	
	public var step:BATTLE_STEP;
	public var type:Int;
	public var x:Int;
	public var y:Int;
	public var curPokemon:PokemonOwned;
	public var enemyPokemon:Pokemon;
	public var background:ImageResource;
	
	public var now:Float;
	
	private var selectedAction:Int;
	private var selectedMove:Int;
	
	private var text:String;
	private var textTime:Float;
	private var textCompleted:Bool;
	private var textCompletedTime:Float;
	private var textDelay:Float;
	private var textOnComplete:Void->Void;
	private var animStep:Int;
	
	public var canRenderEnemy:Bool;
	public var canRenderPlayerPokemon:Bool;
	public var enemyFainted:Bool;
	public var enemyFaintedTick:Int;
	public var pokemonFainted:Bool;
	public var pokemonFaintedTick:Int;
	public var shakeEnemyStatus:Bool;
	public var shakePokemonStatus:Bool;
	
	public var resultQueue:Array<BattleTurnResult>;
	public var curAction:BattleTurnResult;
	public var moveStartTime:Float;
	public var curMove:Move;
	
	private var randInt:Int;
	private var finishX:Int;
	private var finishY:Int;
	private var finishMap:String;
	private var finishMapChars:Array<CCharacterData>;
	
	
	
	public var runningQueue:Bool;
	
	public function new(type:Int) {
		this.type = type;
		
		randInt = Math.floor(Math.random() * 100000);
		step = BATTLE_STEP_TRANSITION;
		text = '';
		selectedAction = 0;
		canRenderEnemy = true;
		canRenderPlayerPokemon = true;
		enemyFainted = false;
		pokemonFainted = false;
		runningQueue = false;
		shakeEnemyStatus = false;
		shakePokemonStatus = false;
		resultQueue = [];
		
		UI.hookDirButtons(buttonHandler);
	}
	
	public function render(ctx:CanvasRenderingContext2D):Void {
		now = Date.now().getTime();
		
		ctx.save();
		ctx.translate(Main.isPhone ? 0 : 160, Main.isPhone ? 0 : 140);
		
		if (step == BATTLE_STEP_TURN && curMove != null) {
			curMove.render(ctx, this);
		}
		
		ctx.lineWidth = 2;
		ctx.strokeStyle = 'rgb(0,0,0)';
		ctx.strokeRect(-1, -1, 482, 226);
		if (background.obj.width != 0) {
			ctx.drawImage(background.obj, 0, 0);
		}
		
		if (step != BATTLE_STEP_FIGHT_MENU) drawBottomPanel(ctx);
		
		if (step == BATTLE_STEP_FIGHT_MENU) drawFightMenu(ctx);
		
		if (canRenderEnemy) renderEnemy(ctx);
		
		if (step == BATTLE_STEP_TRANSITION || step == BATTLE_STEP_POKEMON_APPEARED_TMP || step == BATTLE_STEP_POKEMON_APPEARED) {
			ctx.drawImage(Game.getRes('playerBacksprite').obj, 0, 0, 128, 128, 60, 96, 128, 128);
		}else if (step == BATTLE_STEP_GO_POKEMON) {
			drawGoPokemonAnimation(ctx);
		}else{
			if(canRenderPlayerPokemon) drawPlayerPokemon(ctx);
		}
		
		drawEnemyStatus(ctx);
		
		if (step != BATTLE_STEP_TRANSITION
		&& step != BATTLE_STEP_POKEMON_APPEARED_TMP
		&& step != BATTLE_STEP_POKEMON_APPEARED
		&& step != BATTLE_STEP_GO_POKEMON) {
			drawPokemonStatus(ctx);
		}
		
		if (step == BATTLE_STEP_POKEMON_APPEARED_TMP) {
			step = BATTLE_STEP_POKEMON_APPEARED;
			setBattleText('Wild ' + Util.getPokemonDisplayName(enemyPokemon) +' appeared!', -1, function():Void{
				var pk = curPokemon;
				setBattleText("Go! " + Util.getPokemonDisplayName(curPokemon) + "!");
				step = BATTLE_STEP_GO_POKEMON;
				animStep = 0;
				selectedMove = 0;
			});
		}
		
		
		
		ctx.restore();
	}
	
	private function drawBottomPanel(ctx:CanvasRenderingContext2D):Void {
		ctx.drawImage(Game.getRes('battleTextBackground').obj, 2, 228);
		
		if(text != ''){
			var str = text.substr(0, Math.floor((now - textTime) / 30));
			
			
			ctx.font = '24px Font2';
			
			
			var maxWidth = (step == BATTLE_STEP_ACTION_MENU ? 150 : 420);
			if(ctx.measureText(str).width > maxWidth){
				var firstLine = str;
				var secondLine = '';
				do{
					var arr = firstLine.split(' ');
					secondLine = arr.pop() + ' ' + secondLine;
					firstLine = arr.join(' ');
				} while(ctx.measureText(firstLine).width > maxWidth);
				
				ctx.fillStyle = 'rgb(104,88,112)';
				ctx.fillText(firstLine, 26, 266);
				ctx.fillText(secondLine, 26, 294);
				ctx.fillText(firstLine, 24, 268);
				ctx.fillText(secondLine, 24, 296);
				ctx.fillText(firstLine, 26, 268);
				ctx.fillText(secondLine, 26, 296);
				
				ctx.fillStyle = 'rgb(255,255,255)';
				ctx.fillText(firstLine, 24, 266);
				ctx.fillText(secondLine, 24, 294);
				
			}else{
				ctx.fillStyle = 'rgb(104,88,112)';
				ctx.fillText(str, 24, 268);
				ctx.fillText(str, 26, 266);
				ctx.fillText(str, 26, 268);
				
				ctx.fillStyle = 'rgb(255,255,255)';
				ctx.fillText(str, 24, 266);
			}
			
			if(str == text){
				if(!textCompleted){
					textCompleted = true;
					textCompletedTime = now;
					
					if(textDelay == 0){
						if(textOnComplete != null) textOnComplete();
					}else if(textDelay != -1){
						if (textOnComplete != null) Main.setTimeout(function() { textOnComplete(); }, textDelay);
					}else {
						UI.hookAButton(textOnComplete);
					}
					
				}else if(textDelay == -1 && now - textCompletedTime > 100){
					var tmp = Math.floor((now % 1000) / 250);
					if(tmp == 3) tmp = 1;
					tmp *= 2;
					ctx.drawImage(Game.getRes('battleMisc').obj, 0, 0, 32, 32, 24 + ctx.measureText(str).width, 240 + tmp, 32, 32);
				}
			}
		}
		
		if(step == BATTLE_STEP_ACTION_MENU){
			ctx.drawImage(Game.getRes('battleActionMenu').obj, 246, 226);
			
			var x1 = 252 + Math.floor((now % 1000) / 500) * 2;
			var y1 = 246;
			var x2 = x1 + 112;
			var y2 = y1 + 30;
			
			switch(selectedAction){
				case 0: ctx.drawImage(Game.getRes('battleMisc').obj, 96, 0, 32, 32, x1, y1, 32, 32);
				case 1: ctx.drawImage(Game.getRes('battleMisc').obj, 96, 0, 32, 32, x2, y1, 32, 32);
				case 2: ctx.drawImage(Game.getRes('battleMisc').obj, 96, 0, 32, 32, x1, y2, 32, 32);
				case 3: ctx.drawImage(Game.getRes('battleMisc').obj, 96, 0, 32, 32, x2, y2, 32, 32);
			}
			
		}
		
		
	}
	
	private function drawFightMenu(ctx:CanvasRenderingContext2D):Void {
		ctx.drawImage(Game.getRes('battleMoveMenu').obj, 2, 228);
		
		var x1 = 40;
		var y1 = 268;
		
		var n = curPokemon.moves[0].toUpperCase();
		ctx.font = '24px Font2';
		ctx.fillStyle = 'rgb(208,208,208)';
		ctx.fillText(n, x1, y1 + 2);
		ctx.fillText(n, x1 + 2, y1);
		
		ctx.fillStyle = 'rgb(72,72,72)';
		ctx.fillText(n, x1, y1);
		
		ctx.drawImage(Game.getRes('battleMisc').obj, 96, 0, 32, 32, x1 - 28 + Math.floor((now % 1000) / 500) * 2, y1 - 22, 32, 32);
		
		
		ctx.drawImage(Game.getRes('types').obj, 0, 24 * PokemonConst.TYPE_NORMAL, 64, 24, 390, 284, 64, 24);
	}
	
	private function renderEnemy(ctx:CanvasRenderingContext2D):Void {
		if (enemyFainted) {
			if(Renderer.numRTicks - enemyFaintedTick <= 5){
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(290, 30);
				ctx.lineTo(418, 30);
				ctx.lineTo(418, 158);
				ctx.lineTo(290, 158);
				ctx.lineTo(290, 30);
				ctx.clip();
				ctx.drawImage(enemyPokemon.sprite.obj, 290, 30 + (Renderer.numRTicks - enemyFaintedTick) * 30);
				ctx.restore();
			}
		}else {
			ctx.drawImage(enemyPokemon.sprite.obj, 290, 30);
		}
	}
	
	private function drawGoPokemonAnimation(ctx:CanvasRenderingContext2D):Void {
		if(animStep >= 4 && animStep < 25){
			var ballAnimation = [
				[60, 179, 1, 0],
				[62, 175, 1, 0],
				
				[70, 168, 1, 0],
				[75, 165, 1, 0],
				
				[83, 160, 1, 0],
				[86, 160, 1, 0],
				
				[95, 161, 1, 0],
				[97, 164, 1, 0],
				
				[105, 170, 1, 0],
				
				[110, 175, 1, 0],
				[111, 178, 1, 0],
				[113, 183, 1, 0],
				[114, 185, 1, 0],
				[115, 190, 1, 0],
				[117, 192, 1, 0],
				[120, 195, 1, 0, 0.95],
				[123, 200, 1, 1, 0.9],
				[124, 205, 1.05, 1, 0.8],
				[125, 200, 1.1, 1, 0.6],
				[126, 192, 1.15, 1, 0.3],
				[127, 192, 1.2, 1, 0.1]
			];
			
			ctx.save();
			ctx.globalAlpha = ballAnimation[animStep-4][4];
			ctx.translate(ballAnimation[animStep-4][0], ballAnimation[animStep-4][1]);
			ctx.scale(ballAnimation[animStep-4][2], ballAnimation[animStep-4][2]);
			ctx.rotate(animStep / 17 * Math.PI * 2);
			
			ctx.drawImage(Game.getRes('battlePokeballs').obj, 64, 32 * ballAnimation[animStep-4][3], 32, 32, -16, -16, 32, 32);
			ctx.restore();
		}
		
		if(Math.floor(animStep / 4) < 5){
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(0, 0);
			ctx.lineTo(480, 0);
			ctx.lineTo(480, 320);
			ctx.lineTo(0, 320);
			ctx.lineTo(0, 0);
			ctx.clip();
			
			ctx.globalAlpha = Util.clamp(1 - (animStep / 20), 0, 1);
			
			ctx.drawImage(Game.getRes('playerBacksprite').obj, 128 * Math.floor(animStep / 4), 0, 128, 128, 60 - animStep * 5, 96, 128, 128);
			ctx.restore();
		}
		
		if(animStep > 21 && animStep < 35){
			var perc = Math.min((animStep - 21) / 10, 1);
			
			Main.clearTmpCanvas();
			var tmpCtx = Main.tmpCtx;
			tmpCtx.save();
			tmpCtx.fillStyle = '#FFFFFF';
			tmpCtx.fillRect(0, 0, Main.tmpCanvas.width, Main.tmpCanvas.height);
			tmpCtx.globalCompositeOperation = "destination-atop";
			tmpCtx.translate(124, 192);
			tmpCtx.scale(perc, perc);
			tmpCtx.drawImage(curPokemon.backsprite.obj, -64, -96);
			tmpCtx.restore();
			
			
			ctx.save();
			ctx.translate(124, 192);
			ctx.scale(perc, perc);
			ctx.drawImage(curPokemon.backsprite.obj, -64, -96);
			
			
			ctx.restore();
			
			ctx.globalAlpha = Util.clamp(1 - Math.max(0, perc * perc - 0.5) * 2, 0, 1);
			ctx.drawImage(Main.tmpCanvas, 0, 0);
			ctx.globalAlpha = 1;
		}else if(animStep >= 35){
			selectedAction = 0;
			openActionMenu();
		}
		
		
		++animStep;
	}
	
	private function drawPlayerPokemon(ctx:CanvasRenderingContext2D):Void {
		
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(60, 96);
		ctx.lineTo(188, 96);
		ctx.lineTo(188, 224);
		ctx.lineTo(60, 224);
		ctx.lineTo(60, 96);
		ctx.clip();
		if(pokemonFainted){
			if(Renderer.numRTicks - pokemonFaintedTick <= 5){
				ctx.drawImage(curPokemon.backsprite.obj, 60, 96 + (Renderer.numRTicks - pokemonFaintedTick) * 30);
			}
		}else{
			ctx.drawImage(curPokemon.backsprite.obj, 60, 96 + ((step == BATTLE_STEP_ACTION_MENU || step == BATTLE_STEP_FIGHT_MENU) && ((now + randInt) % 600) < 300 ? 2 : 0));
			
		}
		
		ctx.restore();
	}
	
	private function drawEnemyStatus(ctx:CanvasRenderingContext2D) {
		ctx.save();
		if(shakeEnemyStatus && Renderer.numRTicks % 2 == 0) ctx.translate(0, 2);
		ctx.drawImage(Game.getRes('battleEnemyBar').obj, 26, 32);
		ctx.drawImage(Game.getRes('battleHealthBar').obj, 0, 0, 1, 6, 104, 66, 96, 6);
		
		var hpPerc = enemyPokemon.hp / enemyPokemon.maxHp;
		if(hpPerc > 0.50){
			ctx.drawImage(Game.getRes('battleHealthBar').obj, 0, 6, 1, 6, 104, 66, Math.floor(48 * hpPerc) * 2, 6);
		}else if(hpPerc >= 0.20){
			ctx.drawImage(Game.getRes('battleHealthBar').obj, 0, 12, 1, 6, 104, 66, Math.floor(48 * hpPerc) * 2, 6);
		}else{
			ctx.drawImage(Game.getRes('battleHealthBar').obj, 0, 18, 1, 6, 104, 66, Math.ceil(48 * hpPerc) * 2, 6);
		}
		
		var pokemonName = Util.getPokemonDisplayName(enemyPokemon);
		var pokemonLevel = 'Lv' + enemyPokemon.level;
		var lvlX = 168 - (enemyPokemon.level < 10 ? 0 : (enemyPokemon.level < 100) ? 8 : 16);
		
		ctx.font = '21px Font2';
		Renderer.drawShadowText2(ctx, pokemonName, 40, 56, 'rgb(64,64,64)', 'rgb(216,208,176)');
		Renderer.drawShadowText2(ctx, pokemonLevel, lvlX, 56, 'rgb(64,64,64)', 'rgb(216,208,176)');
		
		
		var tmpX = ctx.measureText(pokemonName).width + 40;
		if(enemyPokemon.gender == 1){
			ctx.drawImage(Game.getRes('battleMisc').obj, 64, 0, 10, 16, tmpX, 42, 10, 16);
		}else if(enemyPokemon.gender == 2){
			ctx.drawImage(Game.getRes('battleMisc').obj, 74, 0, 10, 16, tmpX, 42, 10, 16);
		}
		ctx.restore();
	}
	
	private function drawPokemonStatus(ctx:CanvasRenderingContext2D) {
		ctx.save();
		var tmp = 0;
		if(step == BATTLE_STEP_ACTION_MENU || step == BATTLE_STEP_FIGHT_MENU){
			ctx.translate(0, (now % 600) < 300 ? 0 : 2);
		}
		
		if(shakePokemonStatus && Renderer.numRTicks % 2 == 0) ctx.translate(0, 2);
		
		ctx.drawImage(Game.getRes('battlePokemonBar').obj, 252, 148);
		
		ctx.drawImage(Game.getRes('battleHealthBar').obj, 0, 0, 1, 6, 348, 182, 96, 6);
		
		
		var hpPerc = curPokemon.hp / curPokemon.maxHp;
		if(hpPerc > 0.50){
			ctx.drawImage(Game.getRes('battleHealthBar').obj, 0, 6, 1, 6, 348, 182, Math.floor(48 * hpPerc) * 2, 6);
		}else if(hpPerc >= 0.20){
			ctx.drawImage(Game.getRes('battleHealthBar').obj, 0, 12, 1, 6, 348, 182, Math.floor(48 * hpPerc) * 2, 6);
		}else{
			ctx.drawImage(Game.getRes('battleHealthBar').obj, 0, 18, 1, 6, 348, 182, Math.ceil(48 * hpPerc) * 2, 6);
		}
		
		ctx.fillStyle = 'rgb(64,200,248)';
		ctx.fillRect(316, 214, Math.floor(curPokemon.experience / curPokemon.experienceNeeded * 64) * 2, 4);
		
		
		var pokemonName = Util.getPokemonDisplayName(curPokemon);
		var pokemonLevel = 'Lv'+curPokemon.level;
		var lvlX = 412 - (curPokemon.level < 10 ? 0 : (curPokemon.level < 100) ? 8 : 16);
		var maxHpX = 422 - (curPokemon.maxHp >= 100 ? 8 : 0);
		
		ctx.font = '21px Font2';
		Renderer.drawShadowText2(ctx, pokemonName, 284, 172, 'rgb(64,64,64)', 'rgb(216,208,176)');
		Renderer.drawShadowText2(ctx, pokemonLevel, lvlX, 172, 'rgb(64,64,64)', 'rgb(216,208,176)');
		Renderer.drawShadowText2(ctx, Std.string(curPokemon.maxHp), maxHpX, 208, 'rgb(64,64,64)', 'rgb(216,208,176)');
		Renderer.drawShadowText2(ctx, Std.string(curPokemon.hp), 382, 208, 'rgb(64,64,64)', 'rgb(216,208,176)');
		
		var tmpX = ctx.measureText(pokemonName).width + 284;
		if(curPokemon.gender == 1){
			ctx.drawImage(Game.getRes('battleMisc').obj, 64, 0, 10, 16, tmpX, 158, 10, 16);
		}else if(curPokemon.gender == 2){
			ctx.drawImage(Game.getRes('battleMisc').obj, 74, 0, 10, 16, tmpX, 158, 10, 16);
		}
		
		ctx.restore();
	}
	
	public function openActionMenu():Void {
		runningQueue = false;
		step = BATTLE_STEP_ACTION_MENU;
		
		setBattleText('What will '+Util.getPokemonDisplayName(curPokemon)+' do?');
		
		UI.hookAButton(function(){
			
			// Ignore actions other than attack for now
			if(selectedAction != 0){
				openActionMenu();
				return;
			}
			
			switch(selectedAction){
			case 0: openFightMenu();
			}
		});
	}
	
	public function openFightMenu():Void {
		step = BATTLE_STEP_FIGHT_MENU;
		
		var aAction, bAction = null;
		
		aAction = function() {
			UI.unHookBButton(bAction);
			setBattleText(null);
			step = BATTLE_STEP_TURN;
			Connection.socket.emit('battleMove', {move: selectedMove});
		};
		
		bAction = function(){
			UI.unHookAButton(aAction);
			openActionMenu();
			textTime = 0;
		};
		
		UI.hookAButton(aAction);
		UI.hookBButton(bAction);
	}
	
	public function setBattleText(str:String, delay:Float = null, onComplete:Void->Void = null):Void {
		text = str == null ? '' : str;
		textTime = now;
		if (delay == null) {
			delay = Math.NaN;
		}
		textDelay = delay;
		textOnComplete = onComplete;
		textCompleted = false;
	}
	
	public function runQueue(force:Bool = false):Void {
		if(!force && runningQueue) return;
		runningQueue = true;
		if(resultQueue.length == 0){
			openActionMenu();
			return;
		}
		
		var action = resultQueue.shift();
		curAction = action;
		
		
		var actionPlayerPokemon:Pokemon = action.player == PLAYER_SELF ? curPokemon : enemyPokemon;
		
		switch(action.type){
		case "moveAttack":
			setBattleText(Util.getPokemonDisplayName(actionPlayerPokemon)+" used "+action.value.move.toUpperCase()+"!");
			Main.setTimeout(function():Void{
				moveStartTime = Date.now().getTime();
				playMove(action.value.move);
			}, 1000);
		case "moveMiss":
			setBattleText(Util.getPokemonDisplayName(actionPlayerPokemon)+" used "+action.value.toUpperCase()+"!");
			Main.setTimeout(function():Void{
				setBattleText('But it missed!');
				Main.setTimeout(function() { runQueue(true); }, 1000);
			}, 1000);
		case "pokemonDefeated":
			var attacker:Pokemon;
			var defeated:Pokemon;
			if(action.player == 0){
				attacker = curPokemon;
				defeated = enemyPokemon;
				enemyFainted = true;
				enemyFaintedTick = Renderer.numRTicks;
			}else{
				attacker = enemyPokemon;
				defeated = curPokemon;
				pokemonFainted = true;
				pokemonFaintedTick = Renderer.numRTicks;
			}
			
			
			
			setBattleText((type == BATTLE_WILD && action.player == 0 ? 'Wild ':'')+Util.getPokemonDisplayName(defeated)+' fainted!', -1, function(){
				if(action.player == 0){
					setBattleText(Util.getPokemonDisplayName(attacker) + ' gained '+action.value+' EXP. Points!', -1, function(){
						animateExp();
					});
				}else{
					runQueue(true);
				}
			});
			
		case "win":
			Game.setPokemonParty(action.value.pokemon);
			
			finishX = action.value.x;
			finishY = action.value.y;
			finishMap = action.value.map;
			finishMapChars = action.value.mapChars;
			
			if(type == BATTLE_WILD && action.player == PLAYER_SELF){
				finish();
				return;
			}
			
			
			finish();
			
		case "switchFainted":
			if(action.player != 0){
				setBattleText('The opponent is selecting another pokemon');
				runningQueue = false;
				return;
			}
			
			//TODO
		case "fleeFail":
			null;
		case "pokemonLevelup": runQueue(true);
		}
	}
	
	private function animateHp():Void {
		var action = curAction;
		var renderFunc = null;
		renderFunc = function() {
			var result = action.value.resultHp;
			var pok:Pokemon;
			if(action.player == 1){
				pok = curPokemon;
			}else{
				pok = enemyPokemon;
			}
			
			var step = Math.ceil(pok.maxHp / 50);
			if(pok.hp > result){
				pok.hp -= step;
				if(pok.hp < result){
					pok.hp = result;
				}
			}else if(pok.hp < result){
				pok.hp += step;
				if(pok.hp > result){
					pok.hp = result;
				}
			}
			
			if(pok.hp == result){
				Renderer.unHookRender(renderFunc);
				Main.setTimeout(function() { runQueue(true); }, 100);
			}
		};
		
		Renderer.hookRender(renderFunc);
	}
	
	private function animateExp():Void {
		var action = curAction;
		if(action.player != PLAYER_SELF || curPokemon.level >= 100){
			runQueue(true);
			return;
		}
		
		textDelay = 1/0;
		var expGained = action.value;
		var step = Math.ceil(expGained / 100);
		
		var renderFunc:Void->Void = null;
		renderFunc = function() {
			var pok = curPokemon;
			
			if(step > expGained) step = expGained;
			pok.experience += step;
			expGained -= step;
			
			if(pok.experience >= pok.experienceNeeded){
				expGained += pok.experience - pok.experienceNeeded;
				
				var info = resultQueue.shift();
				if(info.type != 'pokemonLevelup') throw 'Assertion failed';
				
				var backsprite = curPokemon.backsprite;
				curPokemon = info.value;
				curPokemon.backsprite = backsprite;
				pok = curPokemon;
				
				
				pok.experience = 0;
			}
			
			
			if(expGained <= 0){
				Renderer.unHookRender(renderFunc);
				Main.setTimeout(function():Void { runQueue(true); }, 100);
			}
		};
		
		Renderer.hookRender(renderFunc);
	}
	
	public function playMove(n:String):Void {
		var m:Move = Move.getMove(n);
		curMove = m;
		m.start();
	}
	
	public function moveFinished():Void {
		curMove = null;
		
		shakeEnemyStatus = false;
		shakePokemonStatus = false;
		
		var action = curAction;
		if (action.type == 'moveAttack') {
			if(action.value.effec == 0){
				setBattleText("It's not effective...", 0, animateHp);
			}else if(action.value.effec < 1){
				setBattleText("It's not very effective...", 0, animateHp);
			}else if(action.value.effec > 1){
				setBattleText("It's very effective!", 0, animateHp);
			}else{
				animateHp();
			}
		}else{
			runQueue(true);
		}
	}
	
	private function buttonHandler(dir:Int):Void {
		if(step == BATTLE_STEP_ACTION_MENU){
			switch(selectedAction){
			case 0:
				if(dir == Game.DIR_RIGHT){
					selectedAction = 1;
				}else if(dir == Game.DIR_DOWN){
					selectedAction = 2;
				}
			case 1:
				if(dir == Game.DIR_LEFT){
					selectedAction = 0;
				}else if(dir == Game.DIR_DOWN){
					selectedAction = 3;
				}
			case 2:
				if(dir == Game.DIR_UP){
					selectedAction = 0;
				}else if(dir == Game.DIR_RIGHT){
					selectedAction = 3;
				}
			case 3:
				if(dir == Game.DIR_UP){
					selectedAction = 1;
				}else if(dir == Game.DIR_LEFT){
					selectedAction = 2;
				}
			}
		}
	}
	
	public function finish():Void {
		UI.unHookDirButtons(buttonHandler);
		
		var step = 0;
		var func = null;
		
		var ctx = Main.ctx;
		var canvas = Main.canvas;
		func = function() {
			
			ctx.fillStyle = '#000000';
			if(step < 15){
				ctx.globalAlpha = step / 15;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.globalAlpha = 1;
			}else if(step < 20){
				ctx.globalAlpha = 1;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				if(step == 15){
					if(finishMap == Map.cur.id){
						var chr = Game.curGame.getPlayerChar();
						if(chr != null){
							chr.x = finishX;
							chr.y = finishY;
						}
					}else{
						Renderer.unHookRender(func);
						Game.loadMap(finishMap, finishMapChars);
					}
					
					Game.curGame.inBattle = false;
					Game.curGame.battle = null;
					Game.curGame.drawPlayerChar = true;
					Game.curGame.drawPlayerFollower = true;
					
					var chr = Game.curGame.getPlayerChar();
					if(chr != null){
						chr.inBattle = false;
					}
				}
				
			}else{
				ctx.globalAlpha = 1 - (step - 20) / 8;
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.globalAlpha = 1;
				if(step >= 28){
					Renderer.unHookRender(func);
				}
			}
			++step;
		}
		
		Renderer.hookRender(func);
	}
}

enum BATTLE_STEP {
	BATTLE_STEP_TRANSITION;
	BATTLE_STEP_POKEMON_APPEARED_TMP;
	BATTLE_STEP_POKEMON_APPEARED;
	BATTLE_STEP_GO_POKEMON;
	BATTLE_STEP_ACTION_MENU;
	BATTLE_STEP_FIGHT_MENU;
	BATTLE_STEP_TURN;
}