package pokemmo;

import pokemmo.entities.CDoor;
import pokemmo.entities.CFollower;
import pokemmo.entities.CGrassAnimation;
import pokemmo.entities.CLedgeSmoke;
import pokemmo.entities.CStairs;
import pokemmo.entities.CWarp;
import pokemmo.entities.CWarpArrow;
import pokemmo.entities.CWildPokemon;
import pokemmo.Point;
import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class CCharacter extends GameObject {
	inline static public var CHAR_WIDTH:Int = 32;
	inline static public var CHAR_HEIGHT:Int = 64;
	inline static public var CHAR_MOVE_WAIT:Float = 0.3;
	
	public var username:String;
	public var inBattle:Bool;
	public var type:String;
	public var lastX:Int;
	public var lastY:Int;
	public var targetX:Int;
	public var targetY:Int;
	public var targetDirection:Int;
	public var animationStep:Float;
	public var loaded:Bool;
	public var follower:String;
	public var walking:Bool;
	public var walkingHasMoved:Bool;
	public var walkingPerc:Float;
	public var lastMoveTick:Int;
	public var canUpdate:Bool;
	public var onTarget:Void->Void;
	public var battleEnemy:String;
	public var image:ImageResource;
	public var freezeTicks:Int;
	public var jumping:Bool;
	
	private var followerObj:CFollower;
	private var transmitWalk:Bool;
	private var createdTick:Int;
	private var noclip:Bool;
	private var lockDirection:Int;
	private var wildPokemon:CWildPokemon;
	private var battleHasWalkedBack:Bool;
	private var battleX:Int;
	private var battleY:Int;
	private var battleLastX:Int;
	private var battleLastY:Int;
	private var battleFolX:Int;
	private var battleFolY:Int;
	
	public var renderOffsetX:Float;
	public var renderOffsetY:Float;
	public var renderAlpha:Float;
	
	public function new(data:CCharacterData) {
		super(data.x, data.y, data.direction);
		
		username = data.username;
		targetX = x;
		targetY = y;
		targetDirection = direction;
		animationStep = 0;
		loaded = false;
		walking = false;
		walkingPerc = 0.0;
		walkingHasMoved = false;
		inBattle = data.inBattle || false;
		randInt = Math.floor(Math.random() * 100);
		follower = data.follower;
		lastMoveTick = 0;
		canUpdate = true;
		onTarget = null;
		lastX = data.lastX;
		lastY = data.lastY;
		transmitWalk = true;
		createdTick = Renderer.numRTicks;
		noclip = false;
		lockDirection = -1;
		battleHasWalkedBack = false;
		renderOffsetX = renderOffsetY = 0;
		renderAlpha = 1.0;
		freezeTicks = 0;
		jumping = false;
		
		image = Game.curGame.getImage('resources/chars/'+data.type+'.png', function(){
			loaded = true;
		});
		
		Game.curGame.characters.push(this);
		
		followerObj = new CFollower(this);
	}
	
	override public function destroy():Void {
		super.destroy();
		
		Game.curGame.characters.remove(this);
		inBattle = false;
		followerObj.destroy();
		
		if (wildPokemon != null) wildPokemon.destroy();
	}
	
	public function isControllable():Bool {
		return username == Game.username && !Game.curGame.inBattle && Game.curGame.playerCanMove && !Chat.inChat && freezeTicks == 0;
	}
	
	public function getRenderPos():Point {
		if (!walking) return { x: Math.floor(x * Map.cur.tilewidth + renderOffsetX), y: Math.floor(y * Map.cur.tileheight - CHAR_HEIGHT / 2 + renderOffsetY)};
		
		var destX:Float = x * Map.cur.tilewidth;
		var destY:Float = y * Map.cur.tileheight - CHAR_HEIGHT/2;
		var perc = (walkingPerc - CHAR_MOVE_WAIT) * (1.0/(1.0-CHAR_MOVE_WAIT));
		if(walkingPerc >= CHAR_MOVE_WAIT){
			if(walkingHasMoved){
				switch(direction){
					case Game.DIR_LEFT: destX += (Map.cur.tilewidth) * (1-perc);
					case Game.DIR_RIGHT: destX -= (Map.cur.tilewidth) * (1-perc);
					case Game.DIR_UP: destY += (Map.cur.tileheight) * (1-perc);
					case Game.DIR_DOWN: destY -= (Map.cur.tileheight) * (1-perc);
				}
			}else{
				switch(direction){
					case Game.DIR_LEFT: destX -= (Map.cur.tilewidth) * perc;
					case Game.DIR_RIGHT: destX += (Map.cur.tilewidth) * perc;
					case Game.DIR_UP: destY -= (Map.cur.tileheight) * perc;
					case Game.DIR_DOWN: destY += (Map.cur.tileheight) * perc;
				}
			}
		}
		
		return {x:Math.floor(destX + renderOffsetX), y:Math.floor(destY + renderOffsetY)};
	}
	
	override public function tick():Void {
		super.tick();
		
		tickWalking();
		
		if(username == Game.username){
			tickWildBattle();
		}else{
			if(x == targetX && y == targetY && !walking){
				if(onTarget != null){
					onTarget();
					onTarget = null;
				}
			}
		}
		
		if(freezeTicks > 0) --freezeTicks;
	}
	
	private function tickWalking():Void {
		var curMap = Game.curGame.map;
		
		if(!walking){
			walkingHasMoved = false;
			walkingPerc = 0.0;
			
			
			if (username == Game.username) {
				if (isControllable()) {
					if (UI.isKeyDown(37)) { // Left
						walking = true;
						if(direction == Game.DIR_LEFT) walkingPerc = CHAR_MOVE_WAIT;
						direction = Game.DIR_LEFT;
					}else if(UI.isKeyDown(40)){ // Down
						walking = true;
						if(direction == Game.DIR_DOWN) walkingPerc = CHAR_MOVE_WAIT;
						direction = Game.DIR_DOWN;
					}else if(UI.isKeyDown(39)){ // Right
						walking = true;
						if(direction == Game.DIR_RIGHT) walkingPerc = CHAR_MOVE_WAIT;
						direction = Game.DIR_RIGHT;
					}else if(UI.isKeyDown(38)){ // Up
						walking = true;
						if(direction == Game.DIR_UP) walkingPerc = CHAR_MOVE_WAIT;
						direction = Game.DIR_UP;
					}
				}
			}else{
				tickBot();
			}
		}
		
		if(walking){
			if(isControllable()){
				switch(direction){
					case Game.DIR_LEFT:
						if(!UI.isKeyDown(37)){
							if(walkingPerc < CHAR_MOVE_WAIT){
								walking = false;
								Connection.socket.emit('turn', { dir:direction } );
								return;
							}
						}
					case Game.DIR_DOWN:
						if(!UI.isKeyDown(40)){
							if(walkingPerc < CHAR_MOVE_WAIT){
								walking = false;
								Connection.socket.emit('turn', {dir:direction});
								return;
							}
						}
					case Game.DIR_RIGHT:
						if(!UI.isKeyDown(39)){
							if(walkingPerc < CHAR_MOVE_WAIT){
								walking = false;
								Connection.socket.emit('turn', {dir:direction});
								return;
							}
						}
					case Game.DIR_UP:
						if(!UI.isKeyDown(38)){
							if(walkingPerc < CHAR_MOVE_WAIT){
								walking = false;
								Connection.socket.emit('turn', {dir:direction});
								return;
							}
						}
				}
			}
			walkingPerc += 0.10;
			animationStep += 0.20;
			if(animationStep > 4.0) animationStep -= 4.0;
			if(walkingPerc >= (1.0-CHAR_MOVE_WAIT)/2 && !walkingHasMoved){
				if(isControllable() && !noclip){
					var tmpPos = getFrontPosition();
					var tmpWarp = CWarp.getWarpAt(tmpPos.x, tmpPos.y);
					if(tmpWarp != null){
						if (Std.is(tmpWarp, CDoor)) {
							enterDoor(cast tmpWarp);
						}else if(Std.is(tmpWarp, CWarpArrow)){
							enterWarpArrow(cast tmpWarp);
						}else if (Std.is(tmpWarp, CStairs)) {
							enterStairs(cast tmpWarp);
						}
						return;
					}else {
						var frontPosition = getFrontPosition();
						if (Map.cur.isTileLedge(frontPosition.x, frontPosition.y) && Map.cur.getLedgeDir(frontPosition.x, frontPosition.y) == direction) {
							useLedge();
						}else if(willMoveIntoAWall()){
							Connection.socket.emit('turn', {dir:direction});
							walking = false;
							//TODO: Play block sound
							return;
						}
					}
				}else {
					var frontPosition = getFrontPosition();
					if (Map.cur.isTileLedge(frontPosition.x, frontPosition.y) && Map.cur.getLedgeDir(frontPosition.x, frontPosition.y) == direction) {
						useLedge();
					}
				}
				
				if(!Game.curGame.inBattle || username != Game.username){
					lastX = x;
					lastY = y;
				}
				
				switch(direction){
					case Game.DIR_LEFT: x -= 1;
					case Game.DIR_RIGHT: x += 1;
					case Game.DIR_UP: y -= 1;
					case Game.DIR_DOWN: y += 1;
				}
				
				lastMoveTick = Renderer.numRTicks;
				walkingHasMoved = true;
				
				if (curMap.isTileGrass(x, y)) {
					new CGrassAnimation(x, y);
				}
				
				if(username == Game.username && transmitWalk){
					Connection.socket.emit('walk', {ack: Connection.lastAckMove, x: x, y: y, dir:direction});
				}
			}
			
			if(walkingPerc >= 1.0){
				if(username == Game.username){
					if (isControllable() && !willMoveIntoAWall() && (
					(direction == Game.DIR_LEFT && UI.isKeyDown(37))
					|| (direction == Game.DIR_DOWN && UI.isKeyDown(40))
					|| (direction == Game.DIR_RIGHT && UI.isKeyDown(39))
					|| (direction == Game.DIR_UP && UI.isKeyDown(38)))){
						walkingHasMoved = false;
						walkingPerc = CHAR_MOVE_WAIT + 0.10;
					}else{
						walking = false;
						walkingHasMoved = false;
						walkingPerc = 0.0;
					}
				}else{
					walkingHasMoved = false;
					walkingPerc = CHAR_MOVE_WAIT + 0.10;
					walking = false;
					tickBot();
				}
			}
		}else{
			animationStep = 0;
		}
	}
	
	private function tickWildBattle():Void {
		var tmpX, tmpY;
		
		if (Game.curGame.inBattle) {
			var curMap = Game.curGame.map;
			
			
			if(wildPokemon == null && battleEnemy != null && !walking){
				if(battleHasWalkedBack){
					var tmpDir;
					tmpX = battleX;
					tmpY = battleY;
					if(walking && !walkingHasMoved){
						switch(direction){
							case Game.DIR_LEFT: tmpX -= 1;
							case Game.DIR_RIGHT: tmpX += 1;
							case Game.DIR_UP: tmpY -= 1;
							case Game.DIR_DOWN: tmpY += 1;
						}
					}
						
					wildPokemon = new CWildPokemon(battleEnemy, tmpX, tmpY, this);
					
					Renderer.curTransition.step = 7;
				}else{
					battleX = x;
					battleY = y;
					
					lockDirection = direction;
					direction = (direction + 2) % 4;
					walking = true;
					walkingHasMoved = false;
					walkingPerc = 0.0;
					
					battleHasWalkedBack = true;
					
					tmpX = battleX;
					tmpY = battleY;
					
					switch(direction){
						case Game.DIR_LEFT: tmpX -= 1;
						case Game.DIR_RIGHT: tmpX += 1;
						case Game.DIR_UP: tmpY -= 1;
						case Game.DIR_DOWN: tmpY += 1;
					}
					
					battleLastX = tmpX;
					battleLastY = tmpY;
					
					tmpX = battleX;
					tmpY = battleY;
					
					switch(direction){
						case Game.DIR_LEFT: tmpX -= 2;
						case Game.DIR_RIGHT: tmpX += 2;
						case Game.DIR_UP: tmpY -= 2;
						case Game.DIR_DOWN: tmpY += 2;
					}
					if (curMap.isTileSolid(tmpX, tmpY) || curMap.isTileWater(tmpX, tmpY) || curMap.isTileLedge(tmpX, tmpY)) {
						tmpX = battleX;
						tmpY = battleY;
						switch(direction){
							case Game.DIR_LEFT: tmpX -= 1;
							case Game.DIR_RIGHT: tmpX += 1;
							case Game.DIR_UP: tmpY -= 1;
							case Game.DIR_DOWN: tmpY += 1;
						}
					}
					
					battleFolX = tmpX;
					battleFolY = tmpY;
				}
			}
			
			if(battleHasWalkedBack){
				followerObj.forceTarget = true;
				lastX = battleFolX;
				lastY = battleFolY;
			}
			
		}else{
			followerObj.forceTarget = false;
			
			if(wildPokemon != null){
				wildPokemon.destroy();
				wildPokemon = null;
			}
			
			if(lockDirection != -1){
				direction = lockDirection;
				lockDirection = -1;
				lastX = battleLastX;
				lastY = battleLastY;
				
				tmpX = battleX;
				tmpY = battleY;
				switch(direction){
					case Game.DIR_LEFT: tmpX += 1;
					case Game.DIR_RIGHT: tmpX -= 1;
					case Game.DIR_UP: tmpY += 1;
					case Game.DIR_DOWN: tmpY -= 1;
				}
				followerObj.x = tmpX;
				followerObj.y = tmpY;
			}
			
			battleHasWalkedBack = false;
		}
	}
	
	public function enterDoor(door:CDoor){
		var tmpX = x;
		var tmpY = y;
		
		var canvas = Main.canvas;
		var ctx = Main.ctx;
		
		door.open();
		walking = false;
		
		if(username == Game.username){
			Game.curGame.playerCanMove = false;
			Game.curGame.queueLoadMap = true;
		}
		
		
		
		var tmpCount = 0;
		var doorRenderTransition:Void->Void = null;
		doorRenderTransition = function() {
			++tmpCount;
			
			if(tmpCount < 15) return;
			if(tmpCount == 15){
				walking = true;
				noclip = true;
				transmitWalk = false;
			}
			
			lastX = tmpX;
			lastY = tmpY;
			
			if(username == Game.username){
				if(tmpCount == 23){
					Game.curGame.drawPlayerChar = false;
				}
				
				var perc = Util.clamp((tmpCount - 20) / 10, 0, 1);
				ctx.fillStyle = 'rgba(0,0,0,'+perc+')';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				
				if(tmpCount == 30){
					noclip = false;
					transmitWalk = true;
					Game.curGame.queueLoadMap = false;
					if(Game.curGame.queuedMap != null){
						Game.loadMap(Game.curGame.queuedMap, Game.curGame.queuedChars);
					}
				}
			}else if(tmpCount == 23){
				destroy();
				Renderer.unHookRender(doorRenderTransition);
			}
		};
		
		if(username == Game.username) Connection.socket.emit('useWarp', {name:door.name, direction: direction});
		
		Renderer.hookRender(doorRenderTransition);
	}
	
	public function enterWarpArrow(warp:CWarpArrow){
		var tmpX = x;
		var tmpY = y;
		var ctx = Main.ctx;
		var canvas = Main.canvas;
		
		warp.disable = true;
		walking = false;
		
		if (username == Game.username) {
			Game.curGame.playerCanMove = false;
			Game.curGame.queueLoadMap = true;
		}
		
		var tmpCount = 0;
		var warpRenderTransition:Void->Void = null;
		warpRenderTransition = function():Void {
			++tmpCount;
			
			if(username == Game.username){
				var perc = Util.clamp(tmpCount / 10, 0, 1);
				ctx.fillStyle = 'rgba(0,0,0,'+perc+')';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				
				if(tmpCount == 10){
					Game.curGame.queueLoadMap = false;
					if(Game.curGame.queuedMap != null){
						Game.loadMap(Game.curGame.queuedMap, Game.curGame.queuedChars);
					}
				}
			}else{
				destroy();
				Renderer.unHookRender(warpRenderTransition);
			}
		};
		
		if(username == Game.username) Connection.socket.emit('useWarp', {name:warp.name, direction: direction});
		
		Renderer.hookRender(warpRenderTransition);
	}
	
	public function enterStairs(warp:CStairs) {
		if (direction != warp.fromDir) return;
		
		var tmpX = x;
		var tmpY = y;
		
		var canvas = Main.canvas;
		var ctx = Main.ctx;
		
		walking = true;
		
		if(username == Game.username){
			Game.curGame.playerCanMove = false;
			Game.curGame.queueLoadMap = true;
		}
		
		var tmpCount = 0;
		var warpRenderTransition:Void->Void = null;
		warpRenderTransition = function() {
			++tmpCount;
			
			walking = true;
			noclip = true;
			transmitWalk = false;
			if (walkingPerc <= CHAR_MOVE_WAIT) walkingPerc += CHAR_MOVE_WAIT;
			
			lastX = tmpX;
			lastY = tmpY;
			
			if (warp.direction == Game.DIR_DOWN) {
				renderOffsetY += 16/9;
			}else if (warp.direction == Game.DIR_UP) {
				renderOffsetY -= 16/9;
			}else {
				throw "Assertion error";
			}
			
			if(username == Game.username){
				var perc = Util.clamp((tmpCount) / 10, 0, 1);
				ctx.fillStyle = 'rgba(0,0,0,'+perc+')';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				
				if (tmpCount == 10) {
					Game.curGame.drawPlayerChar = false;
					noclip = false;
					transmitWalk = true;
					Game.curGame.queueLoadMap = false;
					if(Game.curGame.queuedMap != null){
						Game.loadMap(Game.curGame.queuedMap, Game.curGame.queuedChars);
					}
				}
			}else {
				renderAlpha = Util.clamp(1 - tmpCount / 10, 0, 1);
				if(tmpCount == 10){
					destroy();
					Renderer.unHookRender(warpRenderTransition);
				}
			}
		};
		
		if(username == Game.username) Connection.socket.emit('useWarp', {name:warp.name, direction: direction});
		
		Renderer.hookRender(warpRenderTransition);
	}
	
	public function useLedge():Void {
		var front = getFrontPosition();
		var dest = getFrontPosition(2);
		
		walking = true;
		noclip = true;
		transmitWalk = false;
		jumping = true;
		
		if(username == Game.username){
			Game.curGame.playerCanMove = false;
		}
		
		var tmpCount = 0;
		var renderFunc:Void->Void = null;
		renderFunc = function() {
			++tmpCount;
			
			if(x != dest.x || y != dest.y) walking = true;
			
			
			renderOffsetY = Math.min(Math.round((8/15 * (tmpCount * tmpCount)) + (-8 * tmpCount)), 0);
			
			if (tmpCount == 18) {
				new CLedgeSmoke(x, y);
			}
			
			if (tmpCount >= 20) {
				renderOffsetY = 0;
				walking = false;
				if(username == Game.username){
					Game.curGame.playerCanMove = true;
				}
				noclip = false;
				jumping = false;
				transmitWalk = true;
				freezeTicks = 2;
				x = dest.x;
				y = dest.y;
				lastX = x;
				lastY = y;
				
				Renderer.unHookRender(renderFunc);
			}
		};
		
		if (username == Game.username) Connection.socket.emit('useLedge', { ack:Connection.lastAckMove, x: front.x, y: front.y } );
		
		Renderer.hookRender(renderFunc);
	}
	
	public function willMoveIntoAWall():Bool{
		var pos = getFrontPosition();
		var map = Game.curGame.map;
		return map.isTileSolid(pos.x, pos.y) || map.isTileWater(pos.x, pos.y) || map.isTileLedge(pos.x, pos.y);
	}
	
	private function getFrontPosition(n:Int = 1):Point{
		switch(direction){
			case Game.DIR_LEFT: return {x: x - n, y: y};
			case Game.DIR_RIGHT: return {x: x + n, y: y};
			case Game.DIR_UP: return {x: x, y: y - n};
			case Game.DIR_DOWN: return {x: x, y: y + n};
		}
		return null;
	}
	
	private function tickBot():Void {
		if(walking) return;
		walking = x != targetX || y != targetY;
		if(!walking) return;
		
		var lastDirection = direction;
		
		if(Math.abs(x - targetX) > 0 && y == targetY){
			direction = x < targetX ? Game.DIR_RIGHT : Game.DIR_LEFT;
		}else if(Math.abs(y - targetY) > 0 && x == targetX){
			direction = y < targetY ? Game.DIR_DOWN : Game.DIR_UP;
		}else{
			direction = (targetY < y) ? Game.DIR_UP : Game.DIR_DOWN;
		}
		
		if(lastDirection != direction){
			walkingPerc = 0.0;
		}
	}
	
	override public function render(ctx:CanvasRenderingContext2D){
		if(!loaded) return;
		
		if (username == Game.username && !Game.curGame.drawPlayerChar) return;
		
		var tmpCtx = Main.tmpCtx;
		
		ctx.save();
		
		ctx.globalAlpha *= renderAlpha;
		if(Renderer.numRTicks - createdTick < 10){
			ctx.globalAlpha *= (Renderer.numRTicks - createdTick) / 10;
		}
		
		var offsetX = Renderer.getOffsetX();
		var offsetY = Renderer.getOffsetY();
		var map = Map.cur;
		
		
		var renderPos = getRenderPos();
		
		var dirId = direction * CHAR_WIDTH;
		if (lockDirection != -1) dirId = lockDirection * CHAR_WIDTH;
		
		
		if(username != Game.username && UI.isMouseInRect(renderPos.x + offsetX - 5, renderPos.y + offsetY - 5, renderPos.x + CHAR_WIDTH + offsetX + 10, renderPos.y + CHAR_HEIGHT + offsetY + 10)){
			Renderer.drawOverlay(ctx, renderPos.x + offsetX, renderPos.y + offsetY, CHAR_WIDTH, CHAR_HEIGHT, function(ctx):Void {
				ctx.drawImage(image.obj, dirId, Math.floor(animationStep) * CHAR_HEIGHT, CHAR_WIDTH, CHAR_HEIGHT, 0, 0, CHAR_WIDTH, CHAR_HEIGHT);
			});
			
			
			ctx.save();
			ctx.font = '12px Font2';
			ctx.textAlign = 'center';
			ctx.fillStyle = '#000000';
			ctx.fillText(username, renderPos.x + offsetX + CHAR_WIDTH/2 + 1, renderPos.y + offsetY + 17);
			ctx.fillStyle = '#FFFFFF';
			ctx.fillText(username, renderPos.x + offsetX + CHAR_WIDTH/2, renderPos.y + offsetY + 16);
			ctx.restore();
			
			if (Game.accountLevel >= 30) {
				UI.setCursor('pointer');
				if(UI.mouseDown && !UI.mouseWasDown){
					Connection.socket.emit('kickPlayer', { username: username } );
				}
			}
		}
		
		if (jumping) {
			ctx.drawImage(Game.getRes('miscSprites').obj, 0, 64, 32, 32, renderPos.x + offsetX, renderPos.y + offsetY - renderOffsetY + 30, 32, 32);
		}
		
		ctx.drawImage(image.obj, dirId, Math.floor(animationStep) * CHAR_HEIGHT, CHAR_WIDTH, CHAR_HEIGHT, renderPos.x + offsetX, renderPos.y + offsetY, CHAR_WIDTH, CHAR_HEIGHT);
		
		
		
		
		if (map.isTileGrass(x, y) && !walking) {
			ctx.drawImage(Game.getRes('miscSprites').obj, 0, 0, 32, 32, x * map.tilewidth + offsetX, y * map.tileheight + offsetY, 32, 32);
		}
		
		if(inBattle && username != Game.username){
			ctx.save();
			var ly = 0.0;
			
			ly = ((Renderer.numRTicks + randInt) % 31) / 30;
			ly *= 2;
			
			if(ly > 1) ly = 1 - (ly - 1);
			ly *= ly;
			ly *= 10;
			
			ctx.translate(renderPos.x + offsetX + 16, renderPos.y + offsetY + 2 + Math.round(ly));
			ctx.rotate(((Renderer.numRTicks + randInt) % 11) / 10 * Math.PI * 2);
			ctx.drawImage(Game.getRes('uiCharInBattle').obj, -10, -10);
			ctx.restore();
		}
		
		if(Renderer.numRTicks - createdTick < 10) ctx.restore();
	}
}

typedef CCharacterData = {
	var username:String;
	var inBattle:Bool;
	var type:String;
	var x:Int;
	var y:Int;
	var lastX:Int;
	var lastY:Int;
	var direction:Int;
	var follower:String;
	var battleEnemy:String;
}