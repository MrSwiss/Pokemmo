$estr = function() { return js.Boot.__string_rec(this,''); }
if(typeof pokemmo=='undefined') pokemmo = {}
pokemmo.GameObject = function(x_,y_,direction_) {
	if( x_ === $_ ) return;
	if(direction_ == null) direction_ = 0;
	this.x = x_;
	this.y = y_;
	this.direction = direction_;
	this.renderPriority = 0;
	this.randInt = Math.floor(Math.random() * 100000);
	this.isTemporary = false;
	pokemmo.Game.curGame.gameObjects.push(this);
}
pokemmo.GameObject.__name__ = ["pokemmo","GameObject"];
pokemmo.GameObject.prototype.x = null;
pokemmo.GameObject.prototype.y = null;
pokemmo.GameObject.prototype.direction = null;
pokemmo.GameObject.prototype.randInt = null;
pokemmo.GameObject.prototype.renderPriority = null;
pokemmo.GameObject.prototype.isTemporary = null;
pokemmo.GameObject.prototype.destroy = function() {
	pokemmo.Game.curGame.gameObjects.remove(this);
}
pokemmo.GameObject.prototype.tick = function() {
}
pokemmo.GameObject.prototype.render = function(ctx) {
}
pokemmo.GameObject.prototype.__class__ = pokemmo.GameObject;
if(!pokemmo.entities) pokemmo.entities = {}
pokemmo.entities.CLedgeSmoke = function(x,y) {
	if( x === $_ ) return;
	pokemmo.GameObject.call(this,x,y);
	this.step = 0;
	this.renderPriority = -100;
}
pokemmo.entities.CLedgeSmoke.__name__ = ["pokemmo","entities","CLedgeSmoke"];
pokemmo.entities.CLedgeSmoke.__super__ = pokemmo.GameObject;
for(var k in pokemmo.GameObject.prototype ) pokemmo.entities.CLedgeSmoke.prototype[k] = pokemmo.GameObject.prototype[k];
pokemmo.entities.CLedgeSmoke.prototype.step = null;
pokemmo.entities.CLedgeSmoke.prototype.render = function(ctx) {
	var map = pokemmo.Map.getCurMap();
	ctx.drawImage(pokemmo.Game.res["miscSprites"].obj,96,Math.floor(this.step / 3) * 32,32,32,this.x * map.tilewidth + pokemmo.Renderer.getOffsetX(),this.y * map.tileheight + pokemmo.Renderer.getOffsetY(),32,32);
	++this.step;
	if(this.step >= 9) this.destroy();
}
pokemmo.entities.CLedgeSmoke.prototype.__class__ = pokemmo.entities.CLedgeSmoke;
pokemmo.Chat = function() { }
pokemmo.Chat.__name__ = ["pokemmo","Chat"];
pokemmo.Chat.chatBox = null;
pokemmo.Chat.setup = function() {
	pokemmo.Chat.chatBox = document.createElement("input");
	pokemmo.Chat.chatBox.type = "text";
	pokemmo.Chat.chatBox.style.opacity = "0";
	pokemmo.Chat.chatBox.style.position = "fixed";
	pokemmo.Chat.chatBox.maxLength = 128;
	pokemmo.Chat.chatLog = [];
	pokemmo.Chat.chatBox.onblur = function(e) {
		pokemmo.Chat.inChat = false;
		var now = Date.now().getTime();
		var _g1 = Math.max(pokemmo.Chat.chatLog.length - 12,0), _g = pokemmo.Chat.chatLog.length;
		while(_g1 < _g) {
			var i = _g1++;
			pokemmo.Chat.chatLog[i].timestamp2 = Math.max(now - 6000,pokemmo.Chat.chatLog[i].timestamp2);
		}
	};
	pokemmo.Chat.chatBox.onkeydown = function(e) {
		e = window.event || e;
		if(e.keyCode == 13) pokemmo.Chat.sendMessage();
	};
	document.body.appendChild(pokemmo.Chat.chatBox);
}
pokemmo.Chat.resetChat = function() {
	pokemmo.Chat.chatBox.value = "";
	pokemmo.Chat.inChat = false;
	pokemmo.Chat.justSentMessage = true;
	pokemmo.Main.jq(pokemmo.Chat.chatBox).blur();
}
pokemmo.Chat.pushMessage = function(msg) {
	var chr = pokemmo.Game.curGame.getPlayerChar();
	msg.timestamp2 = msg.timestamp;
	if(chr != null) {
		if((msg.x - chr.x) * (msg.x - chr.x) + (msg.y - chr.y) * (msg.x - chr.y) > 2025) return;
	}
	if(pokemmo.Chat.chatLog.length > 64) pokemmo.Chat.chatLog.shift();
	msg.bubbleLines = [];
	var ctx = pokemmo.Main.ctx;
	ctx.font = "12px Font2";
	var width = Math.round(ctx.measureText(msg.str).width + 10);
	msg.bubbleLines = pokemmo.Util.reduceTextSize(msg.str,140,ctx);
	if(msg.bubbleLines.length > 1) {
		width = 0;
		var _g = 0, _g1 = msg.bubbleLines;
		while(_g < _g1.length) {
			var line = _g1[_g];
			++_g;
			width = Math.ceil(Math.max(width,ctx.measureText(line).width));
		}
		width += 10;
	}
	var height = msg.bubbleLines.length * 14 + 2;
	msg.bubbleWidth = width;
	msg.bubbleHeight = height;
	pokemmo.Chat.chatLog.push(msg);
}
pokemmo.Chat.sendMessage = function() {
	var str = pokemmo.Chat.chatBox.value;
	if(str.indexOf("/kick ") == 0 && pokemmo.Game.accountLevel >= 30) {
		pokemmo.Connection.socket.emit("kickPlayer",{ username : str.substr("/kick ".length)});
		pokemmo.Chat.resetChat();
		pokemmo.Main.jq(pokemmo.Main.onScreenCanvas).focus();
		return;
	}
	if(str.indexOf("/setpokemon ") == 0 && pokemmo.Game.accountLevel >= 70) {
		pokemmo.Connection.socket.emit("adminSetPokemon",{ id : str.substr("/setpokemon ".length)});
		pokemmo.Chat.resetChat();
		pokemmo.Main.jq(pokemmo.Main.onScreenCanvas).focus();
		return;
	}
	if(str.indexOf("/setlevel ") == 0 && pokemmo.Game.accountLevel >= 70) {
		pokemmo.Connection.socket.emit("adminSetLevel",{ level : str.substr("/setlevel ".length)});
		pokemmo.Chat.resetChat();
		pokemmo.Main.jq(pokemmo.Main.onScreenCanvas).focus();
		return;
	}
	pokemmo.Chat.resetChat();
	pokemmo.Chat.filterChatText();
	pokemmo.Connection.socket.emit("sendMessage",{ str : str});
	pokemmo.Main.jq(pokemmo.Main.onScreenCanvas).focus();
}
pokemmo.Chat.render = function(ctx) {
	if(pokemmo.Chat.inChat && pokemmo.Chat.chatBox.value.length > 0) pokemmo.Chat.filterChatText();
	var x = 20;
	var y = 380;
	ctx.font = "12px Font2";
	if(pokemmo.Chat.inChat) {
		ctx.globalAlpha = 0.5;
		ctx.drawImage(pokemmo.Game.res["uiChat"].obj,x,y);
	}
	ctx.globalAlpha = 1;
	ctx.fillStyle = "rgb(0, 0, 0)";
	var str = pokemmo.Chat.chatBox.value;
	while(true) {
		var w = ctx.measureText(str).width;
		if(w < 440) {
			ctx.fillText(str,x + 8,y + 193);
			if(pokemmo.Chat.inChat) {
				if(Date.now().getTime() % 1000 < 500) ctx.fillRect(x + 10 + w,y + 184,1,10);
			}
			break;
		} else str = str.substr(1);
	}
	var i = pokemmo.Chat.chatLog.length;
	var now = Date.now().getTime();
	var _g1 = Math.max(pokemmo.Chat.chatLog.length - 12,0), _g = pokemmo.Chat.chatLog.length;
	while(_g1 < _g) {
		var i1 = _g1++;
		if(!pokemmo.Chat.inChat) ctx.globalAlpha = pokemmo.Util.clamp(5 - (now - pokemmo.Chat.chatLog[i1].timestamp2) / 1000 + 2,0,1);
		var str1;
		if(!pokemmo.Chat.inChat) {
			ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
			ctx.fillRect(x + 6,y + 169 - 14 * (pokemmo.Chat.chatLog.length - i1),ctx.measureText(pokemmo.Chat.chatLog[i1].username + ": " + pokemmo.Chat.chatLog[i1].str).width + 6,14);
		}
		str1 = pokemmo.Chat.chatLog[i1].username + ": ";
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.fillText(str1,x + 11,y + 181 - 14 * (pokemmo.Chat.chatLog.length - i1));
		ctx.fillStyle = "rgb(255, 255, 0)";
		ctx.fillText(str1,x + 10,y + 180 - 14 * (pokemmo.Chat.chatLog.length - i1));
		var usernameWidth = ctx.measureText(str1).width;
		str1 = pokemmo.Chat.chatLog[i1].str;
		ctx.fillStyle = "rgb(0, 0, 0)";
		ctx.fillText(str1,x + 11 + usernameWidth,y + 181 - 14 * (pokemmo.Chat.chatLog.length - i1));
		ctx.fillStyle = "rgb(255, 255, 255)";
		ctx.fillText(str1,x + 10 + usernameWidth,y + 180 - 14 * (pokemmo.Chat.chatLog.length - i1));
	}
	ctx.globalAlpha = 1;
}
pokemmo.Chat.renderBubbles = function(ctx) {
	var now = Date.now().getTime();
	var CORNER_RADIUS = 10;
	var offx = pokemmo.Renderer.getOffsetX();
	var offy = pokemmo.Renderer.getOffsetY();
	var tmpCanvas = pokemmo.Main.tmpCanvas;
	var tmpCtx = pokemmo.Main.tmpCtx;
	var _g = 0, _g1 = pokemmo.Chat.chatLog;
	while(_g < _g1.length) {
		var msg = _g1[_g];
		++_g;
		var duration = 2500 * (msg.str.length / 70 + 1);
		if(now - msg.timestamp >= duration) continue;
		if(msg.chr == null) msg.chr = pokemmo.Game.curGame.getCharByUsername(msg.username);
		if(msg.chr == null) continue;
		var time = now - msg.timestamp;
		var perc = pokemmo.Util.clamp((duration - time) / 1000,0,0.7);
		var x, y, width = msg.bubbleWidth, height = msg.bubbleHeight;
		x = msg.chr.getRenderPosX() + offx + Math.floor(32 / 2);
		y = msg.chr.getRenderPosY() + offy + 20;
		x -= Math.floor(width / 2);
		y -= height;
		y -= Math.floor((now - msg.timestamp) / 300);
		tmpCtx.clearRect(0,0,width,height);
		tmpCtx.save();
		tmpCtx.lineJoin = "round";
		tmpCtx.lineWidth = CORNER_RADIUS;
		tmpCtx.fillStyle = tmpCtx.strokeStyle = "#FFFFFF";
		tmpCtx.strokeRect(CORNER_RADIUS / 2,CORNER_RADIUS / 2,width - CORNER_RADIUS,height - CORNER_RADIUS);
		tmpCtx.fillRect(CORNER_RADIUS / 2,CORNER_RADIUS / 2,width - CORNER_RADIUS,height - CORNER_RADIUS);
		tmpCtx.restore();
		ctx.save();
		ctx.globalAlpha = perc;
		ctx.drawImage(tmpCanvas,0,0,width,height,x,y,width,height);
		ctx.fillStyle = "#000000";
		var _g3 = 0, _g2 = msg.bubbleLines.length;
		while(_g3 < _g2) {
			var i = _g3++;
			ctx.fillText(msg.bubbleLines[i],x + 5,y + 12 + 14 * i);
		}
		ctx.restore();
	}
}
pokemmo.Chat.chatFilterRegex = null;
pokemmo.Chat.filterChatText = function() {
	if(pokemmo.Chat.chatFilterRegex == null) pokemmo.Chat.chatFilterRegex = new EReg("[^\\u0020-\\u007F\\u0080-\\u00FF]","");
	pokemmo.Chat.chatBox.value = pokemmo.Chat.chatFilterRegex.replace(pokemmo.Chat.chatBox.value,"");
}
pokemmo.Chat.prototype.__class__ = pokemmo.Chat;
pokemmo.Layer = function(data) {
	if( data === $_ ) return;
	this.data = data.data;
	this.width = data.width;
	this.height = data.height;
	this.x = data.x;
	this.y = data.y;
	this.type = data.type;
	this.properties = data.properties;
	this.objects = data.objects;
	if(this.properties == null) this.properties = { solid : "1", overchars : "0", animated : "0", data_layer : "0"};
}
pokemmo.Layer.__name__ = ["pokemmo","Layer"];
pokemmo.Layer.prototype.data = null;
pokemmo.Layer.prototype.width = null;
pokemmo.Layer.prototype.height = null;
pokemmo.Layer.prototype.x = null;
pokemmo.Layer.prototype.y = null;
pokemmo.Layer.prototype.type = null;
pokemmo.Layer.prototype.properties = null;
pokemmo.Layer.prototype.objects = null;
pokemmo.Layer.prototype.render = function(ctx,map) {
	if(this.type != "tilelayer") return;
	var tilesets = map.tilesets;
	var j = 0;
	if(this.x != 0 || this.y != 0) throw "Assertion failed";
	var map1 = pokemmo.Game.curGame.map;
	var initialX = Math.floor(Math.max(Math.floor(pokemmo.Renderer.cameraX),this.x));
	var initialY = Math.floor(Math.max(Math.floor(pokemmo.Renderer.cameraY),this.y));
	var offsetX = pokemmo.Renderer.getOffsetX();
	var offsetY = pokemmo.Renderer.getOffsetY();
	var finalX = Math.floor(Math.min(initialX + Math.ceil(pokemmo.Main.screenWidth / map1.tilewidth) + 1,this.width));
	var finalY = Math.floor(Math.min(initialY + Math.ceil(pokemmo.Main.screenHeight / map1.tileheight) + 1,this.height));
	j += initialY * this.width;
	var _g = initialY;
	while(_g < finalY) {
		var py = _g++;
		j += initialX;
		var _g2 = initialX, _g1 = this.width;
		while(_g2 < _g1) {
			var px = _g2++;
			if(px >= finalX) {
				j += this.width - finalX;
				break;
			}
			var tileid = this.data[j];
			if(tileid == 0 || tileid == null) {
				++j;
				continue;
			}
			var tileset = pokemmo.Tileset.getTilesetOfTile(map1,tileid);
			if(tileset == null) throw "Tileset is null";
			var curTilesetTileid = tileid - tileset.firstgid;
			if(tileset.tileproperties[curTilesetTileid] != null && tileset.tileproperties[curTilesetTileid].animated != null) {
				var id = Number(tileset.tileproperties[curTilesetTileid].animated);
				var numFrames = Number(tileset.tileproperties[curTilesetTileid].numFrames);
				var animDelay = Number(tileset.tileproperties[curTilesetTileid].animDelay);
				if(Math.isNaN(animDelay)) animDelay = 0;
				ctx.drawImage(pokemmo.Game.res["animatedTileset"].obj,tileset.tilewidth * Math.floor((pokemmo.Renderer.numRTicks + animDelay) / 8 % numFrames),id * tileset.tileheight,tileset.tilewidth,tileset.tileheight,(px + this.x) * tileset.tilewidth + offsetX,(py + this.y) * tileset.tileheight + offsetY,tileset.tilewidth,tileset.tileheight);
			} else {
				var numTilesX = Math.floor(tileset.imagewidth / tileset.tilewidth);
				var srcx = curTilesetTileid % numTilesX * tileset.tilewidth;
				var srcy = Math.floor(curTilesetTileid / numTilesX) * tileset.tileheight;
				ctx.drawImage(tileset.image,srcx,srcy,tileset.tilewidth,tileset.tileheight,(px + this.x) * tileset.tilewidth + offsetX,(py + this.y) * tileset.tileheight + offsetY,tileset.tilewidth,tileset.tileheight);
			}
			++j;
		}
	}
}
pokemmo.Layer.prototype.__class__ = pokemmo.Layer;
if(!pokemmo.ui) pokemmo.ui = {}
pokemmo.ui.UIInput = function(x,y) {
	if( x === $_ ) return;
	this.x = x;
	this.y = y;
	this.disabled = false;
}
pokemmo.ui.UIInput.__name__ = ["pokemmo","ui","UIInput"];
pokemmo.ui.UIInput.prototype.x = null;
pokemmo.ui.UIInput.prototype.y = null;
pokemmo.ui.UIInput.prototype.selected = null;
pokemmo.ui.UIInput.prototype.selectedTime = null;
pokemmo.ui.UIInput.prototype.disabled = null;
pokemmo.ui.UIInput.prototype.select = function() {
	if(this.selected) return;
	if(pokemmo.UI.selectedInput != null) pokemmo.UI.selectedInput.blur();
	pokemmo.UI.selectedInput = this;
	this.selected = true;
	this.selectedTime = Date.now().getTime();
}
pokemmo.ui.UIInput.prototype.blur = function() {
	if(!this.selected) return;
	this.selected = false;
	pokemmo.UI.selectedInput = null;
}
pokemmo.ui.UIInput.prototype.tick = function() {
}
pokemmo.ui.UIInput.prototype.render = function(ctx) {
}
pokemmo.ui.UIInput.prototype.isUnderMouse = function() {
	return false;
}
pokemmo.ui.UIInput.prototype.__class__ = pokemmo.ui.UIInput;
pokemmo.ui.TextInput = function(x,y,width) {
	if( x === $_ ) return;
	pokemmo.ui.UIInput.call(this,x,y);
	this.width = width;
	this.height = 18;
	this.selected = false;
	this.isPassword = false;
	this.value = "";
	this.maxLength = 0;
}
pokemmo.ui.TextInput.__name__ = ["pokemmo","ui","TextInput"];
pokemmo.ui.TextInput.__super__ = pokemmo.ui.UIInput;
for(var k in pokemmo.ui.UIInput.prototype ) pokemmo.ui.TextInput.prototype[k] = pokemmo.ui.UIInput.prototype[k];
pokemmo.ui.TextInput.prototype.width = null;
pokemmo.ui.TextInput.prototype.height = null;
pokemmo.ui.TextInput.prototype.value = null;
pokemmo.ui.TextInput.prototype.isPassword = null;
pokemmo.ui.TextInput.prototype.maxLength = null;
pokemmo.ui.TextInput.prototype.select = function() {
	if(this.selected) return;
	pokemmo.ui.UIInput.prototype.select.call(this);
	pokemmo.UI.hiddenInput.value = this.value;
	pokemmo.Main.jq(pokemmo.UI.hiddenInput).focus();
}
pokemmo.ui.TextInput.prototype.blur = function() {
	if(!this.selected) return;
	pokemmo.ui.UIInput.prototype.blur.call(this);
	pokemmo.UI.hiddenInput.value = "";
	pokemmo.Main.jq(pokemmo.UI.hiddenInput).blur();
	pokemmo.Main.jq(pokemmo.Main.onScreenCanvas).focus();
}
pokemmo.ui.TextInput.prototype.tick = function() {
	if(this.disabled) {
		pokemmo.UI.hiddenInput.value = this.value;
		return;
	}
	if(this.selected) this.value = pokemmo.UI.hiddenInput.value;
}
pokemmo.ui.TextInput.prototype.isUnderMouse = function() {
	return pokemmo.UI.mouseX >= this.x && pokemmo.UI.mouseY >= this.y && pokemmo.UI.mouseX < this.x + this.width && pokemmo.UI.mouseY < this.y + this.height;
}
pokemmo.ui.TextInput.prototype.render = function(ctx) {
	var now = Date.now().getTime();
	if(this.isUnderMouse()) pokemmo.Main.onScreenCanvas.style.cursor = "text";
	if(this.maxLength > 0) {
		if(this.value.length > this.maxLength) {
			this.value = this.value.substr(0,this.maxLength);
			pokemmo.UI.hiddenInput.value = this.value;
		}
	}
	ctx.font = "12px Arial";
	ctx.fillStyle = "#000000";
	var str = this.value;
	if(this.isPassword) str = new EReg(".","g").replace(str,"*");
	var txtWidth = 0;
	if(str.length > 0) {
		while(true) {
			txtWidth = Math.ceil(ctx.measureText(str).width);
			if(txtWidth < this.width - 8) break; else str = str.substr(1);
		}
		ctx.fillText(str,this.x + 5,this.y + 14);
	}
	if(this.selected && (now - this.selectedTime) % 1000 < 500) ctx.fillRect(this.x + 6 + txtWidth,this.y + 2,1,14);
}
pokemmo.ui.TextInput.prototype.__class__ = pokemmo.ui.TextInput;
pokemmo.Transition = function(p) {
	if( p === $_ ) return;
	this.step = 0;
}
pokemmo.Transition.__name__ = ["pokemmo","Transition"];
pokemmo.Transition.prototype.step = null;
pokemmo.Transition.prototype.onComplete = null;
pokemmo.Transition.prototype.render = function(ctx) {
}
pokemmo.Transition.prototype.complete = function() {
	pokemmo.Renderer.stopTransition();
	if(this.onComplete != null) this.onComplete();
}
pokemmo.Transition.prototype.__class__ = pokemmo.Transition;
if(!pokemmo.transitions) pokemmo.transitions = {}
pokemmo.transitions.FadeIn = function(frames) {
	if( frames === $_ ) return;
	pokemmo.Transition.call(this);
	this.fadeTime = frames;
}
pokemmo.transitions.FadeIn.__name__ = ["pokemmo","transitions","FadeIn"];
pokemmo.transitions.FadeIn.__super__ = pokemmo.Transition;
for(var k in pokemmo.Transition.prototype ) pokemmo.transitions.FadeIn.prototype[k] = pokemmo.Transition.prototype[k];
pokemmo.transitions.FadeIn.prototype.fadeTime = null;
pokemmo.transitions.FadeIn.prototype.render = function(ctx) {
	ctx.fillStyle = "rgba(0,0,0," + pokemmo.Util.clamp(1 - this.step / this.fadeTime,0,1) + ")";
	ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
	++this.step;
	if(this.step >= this.fadeTime) {
		this.complete();
		return;
	}
}
pokemmo.transitions.FadeIn.prototype.__class__ = pokemmo.transitions.FadeIn;
pokemmo.entities.CPokemon = function(id,x,y,dir,shiny) {
	if( id === $_ ) return;
	if(shiny == null) shiny = false;
	if(dir == null) dir = 0;
	pokemmo.GameObject.call(this,x,y,dir);
	this.image = id == null?null:pokemmo.Game.curGame.getImage("resources/followers/" + id + ".png");
	this.canDrawGrass = true;
	this.walking = false;
	this.walkingPerc = 0.0;
	this.walkingHasMoved = false;
	this.jumping = false;
	this.canIdleJump = false;
	this.renderOffsetX = 0;
	this.renderOffsetY = 0;
	this.shiny = shiny;
	this.targetX = x;
	this.targetY = y;
}
pokemmo.entities.CPokemon.__name__ = ["pokemmo","entities","CPokemon"];
pokemmo.entities.CPokemon.__super__ = pokemmo.GameObject;
for(var k in pokemmo.GameObject.prototype ) pokemmo.entities.CPokemon.prototype[k] = pokemmo.GameObject.prototype[k];
pokemmo.entities.CPokemon.prototype.image = null;
pokemmo.entities.CPokemon.prototype.shiny = null;
pokemmo.entities.CPokemon.prototype.canDrawGrass = null;
pokemmo.entities.CPokemon.prototype.canIdleJump = null;
pokemmo.entities.CPokemon.prototype.walking = null;
pokemmo.entities.CPokemon.prototype.walkingPerc = null;
pokemmo.entities.CPokemon.prototype.walkingHasMoved = null;
pokemmo.entities.CPokemon.prototype.jumping = null;
pokemmo.entities.CPokemon.prototype.targetX = null;
pokemmo.entities.CPokemon.prototype.targetY = null;
pokemmo.entities.CPokemon.prototype.renderOffsetX = null;
pokemmo.entities.CPokemon.prototype.renderOffsetY = null;
pokemmo.entities.CPokemon.prototype.destroy = function() {
	pokemmo.GameObject.prototype.destroy.call(this);
}
pokemmo.entities.CPokemon.prototype.render = function(ctx) {
	var offsetX = pokemmo.Renderer.getOffsetX();
	var offsetY = pokemmo.Renderer.getOffsetY();
	var renderPosX = this.getRenderPosX();
	var renderPosY = this.getRenderPosY();
	var map = pokemmo.Map.getCurMap();
	if(this.image != null && this.image.loaded) {
		if(this.jumping) ctx.drawImage(pokemmo.Game.res["miscSprites"].obj,0,64,32,32,renderPosX + offsetX + 32 / 2,renderPosY + offsetY - this.renderOffsetY + 30,32,32);
		ctx.drawImage(this.image.obj,64 * this.direction,Math.floor((pokemmo.Renderer.numRTicks + this.randInt) % 10 / 5) * 64,64,64,renderPosX + offsetX,renderPosY + offsetY + (this.canIdleJump && (pokemmo.Renderer.numRTicks + this.randInt) % 10 < 5?-2:0),64,64);
		if(this.canDrawGrass && map.isTileGrass(this.x,this.y) && !this.walking) ctx.drawImage(pokemmo.Game.res["miscSprites"].obj,0,0,32,32,this.x * map.tilewidth + offsetX,this.y * map.tileheight + offsetY,32,32);
	}
}
pokemmo.entities.CPokemon.prototype.tick = function() {
	if(!this.walking) {
		this.walkingHasMoved = false;
		this.walkingPerc = 0.0;
		this.tickBot();
	} else {
		this.walkingPerc += 0.1;
		if(this.walkingPerc >= (1 - 0.3) / 2 && !this.walkingHasMoved) {
			var frontX = this.getFrontPositionX();
			var frontY = this.getFrontPositionY();
			if(pokemmo.Map.getCurMap().isTileLedge(frontX,frontY) && pokemmo.Map.getCurMap().getLedgeDir(frontX,frontY) == this.direction) this.useLedge();
			switch(this.direction) {
			case 1:
				this.x -= 1;
				break;
			case 3:
				this.x += 1;
				break;
			case 2:
				this.y -= 1;
				break;
			case 0:
				this.y += 1;
				break;
			}
			this.walkingHasMoved = true;
			if(pokemmo.Map.getCurMap().isTileGrass(this.x,this.y)) new pokemmo.entities.CGrassAnimation(this.x,this.y);
		}
		if(this.walkingPerc >= 1.0) {
			this.walkingHasMoved = false;
			this.walkingPerc = 0.4;
			this.walking = false;
			this.tickBot();
		}
	}
}
pokemmo.entities.CPokemon.prototype.getRenderPosX = function() {
	var curMap = pokemmo.Map.getCurMap();
	if(!this.walking) return Math.floor(this.x * curMap.tilewidth - 64 / 4 + this.renderOffsetX);
	var destX = this.x * curMap.tilewidth - 64 / 4;
	var perc = (this.walkingPerc - 0.3) / (1 - 0.3);
	if(this.walkingPerc > 0.3) {
		if(this.walkingHasMoved) switch(this.direction) {
		case 1:
			destX += curMap.tilewidth * (1 - perc);
			break;
		case 3:
			destX -= curMap.tilewidth * (1 - perc);
			break;
		} else switch(this.direction) {
		case 1:
			destX -= curMap.tilewidth * perc;
			break;
		case 3:
			destX += curMap.tilewidth * perc;
			break;
		}
	}
	return Math.floor(destX + this.renderOffsetX);
}
pokemmo.entities.CPokemon.prototype.getRenderPosY = function() {
	var curMap = pokemmo.Map.getCurMap();
	if(!this.walking) return Math.floor(this.y * curMap.tileheight - 64 / 2 + this.renderOffsetY);
	var destY = this.y * curMap.tileheight - 64 / 2;
	var perc = (this.walkingPerc - 0.3) / (1 - 0.3);
	if(this.walkingPerc > 0.3) {
		if(this.walkingHasMoved) switch(this.direction) {
		case 2:
			destY += curMap.tileheight * (1 - perc);
			break;
		case 0:
			destY -= curMap.tileheight * (1 - perc);
			break;
		} else switch(this.direction) {
		case 2:
			destY -= curMap.tileheight * perc;
			break;
		case 0:
			destY += curMap.tileheight * perc;
			break;
		}
	}
	return Math.floor(destY + this.renderOffsetY);
}
pokemmo.entities.CPokemon.prototype.useLedge = function() {
	var me = this;
	var frontX = this.getFrontPositionX();
	var frontY = this.getFrontPositionY();
	var destX = this.getFrontPositionX(2);
	var destY = this.getFrontPositionY(2);
	var dir = this.direction;
	this.walking = true;
	this.jumping = true;
	var tmpCount = 0;
	var renderFunc = null;
	renderFunc = function() {
		++tmpCount;
		if(me.x != destX || me.y != destY) me.walking = true;
		me.direction = dir;
		me.renderOffsetY = Math.min(Math.round(8 / 15 * (tmpCount * tmpCount) + -8 * tmpCount),0);
		if(tmpCount == 18) new pokemmo.entities.CLedgeSmoke(me.x,me.y);
		if(tmpCount >= 20) {
			me.renderOffsetY = 0;
			me.walking = false;
			me.walkingPerc = 0.0;
			me.walkingHasMoved = false;
			me.jumping = false;
			me.x = destX;
			me.y = destY;
			pokemmo.Renderer.unHookRender(renderFunc);
		}
	};
	pokemmo.Renderer.hookRender(renderFunc);
}
pokemmo.entities.CPokemon.prototype.getFrontPositionX = function(n) {
	if(n == null) n = 1;
	switch(this.direction) {
	case 1:
		return this.x - n;
	case 3:
		return this.x + n;
	case 2:
		return this.x;
	case 0:
		return this.x;
	}
	return null;
}
pokemmo.entities.CPokemon.prototype.getFrontPositionY = function(n) {
	if(n == null) n = 1;
	switch(this.direction) {
	case 1:
		return this.y;
	case 3:
		return this.y;
	case 2:
		return this.y - n;
	case 0:
		return this.y + n;
	}
	return null;
}
pokemmo.entities.CPokemon.prototype.tickBot = function() {
	if(this.jumping) return;
	if(this.walking) return;
	if(Math.abs(this.x - this.targetX) + Math.abs(this.y - this.targetY) > 3) {
		this.x = this.targetX;
		this.y = this.targetY;
		return;
	}
	this.walking = this.x != this.targetX || this.y != this.targetY;
	if(!this.walking) return;
	var lastDirection = this.direction;
	if(Math.abs(this.x - this.targetX) > 0 && this.y == this.targetY) this.direction = this.x < this.targetX?3:1; else if(Math.abs(this.y - this.targetY) > 0 && this.x == this.targetX) this.direction = this.y < this.targetY?0:2; else this.direction = this.targetY < this.y?2:0;
	if(lastDirection != this.direction) this.walkingPerc = 0.0;
}
pokemmo.entities.CPokemon.prototype.__class__ = pokemmo.entities.CPokemon;
pokemmo.Util = function() { }
pokemmo.Util.__name__ = ["pokemmo","Util"];
pokemmo.Util.clamp = function(n,min,max) {
	return n < min?min:n > max?max:n;
}
pokemmo.Util.or = function(v1,v2) {
	return v1?v1:v2;
}
pokemmo.Util.reduceTextSize = function(str,maxWidth,ctx) {
	var arr = str.split(" ");
	var lines = [];
	while(arr.length > 0) {
		var fi = pokemmo.Util.findMaximumTextSize(arr,maxWidth,ctx,0,arr.length);
		lines.push(arr.slice(0,fi).join(" "));
		arr = arr.slice(fi);
	}
	return lines;
}
pokemmo.Util.findMaximumTextSize = function(arr,maxWidth,ctx,low,high) {
	if(high < low) return -1;
	if(high - low <= 1) return low + 1;
	var mid = Math.floor((low + high) / 2);
	var w = ctx.measureText(arr.slice(0,mid).join(" ")).width;
	if(w > maxWidth) return pokemmo.Util.findMaximumTextSize(arr,maxWidth,ctx,low,mid - 1); else if(ctx.measureText(arr.slice(0,mid + 1).join(" ")).width > maxWidth) return mid; else return pokemmo.Util.findMaximumTextSize(arr,maxWidth,ctx,mid + 1,high);
}
pokemmo.Util.getPokemonStatusBarName = function(pk) {
	return pokemmo.Util.or(pk.nickname,pokemmo.Game.pokemonData[pk.id].name).toUpperCase();
}
pokemmo.Util.getPokemonDisplayName = function(pk) {
	var str = pokemmo.Util.or(pk.nickname,pokemmo.Game.pokemonData[pk.id].name).toUpperCase();
	if(pokemmo.Game.curGame != null && pokemmo.Game.curGame.inBattle && pokemmo.Game.curGame.battle.type == 0 && pokemmo.Game.curGame.battle.enemyPokemon == pk) str = "Wild " + str;
	return str;
}
pokemmo.Util.drawRoundedRect = function(x,y,width,height,radius,color,alpha) {
	if(alpha == null) alpha = 1.0;
	var tmpCtx = pokemmo.Main.tmpCtx;
	var tmpCanvas = pokemmo.Main.tmpCanvas;
	var ctx = pokemmo.Main.ctx;
	tmpCtx.clearRect(0,0,width,height);
	tmpCtx.save();
	tmpCtx.lineJoin = "round";
	tmpCtx.lineWidth = radius;
	tmpCtx.fillStyle = tmpCtx.strokeStyle = color;
	tmpCtx.strokeRect(radius / 2,radius / 2,width - radius,height - radius);
	tmpCtx.fillRect(radius / 2,radius / 2,width - radius,height - radius);
	tmpCtx.restore();
	ctx.save();
	ctx.globalAlpha = alpha;
	ctx.drawImage(tmpCanvas,0,0,width,height,x,y,width,height);
	ctx.restore();
}
pokemmo.Util.prototype.__class__ = pokemmo.Util;
pokemmo.transitions.FadeOut = function(frames) {
	if( frames === $_ ) return;
	pokemmo.Transition.call(this);
	this.fadeTime = frames;
}
pokemmo.transitions.FadeOut.__name__ = ["pokemmo","transitions","FadeOut"];
pokemmo.transitions.FadeOut.__super__ = pokemmo.Transition;
for(var k in pokemmo.Transition.prototype ) pokemmo.transitions.FadeOut.prototype[k] = pokemmo.Transition.prototype[k];
pokemmo.transitions.FadeOut.prototype.fadeTime = null;
pokemmo.transitions.FadeOut.prototype.render = function(ctx) {
	ctx.fillStyle = "rgba(0,0,0," + pokemmo.Util.clamp(this.step / this.fadeTime,0,1) + ")";
	ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
	++this.step;
	if(this.step >= this.fadeTime) {
		this.complete();
		return;
	}
}
pokemmo.transitions.FadeOut.prototype.__class__ = pokemmo.transitions.FadeOut;
pokemmo.UI = function() { }
pokemmo.UI.__name__ = ["pokemmo","UI"];
pokemmo.UI.AButtonHooks = null;
pokemmo.UI.BButtonHooks = null;
pokemmo.UI.enterButtonHooks = null;
pokemmo.UI.dirButtonHooks = null;
pokemmo.UI.mouseX = null;
pokemmo.UI.mouseY = null;
pokemmo.UI.inputs = null;
pokemmo.UI.selectedInput = null;
pokemmo.UI.lastSelectedInput = null;
pokemmo.UI.hiddenInput = null;
pokemmo.UI.setup = function() {
	pokemmo.UI.AButtonHooks = [];
	pokemmo.UI.BButtonHooks = [];
	pokemmo.UI.dirButtonHooks = [];
	pokemmo.UI.enterButtonHooks = [];
	pokemmo.UI.inputs = [];
	pokemmo.UI.mouseX = pokemmo.UI.mouseY = 0;
	var w = window;
	pokemmo.UI.hiddenInput = document.createElement("input");
	pokemmo.UI.hiddenInput.type = "text";
	pokemmo.UI.hiddenInput.style.opacity = "0";
	pokemmo.UI.hiddenInput.style.position = "fixed";
	document.body.appendChild(pokemmo.UI.hiddenInput);
	pokemmo.Main.jq(w).keydown(function(e) {
		if(!pokemmo.Chat.inChat && e.keyCode == 68 && e.shiftKey && pokemmo.UI.selectedInput == null) {
			pokemmo.Main.printDebug();
			e.preventDefault();
			return;
		}
		if(e.keyCode == 13) {
			if(pokemmo.Game.state == pokemmo.GameState.ST_MAP) {
				if(!pokemmo.Chat.inChat && !pokemmo.Chat.justSentMessage) {
					pokemmo.Chat.inChat = true;
					pokemmo.Main.jq(pokemmo.Chat.chatBox).focus();
				}
			} else pokemmo.UI.fireEnterHooks = true;
			e.preventDefault();
		} else if(e.keyCode == 9) {
			pokemmo.UI.selectNextInput();
			e.preventDefault();
		}
		if(!pokemmo.Chat.inChat && !pokemmo.UI.keysDown[e.keyCode]) {
			pokemmo.UI.keysDown[e.keyCode] = true;
			if(e.keyCode == 90) {
				pokemmo.UI.uiAButtonDown = true;
				pokemmo.UI.fireAHooks = true;
			} else if(e.keyCode == 88) {
				pokemmo.UI.uiBButtonDown = true;
				pokemmo.UI.fireBHooks = true;
			} else if(e.keyCode == 37) pokemmo.UI.arrowKeysPressed.push(1); else if(e.keyCode == 40) pokemmo.UI.arrowKeysPressed.push(0); else if(e.keyCode == 39) pokemmo.UI.arrowKeysPressed.push(3); else if(e.keyCode == 38) pokemmo.UI.arrowKeysPressed.push(2);
		}
	});
	pokemmo.Main.jq(w).keyup(function(e) {
		pokemmo.UI.keysDown[e.keyCode] = false;
		if(e.keyCode == 13) pokemmo.Chat.justSentMessage = false; else if(e.keyCode == 90) pokemmo.UI.uiAButtonDown = false; else if(e.keyCode == 88) pokemmo.UI.uiBButtonDown = false;
		if(e.keyCode == 13 || e.keyCode == 32) {
			if(pokemmo.UI.selectedInput != null && Std["is"](pokemmo.UI.selectedInput,pokemmo.ui.UIButton)) {
				var b = pokemmo.UI.selectedInput;
				if(b.instantSubmit) b.submit();
			}
		}
	});
	pokemmo.Main.jq(w).blur(function() {
		var _g1 = 0, _g = pokemmo.UI.keysDown.length;
		while(_g1 < _g) {
			var i = _g1++;
			pokemmo.UI.keysDown[i] = false;
		}
		pokemmo.UI.mouseDown = false;
	});
	pokemmo.Main.jq(w).mousedown(function(e) {
		pokemmo.UI.mouseDownFuture = true;
		var selectedAny = false;
		var _g1 = 0, _g = pokemmo.UI.inputs.length;
		while(_g1 < _g) {
			var i = _g1++;
			if(pokemmo.UI.inputs[i].isUnderMouse()) {
				pokemmo.UI.inputs[i].select();
				selectedAny = true;
			}
		}
		if(!selectedAny && pokemmo.UI.selectedInput != null) {
			pokemmo.UI.lastSelectedInput = pokemmo.UI.selectedInput;
			pokemmo.UI.selectedInput.blur();
		}
		e.preventDefault();
	});
	pokemmo.Main.jq(w).mouseup(function() {
		pokemmo.UI.mouseDownFuture = false;
		if(pokemmo.UI.selectedInput != null && pokemmo.UI.selectedInput.isUnderMouse() && Std["is"](pokemmo.UI.selectedInput,pokemmo.ui.UIButton)) {
			var b = pokemmo.UI.selectedInput;
			if(b.instantSubmit) b.submit();
		}
	});
}
pokemmo.UI.selectNextInput = function() {
	if(pokemmo.UI.inputs.length <= 1) return;
	if(pokemmo.UI.selectedInput != null) pokemmo.UI.inputs[(pokemmo.UI.inputs.indexOf(pokemmo.UI.selectedInput) + 1) % pokemmo.UI.inputs.length].select(); else if(pokemmo.UI.lastSelectedInput != null) pokemmo.UI.inputs[(pokemmo.UI.inputs.indexOf(pokemmo.UI.lastSelectedInput) + 1) % pokemmo.UI.inputs.length].select(); else if(pokemmo.UI.inputs.length > 0) pokemmo.UI.inputs[0].select();
	if(pokemmo.UI.selectedInput != null && pokemmo.UI.selectedInput.disabled) {
		var i = pokemmo.UI.inputs.indexOf(pokemmo.UI.selectedInput);
		var _g1 = i, _g = pokemmo.UI.inputs.length;
		while(_g1 < _g) {
			var j = _g1++;
			if(!pokemmo.UI.inputs[j].disabled) {
				pokemmo.UI.inputs[j].select();
				return;
			}
		}
		var _g = 0;
		while(_g < i) {
			var j = _g++;
			if(!pokemmo.UI.inputs[j].disabled) {
				pokemmo.UI.inputs[j].select();
				return;
			}
		}
	}
}
pokemmo.UI.tick = function() {
	pokemmo.Main.onScreenCanvas.style.cursor = "auto";
	pokemmo.UI.mouseWasDown = pokemmo.UI.mouseDown;
	pokemmo.UI.mouseDown = pokemmo.UI.mouseDownFuture;
	if(pokemmo.UI.hiddenInput.selected) {
		pokemmo.UI.hiddenInput.selectionStart = pokemmo.UI.hiddenInput.value.length;
		pokemmo.UI.hiddenInput.selectionEnd = pokemmo.UI.hiddenInput.value.length;
	}
	var _g1 = 0, _g = pokemmo.UI.inputs.length;
	while(_g1 < _g) {
		var i = _g1++;
		pokemmo.UI.inputs[i].tick();
	}
	if(pokemmo.UI.fireAHooks) {
		pokemmo.UI.fireAHooks = false;
		var arr = pokemmo.UI.AButtonHooks.copy();
		pokemmo.UI.AButtonHooks = [];
		if(!(pokemmo.Renderer.curTransition != null)) {
			var _g = 0;
			while(_g < arr.length) {
				var e = arr[_g];
				++_g;
				e();
			}
		}
	}
	if(pokemmo.UI.fireBHooks) {
		pokemmo.UI.fireBHooks = false;
		var arr = pokemmo.UI.BButtonHooks.copy();
		pokemmo.UI.BButtonHooks = [];
		if(!(pokemmo.Renderer.curTransition != null)) {
			var _g = 0;
			while(_g < arr.length) {
				var e = arr[_g];
				++_g;
				e();
			}
		}
	}
	if(pokemmo.UI.fireEnterHooks) {
		pokemmo.UI.fireEnterHooks = false;
		var arr = pokemmo.UI.enterButtonHooks.copy();
		pokemmo.UI.enterButtonHooks = [];
		if(!(pokemmo.Renderer.curTransition != null)) {
			var _g = 0;
			while(_g < arr.length) {
				var e = arr[_g];
				++_g;
				e();
			}
		}
	}
	if(!(pokemmo.Renderer.curTransition != null)) {
		var _g1 = 0, _g = pokemmo.UI.arrowKeysPressed.length;
		while(_g1 < _g) {
			var i = _g1++;
			var _g3 = 0, _g2 = pokemmo.UI.dirButtonHooks.length;
			while(_g3 < _g2) {
				var j = _g3++;
				pokemmo.UI.dirButtonHooks[j](pokemmo.UI.arrowKeysPressed[i]);
			}
		}
	}
	pokemmo.UI.arrowKeysPressed = [];
}
pokemmo.UI.render = function(ctx) {
	var _g1 = 0, _g = pokemmo.UI.inputs.length;
	while(_g1 < _g) {
		var i = _g1++;
		pokemmo.UI.inputs[i].render(ctx);
	}
}
pokemmo.UI.hookAButton = function(func) {
	pokemmo.UI.AButtonHooks.push(func);
}
pokemmo.UI.hookBButton = function(func) {
	pokemmo.UI.BButtonHooks.push(func);
}
pokemmo.UI.hookEnterButton = function(func) {
	pokemmo.UI.enterButtonHooks.push(func);
}
pokemmo.UI.unHookAButton = function(func) {
	pokemmo.UI.AButtonHooks.remove(func);
}
pokemmo.UI.unHookBButton = function(func) {
	pokemmo.UI.BButtonHooks.remove(func);
}
pokemmo.UI.unHookABButtons = function() {
	pokemmo.UI.AButtonHooks = [];
	pokemmo.UI.BButtonHooks = [];
}
pokemmo.UI.unHookAllAButton = function() {
	pokemmo.UI.BButtonHooks = [];
}
pokemmo.UI.unHookAllBButton = function() {
	pokemmo.UI.BButtonHooks = [];
}
pokemmo.UI.unHookEnterButton = function(func) {
	pokemmo.UI.AButtonHooks.remove(func);
}
pokemmo.UI.hookDirButtons = function(func) {
	pokemmo.UI.dirButtonHooks.push(func);
}
pokemmo.UI.unHookDirButtons = function(func) {
	pokemmo.UI.dirButtonHooks.remove(func);
}
pokemmo.UI.isKeyDown = function(n) {
	return !!pokemmo.UI.keysDown[n];
}
pokemmo.UI.isMouseInRect = function(x1,y1,x2,y2) {
	return pokemmo.UI.mouseX >= x1 && pokemmo.UI.mouseY >= y1 && pokemmo.UI.mouseX < x2 && pokemmo.UI.mouseY < y2;
}
pokemmo.UI.renderPokemonParty = function(ctx) {
	if(pokemmo.Main.isPhone) return;
	pokemmo.Main.tmpCtx.clearRect(0,0,pokemmo.Main.tmpCanvas.width,pokemmo.Main.tmpCanvas.height);
	var x = 10;
	var y = 10;
	var deltaY = 48;
	var pokemonParty = pokemmo.Game.pokemonParty;
	var tmpCtx = pokemmo.Main.tmpCtx;
	var tmpCanvas = pokemmo.Main.tmpCanvas;
	if(pokemonParty == null) return;
	var drawStyleText = function(str,x_,y_) {
		tmpCtx.fillStyle = "rgb(0, 0, 0)";
		tmpCtx.fillText(str,x + x_ + 2,y + y_ + 2);
		tmpCtx.fillStyle = "rgb(255, 255, 255)";
		tmpCtx.fillText(str,x + x_,y + y_);
	};
	var _g1 = 0, _g = pokemonParty.length;
	while(_g1 < _g) {
		var i = _g1++;
		tmpCtx.save();
		tmpCtx.shadowOffsetX = 4;
		tmpCtx.shadowOffsetY = 4;
		tmpCtx.shadowBlur = 0;
		tmpCtx.shadowColor = "rgba(0, 0, 0, 0.5)";
		tmpCtx.drawImage(pokemmo.Game.res["uiPokemon"].obj,x,y);
		tmpCtx.restore();
		if(pokemonParty[i].icon.loaded) tmpCtx.drawImage(pokemonParty[i].icon.obj,x + 8,y + 8);
		tmpCtx.font = "12pt Font1";
		tmpCtx.fillStyle = "rgb(255, 255, 255)";
		drawStyleText(pokemmo.Util.getPokemonDisplayName(pokemonParty[i]),45,21);
		var lvWidth = tmpCtx.measureText("Lv " + pokemonParty[i].level).width;
		drawStyleText("Lv " + pokemonParty[i].level,45,35);
		tmpCtx.font = "12pt Font1";
		var hp = pokemonParty[i].hp + "/" + pokemonParty[i].maxHp;
		var barWidth = Math.ceil(tmpCtx.measureText(hp).width);
		drawStyleText(hp,280 - barWidth,35);
		var sx = x + 60 + lvWidth;
		tmpCtx.save();
		tmpCtx.translate(-0.5,-0.5);
		tmpCtx.lineWidth = 2;
		tmpCtx.save();
		tmpCtx.beginPath();
		tmpCtx.moveTo(0,y + 32);
		tmpCtx.lineTo(tmpCanvas.width,y + 32);
		tmpCtx.lineTo(tmpCanvas.width,y + 45);
		tmpCtx.lineTo(0,y + 45);
		tmpCtx.lineTo(0,y + 32);
		tmpCtx.clip();
		tmpCtx.strokeStyle = "rgb(0, 0, 0)";
		tmpCtx.fillStyle = "rgb(0, 0, 0)";
		tmpCtx.fillRect(sx + 5,y + 30,190 - barWidth - lvWidth,5);
		tmpCtx.fillStyle = "rgb(64,200,248)";
		tmpCtx.fillRect(sx + 5,y + 30,Math.ceil((190 - barWidth - lvWidth) * (pokemonParty[i].experience / pokemonParty[i].experienceNeeded)),5);
		tmpCtx.strokeRect(sx + 5,y + 30,190 - barWidth - lvWidth,5);
		tmpCtx.restore();
		tmpCtx.fillStyle = "rgb(0, 200, 0)";
		tmpCtx.strokeStyle = "rgb(0, 0, 0)";
		tmpCtx.fillRect(sx,y + 27,Math.ceil((200 - barWidth - lvWidth) * (pokemonParty[i].hp / pokemonParty[i].maxHp)),5);
		tmpCtx.strokeRect(sx,y + 27,200 - barWidth - lvWidth,5);
		tmpCtx.restore();
		y += deltaY;
	}
	ctx.globalAlpha = 0.8;
	ctx.drawImage(tmpCanvas,480,0);
	ctx.globalAlpha = 1;
}
pokemmo.UI.createTextInput = function(x,y,width) {
	var ti = new pokemmo.ui.TextInput(x,y,width);
	pokemmo.UI.inputs.push(ti);
	return ti;
}
pokemmo.UI.pushInput = function(i) {
	pokemmo.UI.inputs.push(i);
}
pokemmo.UI.removeInput = function(i) {
	if(pokemmo.UI.selectedInput == i) i.blur();
	pokemmo.UI.inputs.remove(i);
}
pokemmo.UI.removeAllInputs = function() {
	while(pokemmo.UI.inputs.length > 0) pokemmo.UI.removeInput(pokemmo.UI.inputs[0]);
}
pokemmo.UI.setCursor = function(str) {
	pokemmo.Main.onScreenCanvas.style.cursor = str;
}
pokemmo.UI.prototype.__class__ = pokemmo.UI;
Reflect = function() { }
Reflect.__name__ = ["Reflect"];
Reflect.hasField = function(o,field) {
	if(o.hasOwnProperty != null) return o.hasOwnProperty(field);
	var arr = Reflect.fields(o);
	var $it0 = arr.iterator();
	while( $it0.hasNext() ) {
		var t = $it0.next();
		if(t == field) return true;
	}
	return false;
}
Reflect.field = function(o,field) {
	var v = null;
	try {
		v = o[field];
	} catch( e ) {
	}
	return v;
}
Reflect.setField = function(o,field,value) {
	o[field] = value;
}
Reflect.callMethod = function(o,func,args) {
	return func.apply(o,args);
}
Reflect.fields = function(o) {
	if(o == null) return new Array();
	var a = new Array();
	if(o.hasOwnProperty) {
		for(var i in o) if( o.hasOwnProperty(i) ) a.push(i);
	} else {
		var t;
		try {
			t = o.__proto__;
		} catch( e ) {
			t = null;
		}
		if(t != null) o.__proto__ = null;
		for(var i in o) if( i != "__proto__" ) a.push(i);
		if(t != null) o.__proto__ = t;
	}
	return a;
}
Reflect.isFunction = function(f) {
	return typeof(f) == "function" && f.__name__ == null;
}
Reflect.compare = function(a,b) {
	return a == b?0:a > b?1:-1;
}
Reflect.compareMethods = function(f1,f2) {
	if(f1 == f2) return true;
	if(!Reflect.isFunction(f1) || !Reflect.isFunction(f2)) return false;
	return f1.scope == f2.scope && f1.method == f2.method && f1.method != null;
}
Reflect.isObject = function(v) {
	if(v == null) return false;
	var t = typeof(v);
	return t == "string" || t == "object" && !v.__enum__ || t == "function" && v.__name__ != null;
}
Reflect.deleteField = function(o,f) {
	if(!Reflect.hasField(o,f)) return false;
	delete(o[f]);
	return true;
}
Reflect.copy = function(o) {
	var o2 = { };
	var _g = 0, _g1 = Reflect.fields(o);
	while(_g < _g1.length) {
		var f = _g1[_g];
		++_g;
		o2[f] = Reflect.field(o,f);
	}
	return o2;
}
Reflect.makeVarArgs = function(f) {
	return function() {
		var a = new Array();
		var _g1 = 0, _g = arguments.length;
		while(_g1 < _g) {
			var i = _g1++;
			a.push(arguments[i]);
		}
		return f(a);
	};
}
Reflect.prototype.__class__ = Reflect;
pokemmo.transitions.BlackScreen = function(duration) {
	if( duration === $_ ) return;
	pokemmo.Transition.call(this);
	this.duration = duration;
}
pokemmo.transitions.BlackScreen.__name__ = ["pokemmo","transitions","BlackScreen"];
pokemmo.transitions.BlackScreen.__super__ = pokemmo.Transition;
for(var k in pokemmo.Transition.prototype ) pokemmo.transitions.BlackScreen.prototype[k] = pokemmo.Transition.prototype[k];
pokemmo.transitions.BlackScreen.prototype.duration = null;
pokemmo.transitions.BlackScreen.prototype.render = function(ctx) {
	ctx.fillStyle = "#000000";
	ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
	if(this.step >= 0) ++this.step;
	if(this.step >= this.duration) {
		this.complete();
		return;
	}
}
pokemmo.transitions.BlackScreen.prototype.__class__ = pokemmo.transitions.BlackScreen;
pokemmo.entities.CWarp = function(name,x,y) {
	if( name === $_ ) return;
	pokemmo.GameObject.call(this,x,y);
	this.name = name;
	this.disable = false;
}
pokemmo.entities.CWarp.__name__ = ["pokemmo","entities","CWarp"];
pokemmo.entities.CWarp.__super__ = pokemmo.GameObject;
for(var k in pokemmo.GameObject.prototype ) pokemmo.entities.CWarp.prototype[k] = pokemmo.GameObject.prototype[k];
pokemmo.entities.CWarp.getWarpAt = function(x,y) {
	var _g = 0, _g1 = pokemmo.Game.curGame.gameObjects;
	while(_g < _g1.length) {
		var i = _g1[_g];
		++_g;
		if(i.x == x && i.y == y && Std["is"](i,pokemmo.entities.CWarp)) return i;
	}
	return null;
}
pokemmo.entities.CWarp.getWarpByName = function(str) {
	var _g = 0, _g1 = pokemmo.Game.curGame.gameObjects;
	while(_g < _g1.length) {
		var i = _g1[_g];
		++_g;
		if(Std["is"](i,pokemmo.entities.CWarp) && i.name == str) return i;
	}
	return null;
}
pokemmo.entities.CWarp.prototype.name = null;
pokemmo.entities.CWarp.prototype.disable = null;
pokemmo.entities.CWarp.prototype.canWarp = function(obj) {
	return true;
}
pokemmo.entities.CWarp.prototype.__class__ = pokemmo.entities.CWarp;
IntIter = function(min,max) {
	if( min === $_ ) return;
	this.min = min;
	this.max = max;
}
IntIter.__name__ = ["IntIter"];
IntIter.prototype.min = null;
IntIter.prototype.max = null;
IntIter.prototype.hasNext = function() {
	return this.min < this.max;
}
IntIter.prototype.next = function() {
	return this.min++;
}
IntIter.prototype.__class__ = IntIter;
pokemmo.entities.CWildPokemon = function(id,x,y,chr,shiny) {
	if( id === $_ ) return;
	pokemmo.entities.CPokemon.call(this,id,x,y,0,shiny);
	this.chr = chr;
	this.createdTick = pokemmo.Renderer.numRTicks;
}
pokemmo.entities.CWildPokemon.__name__ = ["pokemmo","entities","CWildPokemon"];
pokemmo.entities.CWildPokemon.__super__ = pokemmo.entities.CPokemon;
for(var k in pokemmo.entities.CPokemon.prototype ) pokemmo.entities.CWildPokemon.prototype[k] = pokemmo.entities.CPokemon.prototype[k];
pokemmo.entities.CWildPokemon.prototype.createdTick = null;
pokemmo.entities.CWildPokemon.prototype.chr = null;
pokemmo.entities.CWildPokemon.prototype.tick = function() {
	if(!this.chr.inBattle) {
		this.destroy();
		return;
	}
	pokemmo.entities.CPokemon.prototype.tick.call(this);
	if(!this.walking) {
		if(this.x < this.chr.x) this.direction = 3; else if(this.x > this.chr.x) this.direction = 1; else if(this.y > this.chr.y) this.direction = 2; else this.direction = 0;
	}
}
pokemmo.entities.CWildPokemon.prototype.render = function(ctx) {
	if(this.chr.username == pokemmo.Game.username && !pokemmo.Game.curGame.drawPlayerChar) return;
	ctx.save();
	this.canDrawGrass = pokemmo.Renderer.numRTicks - this.createdTick < 5;
	if(pokemmo.Renderer.numRTicks - this.createdTick < 10) ctx.translate(0,-(Math.floor(-7 / 50 * (pokemmo.Renderer.numRTicks - this.createdTick) * (pokemmo.Renderer.numRTicks - this.createdTick) + 7 / 5 * (pokemmo.Renderer.numRTicks - this.createdTick)) * 8));
	pokemmo.entities.CPokemon.prototype.render.call(this,ctx);
	ctx.restore();
}
pokemmo.entities.CWildPokemon.prototype.__class__ = pokemmo.entities.CWildPokemon;
if(typeof js=='undefined') js = {}
js.Boot = function() { }
js.Boot.__name__ = ["js","Boot"];
js.Boot.__unhtml = function(s) {
	return s.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
}
js.Boot.__trace = function(v,i) {
	var msg = i != null?i.fileName + ":" + i.lineNumber + ": ":"";
	msg += js.Boot.__unhtml(js.Boot.__string_rec(v,"")) + "<br/>";
	var d = document.getElementById("haxe:trace");
	if(d == null) alert("No haxe:trace element defined\n" + msg); else d.innerHTML += msg;
}
js.Boot.__clear_trace = function() {
	var d = document.getElementById("haxe:trace");
	if(d != null) d.innerHTML = "";
}
js.Boot.__closure = function(o,f) {
	var m = o[f];
	if(m == null) return null;
	var f1 = function() {
		return m.apply(o,arguments);
	};
	f1.scope = o;
	f1.method = m;
	return f1;
}
js.Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ != null || o.__ename__ != null)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__ != null) {
				if(o.length == 2) return o[0];
				var str = o[0] + "(";
				s += "\t";
				var _g1 = 2, _g = o.length;
				while(_g1 < _g) {
					var i = _g1++;
					if(i != 2) str += "," + js.Boot.__string_rec(o[i],s); else str += js.Boot.__string_rec(o[i],s);
				}
				return str + ")";
			}
			var l = o.length;
			var i;
			var str = "[";
			s += "\t";
			var _g = 0;
			while(_g < l) {
				var i1 = _g++;
				str += (i1 > 0?",":"") + js.Boot.__string_rec(o[i1],s);
			}
			str += "]";
			return str;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			return "???";
		}
		if(tostr != null && tostr != Object.toString) {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
		}
		var k = null;
		var str = "{\n";
		s += "\t";
		var hasp = o.hasOwnProperty != null;
		for( var k in o ) { ;
		if(hasp && !o.hasOwnProperty(k)) {
			continue;
		}
		if(k == "prototype" || k == "__class__" || k == "__super__" || k == "__interfaces__") {
			continue;
		}
		if(str.length != 2) str += ", \n";
		str += s + k + " : " + js.Boot.__string_rec(o[k],s);
		}
		s = s.substring(1);
		str += "\n" + s + "}";
		return str;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
}
js.Boot.__interfLoop = function(cc,cl) {
	if(cc == null) return false;
	if(cc == cl) return true;
	var intf = cc.__interfaces__;
	if(intf != null) {
		var _g1 = 0, _g = intf.length;
		while(_g1 < _g) {
			var i = _g1++;
			var i1 = intf[i];
			if(i1 == cl || js.Boot.__interfLoop(i1,cl)) return true;
		}
	}
	return js.Boot.__interfLoop(cc.__super__,cl);
}
js.Boot.__instanceof = function(o,cl) {
	try {
		if(o instanceof cl) {
			if(cl == Array) return o.__enum__ == null;
			return true;
		}
		if(js.Boot.__interfLoop(o.__class__,cl)) return true;
	} catch( e ) {
		if(cl == null) return false;
	}
	switch(cl) {
	case Int:
		return Math.ceil(o%2147483648.0) === o;
	case Float:
		return typeof(o) == "number";
	case Bool:
		return o === true || o === false;
	case String:
		return typeof(o) == "string";
	case Dynamic:
		return true;
	default:
		if(o == null) return false;
		return o.__enum__ == cl || cl == Class && o.__name__ != null || cl == Enum && o.__ename__ != null;
	}
}
js.Boot.__init = function() {
	js.Lib.isIE = typeof document!='undefined' && document.all != null && typeof window!='undefined' && window.opera == null;
	js.Lib.isOpera = typeof window!='undefined' && window.opera != null;
	Array.prototype.copy = Array.prototype.slice;
	Array.prototype.insert = function(i,x) {
		this.splice(i,0,x);
	};
	Array.prototype.remove = Array.prototype.indexOf?function(obj) {
		var idx = this.indexOf(obj);
		if(idx == -1) return false;
		this.splice(idx,1);
		return true;
	}:function(obj) {
		var i = 0;
		var l = this.length;
		while(i < l) {
			if(this[i] == obj) {
				this.splice(i,1);
				return true;
			}
			i++;
		}
		return false;
	};
	Array.prototype.iterator = function() {
		return { cur : 0, arr : this, hasNext : function() {
			return this.cur < this.arr.length;
		}, next : function() {
			return this.arr[this.cur++];
		}};
	};
	if(String.prototype.cca == null) String.prototype.cca = String.prototype.charCodeAt;
	String.prototype.charCodeAt = function(i) {
		var x = this.cca(i);
		if(x != x) return null;
		return x;
	};
	var oldsub = String.prototype.substr;
	String.prototype.substr = function(pos,len) {
		if(pos != null && pos != 0 && len != null && len < 0) return "";
		if(len == null) len = this.length;
		if(pos < 0) {
			pos = this.length + pos;
			if(pos < 0) pos = 0;
		} else if(len < 0) len = this.length + len - pos;
		return oldsub.apply(this,[pos,len]);
	};
	$closure = js.Boot.__closure;
}
js.Boot.prototype.__class__ = js.Boot;
pokemmo.Renderer = function() { }
pokemmo.Renderer.__name__ = ["pokemmo","Renderer"];
pokemmo.Renderer.willRender = null;
pokemmo.Renderer.cameraX = null;
pokemmo.Renderer.cameraY = null;
pokemmo.Renderer.renderHooks = null;
pokemmo.Renderer.gameRenderHooks = null;
pokemmo.Renderer.curTransition = null;
pokemmo.Renderer.setup = function() {
	pokemmo.Renderer.resetHooks();
}
pokemmo.Renderer.render = function() {
	if(pokemmo.Renderer.willRender) return;
	pokemmo.Renderer.willRender = true;
	var func = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame;
	if(func == null) func = function(tmp) {
		setTimeout(pokemmo.Renderer.realRender,1);
	};
	func(pokemmo.Renderer.realRender);
}
pokemmo.Renderer.getOffsetX = function() {
	return Math.floor(pokemmo.Game.curGame.map.tilewidth * -pokemmo.Renderer.cameraX);
}
pokemmo.Renderer.getOffsetY = function() {
	return Math.floor(pokemmo.Game.curGame.map.tileheight * -pokemmo.Renderer.cameraY);
}
pokemmo.Renderer.hookRender = function(func) {
	if(pokemmo.Renderer.renderHooks.indexOf(func) != -1) return;
	pokemmo.Renderer.renderHooks.push(func);
}
pokemmo.Renderer.unHookRender = function(func) {
	var i = pokemmo.Renderer.renderHooks.indexOf(func);
	if(i != -1) pokemmo.Renderer.renderHooks.splice(i,1);
}
pokemmo.Renderer.resetHooks = function() {
	pokemmo.Renderer.renderHooks = [];
	pokemmo.Renderer.gameRenderHooks = [];
}
pokemmo.Renderer.realRender = function() {
	pokemmo.Renderer.willRender = false;
	var ctx = pokemmo.Main.ctx;
	var canvas = pokemmo.Main.canvas;
	var onScreenCtx = pokemmo.Main.onScreenCtx;
	var onScreenCanvas = pokemmo.Main.onScreenCanvas;
	var tmpCtx = pokemmo.Main.tmpCtx;
	var tmpCanvas = pokemmo.Main.tmpCanvas;
	ctx.clearRect(0,0,canvas.width,canvas.height);
	ctx.fillStyle = "#66BBFF";
	ctx.fillRect(0,0,canvas.width,canvas.height);
	var g = pokemmo.Game.curGame;
	switch( (pokemmo.Game.state)[1] ) {
	case 0:
		ctx.fillStyle = "#000000";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		break;
	case 2:
		if(g == null) return;
		var map = g.map;
		if(map == null) throw "No map in memory";
		var chr = g.getPlayerChar();
		if(chr != null) {
			pokemmo.Renderer.cameraX = chr.getRenderPosX() / map.tilewidth + 1 - pokemmo.Main.screenWidth / map.tilewidth / 2;
			pokemmo.Renderer.cameraY = chr.getRenderPosY() / map.tileheight - pokemmo.Main.screenHeight / map.tileheight / 2;
		}
		map.render(ctx);
		map.renderAnimated(ctx);
		pokemmo.Game.curGame.renderObjects(ctx);
		map.renderOver(ctx);
		var _g = 0, _g1 = pokemmo.Renderer.gameRenderHooks;
		while(_g < _g1.length) {
			var hk = _g1[_g];
			++_g;
			hk();
		}
		pokemmo.Chat.renderBubbles(ctx);
		if(g.inBattle && g.battle.step != pokemmo.BATTLE_STEP.BATTLE_STEP_TRANSITION) g.battle.render(ctx);
		pokemmo.Chat.render(ctx);
		if(!g.inBattle) pokemmo.UI.renderPokemonParty(ctx);
		if(pokemmo.Renderer.renderHooks.length > 0) {
			var arr = pokemmo.Renderer.renderHooks.copy();
			var _g1 = 0, _g = arr.length;
			while(_g1 < _g) {
				var i = _g1++;
				arr[i]();
			}
		}
		break;
	case 1:
		ctx.fillStyle = "#000000";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "12pt Courier New";
		if(pokemmo.Game.loadError) ctx.fillText("Failed loading files",10,30); else if(pokemmo.Game.pendingLoad == 0) {
			pokemmo.Game.state = pokemmo.GameState.ST_MAP;
			var step = 0;
			var func = null;
			func = function() {
				ctx.fillStyle = "#000000";
				ctx.globalAlpha = 1 - step / 8;
				ctx.fillRect(0,0,canvas.width,canvas.height);
				ctx.globalAlpha = 1;
				++step;
				if(step >= 8) pokemmo.Renderer.unHookRender(func);
			};
			pokemmo.Renderer.hookRender(func);
			pokemmo.Renderer.render();
		} else ctx.fillText("Loading... " + pokemmo.Game.pendingLoad,10,30);
		break;
	case 3:
		ctx.fillStyle = "#000000";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "12pt Courier New";
		ctx.fillText("Disconnected from the server",10,30);
		break;
	case 4:
		pokemmo.TitleScreen.render(ctx);
		break;
	case 6:
		pokemmo.RegisterScreen.render(ctx);
		break;
	case 5:
		pokemmo.NewGameScreen.render(ctx);
		break;
	}
	pokemmo.UI.render(ctx);
	if(pokemmo.Renderer.curTransition != null) pokemmo.Renderer.curTransition.render(ctx);
	onScreenCtx.clearRect(0,0,onScreenCanvas.width,onScreenCanvas.height);
	onScreenCtx.drawImage(canvas,0,0);
	++pokemmo.Renderer.numRTicks;
}
pokemmo.Renderer.drawOverlay = function(ctx,x,y,width,height,drawFunc) {
	var tmpCtx = pokemmo.Main.tmpCtx;
	var overlayWidth = width + 4;
	var overlayHeight = height + 4;
	tmpCtx.clearRect(0,0,overlayWidth,overlayHeight);
	tmpCtx.save();
	tmpCtx.fillStyle = "#FFFF00";
	tmpCtx.fillRect(0,0,overlayWidth,overlayHeight);
	tmpCtx.globalCompositeOperation = "destination-atop";
	drawFunc(tmpCtx);
	tmpCtx.restore();
	ctx.drawImage(pokemmo.Main.tmpCanvas,0,0,width,height,x - 2,y,width,height);
	ctx.drawImage(pokemmo.Main.tmpCanvas,0,0,width,height,x,y - 2,width,height);
	ctx.drawImage(pokemmo.Main.tmpCanvas,0,0,width,height,x,y + 2,width,height);
	ctx.drawImage(pokemmo.Main.tmpCanvas,0,0,width,height,x + 2,y,width,height);
}
pokemmo.Renderer.drawShadowText2 = function(ctx,str,x,y,color,shadowColor) {
	ctx.fillStyle = shadowColor;
	ctx.fillText(str,x + 2,y);
	ctx.fillText(str,x,y + 2);
	ctx.fillText(str,x + 2,y + 2);
	ctx.fillStyle = color;
	ctx.fillText(str,x,y);
}
pokemmo.Renderer.startTransition = function(t) {
	pokemmo.Renderer.curTransition = t;
	return t;
}
pokemmo.Renderer.stopTransition = function() {
	pokemmo.Renderer.curTransition = null;
}
pokemmo.Renderer.isInTransition = function() {
	return pokemmo.Renderer.curTransition != null;
}
pokemmo.Renderer.prototype.__class__ = pokemmo.Renderer;
pokemmo.NewGameScreen = function() { }
pokemmo.NewGameScreen.__name__ = ["pokemmo","NewGameScreen"];
pokemmo.NewGameScreen.starters = null;
pokemmo.NewGameScreen.chars = null;
pokemmo.NewGameScreen.charsImage = null;
pokemmo.NewGameScreen.startersFollowerImage = null;
pokemmo.NewGameScreen.startersSpriteImage = null;
pokemmo.NewGameScreen.border128 = null;
pokemmo.NewGameScreen.arrows = null;
pokemmo.NewGameScreen.curChar = null;
pokemmo.NewGameScreen.curStarter = null;
pokemmo.NewGameScreen.confirmBtn = null;
pokemmo.NewGameScreen.cancelBtn = null;
pokemmo.NewGameScreen.arrowPokLeft = null;
pokemmo.NewGameScreen.arrowPokRight = null;
pokemmo.NewGameScreen.arrowCharLeft = null;
pokemmo.NewGameScreen.arrowCharRight = null;
pokemmo.NewGameScreen.init = function(starters,chars) {
	pokemmo.NewGameScreen.starters = starters;
	pokemmo.NewGameScreen.chars = chars;
	pokemmo.NewGameScreen.pendingLoad = starters.length * 2 + chars.length;
	pokemmo.NewGameScreen.startersFollowerImage = [];
	pokemmo.NewGameScreen.startersSpriteImage = [];
	pokemmo.NewGameScreen.charsImage = [];
	pokemmo.NewGameScreen.curChar = Math.floor(Math.random() * chars.length);
	pokemmo.NewGameScreen.curStarter = Math.floor(Math.random() * starters.length);
	++pokemmo.NewGameScreen.pendingLoad;
	pokemmo.NewGameScreen.border128 = new pokemmo.ImageResource("resources/ui/border_128.png",pokemmo.NewGameScreen.onImageLoad,pokemmo.NewGameScreen.onImageError);
	++pokemmo.NewGameScreen.pendingLoad;
	pokemmo.NewGameScreen.arrows = new pokemmo.ImageResource("resources/ui/arrows.png",pokemmo.NewGameScreen.onImageLoad,pokemmo.NewGameScreen.onImageError);
	var _g = 0;
	while(_g < starters.length) {
		var i = starters[_g];
		++_g;
		pokemmo.NewGameScreen.startersFollowerImage.push(new pokemmo.ImageResource("resources/followers/" + i + ".png",pokemmo.NewGameScreen.onImageLoad,pokemmo.NewGameScreen.onImageError));
		pokemmo.NewGameScreen.startersSpriteImage.push(new pokemmo.ImageResource("resources/sprites/" + i + ".png",pokemmo.NewGameScreen.onImageLoad,pokemmo.NewGameScreen.onImageError));
	}
	var _g = 0;
	while(_g < chars.length) {
		var i = chars[_g];
		++_g;
		pokemmo.NewGameScreen.charsImage.push(new pokemmo.ImageResource("resources/chars/" + i + ".png",pokemmo.NewGameScreen.onImageLoad,pokemmo.NewGameScreen.onImageError));
	}
	pokemmo.NewGameScreen.confirmBtn = new pokemmo.ui.UIButton(340,490,130,30);
	pokemmo.NewGameScreen.confirmBtn.drawIdle = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,200,0,150,50,pokemmo.NewGameScreen.confirmBtn.x - 15,pokemmo.NewGameScreen.confirmBtn.y - 15,150,50);
	};
	pokemmo.NewGameScreen.confirmBtn.drawHover = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,200,50,150,50,pokemmo.NewGameScreen.confirmBtn.x - 15,pokemmo.NewGameScreen.confirmBtn.y - 15,150,50);
	};
	pokemmo.NewGameScreen.confirmBtn.drawDown = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,200,100,150,50,pokemmo.NewGameScreen.confirmBtn.x - 15,pokemmo.NewGameScreen.confirmBtn.y - 15,150,50);
	};
	pokemmo.NewGameScreen.confirmBtn.drawDisabled = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,200,150,150,50,pokemmo.NewGameScreen.confirmBtn.x - 15,pokemmo.NewGameScreen.confirmBtn.y - 15,150,50);
	};
	pokemmo.NewGameScreen.confirmBtn.onSubmit = pokemmo.NewGameScreen.onConfirm;
	pokemmo.UI.inputs.push(pokemmo.NewGameScreen.confirmBtn);
	var createArrow = function(x,y,dir,func) {
		var arrow = new pokemmo.ui.UIButton(x,y,32,32);
		arrow.drawIdle = function(ctx) {
			ctx.drawImage(pokemmo.NewGameScreen.arrows.obj,dir * 32,0,32,32,arrow.x,arrow.y,32,32);
		};
		arrow.drawHover = function(ctx) {
			ctx.drawImage(pokemmo.NewGameScreen.arrows.obj,dir * 32,32,32,32,arrow.x,arrow.y,32,32);
		};
		arrow.drawDown = function(ctx) {
			ctx.drawImage(pokemmo.NewGameScreen.arrows.obj,dir * 32,64,32,32,arrow.x,arrow.y,32,32);
		};
		arrow.onSubmit = func;
		pokemmo.UI.inputs.push(arrow);
		return arrow;
	};
	pokemmo.NewGameScreen.arrowPokLeft = createArrow(260,430,1,function() {
		if(--pokemmo.NewGameScreen.curStarter < 0) pokemmo.NewGameScreen.curStarter += starters.length;
	});
	pokemmo.NewGameScreen.arrowPokRight = createArrow(305,430,3,function() {
		if(++pokemmo.NewGameScreen.curStarter >= starters.length) pokemmo.NewGameScreen.curStarter -= starters.length;
	});
	pokemmo.NewGameScreen.arrowCharLeft = createArrow(468,430,1,function() {
		if(--pokemmo.NewGameScreen.curChar < 0) pokemmo.NewGameScreen.curChar += chars.length;
	});
	pokemmo.NewGameScreen.arrowCharRight = createArrow(513,430,3,function() {
		if(++pokemmo.NewGameScreen.curChar >= chars.length) pokemmo.NewGameScreen.curChar -= chars.length;
	});
}
pokemmo.NewGameScreen.onImageLoad = function() {
	--pokemmo.NewGameScreen.pendingLoad;
	if(pokemmo.NewGameScreen.pendingLoad == 0) pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeIn(10));
}
pokemmo.NewGameScreen.onImageError = function() {
}
pokemmo.NewGameScreen.onConfirm = function() {
	pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeOut(10)).onComplete = function() {
		pokemmo.NewGameScreen.destroy();
		pokemmo.Game.state = pokemmo.GameState.ST_LOADING;
		pokemmo.Connection.socket.emit("newGame",{ starter : pokemmo.NewGameScreen.starters[pokemmo.NewGameScreen.curStarter], character : pokemmo.NewGameScreen.chars[pokemmo.NewGameScreen.curChar]});
	};
}
pokemmo.NewGameScreen.destroy = function() {
	pokemmo.UI.removeInput(pokemmo.NewGameScreen.confirmBtn);
	pokemmo.UI.removeInput(pokemmo.NewGameScreen.arrowPokLeft);
	pokemmo.UI.removeInput(pokemmo.NewGameScreen.arrowPokRight);
	pokemmo.UI.removeInput(pokemmo.NewGameScreen.arrowCharLeft);
	pokemmo.UI.removeInput(pokemmo.NewGameScreen.arrowCharRight);
}
pokemmo.NewGameScreen.render = function(ctx) {
	if(pokemmo.NewGameScreen.pendingLoad > 0) {
		ctx.fillStyle = "#000000";
		ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "12pt Courier New";
		ctx.fillText("Loading... " + pokemmo.NewGameScreen.pendingLoad,10,30);
		return;
	}
	ctx.save();
	ctx.drawImage(pokemmo.TitleScreen.titleLogo.obj,117,80);
	ctx.fillStyle = "#000000";
	ctx.font = "21px Font3";
	ctx.textAlign = "center";
	ctx.fillText("Choose your character and starter Pokémon",400,250);
	ctx.drawImage(pokemmo.NewGameScreen.border128.obj,200,250);
	ctx.drawImage(pokemmo.NewGameScreen.border128.obj,408,250);
	ctx.drawImage(pokemmo.NewGameScreen.startersSpriteImage[pokemmo.NewGameScreen.curStarter].obj,232,282);
	ctx.drawImage(pokemmo.NewGameScreen.startersFollowerImage[pokemmo.NewGameScreen.curStarter].obj,192,Math.floor(pokemmo.Renderer.numRTicks % 10 / 5) * 64,64,64,449,302,64,64);
	ctx.drawImage(pokemmo.NewGameScreen.charsImage[pokemmo.NewGameScreen.curChar].obj,96,Math.floor((pokemmo.Renderer.numRTicks + 3) % 20 / 5) * 64,32,64,508,302,32,64);
	ctx.restore();
}
pokemmo.NewGameScreen.prototype.__class__ = pokemmo.NewGameScreen;
pokemmo.RegisterScreen = function() { }
pokemmo.RegisterScreen.__name__ = ["pokemmo","RegisterScreen"];
pokemmo.RegisterScreen.regsocket = null;
pokemmo.RegisterScreen.confirmBtn = null;
pokemmo.RegisterScreen.cancelBtn = null;
pokemmo.RegisterScreen.captchaImage = null;
pokemmo.RegisterScreen.oldCaptchaImage = null;
pokemmo.RegisterScreen.requestInitTime = null;
pokemmo.RegisterScreen.usernameTxt = null;
pokemmo.RegisterScreen.passwordTxt = null;
pokemmo.RegisterScreen.password2Txt = null;
pokemmo.RegisterScreen.emailTxt = null;
pokemmo.RegisterScreen.captchaTxt = null;
pokemmo.RegisterScreen.sentRequest = null;
pokemmo.RegisterScreen.requestError = null;
pokemmo.RegisterScreen.captchaChallenge = null;
pokemmo.RegisterScreen.ignoreDisconnect = null;
pokemmo.RegisterScreen.init = function() {
	pokemmo.RegisterScreen.regsocket = io.connect("http://localhost:2827");
	pokemmo.RegisterScreen.ignoreDisconnect = false;
	pokemmo.RegisterScreen.confirmBtn = new pokemmo.ui.UIButton(410,490,130,30);
	pokemmo.RegisterScreen.confirmBtn.drawIdle = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,200,0,150,50,pokemmo.RegisterScreen.confirmBtn.x - 15,pokemmo.RegisterScreen.confirmBtn.y - 15,150,50);
	};
	pokemmo.RegisterScreen.confirmBtn.drawHover = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,200,50,150,50,pokemmo.RegisterScreen.confirmBtn.x - 15,pokemmo.RegisterScreen.confirmBtn.y - 15,150,50);
	};
	pokemmo.RegisterScreen.confirmBtn.drawDown = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,200,100,150,50,pokemmo.RegisterScreen.confirmBtn.x - 15,pokemmo.RegisterScreen.confirmBtn.y - 15,150,50);
	};
	pokemmo.RegisterScreen.confirmBtn.drawDisabled = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,200,150,150,50,pokemmo.RegisterScreen.confirmBtn.x - 15,pokemmo.RegisterScreen.confirmBtn.y - 15,150,50);
	};
	pokemmo.RegisterScreen.confirmBtn.onSubmit = pokemmo.RegisterScreen.onConfirm;
	pokemmo.RegisterScreen.cancelBtn = new pokemmo.ui.UIButton(270,490,130,30);
	pokemmo.RegisterScreen.cancelBtn.drawIdle = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,350,0,150,50,pokemmo.RegisterScreen.cancelBtn.x - 15,pokemmo.RegisterScreen.cancelBtn.y - 15,150,50);
	};
	pokemmo.RegisterScreen.cancelBtn.drawHover = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,350,50,150,50,pokemmo.RegisterScreen.cancelBtn.x - 15,pokemmo.RegisterScreen.cancelBtn.y - 15,150,50);
	};
	pokemmo.RegisterScreen.cancelBtn.drawDown = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,350,100,150,50,pokemmo.RegisterScreen.cancelBtn.x - 15,pokemmo.RegisterScreen.cancelBtn.y - 15,150,50);
	};
	pokemmo.RegisterScreen.cancelBtn.drawDisabled = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,350,150,150,50,pokemmo.RegisterScreen.cancelBtn.x - 15,pokemmo.RegisterScreen.cancelBtn.y - 15,150,50);
	};
	pokemmo.RegisterScreen.cancelBtn.onSubmit = pokemmo.RegisterScreen.onCancel;
	pokemmo.RegisterScreen.usernameTxt = pokemmo.UI.createTextInput(245,321,130);
	pokemmo.RegisterScreen.usernameTxt.maxLength = 10;
	pokemmo.RegisterScreen.passwordTxt = pokemmo.UI.createTextInput(245,346,130);
	pokemmo.RegisterScreen.passwordTxt.maxLength = 64;
	pokemmo.RegisterScreen.passwordTxt.isPassword = true;
	pokemmo.RegisterScreen.password2Txt = pokemmo.UI.createTextInput(245,371,130);
	pokemmo.RegisterScreen.password2Txt.maxLength = 64;
	pokemmo.RegisterScreen.password2Txt.isPassword = true;
	pokemmo.RegisterScreen.emailTxt = pokemmo.UI.createTextInput(245,396,130);
	pokemmo.RegisterScreen.emailTxt.maxLength = 100;
	pokemmo.RegisterScreen.captchaTxt = pokemmo.UI.createTextInput(423,360,220);
	pokemmo.RegisterScreen.captchaTxt.maxLength = 100;
	pokemmo.UI.inputs.push(pokemmo.RegisterScreen.confirmBtn);
	pokemmo.UI.inputs.push(pokemmo.RegisterScreen.cancelBtn);
	pokemmo.RegisterScreen.regsocket.on("registration",function(data) {
		pokemmo.RegisterScreen.requestError = data.result;
		if(pokemmo.RegisterScreen.requestError == "success") {
			pokemmo.RegisterScreen.ignoreDisconnect = true;
			pokemmo.RegisterScreen.destroy();
			pokemmo.Connection.socket.emit("login",{ username : pokemmo.RegisterScreen.usernameTxt.value, password : pokemmo.RegisterScreen.passwordTxt.value});
		} else {
			pokemmo.RegisterScreen.requestInitTime = Date.now().getTime();
			pokemmo.RegisterScreen.captchaTxt.value = "";
			pokemmo.RegisterScreen.sentRequest = false;
			if(pokemmo.RegisterScreen.requestError == "short_password" || pokemmo.RegisterScreen.requestError == "long_password" || pokemmo.RegisterScreen.requestError == "invalid_password") pokemmo.RegisterScreen.password2Txt.value = "";
		}
	});
	pokemmo.RegisterScreen.regsocket.on("disconnect",function(data) {
		if(pokemmo.RegisterScreen.ignoreDisconnect) return;
		pokemmo.RegisterScreen.ignoreDisconnect = true;
		pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeOut(10)).onComplete = function() {
			pokemmo.RegisterScreen.destroy();
			pokemmo.Game.state = pokemmo.GameState.ST_TITLE;
			pokemmo.TitleScreen.init();
			pokemmo.Renderer.startTransition(new pokemmo.transitions.BlackScreen(10)).onComplete = function() {
				pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeIn(10));
			};
		};
	});
	pokemmo.RegisterScreen.sentRequest = false;
	pokemmo.RegisterScreen.loadCaptcha();
}
pokemmo.RegisterScreen.destroy = function() {
	pokemmo.RegisterScreen.regsocket.disconnect();
	pokemmo.UI.removeInput(pokemmo.RegisterScreen.confirmBtn);
	pokemmo.UI.removeInput(pokemmo.RegisterScreen.cancelBtn);
	pokemmo.UI.removeInput(pokemmo.RegisterScreen.usernameTxt);
	pokemmo.UI.removeInput(pokemmo.RegisterScreen.passwordTxt);
	pokemmo.UI.removeInput(pokemmo.RegisterScreen.password2Txt);
	pokemmo.UI.removeInput(pokemmo.RegisterScreen.emailTxt);
	pokemmo.UI.removeInput(pokemmo.RegisterScreen.captchaTxt);
}
pokemmo.RegisterScreen.onConfirm = function() {
	if(pokemmo.RegisterScreen.sentRequest) return;
	pokemmo.RegisterScreen.requestError = null;
	pokemmo.RegisterScreen.requestInitTime = Date.now().getTime();
	if(pokemmo.RegisterScreen.usernameTxt.value.length < 4) pokemmo.RegisterScreen.requestError = "short_username"; else if(pokemmo.RegisterScreen.usernameTxt.value.length > 10) pokemmo.RegisterScreen.requestError = "long_username"; else if(pokemmo.RegisterScreen.passwordTxt.value.length < 8) pokemmo.RegisterScreen.requestError = "short_password"; else if(pokemmo.RegisterScreen.passwordTxt.value.length > 32) pokemmo.RegisterScreen.requestError = "long_password"; else if(pokemmo.RegisterScreen.passwordTxt.value != pokemmo.RegisterScreen.password2Txt.value) {
		pokemmo.RegisterScreen.requestError = "mismatch_password";
		pokemmo.RegisterScreen.passwordTxt.value = "";
		pokemmo.RegisterScreen.password2Txt.value = "";
	}
	if(pokemmo.RegisterScreen.requestError != null) return;
	pokemmo.RegisterScreen.sentRequest = true;
	pokemmo.RegisterScreen.oldCaptchaImage = pokemmo.RegisterScreen.captchaImage;
	pokemmo.RegisterScreen.loadCaptcha();
	pokemmo.RegisterScreen.regsocket.emit("register",{ username : pokemmo.RegisterScreen.usernameTxt.value, password : pokemmo.RegisterScreen.passwordTxt.value, challenge : pokemmo.RegisterScreen.captchaChallenge, response : pokemmo.RegisterScreen.captchaTxt.value, email : pokemmo.RegisterScreen.emailTxt.value});
}
pokemmo.RegisterScreen.loadCaptcha = function() {
	var b = document.createElement("script");
	b.type = "text/javascript";
	b.src = "http://www.google.com/recaptcha/api/challenge?k=6Lfxuc4SAAAAAJmKHMi1LS1DkjXj18CvHbd_geFW&ajax=1";
	document.body.appendChild(b);
	window.Recaptcha = { challenge_callback : pokemmo.RegisterScreen.gotChallenge};
}
pokemmo.RegisterScreen.gotChallenge = function() {
	pokemmo.RegisterScreen.captchaChallenge = RecaptchaState.challenge;
	pokemmo.RegisterScreen.captchaImage = new pokemmo.ImageResource("http://www.google.com/recaptcha/api/image?c=" + pokemmo.RegisterScreen.captchaChallenge);
}
pokemmo.RegisterScreen.onCancel = function() {
	pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeOut(10)).onComplete = function() {
		pokemmo.RegisterScreen.destroy();
		pokemmo.Game.state = pokemmo.GameState.ST_TITLE;
		pokemmo.TitleScreen.init();
		pokemmo.Renderer.startTransition(new pokemmo.transitions.BlackScreen(5)).onComplete = function() {
			pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeIn(10));
		};
	};
}
pokemmo.RegisterScreen.render = function(ctx) {
	var now = Date.now().getTime();
	var c2 = Math.floor(255 * ((now - pokemmo.RegisterScreen.requestInitTime) / 2000));
	var cstr = "#" + (16711680 | c2 << 8 | c2).toString(16);
	ctx.drawImage(pokemmo.TitleScreen.titleLogo.obj,117,80);
	pokemmo.Util.drawRoundedRect(145,275,250,150,15,"#FFFFFF",0.7);
	if((pokemmo.RegisterScreen.requestError == "short_username" || pokemmo.RegisterScreen.requestError == "long_username" || pokemmo.RegisterScreen.requestError == "invalid_username" || pokemmo.RegisterScreen.requestError == "username_already_exists") && now - pokemmo.RegisterScreen.requestInitTime < 2000) pokemmo.Util.drawRoundedRect(245,321,135,18,5,cstr,1.0); else pokemmo.Util.drawRoundedRect(245,321,135,18,5,"#FFFFFF",1.0);
	if((pokemmo.RegisterScreen.requestError == "short_password" || pokemmo.RegisterScreen.requestError == "long_password" || pokemmo.RegisterScreen.requestError == "invalid_password" || pokemmo.RegisterScreen.requestError == "mismatch_password") && now - pokemmo.RegisterScreen.requestInitTime < 2000) pokemmo.Util.drawRoundedRect(245,346,135,18,5,cstr,1.0); else pokemmo.Util.drawRoundedRect(245,346,135,18,5,"#FFFFFF",1.0);
	if(pokemmo.RegisterScreen.requestError == "mismatch_password" && now - pokemmo.RegisterScreen.requestInitTime < 2000) pokemmo.Util.drawRoundedRect(245,371,135,18,5,cstr,1.0); else pokemmo.Util.drawRoundedRect(245,371,135,18,5,"#FFFFFF",1.0);
	if(pokemmo.RegisterScreen.requestError == "invalid_email" && now - pokemmo.RegisterScreen.requestInitTime < 2000) pokemmo.Util.drawRoundedRect(245,396,135,18,5,cstr,1.0); else pokemmo.Util.drawRoundedRect(245,396,135,18,5,"#FFFFFF",1.0);
	pokemmo.RegisterScreen.confirmBtn.disabled = pokemmo.RegisterScreen.captchaImage == null || !pokemmo.RegisterScreen.captchaImage.loaded || pokemmo.RegisterScreen.sentRequest;
	pokemmo.RegisterScreen.usernameTxt.disabled = pokemmo.RegisterScreen.passwordTxt.disabled = pokemmo.RegisterScreen.password2Txt.disabled = pokemmo.RegisterScreen.emailTxt.disabled = pokemmo.RegisterScreen.captchaTxt.disabled = pokemmo.RegisterScreen.sentRequest;
	ctx.save();
	ctx.fillStyle = "#000000";
	ctx.font = "21px Font3";
	ctx.fillText("Register",270 - Math.round(ctx.measureText("Register").width / 2),300);
	ctx.font = "12px Font3";
	ctx.fillText("ID:",155,335);
	ctx.fillText("PW:",155,360);
	ctx.fillText("PW (Again):",155,385);
	ctx.fillText("Email:",155,410);
	ctx.restore();
	if(pokemmo.RegisterScreen.requestError == "invalid_captcha" && now - pokemmo.RegisterScreen.requestInitTime < 2000) pokemmo.Util.drawRoundedRect(410,275,250,115,15,cstr,0.7); else pokemmo.Util.drawRoundedRect(410,275,250,115,15,"#FFFFFF",0.7);
	if(pokemmo.RegisterScreen.sentRequest) {
		if(pokemmo.RegisterScreen.oldCaptchaImage != null && pokemmo.RegisterScreen.oldCaptchaImage.loaded) ctx.drawImage(pokemmo.RegisterScreen.oldCaptchaImage.obj,423,285,225,42);
	} else if(pokemmo.RegisterScreen.captchaImage != null && pokemmo.RegisterScreen.captchaImage.loaded) ctx.drawImage(pokemmo.RegisterScreen.captchaImage.obj,423,285,225,42);
	pokemmo.Util.drawRoundedRect(423,360,225,18,5,"#FFFFFF",1.0);
	ctx.fillStyle = "#000000";
	ctx.font = "12px Font3";
	ctx.fillText("Type the words above:",423 + 225 / 2 - ctx.measureText("Type the words above:").width / 2,350);
	if(pokemmo.RegisterScreen.sentRequest) ctx.drawImage(pokemmo.TitleScreen.loadingImg.obj,0,32 * (Math.floor((now - pokemmo.RegisterScreen.requestInitTime) / 100) % 12),32,32,384,440,32,32);
	if(now - pokemmo.RegisterScreen.requestInitTime < 4000) {
		var errorMsg = null;
		switch(pokemmo.RegisterScreen.requestError) {
		case "short_username":
			errorMsg = "Username is too short (min. 4 characters)";
			break;
		case "long_username":
			errorMsg = "Username is too long (max. 10 characters)";
			break;
		case "invalid_username":
			errorMsg = "Invalid username (alphanumeric and underscore only)";
			break;
		case "username_already_exists":
			errorMsg = "Username already exists";
			break;
		case "email_already_registered":
			errorMsg = "Email is already registered";
			break;
		case "short_password":
			errorMsg = "Password is too short (min. 8 characters)";
			break;
		case "long_password":
			errorMsg = "Password is too long (max. 32 characters)";
			break;
		case "invalid_password":
			errorMsg = "Invalid password characters (alphanumeric and _!@#$%&*()[]{}.,:;- only)";
			break;
		case "invalid_email":
			errorMsg = "Invalid email";
			break;
		case "internal_error":
			errorMsg = "Internal Server Error";
			break;
		case "registration_disabled":
			errorMsg = "Registration disabled";
			break;
		case "invalid_captcha":
			errorMsg = "Invalid captcha";
			break;
		case "mismatch_password":
			errorMsg = "Passwords mismatch";
			break;
		case "registered_recently":
			errorMsg = "You already registered an account recently";
			break;
		}
		if(errorMsg != null) {
			ctx.save();
			ctx.fillStyle = "rgba(200,0,0," + pokemmo.Util.clamp(4 - (now - pokemmo.RegisterScreen.requestInitTime) / 1000,0,1) + ")";
			ctx.textAlign = "center";
			ctx.fillText(errorMsg,400,465);
			ctx.restore();
		}
	}
}
pokemmo.RegisterScreen.prototype.__class__ = pokemmo.RegisterScreen;
pokemmo.TitleScreen = function() { }
pokemmo.TitleScreen.__name__ = ["pokemmo","TitleScreen"];
pokemmo.TitleScreen.usernameTxt = null;
pokemmo.TitleScreen.passwordTxt = null;
pokemmo.TitleScreen.loginButton = null;
pokemmo.TitleScreen.registerButton = null;
pokemmo.TitleScreen.donateButton = null;
pokemmo.TitleScreen.titleScreen = null;
pokemmo.TitleScreen.titleLogo = null;
pokemmo.TitleScreen.titleButtons = null;
pokemmo.TitleScreen.loadingImg = null;
pokemmo.TitleScreen.sentLogin = null;
pokemmo.TitleScreen.loginInitTime = null;
pokemmo.TitleScreen.tweets = null;
pokemmo.TitleScreen.setup = function() {
	pokemmo.TitleScreen.titleScreen = pokemmo.Game.loadImageResource("titleScreen","resources/ui/title.png");
	pokemmo.TitleScreen.titleLogo = pokemmo.Game.loadImageResource("titleLogo","resources/ui/title_logo.png");
	pokemmo.TitleScreen.titleButtons = pokemmo.Game.loadImageResource("titleButtons","resources/ui/title_buttons.png");
	pokemmo.TitleScreen.loadingImg = pokemmo.Game.loadImageResource("loading","resources/ui/loading.png");
	var b = document.createElement("script");
	b.type = "text/javascript";
	b.src = pokemmo.TitleScreen.TWITTER_API_URL;
	document.body.appendChild(b);
	window.twitterAPIResult = pokemmo.TitleScreen.onTwitterResult;
}
pokemmo.TitleScreen.init = function() {
	pokemmo.TitleScreen.usernameTxt = pokemmo.UI.createTextInput(350,321,130);
	pokemmo.TitleScreen.usernameTxt.maxLength = 10;
	pokemmo.TitleScreen.passwordTxt = pokemmo.UI.createTextInput(350,346,130);
	pokemmo.TitleScreen.passwordTxt.maxLength = 64;
	pokemmo.TitleScreen.passwordTxt.isPassword = true;
	pokemmo.TitleScreen.loginButton = new pokemmo.ui.UIButton(455,375,30,30);
	pokemmo.TitleScreen.loginButton.drawIdle = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,0,0,50,50,445,365,50,50);
	};
	pokemmo.TitleScreen.loginButton.drawHover = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,0,50,50,50,445,365,50,50);
	};
	pokemmo.TitleScreen.loginButton.drawDown = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,0,100,50,50,445,365,50,50);
	};
	pokemmo.TitleScreen.loginButton.drawDisabled = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,0,150,50,50,445,365,50,50);
	};
	pokemmo.TitleScreen.loginButton.onSubmit = pokemmo.TitleScreen.onLoginSubmit;
	pokemmo.UI.inputs.push(pokemmo.TitleScreen.loginButton);
	pokemmo.TitleScreen.registerButton = new pokemmo.ui.UIButton(310,375,130,30);
	pokemmo.TitleScreen.registerButton.drawIdle = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,50,0,150,50,300,365,150,50);
	};
	pokemmo.TitleScreen.registerButton.drawHover = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,50,50,150,50,300,365,150,50);
	};
	pokemmo.TitleScreen.registerButton.drawDown = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,50,100,150,50,300,365,150,50);
	};
	pokemmo.TitleScreen.registerButton.drawDisabled = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,50,150,150,50,300,365,150,50);
	};
	pokemmo.TitleScreen.registerButton.onSubmit = pokemmo.TitleScreen.onRegisterSubmit;
	pokemmo.UI.inputs.push(pokemmo.TitleScreen.registerButton);
	pokemmo.TitleScreen.donateButton = new pokemmo.ui.UIButton(305,470,190,30);
	pokemmo.TitleScreen.donateButton.drawIdle = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,500,0,210,50,295,460,210,50);
	};
	pokemmo.TitleScreen.donateButton.drawHover = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,500,50,210,50,295,460,210,50);
	};
	pokemmo.TitleScreen.donateButton.drawDown = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,500,100,210,50,295,460,210,50);
	};
	pokemmo.TitleScreen.donateButton.drawDisabled = function(ctx) {
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,500,150,210,50,295,460,210,50);
	};
	pokemmo.TitleScreen.donateButton.instantSubmit = true;
	pokemmo.TitleScreen.donateButton.onSubmit = function() {
		window.open("https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=QBXGPHQPQ5G5Y","_blank");
	};
	pokemmo.UI.inputs.push(pokemmo.TitleScreen.donateButton);
	pokemmo.TitleScreen.usernameTxt.select();
	pokemmo.UI.enterButtonHooks.push(pokemmo.TitleScreen.onEnterButton);
}
pokemmo.TitleScreen.destroy = function() {
	pokemmo.UI.removeInput(pokemmo.TitleScreen.usernameTxt);
	pokemmo.UI.removeInput(pokemmo.TitleScreen.passwordTxt);
	pokemmo.UI.removeInput(pokemmo.TitleScreen.loginButton);
	pokemmo.UI.removeInput(pokemmo.TitleScreen.registerButton);
	pokemmo.UI.removeInput(pokemmo.TitleScreen.donateButton);
}
pokemmo.TitleScreen.onTwitterResult = function(data) {
	pokemmo.TitleScreen.tweets = data.results;
}
pokemmo.TitleScreen.onLoginSubmit = function() {
	if(pokemmo.TitleScreen.sentLogin) return;
	if(pokemmo.TitleScreen.usernameTxt.value.length < 4 || pokemmo.TitleScreen.passwordTxt.value.length < 8) return;
	pokemmo.TitleScreen.sentLogin = true;
	pokemmo.TitleScreen.loginInitTime = Date.now().getTime();
	pokemmo.Connection.socket.emit("login",{ username : pokemmo.TitleScreen.usernameTxt.value, password : pokemmo.TitleScreen.passwordTxt.value});
}
pokemmo.TitleScreen.onRegisterSubmit = function() {
	if(pokemmo.TitleScreen.sentLogin) return;
	pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeOut(10)).onComplete = function() {
		pokemmo.TitleScreen.destroy();
		pokemmo.Game.state = pokemmo.GameState.ST_REGISTER;
		pokemmo.RegisterScreen.init();
		pokemmo.RegisterScreen.usernameTxt.value = pokemmo.TitleScreen.usernameTxt.value;
		pokemmo.RegisterScreen.passwordTxt.value = pokemmo.TitleScreen.passwordTxt.value;
		pokemmo.Renderer.startTransition(new pokemmo.transitions.BlackScreen(5)).onComplete = function() {
			pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeIn(10));
		};
	};
}
pokemmo.TitleScreen.loginFailed = function() {
	pokemmo.TitleScreen.sentLogin = false;
	pokemmo.TitleScreen.loginInitTime = Date.now().getTime();
	pokemmo.TitleScreen.passwordTxt.value = "";
}
pokemmo.TitleScreen.onEnterButton = function() {
	if(pokemmo.UI.selectedInput == pokemmo.TitleScreen.usernameTxt || pokemmo.UI.selectedInput == pokemmo.TitleScreen.passwordTxt) pokemmo.TitleScreen.onLoginSubmit();
	pokemmo.UI.enterButtonHooks.push(pokemmo.TitleScreen.onEnterButton);
}
pokemmo.TitleScreen.render = function(ctx) {
	var canvas = ctx.canvas;
	if(!pokemmo.TitleScreen.titleScreen.loaded || !pokemmo.TitleScreen.titleButtons.loaded || !pokemmo.TitleScreen.titleLogo.loaded || !pokemmo.TitleScreen.loadingImg.loaded) {
		ctx.fillStyle = "#000000";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		return;
	}
	var now = Date.now().getTime();
	ctx.drawImage(pokemmo.TitleScreen.titleScreen.obj,0,0);
	ctx.drawImage(pokemmo.TitleScreen.titleLogo.obj,117,80);
	if(pokemmo.TitleScreen.sentLogin) {
		pokemmo.TitleScreen.usernameTxt.disabled = true;
		pokemmo.TitleScreen.passwordTxt.disabled = true;
		pokemmo.TitleScreen.loginButton.disabled = true;
		pokemmo.TitleScreen.registerButton.disabled = true;
		pokemmo.Util.drawRoundedRect(300,275,200,140,15,"#FFFFFF",0.35);
		pokemmo.Util.drawRoundedRect(350,321,135,18,5,"#FFFFFF",0.5);
		pokemmo.Util.drawRoundedRect(350,346,135,18,5,"#FFFFFF",0.5);
		ctx.drawImage(pokemmo.TitleScreen.loadingImg.obj,0,32 * (Math.floor((now - pokemmo.TitleScreen.loginInitTime) / 100) % 12),32,32,384,425,32,32);
	} else {
		pokemmo.TitleScreen.usernameTxt.disabled = false;
		pokemmo.TitleScreen.passwordTxt.disabled = false;
		pokemmo.TitleScreen.loginButton.disabled = pokemmo.TitleScreen.usernameTxt.value.length < 4 || pokemmo.TitleScreen.passwordTxt.value.length < 8;
		pokemmo.TitleScreen.registerButton.disabled = false;
		pokemmo.Util.drawRoundedRect(300,275,200,140,15,"#FFFFFF",0.7);
		pokemmo.Util.drawRoundedRect(350,321,135,18,5,"#FFFFFF",1.0);
		pokemmo.Util.drawRoundedRect(350,346,135,18,5,"#FFFFFF",1.0);
	}
	ctx.save();
	ctx.fillStyle = "#000000";
	ctx.font = "21px Font3";
	ctx.fillText("Login",400 - Math.round(ctx.measureText("Login").width / 2),300);
	ctx.font = "12px Font3";
	ctx.fillText("ID:",310,335);
	ctx.fillText("PW:",310,360);
	if(!pokemmo.TitleScreen.sentLogin && now - pokemmo.TitleScreen.loginInitTime < 4000) {
		ctx.fillStyle = "rgba(200,0,0," + pokemmo.Util.clamp(4 - (now - pokemmo.TitleScreen.loginInitTime) / 1000,0,1) + ")";
		ctx.textAlign = "center";
		ctx.fillText("Invalid username or password",400,430);
	}
	ctx.restore();
	if(pokemmo.TitleScreen.tweets != null && pokemmo.TitleScreen.tweets.length > 0) {
		ctx.save();
		var MAX_TWEET_WIDTH = 185;
		var tweetsHeight = 10;
		var _g = 0, _g1 = pokemmo.TitleScreen.tweets;
		while(_g < _g1.length) {
			var t = _g1[_g];
			++_g;
			ctx.font = "italic 12px Courier";
			var w = ctx.measureText(t.text).width;
			if(w < MAX_TWEET_WIDTH) tweetsHeight += 15; else tweetsHeight += 15 * pokemmo.Util.reduceTextSize(t.text,MAX_TWEET_WIDTH,ctx).length;
			tweetsHeight += 10;
		}
		if(tweetsHeight <= 0) return;
		pokemmo.Util.drawRoundedRect(20,275,260,tweetsHeight,15,"#FFFFFF",0.7);
		ctx.translate(30,300);
		var _g = 0, _g1 = pokemmo.TitleScreen.tweets;
		while(_g < _g1.length) {
			var t = _g1[_g];
			++_g;
			ctx.fillStyle = "#000000";
			ctx.font = "bold 12px Courier";
			var uw = ctx.measureText(t.from_user_name + ": ").width;
			ctx.fillText(t.from_user_name + ": ",0,0);
			ctx.font = "italic 12px Courier";
			var str = t.text.substr("#ANN ".length);
			var w = ctx.measureText(t.text).width;
			if(w < MAX_TWEET_WIDTH) {
				ctx.fillText(str,uw + 2,0);
				ctx.translate(0,15);
			} else {
				var lines = pokemmo.Util.reduceTextSize(str,MAX_TWEET_WIDTH,ctx);
				var _g2 = 0;
				while(_g2 < lines.length) {
					var l = lines[_g2];
					++_g2;
					ctx.fillText(l,uw + 2,0);
					ctx.translate(0,15);
				}
			}
			ctx.translate(0,10);
		}
		ctx.restore();
		ctx.drawImage(ctx.canvas,0,0);
	}
	ctx.font = "12px Courier";
	ctx.fillStyle = "#000000";
	ctx.fillText("Version: " + 0 + "." + 1 + "/" + 1609,10,600);
}
pokemmo.TitleScreen.prototype.__class__ = pokemmo.TitleScreen;
pokemmo.PokemonConst = function() { }
pokemmo.PokemonConst.__name__ = ["pokemmo","PokemonConst"];
pokemmo.PokemonConst.typeNameToInt = function(name) {
	switch(name.toLowerCase()) {
	case "normal":
		return 0;
	case "fire":
		return 1;
	case "water":
		return 2;
	case "ice":
		return 3;
	case "electric":
		return 4;
	case "grass":
		return 5;
	case "ground":
		return 6;
	case "rock":
		return 7;
	case "fight":
		return 8;
	case "fighting":
		return 8;
	case "steel":
		return 9;
	case "dark":
		return 10;
	case "psychic":
		return 11;
	case "flying":
		return 12;
	case "bug":
		return 13;
	case "poison":
		return 14;
	case "ghost":
		return 15;
	case "dragon":
		return 16;
	case "unknown":
		return 17;
	}
	throw "Unknown move type: " + name;
}
pokemmo.PokemonConst.getStatusName = function(id) {
	switch(id) {
	case 0:
		return "None";
	case 1:
		return "Sleep";
	case 2:
		return "Freeze";
	case 3:
		return "Paralyze";
	case 4:
		return "Poison";
	case 5:
		return "Burn";
	}
	throw "Unknown status type: " + id;
}
pokemmo.PokemonConst.getStatusApplyPhrase = function(id,name) {
	switch(id) {
	case 1:
		return name + " fell asleep!";
	case 2:
		return name + " is frozen solid!";
	case 3:
		return name + " is paralyzed";
	case 4:
		return name + " is poisoned!";
	case 5:
		return name + " is burned!";
	}
	throw "Unknown status type: " + id;
}
pokemmo.PokemonConst.prototype.__class__ = pokemmo.PokemonConst;
StringBuf = function(p) {
	if( p === $_ ) return;
	this.b = new Array();
}
StringBuf.__name__ = ["StringBuf"];
StringBuf.prototype.add = function(x) {
	this.b[this.b.length] = x == null?"null":x;
}
StringBuf.prototype.addSub = function(s,pos,len) {
	this.b[this.b.length] = s.substr(pos,len);
}
StringBuf.prototype.addChar = function(c) {
	this.b[this.b.length] = String.fromCharCode(c);
}
StringBuf.prototype.toString = function() {
	return this.b.join("");
}
StringBuf.prototype.b = null;
StringBuf.prototype.__class__ = StringBuf;
pokemmo.entities.CGrassAnimation = function(x,y) {
	if( x === $_ ) return;
	pokemmo.GameObject.call(this,x,y);
	this.createdTick = pokemmo.Renderer.numRTicks;
	this.isTemporary = true;
}
pokemmo.entities.CGrassAnimation.__name__ = ["pokemmo","entities","CGrassAnimation"];
pokemmo.entities.CGrassAnimation.__super__ = pokemmo.GameObject;
for(var k in pokemmo.GameObject.prototype ) pokemmo.entities.CGrassAnimation.prototype[k] = pokemmo.GameObject.prototype[k];
pokemmo.entities.CGrassAnimation.prototype.createdTick = null;
pokemmo.entities.CGrassAnimation.prototype.tick = function() {
	if(pokemmo.Renderer.numRTicks - this.createdTick >= 16) {
		this.destroy();
		return;
	}
}
pokemmo.entities.CGrassAnimation.prototype.render = function(ctx) {
	if(pokemmo.Renderer.numRTicks - this.createdTick >= 16) {
		this.destroy();
		return;
	}
	var curMap = pokemmo.Map.getCurMap();
	ctx.drawImage(pokemmo.Game.res["miscSprites"].obj,32,32 * Math.floor((pokemmo.Renderer.numRTicks - this.createdTick) / 4),32,32,this.x * curMap.tilewidth + pokemmo.Renderer.getOffsetX(),this.y * curMap.tileheight + pokemmo.Renderer.getOffsetY(),32,32);
}
pokemmo.entities.CGrassAnimation.prototype.__class__ = pokemmo.entities.CGrassAnimation;
pokemmo.transitions.BattleTransition001 = function(p) {
	if( p === $_ ) return;
	pokemmo.Transition.call(this);
}
pokemmo.transitions.BattleTransition001.__name__ = ["pokemmo","transitions","BattleTransition001"];
pokemmo.transitions.BattleTransition001.__super__ = pokemmo.Transition;
for(var k in pokemmo.Transition.prototype ) pokemmo.transitions.BattleTransition001.prototype[k] = pokemmo.Transition.prototype[k];
pokemmo.transitions.BattleTransition001.prototype.render = function(ctx) {
	if(this.step < 0) return;
	ctx.fillStyle = "#000000";
	var canvas = ctx.canvas;
	var tmpCtx = pokemmo.Main.tmpCtx;
	var g = pokemmo.Game.curGame;
	if(this.step >= 50) g.battle.render(ctx);
	if(this.step < 20) {
	} else if(this.step < 38) {
		var h = (this.step - 20) * (this.step - 20);
		ctx.fillRect(0,0,canvas.width,h);
		ctx.fillRect(0,canvas.height - h,canvas.width,h);
	} else if(this.step < 50) {
		ctx.fillRect(0,0,canvas.width,canvas.height);
		g.drawPlayerChar = false;
		g.drawPlayerFollower = false;
		var chr = pokemmo.Game.curGame.getPlayerChar();
		if(chr != null) {
			chr.x = g.battle.x;
			chr.y = g.battle.y;
		}
	} else if(this.step < 70) {
		var perc = (this.step - 50) / 20;
		if(perc > 1) perc = 1;
		perc *= perc;
		ctx.fillRect(0,canvas.height / 2 - 80 / 2,canvas.width,80);
		var h = (canvas.height / 2 - 80 / 2) * (1 - perc);
		ctx.fillRect(0,canvas.height / 2 - 80 / 2 - h,canvas.width,h);
		ctx.fillRect(0,canvas.height / 2 + 80 / 2,canvas.width,h);
		ctx.save();
		ctx.translate(canvas.width / 2,canvas.height / 2);
		ctx.rotate(Math.PI * 2 * perc);
		ctx.scale(perc,perc);
		ctx.drawImage(pokemmo.Game.res["battleIntroPokeball"].obj,-60,-60);
		ctx.restore();
	} else if(this.step < 100) {
		var perc = (this.step - 80) / 20;
		pokemmo.Main.tmpCtx.clearRect(0,0,pokemmo.Main.tmpCanvas.width,pokemmo.Main.tmpCanvas.height);
		tmpCtx.fillStyle = "rgb(0, 0, 0)";
		tmpCtx.fillRect(0,canvas.height / 2 - 80 / 2,canvas.width,80);
		tmpCtx.drawImage(pokemmo.Game.res["battleIntroPokeball"].obj,canvas.width / 2 - 60,canvas.height / 2 - 60);
		ctx.globalAlpha = pokemmo.Util.clamp(1 - perc,0,1);
		ctx.drawImage(pokemmo.Main.tmpCanvas,0,0);
		ctx.globalAlpha = 1;
	} else {
		g.battle.step = pokemmo.BATTLE_STEP.BATTLE_STEP_POKEMON_APPEARED_TMP;
		this.complete();
	}
	++this.step;
}
pokemmo.transitions.BattleTransition001.prototype.__class__ = pokemmo.transitions.BattleTransition001;
pokemmo.ui.UIButton = function(x,y,width,height) {
	if( x === $_ ) return;
	pokemmo.ui.UIInput.call(this,x,y);
	this.width = width;
	this.height = height;
	this.mouseWasDown = false;
	this.keyWasDown = false;
	this.instantSubmit = false;
}
pokemmo.ui.UIButton.__name__ = ["pokemmo","ui","UIButton"];
pokemmo.ui.UIButton.__super__ = pokemmo.ui.UIInput;
for(var k in pokemmo.ui.UIInput.prototype ) pokemmo.ui.UIButton.prototype[k] = pokemmo.ui.UIInput.prototype[k];
pokemmo.ui.UIButton.prototype.drawIdle = null;
pokemmo.ui.UIButton.prototype.drawHover = null;
pokemmo.ui.UIButton.prototype.drawDown = null;
pokemmo.ui.UIButton.prototype.drawDisabled = null;
pokemmo.ui.UIButton.prototype.onSubmit = null;
pokemmo.ui.UIButton.prototype.instantSubmit = null;
pokemmo.ui.UIButton.prototype.width = null;
pokemmo.ui.UIButton.prototype.height = null;
pokemmo.ui.UIButton.prototype.mouseWasDown = null;
pokemmo.ui.UIButton.prototype.keyWasDown = null;
pokemmo.ui.UIButton.prototype.tick = function() {
	if(this.disabled) return;
	if(this.isUnderMouse()) pokemmo.Main.onScreenCanvas.style.cursor = "pointer";
}
pokemmo.ui.UIButton.prototype.submit = function() {
	if(this.onSubmit != null) this.onSubmit();
	this.mouseWasDown = false;
	this.keyWasDown = false;
}
pokemmo.ui.UIButton.prototype.render = function(ctx) {
	if(this.disabled) {
		this.mouseWasDown = false;
		this.keyWasDown = false;
		this.drawDisabled(ctx);
		return;
	}
	if(this.selected) {
		if(pokemmo.UI.mouseDown && this.isUnderMouse() || !!pokemmo.UI.keysDown[13] || !!pokemmo.UI.keysDown[32]) this.drawDown(ctx); else {
			this.drawHover(ctx);
			if(this.mouseWasDown && this.isUnderMouse() || this.keyWasDown) {
				if(!this.keyWasDown) this.blur();
				this.submit();
			}
		}
	} else if(this.isUnderMouse()) this.drawHover(ctx); else this.drawIdle(ctx);
	this.mouseWasDown = pokemmo.UI.mouseDown;
	this.keyWasDown = !!pokemmo.UI.keysDown[13] || !!pokemmo.UI.keysDown[32];
}
pokemmo.ui.UIButton.prototype.isUnderMouse = function() {
	return pokemmo.UI.mouseX >= this.x && pokemmo.UI.mouseY >= this.y && pokemmo.UI.mouseX < this.x + this.width && pokemmo.UI.mouseY < this.y + this.height;
}
pokemmo.ui.UIButton.prototype.__class__ = pokemmo.ui.UIButton;
pokemmo.Battle = function(data) {
	if( data === $_ ) return;
	this.type = data.type;
	this.x = data.x;
	this.y = data.y;
	this.myId = data.id;
	this.myTeam = data.team;
	this.battleFinished = false;
	this.players = data.info.players;
	switch(this.type) {
	case 0:
		this.setCurPokemon(data.info.players[this.myId].pokemon);
		this.enemyPokemon = data.info.players[this.myId == 0?1:0].pokemon;
		break;
	default:
		throw "Invalid battle type";
	}
	this.background = pokemmo.Game.curGame.getImage("resources/ui/battle_background1.png");
	this.enemyPokemon.sprite = pokemmo.Game.curGame.getImage("resources/sprites" + (this.enemyPokemon.shiny?"_shiny":"") + "/" + this.enemyPokemon.id + ".png");
	this.randInt = Math.floor(Math.random() * 100000);
	this.step = pokemmo.BATTLE_STEP.BATTLE_STEP_TRANSITION;
	this.text = "";
	this.selectedAction = 0;
	this.canRenderEnemy = true;
	this.canRenderPlayerPokemon = true;
	this.enemyFainted = false;
	this.pokemonFainted = false;
	this.runningQueue = false;
	this.shakeEnemyStatus = false;
	this.shakePokemonStatus = false;
	this.resultQueue = [];
	pokemmo.UI.dirButtonHooks.push($closure(this,"buttonHandler"));
}
pokemmo.Battle.__name__ = ["pokemmo","Battle"];
pokemmo.Battle.prototype.step = null;
pokemmo.Battle.prototype.type = null;
pokemmo.Battle.prototype.myId = null;
pokemmo.Battle.prototype.myTeam = null;
pokemmo.Battle.prototype.x = null;
pokemmo.Battle.prototype.y = null;
pokemmo.Battle.prototype.curPokemon = null;
pokemmo.Battle.prototype.enemyPokemon = null;
pokemmo.Battle.prototype.background = null;
pokemmo.Battle.prototype.now = null;
pokemmo.Battle.prototype.selectedAction = null;
pokemmo.Battle.prototype.selectedMove = null;
pokemmo.Battle.prototype.text = null;
pokemmo.Battle.prototype.textTime = null;
pokemmo.Battle.prototype.textCompleted = null;
pokemmo.Battle.prototype.textCompletedTime = null;
pokemmo.Battle.prototype.textDelay = null;
pokemmo.Battle.prototype.textOnComplete = null;
pokemmo.Battle.prototype.textOnYes = null;
pokemmo.Battle.prototype.textOnNo = null;
pokemmo.Battle.prototype.textQuestion = null;
pokemmo.Battle.prototype.textQuestionSelectedAnswer = null;
pokemmo.Battle.prototype.animStep = null;
pokemmo.Battle.prototype.canRenderEnemy = null;
pokemmo.Battle.prototype.canRenderPlayerPokemon = null;
pokemmo.Battle.prototype.enemyFainted = null;
pokemmo.Battle.prototype.enemyFaintedTick = null;
pokemmo.Battle.prototype.pokemonFainted = null;
pokemmo.Battle.prototype.pokemonFaintedTick = null;
pokemmo.Battle.prototype.shakeEnemyStatus = null;
pokemmo.Battle.prototype.shakePokemonStatus = null;
pokemmo.Battle.prototype.resultQueue = null;
pokemmo.Battle.prototype.curAction = null;
pokemmo.Battle.prototype.moveStartTime = null;
pokemmo.Battle.prototype.curMove = null;
pokemmo.Battle.prototype.randInt = null;
pokemmo.Battle.prototype.battleFinished = null;
pokemmo.Battle.prototype.learningMove = null;
pokemmo.Battle.prototype.forgetMoveSelected = null;
pokemmo.Battle.prototype.runningQueue = null;
pokemmo.Battle.prototype.players = null;
pokemmo.Battle.prototype.setCurPokemon = function(pk) {
	pk.backsprite = pokemmo.Game.curGame.getImage("resources/back" + (pk.shiny?"_shiny":"") + "/" + pk.id + ".png");
	pk.iconBig = pokemmo.Game.curGame.getImage("resources/picons/" + pk.id + "_1_x2.png");
	this.curPokemon = pk;
}
pokemmo.Battle.prototype.render = function(ctx) {
	var me = this;
	this.now = Date.now().getTime();
	ctx.save();
	ctx.translate(pokemmo.Main.isPhone?0:160,pokemmo.Main.isPhone?0:140);
	if(this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_LEARN_MOVE) this.renderLearnMove(ctx); else {
		if(this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_TURN && this.curMove != null) this.curMove.render(ctx,this);
		ctx.lineWidth = 2;
		ctx.strokeStyle = "rgb(0,0,0)";
		ctx.strokeRect(-1,-1,482,226);
		if(this.background.obj.width != 0) ctx.drawImage(this.background.obj,0,0);
		if(this.step != pokemmo.BATTLE_STEP.BATTLE_STEP_FIGHT_MENU) this.drawBottomPanel(ctx);
		if(this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_FIGHT_MENU) this.drawFightMenu(ctx);
		if(this.canRenderEnemy) this.renderEnemy(ctx);
		if(this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_TRANSITION || this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_POKEMON_APPEARED_TMP || this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_POKEMON_APPEARED) ctx.drawImage(pokemmo.Game.res["playerBacksprite"].obj,0,0,128,128,60,96,128,128); else if(this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_GO_POKEMON) this.drawGoPokemonAnimation(ctx); else if(this.canRenderPlayerPokemon) this.drawPlayerPokemon(ctx);
		this.drawEnemyStatus(ctx);
		if(this.step != pokemmo.BATTLE_STEP.BATTLE_STEP_TRANSITION && this.step != pokemmo.BATTLE_STEP.BATTLE_STEP_POKEMON_APPEARED_TMP && this.step != pokemmo.BATTLE_STEP.BATTLE_STEP_POKEMON_APPEARED && this.step != pokemmo.BATTLE_STEP.BATTLE_STEP_GO_POKEMON) this.drawPokemonStatus(ctx);
		if(this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_POKEMON_APPEARED_TMP) {
			this.step = pokemmo.BATTLE_STEP.BATTLE_STEP_POKEMON_APPEARED;
			this.setBattleText(pokemmo.Util.getPokemonDisplayName(this.enemyPokemon) + " appeared!",-1,function() {
				var pk = me.curPokemon;
				me.setBattleText("Go! " + pokemmo.Util.getPokemonDisplayName(me.curPokemon) + "!");
				me.step = pokemmo.BATTLE_STEP.BATTLE_STEP_GO_POKEMON;
				me.animStep = 0;
				me.selectedMove = 0;
			});
		}
		if(this.step != pokemmo.BATTLE_STEP.BATTLE_STEP_FIGHT_MENU && this.text != "" && this.textCompleted && this.textQuestion) {
			ctx.drawImage(pokemmo.Game.res["battleYesNo"].obj,370,130);
			if(this.textQuestionSelectedAnswer) ctx.drawImage(pokemmo.Game.res["battleMisc"].obj,96,0,32,32,376 + Math.floor(this.now % 1000 / 500) * 2,148,32,32); else ctx.drawImage(pokemmo.Game.res["battleMisc"].obj,96,0,32,32,376 + Math.floor(this.now % 1000 / 500) * 2,178,32,32);
		}
	}
	ctx.restore();
}
pokemmo.Battle.prototype.renderLearnMove = function(ctx) {
	ctx.drawImage(pokemmo.Game.res["battleLearnMove"].obj,0,0);
	ctx.drawImage(this.curPokemon.iconBig.obj,16,32);
	ctx.drawImage(pokemmo.Game.res["types"].obj,0,24 * pokemmo.PokemonConst.typeNameToInt(pokemmo.Game.pokemonData[this.curPokemon.id].type1),64,24,96,70,64,24);
	if(pokemmo.Game.pokemonData[this.curPokemon.id].type2 != null) ctx.drawImage(pokemmo.Game.res["types"].obj,0,24 * pokemmo.PokemonConst.typeNameToInt(pokemmo.Game.pokemonData[this.curPokemon.id].type2),64,24,164,70,64,24);
	ctx.font = "24px Font2";
	pokemmo.Renderer.drawShadowText2(ctx,pokemmo.Util.getPokemonDisplayName(this.curPokemon),80,56,"rgb(248,248,248)","rgb(96,96,96)");
	ctx.save();
	var _g = 0;
	while(_g < 5) {
		var i = _g++;
		var move = i < 4?this.curPokemon.moves[i]:this.learningMove;
		var movePP = i < 4?this.curPokemon.movesPP[i]:pokemmo.Game.movesData[this.learningMove.toLowerCase()].maxPP;
		var moveMaxPP = i < 4?this.curPokemon.movesMaxPP[i]:movePP;
		var moveType = pokemmo.Game.movesData[(i < 4?this.curPokemon.moves[i]:this.learningMove).toLowerCase()].type;
		ctx.drawImage(pokemmo.Game.res["types"].obj,0,24 * pokemmo.PokemonConst.typeNameToInt(moveType),64,24,246,42,64,24);
		pokemmo.Renderer.drawShadowText2(ctx,move.toUpperCase(),326,64,"rgb(32,32,32)","rgb(216,216,216)");
		pokemmo.Renderer.drawShadowText2(ctx,Std.string(movePP),412 + (movePP < 10?8:0),86,"rgb(32,32,32)","rgb(216,216,216)");
		pokemmo.Renderer.drawShadowText2(ctx,Std.string(moveMaxPP),448,86,"rgb(32,32,32)","rgb(216,216,216)");
		ctx.translate(0,56);
	}
	ctx.restore();
	ctx.drawImage(pokemmo.Game.res["battleLearnMoveSelection"].obj,240,36 + 56 * this.forgetMoveSelected);
}
pokemmo.Battle.prototype.drawBottomPanel = function(ctx) {
	var me = this;
	ctx.drawImage(pokemmo.Game.res["battleTextBackground"].obj,2,228);
	if(this.text != "") {
		var str = this.text.substr(0,Math.floor((this.now - this.textTime) / 30));
		ctx.font = "24px Font2";
		var maxWidth = this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_ACTION_MENU?150:420;
		var lastLine = str;
		var secondLine = null;
		if(ctx.measureText(str).width > maxWidth) {
			var firstLine = str;
			secondLine = "";
			do {
				var arr = firstLine.split(" ");
				secondLine = arr.pop() + " " + secondLine;
				firstLine = arr.join(" ");
			} while(ctx.measureText(firstLine).width > maxWidth);
			ctx.fillStyle = "rgb(104,88,112)";
			ctx.fillText(firstLine,26,266);
			ctx.fillText(secondLine,26,294);
			ctx.fillText(firstLine,24,268);
			ctx.fillText(secondLine,24,296);
			ctx.fillText(firstLine,26,268);
			ctx.fillText(secondLine,26,296);
			ctx.fillStyle = "rgb(255,255,255)";
			ctx.fillText(firstLine,24,266);
			ctx.fillText(secondLine,24,294);
			lastLine = secondLine;
		} else {
			ctx.fillStyle = "rgb(104,88,112)";
			ctx.fillText(str,24,268);
			ctx.fillText(str,26,266);
			ctx.fillText(str,26,268);
			ctx.fillStyle = "rgb(255,255,255)";
			ctx.fillText(str,24,266);
		}
		if(str == this.text) {
			if(!this.textCompleted) {
				this.textCompleted = true;
				this.textCompletedTime = this.now;
				if(this.textQuestion) {
					this.textQuestionSelectedAnswer = true;
					pokemmo.UI.AButtonHooks.push(function() {
						{
							pokemmo.UI.AButtonHooks = [];
							pokemmo.UI.BButtonHooks = [];
						}
						if(me.textQuestionSelectedAnswer) me.textOnYes(); else me.textOnNo();
					});
					pokemmo.UI.BButtonHooks.push(function() {
						{
							pokemmo.UI.AButtonHooks = [];
							pokemmo.UI.BButtonHooks = [];
						}
						me.textOnNo();
					});
				} else if(this.textDelay == 0) {
					if(this.textOnComplete != null) this.textOnComplete();
				} else if(this.textDelay != -1) {
					if(this.textOnComplete != null) setTimeout(function() {
						me.textOnComplete();
					},this.textDelay);
				} else pokemmo.UI.AButtonHooks.push(function() {
					setTimeout(me.textOnComplete,100);
				});
			} else if(!this.textQuestion) {
				if(this.textDelay == -1 && this.now - this.textCompletedTime > 100) {
					var tmp = Math.floor(this.now % 1000 / 250);
					if(tmp == 3) tmp = 1;
					tmp *= 2;
					ctx.drawImage(pokemmo.Game.res["battleMisc"].obj,0,0,32,32,24 + ctx.measureText(lastLine).width,240 + tmp + (secondLine != null?28:0),32,32);
				}
			}
		}
	}
	if(this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_ACTION_MENU) {
		ctx.drawImage(pokemmo.Game.res["battleActionMenu"].obj,246,226);
		var x1 = 252 + Math.floor(this.now % 1000 / 500) * 2;
		var y1 = 246;
		var x2 = x1 + 112;
		var y2 = y1 + 30;
		switch(this.selectedAction) {
		case 0:
			ctx.drawImage(pokemmo.Game.res["battleMisc"].obj,96,0,32,32,x1,y1,32,32);
			break;
		case 1:
			ctx.drawImage(pokemmo.Game.res["battleMisc"].obj,96,0,32,32,x2,y1,32,32);
			break;
		case 2:
			ctx.drawImage(pokemmo.Game.res["battleMisc"].obj,96,0,32,32,x1,y2,32,32);
			break;
		case 3:
			ctx.drawImage(pokemmo.Game.res["battleMisc"].obj,96,0,32,32,x2,y2,32,32);
			break;
		}
	}
}
pokemmo.Battle.prototype.drawFightMenu = function(ctx) {
	ctx.drawImage(pokemmo.Game.res["battleMoveMenu"].obj,2,228);
	var x1 = 40;
	var y1 = 268;
	var x2 = 180;
	var y2 = 300;
	var _g = 0;
	while(_g < 4) {
		var i = _g++;
		var x = 0;
		var y = 0;
		switch(i) {
		case 0:
			x = x1;
			y = y1;
			break;
		case 1:
			x = x2;
			y = y1;
			break;
		case 2:
			x = x1;
			y = y2;
			break;
		case 3:
			x = x2;
			y = y2;
			break;
		}
		var n = this.curPokemon.moves[i] == null?"--":this.curPokemon.moves[i].toUpperCase();
		ctx.font = "16px Font4";
		ctx.fillStyle = "rgb(208,208,208)";
		ctx.fillText(n,x,y + 2);
		ctx.fillText(n,x + 2,y);
		ctx.fillText(n,x + 2,y + 2);
		ctx.fillStyle = "rgb(72,72,72)";
		ctx.fillText(n,x,y);
		if(this.selectedMove == i) ctx.drawImage(pokemmo.Game.res["battleMisc"].obj,96,0,32,32,x - 28 + Math.floor(this.now % 1000 / 500) * 2,y - 22,32,32);
	}
	ctx.drawImage(pokemmo.Game.res["types"].obj,0,24 * pokemmo.PokemonConst.typeNameToInt(pokemmo.Game.movesData[this.curPokemon.moves[this.selectedMove].toLowerCase()].type),64,24,390,284,64,24);
}
pokemmo.Battle.prototype.renderEnemy = function(ctx) {
	if(this.enemyFainted) {
		if(pokemmo.Renderer.numRTicks - this.enemyFaintedTick <= 5) {
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(290,30);
			ctx.lineTo(418,30);
			ctx.lineTo(418,158);
			ctx.lineTo(290,158);
			ctx.lineTo(290,30);
			ctx.clip();
			ctx.drawImage(this.enemyPokemon.sprite.obj,290,30 + (pokemmo.Renderer.numRTicks - this.enemyFaintedTick) * 30);
			ctx.restore();
		}
	} else ctx.drawImage(this.enemyPokemon.sprite.obj,290,30);
}
pokemmo.Battle.prototype.drawGoPokemonAnimation = function(ctx) {
	if(this.animStep >= 4 && this.animStep < 25) {
		var ballAnimation = [[60,179,1,0],[62,175,1,0],[70,168,1,0],[75,165,1,0],[83,160,1,0],[86,160,1,0],[95,161,1,0],[97,164,1,0],[105,170,1,0],[110,175,1,0],[111,178,1,0],[113,183,1,0],[114,185,1,0],[115,190,1,0],[117,192,1,0],[120,195,1,0,0.95],[123,200,1,1,0.9],[124,205,1.05,1,0.8],[125,200,1.1,1,0.6],[126,192,1.15,1,0.3],[127,192,1.2,1,0.1]];
		ctx.save();
		ctx.globalAlpha = ballAnimation[this.animStep - 4][4];
		ctx.translate(ballAnimation[this.animStep - 4][0],ballAnimation[this.animStep - 4][1]);
		ctx.scale(ballAnimation[this.animStep - 4][2],ballAnimation[this.animStep - 4][2]);
		ctx.rotate(this.animStep / 17 * Math.PI * 2);
		ctx.drawImage(pokemmo.Game.res["battlePokeballs"].obj,64,32 * ballAnimation[this.animStep - 4][3],32,32,-16,-16,32,32);
		ctx.restore();
	}
	if(Math.floor(this.animStep / 4) < 5) {
		ctx.save();
		ctx.beginPath();
		ctx.moveTo(0,0);
		ctx.lineTo(480,0);
		ctx.lineTo(480,320);
		ctx.lineTo(0,320);
		ctx.lineTo(0,0);
		ctx.clip();
		ctx.globalAlpha = pokemmo.Util.clamp(1 - this.animStep / 20,0,1);
		ctx.drawImage(pokemmo.Game.res["playerBacksprite"].obj,128 * Math.floor(this.animStep / 4),0,128,128,60 - this.animStep * 5,96,128,128);
		ctx.restore();
	}
	if(this.animStep > 21 && this.animStep < 35) {
		var perc = Math.min((this.animStep - 21) / 10,1);
		pokemmo.Main.tmpCtx.clearRect(0,0,pokemmo.Main.tmpCanvas.width,pokemmo.Main.tmpCanvas.height);
		var tmpCtx = pokemmo.Main.tmpCtx;
		tmpCtx.save();
		tmpCtx.fillStyle = "#FFFFFF";
		tmpCtx.fillRect(0,0,pokemmo.Main.tmpCanvas.width,pokemmo.Main.tmpCanvas.height);
		tmpCtx.globalCompositeOperation = "destination-atop";
		tmpCtx.translate(124,192);
		tmpCtx.scale(perc,perc);
		tmpCtx.drawImage(this.curPokemon.backsprite.obj,-64,-96);
		tmpCtx.restore();
		ctx.save();
		ctx.translate(124,192);
		ctx.scale(perc,perc);
		ctx.drawImage(this.curPokemon.backsprite.obj,-64,-96);
		ctx.restore();
		ctx.globalAlpha = pokemmo.Util.clamp(1 - Math.max(0,perc * perc - 0.5) * 2,0,1);
		ctx.drawImage(pokemmo.Main.tmpCanvas,0,0);
		ctx.globalAlpha = 1;
	} else if(this.animStep >= 35) {
		this.selectedAction = 0;
		this.openActionMenu();
	}
	++this.animStep;
}
pokemmo.Battle.prototype.drawPlayerPokemon = function(ctx) {
	ctx.save();
	ctx.beginPath();
	ctx.moveTo(60,96);
	ctx.lineTo(188,96);
	ctx.lineTo(188,224);
	ctx.lineTo(60,224);
	ctx.lineTo(60,96);
	ctx.clip();
	if(this.pokemonFainted) {
		if(pokemmo.Renderer.numRTicks - this.pokemonFaintedTick <= 5) ctx.drawImage(this.curPokemon.backsprite.obj,60,96 + (pokemmo.Renderer.numRTicks - this.pokemonFaintedTick) * 30);
	} else ctx.drawImage(this.curPokemon.backsprite.obj,60,96 + ((this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_ACTION_MENU || this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_FIGHT_MENU) && (this.now + this.randInt) % 600 < 300?2:0));
	ctx.restore();
}
pokemmo.Battle.prototype.drawEnemyStatus = function(ctx) {
	ctx.save();
	if(this.shakeEnemyStatus && pokemmo.Renderer.numRTicks % 2 == 0) ctx.translate(0,2);
	ctx.drawImage(pokemmo.Game.res["battleEnemyBar"].obj,26,32);
	ctx.drawImage(pokemmo.Game.res["battleHealthBar"].obj,0,0,1,6,104,66,96,6);
	var hpPerc = this.enemyPokemon.hp / this.enemyPokemon.maxHp;
	if(hpPerc > 0.50) ctx.drawImage(pokemmo.Game.res["battleHealthBar"].obj,0,6,1,6,104,66,Math.floor(48 * hpPerc) * 2,6); else if(hpPerc >= 0.20) ctx.drawImage(pokemmo.Game.res["battleHealthBar"].obj,0,12,1,6,104,66,Math.floor(48 * hpPerc) * 2,6); else ctx.drawImage(pokemmo.Game.res["battleHealthBar"].obj,0,18,1,6,104,66,Math.ceil(48 * hpPerc) * 2,6);
	var pokemonName = pokemmo.Util.getPokemonStatusBarName(this.enemyPokemon);
	var pokemonLevel = "Lv" + this.enemyPokemon.level;
	var lvlX = 168 - (this.enemyPokemon.level < 10?0:this.enemyPokemon.level < 100?8:16);
	ctx.font = "16px Font4";
	{
		ctx.fillStyle = "rgb(216,208,176)";
		ctx.fillText(pokemonName,42,56);
		ctx.fillText(pokemonName,40,58);
		ctx.fillText(pokemonName,42,58);
		ctx.fillStyle = "rgb(64,64,64)";
		ctx.fillText(pokemonName,40,56);
	}
	{
		ctx.fillStyle = "rgb(216,208,176)";
		ctx.fillText(pokemonLevel,lvlX + 2,56);
		ctx.fillText(pokemonLevel,lvlX,58);
		ctx.fillText(pokemonLevel,lvlX + 2,58);
		ctx.fillStyle = "rgb(64,64,64)";
		ctx.fillText(pokemonLevel,lvlX,56);
	}
	var tmpX = ctx.measureText(pokemonName).width + 40;
	if(this.enemyPokemon.gender == 1) ctx.drawImage(pokemmo.Game.res["battleMisc"].obj,64,0,10,16,tmpX,42,10,16); else if(this.enemyPokemon.gender == 2) ctx.drawImage(pokemmo.Game.res["battleMisc"].obj,74,0,10,16,tmpX,42,10,16);
	ctx.restore();
}
pokemmo.Battle.prototype.drawPokemonStatus = function(ctx) {
	ctx.save();
	var tmp = 0;
	if(this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_ACTION_MENU || this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_FIGHT_MENU) ctx.translate(0,this.now % 600 < 300?0:2);
	if(this.shakePokemonStatus && pokemmo.Renderer.numRTicks % 2 == 0) ctx.translate(0,2);
	ctx.drawImage(pokemmo.Game.res["battlePokemonBar"].obj,252,148);
	ctx.drawImage(pokemmo.Game.res["battleHealthBar"].obj,0,0,1,6,348,182,96,6);
	var hpPerc = this.curPokemon.hp / this.curPokemon.maxHp;
	if(hpPerc > 0.50) ctx.drawImage(pokemmo.Game.res["battleHealthBar"].obj,0,6,1,6,348,182,Math.floor(48 * hpPerc) * 2,6); else if(hpPerc >= 0.20) ctx.drawImage(pokemmo.Game.res["battleHealthBar"].obj,0,12,1,6,348,182,Math.floor(48 * hpPerc) * 2,6); else ctx.drawImage(pokemmo.Game.res["battleHealthBar"].obj,0,18,1,6,348,182,Math.ceil(48 * hpPerc) * 2,6);
	ctx.fillStyle = "rgb(64,200,248)";
	ctx.fillRect(316,214,Math.floor(this.curPokemon.experience / this.curPokemon.experienceNeeded * 64) * 2,4);
	var pokemonName = pokemmo.Util.getPokemonStatusBarName(this.curPokemon);
	var pokemonLevel = "Lv" + this.curPokemon.level;
	var lvlX = 412 - (this.curPokemon.level < 10?0:this.curPokemon.level < 100?8:16);
	var maxHpX = 422 - (this.curPokemon.maxHp >= 100?8:0);
	ctx.font = "16px Font4";
	{
		ctx.fillStyle = "rgb(216,208,176)";
		ctx.fillText(pokemonName,286,172);
		ctx.fillText(pokemonName,284,174);
		ctx.fillText(pokemonName,286,174);
		ctx.fillStyle = "rgb(64,64,64)";
		ctx.fillText(pokemonName,284,172);
	}
	{
		ctx.fillStyle = "rgb(216,208,176)";
		ctx.fillText(pokemonLevel,lvlX + 2,172);
		ctx.fillText(pokemonLevel,lvlX,174);
		ctx.fillText(pokemonLevel,lvlX + 2,174);
		ctx.fillStyle = "rgb(64,64,64)";
		ctx.fillText(pokemonLevel,lvlX,172);
	}
	pokemmo.Renderer.drawShadowText2(ctx,Std.string(this.curPokemon.maxHp),maxHpX,208,"rgb(64,64,64)","rgb(216,208,176)");
	pokemmo.Renderer.drawShadowText2(ctx,Std.string(this.curPokemon.hp),382,208,"rgb(64,64,64)","rgb(216,208,176)");
	var tmpX = ctx.measureText(pokemonName).width + 284;
	if(this.curPokemon.gender == 1) ctx.drawImage(pokemmo.Game.res["battleMisc"].obj,64,0,10,16,tmpX,158,10,16); else if(this.curPokemon.gender == 2) ctx.drawImage(pokemmo.Game.res["battleMisc"].obj,74,0,10,16,tmpX,158,10,16);
	ctx.restore();
}
pokemmo.Battle.prototype.openActionMenu = function() {
	var me = this;
	this.runningQueue = false;
	this.step = pokemmo.BATTLE_STEP.BATTLE_STEP_ACTION_MENU;
	this.setBattleText("What will " + pokemmo.Util.getPokemonDisplayName(this.curPokemon) + " do?");
	pokemmo.UI.AButtonHooks.push(function() {
		switch(me.selectedAction) {
		case 0:
			me.openFightMenu();
			break;
		case 3:
			me.setBattleText(null);
			me.step = pokemmo.BATTLE_STEP.BATTLE_STEP_TURN;
			pokemmo.Connection.socket.emit("battleAction",{ type : "run"});
			break;
		default:
			me.openActionMenu();
		}
	});
}
pokemmo.Battle.prototype.openFightMenu = function() {
	var me = this;
	this.step = pokemmo.BATTLE_STEP.BATTLE_STEP_FIGHT_MENU;
	var aAction, bAction = null;
	aAction = function() {
		pokemmo.UI.BButtonHooks.remove(bAction);
		me.setBattleText(null);
		me.step = pokemmo.BATTLE_STEP.BATTLE_STEP_TURN;
		pokemmo.Connection.socket.emit("battleAction",{ type : "move", move : me.selectedMove});
	};
	bAction = function() {
		pokemmo.UI.AButtonHooks.remove(aAction);
		me.openActionMenu();
		me.textTime = 0;
	};
	pokemmo.UI.AButtonHooks.push(aAction);
	pokemmo.UI.BButtonHooks.push(bAction);
}
pokemmo.Battle.prototype.setBattleText = function(str,delay,onComplete) {
	this.textQuestion = false;
	this.text = str == null?"":str;
	this.textTime = this.now;
	if(delay == null) delay = Math.NaN;
	this.textDelay = delay;
	this.textOnComplete = onComplete;
	this.textCompleted = false;
}
pokemmo.Battle.prototype.setBattleTextQuestion = function(str,onYes,onNo) {
	this.setBattleText(str);
	this.textQuestion = true;
	this.textOnYes = onYes;
	this.textOnNo = onNo;
}
pokemmo.Battle.prototype.runQueue = function(force) {
	if(force == null) force = false;
	var me = this;
	if(!force && this.runningQueue) return;
	this.runningQueue = true;
	if(this.resultQueue.length == 0) {
		this.openActionMenu();
		return;
	}
	var action = this.resultQueue.shift();
	this.curAction = action;
	var actionPlayerPokemon = action.player != null?this.players[action.player].pokemon:null;
	var actionEnemyPokemon = action.player != null?this.players[action.player == 0?1:0].pokemon:null;
	switch(action.type) {
	case "moveAttack":
		this.setBattleText(pokemmo.Util.getPokemonDisplayName(actionPlayerPokemon) + " used " + action.value.move.toUpperCase() + "!");
		setTimeout(function() {
			me.moveStartTime = Date.now().getTime();
			me.playMove(action.value.move);
		},1000);
		break;
	case "moveMiss":
		this.setBattleText(pokemmo.Util.getPokemonDisplayName(actionPlayerPokemon) + " used " + action.value.toUpperCase() + "!");
		setTimeout(function() {
			me.setBattleText("But it missed!");
			setTimeout(function() {
				me.runQueue(true);
			},1000);
		},1000);
		break;
	case "moveDebuff":
		this.setBattleText(pokemmo.Util.getPokemonDisplayName(actionPlayerPokemon) + " used " + action.value.move.toUpperCase() + "!");
		setTimeout(function() {
			me.moveStartTime = Date.now().getTime();
			me.moveFinished();
		},1000);
		break;
	case "debuff":
		this.runQueue(true);
		break;
	case "applyStatus":
		actionEnemyPokemon.status = action.value;
		this.setBattleText(pokemmo.PokemonConst.getStatusApplyPhrase(action.value,pokemmo.Util.or(actionEnemyPokemon.nickname,pokemmo.Game.pokemonData[actionEnemyPokemon.id].name).toUpperCase()),-1,function() {
			setTimeout(function() {
				me.runQueue(true);
			},1000);
		});
		break;
	case "pokemonDefeated":
		var attacker;
		var defeated;
		if((action.player < Math.floor(this.players.length / 2)?0:1) != this.myTeam) {
			attacker = this.curPokemon;
			defeated = this.enemyPokemon;
			this.enemyFainted = true;
			this.enemyFaintedTick = pokemmo.Renderer.numRTicks;
		} else {
			attacker = this.enemyPokemon;
			defeated = this.curPokemon;
			this.pokemonFainted = true;
			this.pokemonFaintedTick = pokemmo.Renderer.numRTicks;
		}
		this.setBattleText(pokemmo.Util.getPokemonDisplayName(defeated) + " fainted!",-1,function() {
			if((action.player < Math.floor(me.players.length / 2)?0:1) != me.myTeam && action.value > 0) me.setBattleText(pokemmo.Util.getPokemonDisplayName(attacker) + " gained " + action.value + " EXP. Points!",-1,function() {
				me.animateExp();
			}); else me.runQueue(true);
		});
		break;
	case "win":
		this.finish();
		break;
	case "flee":
		this.setBattleText("Got away safely!",-1,function() {
			me.battleFinished = true;
			me.finish();
		});
		break;
	case "fleeFail":
		this.setBattleText("Your attempt to run failed!",-1,function() {
			me.runQueue(true);
		});
		break;
	case "switchFainted":
		if(action.player != this.myId) {
			this.setBattleText("The opponent is selecting another pokemon");
			this.runningQueue = false;
			return;
		}
		break;
	case "pokemonLevelup":
		this.runQueue(true);
		break;
	case "pokemonLearnedMove":
		if(action.player != this.myId) return;
		this.learnedMoves(action,function() {
			me.runQueue(true);
		});
		break;
	case "pokemonLearnMoves":
		if(action.player != this.myId) return;
		var arr = action.value;
		var func = null;
		var i = -1;
		func = function() {
			++i;
			if(i >= arr.length) {
				me.runQueue(true);
				return;
			}
			me.learnMoveOver(arr[i],func);
		};
		func();
		break;
	default:
		pokemmo.Main.log("Unknown battle action: " + action.type);
	}
}
pokemmo.Battle.prototype.getPlayerTeam = function(p) {
	return p < Math.floor(this.players.length / 2)?0:1;
}
pokemmo.Battle.prototype.learnedMoves = function(action,onComplete) {
	var me = this;
	var arr = action.value;
	var i = 0;
	var func = null;
	func = function() {
		if(i >= arr.length) {
			onComplete();
			return;
		}
		me.setBattleText(pokemmo.Util.getPokemonDisplayName(me.curPokemon) + " learned " + arr[i++].toUpperCase() + "!",-1,func);
	};
	func();
}
pokemmo.Battle.prototype.learnMoveOver = function(move,func) {
	var me = this;
	this.learningMove = move;
	var previousStep = null;
	var aAction = null;
	var bAction = null;
	var ctx = pokemmo.Main.ctx;
	this.setBattleText(pokemmo.Util.getPokemonDisplayName(this.curPokemon) + " is trying to learn " + move.toUpperCase() + ".",-1,function() {
		me.setBattleText("But, " + pokemmo.Util.getPokemonDisplayName(me.curPokemon) + " can't learn more than four moves.",-1,function() {
			me.setBattleTextQuestion("Delete a move to make room for " + move.toUpperCase() + "?",function() {
				var transition = null;
				var tstep = 0;
				transition = function() {
					ctx.save();
					ctx.translate(pokemmo.Main.isPhone?0:160,pokemmo.Main.isPhone?0:140);
					if(tstep < 10) {
						ctx.globalAlpha = tstep / 10;
						ctx.fillStyle = "#000000";
						ctx.fillRect(0,0,480,320);
					} else if(tstep < 15) {
						if(tstep == 10) {
							me.forgetMoveSelected = 0;
							previousStep = me.step;
							me.step = pokemmo.BATTLE_STEP.BATTLE_STEP_LEARN_MOVE;
						}
						ctx.fillStyle = "#000000";
						ctx.fillRect(0,0,480,320);
					} else if(tstep < 25) {
						ctx.globalAlpha = 1 - (tstep - 15) / 10;
						ctx.fillStyle = "#000000";
						ctx.fillRect(0,0,480,320);
					} else {
						pokemmo.Renderer.unHookRender(transition);
						pokemmo.UI.AButtonHooks.push(aAction);
						pokemmo.UI.BButtonHooks.push(bAction);
					}
					ctx.restore();
					++tstep;
				};
				pokemmo.Renderer.hookRender(transition);
			},function() {
				func();
			});
		});
	});
	aAction = function() {
		pokemmo.UI.BButtonHooks = [];
		var oldMove = me.curPokemon.moves[me.forgetMoveSelected];
		pokemmo.Connection.socket.emit("battleLearnMove",{ slot : me.forgetMoveSelected, move : move});
		var transition = null;
		var tstep = 0;
		transition = function() {
			ctx.save();
			ctx.translate(pokemmo.Main.isPhone?0:160,pokemmo.Main.isPhone?0:140);
			if(tstep < 10) {
				ctx.globalAlpha = tstep / 10;
				ctx.fillStyle = "#000000";
				ctx.fillRect(0,0,480,320);
			} else if(tstep < 15) {
				if(tstep == 10) {
					me.curPokemon.moves[me.forgetMoveSelected] = me.learningMove;
					me.step = previousStep;
					me.setBattleText("1, 2, and... ... ... Poof!",-1,function() {
						me.setBattleText(pokemmo.Util.getPokemonDisplayName(me.curPokemon) + " forgot " + oldMove.toUpperCase() + ".",-1,function() {
							me.setBattleText("And...",-1,function() {
								me.setBattleText(pokemmo.Util.getPokemonDisplayName(me.curPokemon) + " learned " + move.toUpperCase() + "!",-1,function() {
									func();
								});
							});
						});
					});
				}
				ctx.fillStyle = "#000000";
				ctx.fillRect(0,0,480,320);
			} else if(tstep < 25) {
				ctx.globalAlpha = 1 - (tstep - 15) / 10;
				ctx.fillStyle = "#000000";
				ctx.fillRect(0,0,480,320);
			} else pokemmo.Renderer.unHookRender(transition);
			ctx.restore();
			++tstep;
		};
		pokemmo.Renderer.hookRender(transition);
	};
	bAction = function() {
		pokemmo.UI.BButtonHooks = [];
		var transition = null;
		var tstep = 0;
		transition = function() {
			ctx.save();
			ctx.translate(pokemmo.Main.isPhone?0:160,pokemmo.Main.isPhone?0:140);
			if(tstep < 10) {
				ctx.globalAlpha = tstep / 10;
				ctx.fillStyle = "#000000";
				ctx.fillRect(0,0,480,320);
			} else if(tstep < 15) {
				if(tstep == 10) {
					me.step = previousStep;
					me.setBattleTextQuestion("Are you sure you want " + pokemmo.Util.getPokemonDisplayName(me.curPokemon) + " to stop learning " + me.learningMove.toUpperCase() + "?",function() {
						me.setBattleText(null);
						func();
					},function() {
						me.learnMoveOver(me.learningMove,func);
					});
				}
				ctx.fillStyle = "#000000";
				ctx.fillRect(0,0,480,320);
			} else if(tstep < 25) {
				ctx.globalAlpha = 1 - (tstep - 15) / 10;
				ctx.fillStyle = "#000000";
				ctx.fillRect(0,0,480,320);
			} else pokemmo.Renderer.unHookRender(transition);
			ctx.restore();
			++tstep;
		};
		pokemmo.Renderer.hookRender(transition);
	};
}
pokemmo.Battle.prototype.animateHp = function() {
	var me = this;
	var action = this.curAction;
	var renderFunc = null;
	renderFunc = function() {
		var result = action.value.resultHp;
		var pok;
		var enemy;
		if(action.player != me.myId) {
			pok = me.curPokemon;
			enemy = me.enemyPokemon;
		} else {
			pok = me.enemyPokemon;
			enemy = me.curPokemon;
		}
		var step = Math.ceil(pok.maxHp / 50);
		if(pok.hp > result) {
			pok.hp -= step;
			if(pok.hp < result) pok.hp = result;
		} else if(pok.hp < result) {
			pok.hp += step;
			if(pok.hp > result) pok.hp = result;
		}
		if(pok.hp == result) {
			pokemmo.Renderer.unHookRender(renderFunc);
			if(action.value.effec == 0) me.setBattleText("It doesn't affect " + pokemmo.Util.or(pok.nickname,pokemmo.Game.pokemonData[pok.id].name).toUpperCase(),-1,function() {
				me.runQueue(true);
			}); else if(action.value.effec < 1) me.setBattleText("It's not very effective...",-1,function() {
				me.runQueue(true);
			}); else if(action.value.effec > 1) me.setBattleText("It's super effective!",-1,function() {
				me.runQueue(true);
			}); else setTimeout(function() {
				me.runQueue(true);
			},200);
		}
	};
	pokemmo.Renderer.hookRender(renderFunc);
}
pokemmo.Battle.prototype.animateExp = function() {
	var me = this;
	var action = this.curAction;
	if((action.player < Math.floor(this.players.length / 2)?0:1) == this.myTeam || this.curPokemon.level >= 100) {
		this.runQueue(true);
		return;
	}
	this.textDelay = 1 / 0;
	var expGained = action.value;
	var step = Math.ceil(expGained / 100);
	var renderFunc = null;
	renderFunc = function() {
		var pok = me.curPokemon;
		if(step > expGained) step = expGained;
		pok.experience += step;
		expGained -= step;
		if(pok.experience >= pok.experienceNeeded) {
			expGained += pok.experience - pok.experienceNeeded;
			var info = me.resultQueue.shift();
			if(info.type != "pokemonLevelup") throw "Assertion failed";
			var backsprite = me.curPokemon.backsprite;
			me.setCurPokemon(info.value);
			pok = me.curPokemon;
			if(action.player != me.myId) return;
			pok.experience = 0;
			pokemmo.Renderer.unHookRender(renderFunc);
			me.setBattleText(pokemmo.Util.getPokemonDisplayName(me.curPokemon) + " grew to LV. " + me.curPokemon.level + "!",-1,function() {
				if(me.resultQueue.length > 0 && me.resultQueue[0].type == "pokemonLearnedMove") me.learnedMoves(me.resultQueue.shift(),$closure(me,"animateExp")); else me.animateExp();
			});
		}
		if(expGained <= 0) {
			pokemmo.Renderer.unHookRender(renderFunc);
			setTimeout(function() {
				me.runQueue(true);
			},100);
		}
	};
	pokemmo.Renderer.hookRender(renderFunc);
}
pokemmo.Battle.prototype.playMove = function(n) {
	var m = pokemmo.Move.getMove(n);
	this.curMove = m;
	m.start();
}
pokemmo.Battle.prototype.moveFinished = function() {
	var me = this;
	this.curMove = null;
	this.shakeEnemyStatus = false;
	this.shakePokemonStatus = false;
	var action = this.curAction;
	if(action.type == "moveAttack") this.animateHp(); else setTimeout(function() {
		me.runQueue(true);
	},200);
}
pokemmo.Battle.prototype.buttonHandler = function(dir) {
	if(pokemmo.Renderer.curTransition != null) return;
	if(this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_ACTION_MENU) switch(this.selectedAction) {
	case 0:
		if(dir == 3) this.selectedAction = 1; else if(dir == 0) this.selectedAction = 2;
		break;
	case 1:
		if(dir == 1) this.selectedAction = 0; else if(dir == 0) this.selectedAction = 3;
		break;
	case 2:
		if(dir == 2) this.selectedAction = 0; else if(dir == 3) this.selectedAction = 3;
		break;
	case 3:
		if(dir == 2) this.selectedAction = 1; else if(dir == 1) this.selectedAction = 2;
		break;
	} else if(this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_FIGHT_MENU) switch(this.selectedMove) {
	case 0:
		if(dir == 3 && this.curPokemon.moves[1] != null) this.selectedMove = 1; else if(dir == 0 && this.curPokemon.moves[2] != null) this.selectedMove = 2;
		break;
	case 1:
		if(dir == 1 && this.curPokemon.moves[0] != null) this.selectedMove = 0; else if(dir == 0 && this.curPokemon.moves[3] != null) this.selectedMove = 3;
		break;
	case 2:
		if(dir == 2 && this.curPokemon.moves[0] != null) this.selectedMove = 0; else if(dir == 3 && this.curPokemon.moves[3] != null) this.selectedMove = 3;
		break;
	case 3:
		if(dir == 2 && this.curPokemon.moves[1] != null) this.selectedMove = 1; else if(dir == 1 && this.curPokemon.moves[2] != null) this.selectedMove = 2;
		break;
	} else if(this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_LEARN_MOVE) {
		if(dir == 2) {
			if(this.forgetMoveSelected > 0) --this.forgetMoveSelected;
		} else if(dir == 0) {
			if(this.forgetMoveSelected < 4) ++this.forgetMoveSelected;
		}
	}
	if(this.text != "" && this.textCompleted && this.textQuestion) {
		if(this.textQuestionSelectedAnswer) {
			if(dir == 0) this.textQuestionSelectedAnswer = false;
		} else if(dir == 2) this.textQuestionSelectedAnswer = true;
	}
}
pokemmo.Battle.prototype.finish = function() {
	var me = this;
	pokemmo.UI.dirButtonHooks.remove($closure(this,"buttonHandler"));
	pokemmo.Connection.socket.emit("battleFinished");
	pokemmo.Connection.socket.once("battleFinish",function(data) {
		pokemmo.Game.setPokemonParty(data.pokemon);
		me.battleFinished = true;
	});
	var step = 0;
	var func = null;
	var ctx = pokemmo.Main.ctx;
	var canvas = pokemmo.Main.canvas;
	func = function() {
		ctx.fillStyle = "#000000";
		if(step < 15) {
			ctx.globalAlpha = step / 15;
			ctx.fillRect(0,0,canvas.width,canvas.height);
			ctx.globalAlpha = 1;
		} else if(step < 20) {
			ctx.globalAlpha = 1;
			ctx.fillRect(0,0,canvas.width,canvas.height);
			if(!me.battleFinished) return;
			if(step == 15) {
				pokemmo.Game.curGame.inBattle = false;
				pokemmo.Game.curGame.battle = null;
				pokemmo.Game.curGame.drawPlayerChar = true;
				pokemmo.Game.curGame.drawPlayerFollower = true;
				var chr = pokemmo.Game.curGame.getPlayerChar();
				if(chr != null) chr.inBattle = false;
			}
		} else {
			ctx.globalAlpha = 1 - (step - 20) / 8;
			ctx.fillRect(0,0,canvas.width,canvas.height);
			ctx.globalAlpha = 1;
			if(step >= 28) pokemmo.Renderer.unHookRender(func);
		}
		++step;
	};
	pokemmo.Renderer.hookRender(func);
}
pokemmo.Battle.prototype.__class__ = pokemmo.Battle;
pokemmo.BATTLE_STEP = { __ename__ : ["pokemmo","BATTLE_STEP"], __constructs__ : ["BATTLE_STEP_TRANSITION","BATTLE_STEP_POKEMON_APPEARED_TMP","BATTLE_STEP_POKEMON_APPEARED","BATTLE_STEP_GO_POKEMON","BATTLE_STEP_ACTION_MENU","BATTLE_STEP_FIGHT_MENU","BATTLE_STEP_TURN","BATTLE_STEP_LEARN_MOVE"] }
pokemmo.BATTLE_STEP.BATTLE_STEP_TRANSITION = ["BATTLE_STEP_TRANSITION",0];
pokemmo.BATTLE_STEP.BATTLE_STEP_TRANSITION.toString = $estr;
pokemmo.BATTLE_STEP.BATTLE_STEP_TRANSITION.__enum__ = pokemmo.BATTLE_STEP;
pokemmo.BATTLE_STEP.BATTLE_STEP_POKEMON_APPEARED_TMP = ["BATTLE_STEP_POKEMON_APPEARED_TMP",1];
pokemmo.BATTLE_STEP.BATTLE_STEP_POKEMON_APPEARED_TMP.toString = $estr;
pokemmo.BATTLE_STEP.BATTLE_STEP_POKEMON_APPEARED_TMP.__enum__ = pokemmo.BATTLE_STEP;
pokemmo.BATTLE_STEP.BATTLE_STEP_POKEMON_APPEARED = ["BATTLE_STEP_POKEMON_APPEARED",2];
pokemmo.BATTLE_STEP.BATTLE_STEP_POKEMON_APPEARED.toString = $estr;
pokemmo.BATTLE_STEP.BATTLE_STEP_POKEMON_APPEARED.__enum__ = pokemmo.BATTLE_STEP;
pokemmo.BATTLE_STEP.BATTLE_STEP_GO_POKEMON = ["BATTLE_STEP_GO_POKEMON",3];
pokemmo.BATTLE_STEP.BATTLE_STEP_GO_POKEMON.toString = $estr;
pokemmo.BATTLE_STEP.BATTLE_STEP_GO_POKEMON.__enum__ = pokemmo.BATTLE_STEP;
pokemmo.BATTLE_STEP.BATTLE_STEP_ACTION_MENU = ["BATTLE_STEP_ACTION_MENU",4];
pokemmo.BATTLE_STEP.BATTLE_STEP_ACTION_MENU.toString = $estr;
pokemmo.BATTLE_STEP.BATTLE_STEP_ACTION_MENU.__enum__ = pokemmo.BATTLE_STEP;
pokemmo.BATTLE_STEP.BATTLE_STEP_FIGHT_MENU = ["BATTLE_STEP_FIGHT_MENU",5];
pokemmo.BATTLE_STEP.BATTLE_STEP_FIGHT_MENU.toString = $estr;
pokemmo.BATTLE_STEP.BATTLE_STEP_FIGHT_MENU.__enum__ = pokemmo.BATTLE_STEP;
pokemmo.BATTLE_STEP.BATTLE_STEP_TURN = ["BATTLE_STEP_TURN",6];
pokemmo.BATTLE_STEP.BATTLE_STEP_TURN.toString = $estr;
pokemmo.BATTLE_STEP.BATTLE_STEP_TURN.__enum__ = pokemmo.BATTLE_STEP;
pokemmo.BATTLE_STEP.BATTLE_STEP_LEARN_MOVE = ["BATTLE_STEP_LEARN_MOVE",7];
pokemmo.BATTLE_STEP.BATTLE_STEP_LEARN_MOVE.toString = $estr;
pokemmo.BATTLE_STEP.BATTLE_STEP_LEARN_MOVE.__enum__ = pokemmo.BATTLE_STEP;
pokemmo.CCharacter = function(data) {
	if( data === $_ ) return;
	var me = this;
	pokemmo.GameObject.call(this,data.x,data.y,data.direction);
	this.username = data.username;
	this.targetX = this.x;
	this.targetY = this.y;
	this.targetDirection = this.direction;
	this.animationStep = 0;
	this.loaded = false;
	this.walking = false;
	this.walkingPerc = 0.0;
	this.walkingHasMoved = false;
	this.inBattle = data.inBattle;
	this.randInt = Math.floor(Math.random() * 100);
	this.follower = data.follower;
	this.lastMoveTick = 0;
	this.canUpdate = true;
	this.onTarget = null;
	this.lastX = data.lastX;
	this.lastY = data.lastY;
	this.transmitWalk = true;
	this.createdTick = pokemmo.Renderer.numRTicks;
	this.noclip = false;
	this.lockDirection = -1;
	this.battleHasWalkedBack = false;
	this.renderOffsetX = this.renderOffsetY = 0;
	this.renderAlpha = 1.0;
	this.freezeTicks = 0;
	this.jumping = false;
	this.followerShiny = data.folShiny;
	this.image = pokemmo.Game.curGame.getImage("resources/chars/" + data.type + ".png",function() {
		me.loaded = true;
	});
	pokemmo.Game.curGame.characters.push(this);
	this.followerObj = new pokemmo.entities.CFollower(this);
}
pokemmo.CCharacter.__name__ = ["pokemmo","CCharacter"];
pokemmo.CCharacter.__super__ = pokemmo.GameObject;
for(var k in pokemmo.GameObject.prototype ) pokemmo.CCharacter.prototype[k] = pokemmo.GameObject.prototype[k];
pokemmo.CCharacter.prototype.username = null;
pokemmo.CCharacter.prototype.inBattle = null;
pokemmo.CCharacter.prototype.type = null;
pokemmo.CCharacter.prototype.lastX = null;
pokemmo.CCharacter.prototype.lastY = null;
pokemmo.CCharacter.prototype.targetX = null;
pokemmo.CCharacter.prototype.targetY = null;
pokemmo.CCharacter.prototype.targetDirection = null;
pokemmo.CCharacter.prototype.animationStep = null;
pokemmo.CCharacter.prototype.loaded = null;
pokemmo.CCharacter.prototype.follower = null;
pokemmo.CCharacter.prototype.followerShiny = null;
pokemmo.CCharacter.prototype.walking = null;
pokemmo.CCharacter.prototype.walkingHasMoved = null;
pokemmo.CCharacter.prototype.walkingPerc = null;
pokemmo.CCharacter.prototype.lastMoveTick = null;
pokemmo.CCharacter.prototype.canUpdate = null;
pokemmo.CCharacter.prototype.onTarget = null;
pokemmo.CCharacter.prototype.battleEnemy = null;
pokemmo.CCharacter.prototype.battleEnemyShiny = null;
pokemmo.CCharacter.prototype.image = null;
pokemmo.CCharacter.prototype.freezeTicks = null;
pokemmo.CCharacter.prototype.jumping = null;
pokemmo.CCharacter.prototype.followerObj = null;
pokemmo.CCharacter.prototype.transmitWalk = null;
pokemmo.CCharacter.prototype.createdTick = null;
pokemmo.CCharacter.prototype.noclip = null;
pokemmo.CCharacter.prototype.lockDirection = null;
pokemmo.CCharacter.prototype.wildPokemon = null;
pokemmo.CCharacter.prototype.battleHasWalkedBack = null;
pokemmo.CCharacter.prototype.battleX = null;
pokemmo.CCharacter.prototype.battleY = null;
pokemmo.CCharacter.prototype.battleLastX = null;
pokemmo.CCharacter.prototype.battleLastY = null;
pokemmo.CCharacter.prototype.battleFolX = null;
pokemmo.CCharacter.prototype.battleFolY = null;
pokemmo.CCharacter.prototype.renderOffsetX = null;
pokemmo.CCharacter.prototype.renderOffsetY = null;
pokemmo.CCharacter.prototype.renderAlpha = null;
pokemmo.CCharacter.prototype.destroy = function() {
	pokemmo.GameObject.prototype.destroy.call(this);
	pokemmo.Game.curGame.characters.remove(this);
	this.inBattle = false;
	this.followerObj.destroy();
	if(this.wildPokemon != null) this.wildPokemon.destroy();
}
pokemmo.CCharacter.prototype.update = function(data) {
	if(!this.canUpdate) return;
	this.follower = data.follower;
	this.followerShiny = data.folShiny;
	if(data.username == pokemmo.Game.username) {
		if(data.type != pokemmo.Game.playerBackspriteType) {
			pokemmo.Game.playerBackspriteType = data.type;
			pokemmo.Game.res["playerBacksprite"] = new pokemmo.ImageResource("resources/chars_sprites/" + data.type + ".png");
		}
		return;
	}
	this.inBattle = data.inBattle;
	this.battleEnemy = data.battleEnemy;
	this.battleEnemyShiny = data.battleEnemyShiny;
	this.targetX = data.x;
	this.targetY = data.y;
	this.targetDirection = data.direction;
	this.lastX = data.lastX;
	this.lastY = data.lastY;
	if(this.x == data.x && this.y == data.y) this.direction = data.direction; else if(Math.abs(this.x - data.x) <= 1 && Math.abs(this.y - data.y) <= 1 || this.x - 2 == data.x && this.y == data.y || this.x + 2 == data.x && this.y == data.y || this.x == data.x && this.y - 2 == data.y || this.x == data.x && this.y + 2 == data.y) {
	} else {
		this.direction = data.direction;
		this.x = data.x;
		this.y = data.y;
	}
}
pokemmo.CCharacter.prototype.isControllable = function() {
	return this.username == pokemmo.Game.username && !pokemmo.Game.curGame.inBattle && pokemmo.Game.curGame.playerCanMove && !pokemmo.Chat.inChat && this.freezeTicks == 0;
}
pokemmo.CCharacter.prototype.getRenderPosX = function() {
	if(!this.walking) return Math.floor(this.x * pokemmo.Map.getCurMap().tilewidth + this.renderOffsetX);
	var destX = this.x * pokemmo.Map.getCurMap().tilewidth;
	var perc = (this.walkingPerc - 0.3) * (1.0 / 0.7);
	if(this.walkingPerc >= 0.3) {
		if(this.walkingHasMoved) switch(this.direction) {
		case 1:
			destX += pokemmo.Map.getCurMap().tilewidth * (1 - perc);
			break;
		case 3:
			destX -= pokemmo.Map.getCurMap().tilewidth * (1 - perc);
			break;
		} else switch(this.direction) {
		case 1:
			destX -= pokemmo.Map.getCurMap().tilewidth * perc;
			break;
		case 3:
			destX += pokemmo.Map.getCurMap().tilewidth * perc;
			break;
		}
	}
	return Math.floor(destX + this.renderOffsetX);
}
pokemmo.CCharacter.prototype.getRenderPosY = function() {
	if(!this.walking) return Math.floor(this.y * pokemmo.Map.getCurMap().tileheight - 64 / 2 + this.renderOffsetY);
	var destY = this.y * pokemmo.Map.getCurMap().tileheight - 64 / 2;
	var perc = (this.walkingPerc - 0.3) * (1.0 / 0.7);
	if(this.walkingPerc >= 0.3) {
		if(this.walkingHasMoved) switch(this.direction) {
		case 2:
			destY += pokemmo.Map.getCurMap().tileheight * (1 - perc);
			break;
		case 0:
			destY -= pokemmo.Map.getCurMap().tileheight * (1 - perc);
			break;
		} else switch(this.direction) {
		case 2:
			destY -= pokemmo.Map.getCurMap().tileheight * perc;
			break;
		case 0:
			destY += pokemmo.Map.getCurMap().tileheight * perc;
			break;
		}
	}
	return Math.floor(destY + this.renderOffsetY);
}
pokemmo.CCharacter.prototype.tick = function() {
	pokemmo.GameObject.prototype.tick.call(this);
	this.tickWalking();
	if(this.username == pokemmo.Game.username) this.tickWildBattle(); else if(this.x == this.targetX && this.y == this.targetY && !this.walking) {
		if(this.onTarget != null) {
			this.onTarget();
			this.onTarget = null;
		}
	}
	if(this.freezeTicks > 0) --this.freezeTicks;
}
pokemmo.CCharacter.prototype.tickWalking = function() {
	var curMap = pokemmo.Game.curGame.map;
	if(!this.walking) {
		this.walkingHasMoved = false;
		this.walkingPerc = 0.0;
		if(this.username == pokemmo.Game.username) {
			if(this.isControllable()) {
				if(!!pokemmo.UI.keysDown[37]) {
					this.walking = true;
					if(this.direction == 1) this.walkingPerc = 0.3;
					this.direction = 1;
				} else if(!!pokemmo.UI.keysDown[40]) {
					this.walking = true;
					if(this.direction == 0) this.walkingPerc = 0.3;
					this.direction = 0;
				} else if(!!pokemmo.UI.keysDown[39]) {
					this.walking = true;
					if(this.direction == 3) this.walkingPerc = 0.3;
					this.direction = 3;
				} else if(!!pokemmo.UI.keysDown[38]) {
					this.walking = true;
					if(this.direction == 2) this.walkingPerc = 0.3;
					this.direction = 2;
				}
			}
		} else this.tickBot();
	}
	if(this.walking) {
		if(this.isControllable()) switch(this.direction) {
		case 1:
			if(!!!pokemmo.UI.keysDown[37]) {
				if(this.walkingPerc < 0.3) {
					this.walking = false;
					pokemmo.Connection.socket.emit("turn",{ dir : this.direction});
					return;
				}
			}
			break;
		case 0:
			if(!!!pokemmo.UI.keysDown[40]) {
				if(this.walkingPerc < 0.3) {
					this.walking = false;
					pokemmo.Connection.socket.emit("turn",{ dir : this.direction});
					return;
				}
			}
			break;
		case 3:
			if(!!!pokemmo.UI.keysDown[39]) {
				if(this.walkingPerc < 0.3) {
					this.walking = false;
					pokemmo.Connection.socket.emit("turn",{ dir : this.direction});
					return;
				}
			}
			break;
		case 2:
			if(!!!pokemmo.UI.keysDown[38]) {
				if(this.walkingPerc < 0.3) {
					this.walking = false;
					pokemmo.Connection.socket.emit("turn",{ dir : this.direction});
					return;
				}
			}
			break;
		}
		this.walkingPerc += 0.10;
		this.animationStep += 0.20;
		if(this.animationStep > 4.0) this.animationStep -= 4.0;
		if(this.walkingPerc >= 0.7 / 2 && !this.walkingHasMoved) {
			var frontX = this.getFrontPositionX();
			var frontY = this.getFrontPositionY();
			if(this.isControllable() && !this.noclip) {
				var tmpWarp = pokemmo.entities.CWarp.getWarpAt(frontX,frontY);
				if(tmpWarp != null && tmpWarp.canWarp(this)) {
					if(Std["is"](tmpWarp,pokemmo.entities.CDoor)) this.enterDoor(tmpWarp); else if(Std["is"](tmpWarp,pokemmo.entities.CWarpArrow)) this.enterWarpArrow(tmpWarp); else if(Std["is"](tmpWarp,pokemmo.entities.CStairs)) this.enterStairs(tmpWarp);
					return;
				} else if(pokemmo.Map.getCurMap().isTileLedge(frontX,frontY) && pokemmo.Map.getCurMap().getLedgeDir(frontX,frontY) == this.direction) this.useLedge(); else if(this.willMoveIntoAWall()) {
					pokemmo.Connection.socket.emit("turn",{ dir : this.direction});
					this.walking = false;
					return;
				}
			} else if(pokemmo.Map.getCurMap().isTileLedge(frontX,frontY) && pokemmo.Map.getCurMap().getLedgeDir(frontX,frontY) == this.direction) this.useLedge();
			if(!pokemmo.Game.curGame.inBattle || this.username != pokemmo.Game.username) {
				this.lastX = this.x;
				this.lastY = this.y;
			}
			switch(this.direction) {
			case 1:
				this.x -= 1;
				break;
			case 3:
				this.x += 1;
				break;
			case 2:
				this.y -= 1;
				break;
			case 0:
				this.y += 1;
				break;
			}
			this.lastMoveTick = pokemmo.Renderer.numRTicks;
			this.walkingHasMoved = true;
			if(curMap.isTileGrass(this.x,this.y)) new pokemmo.entities.CGrassAnimation(this.x,this.y);
			if(this.username == pokemmo.Game.username && this.transmitWalk) pokemmo.Connection.socket.emit("walk",{ ack : pokemmo.Connection.lastAckMove, x : this.x, y : this.y, dir : this.direction});
		}
		if(this.walkingPerc >= 1.0) {
			if(this.username == pokemmo.Game.username) {
				if(this.isControllable() && !this.willMoveIntoAWall() && (this.direction == 1 && !!pokemmo.UI.keysDown[37] || this.direction == 0 && !!pokemmo.UI.keysDown[40] || this.direction == 3 && !!pokemmo.UI.keysDown[39] || this.direction == 2 && !!pokemmo.UI.keysDown[38])) {
					this.walkingHasMoved = false;
					this.walkingPerc = 0.4;
				} else {
					this.walking = false;
					this.walkingHasMoved = false;
					this.walkingPerc = 0.0;
				}
			} else {
				this.walkingHasMoved = false;
				this.walkingPerc = 0.4;
				this.walking = false;
				this.tickBot();
			}
		}
	} else this.animationStep = 0;
}
pokemmo.CCharacter.prototype.tickWildBattle = function() {
	var tmpX, tmpY;
	if(pokemmo.Game.curGame.inBattle) {
		var curMap = pokemmo.Game.curGame.map;
		if(this.wildPokemon == null && this.battleEnemy != null && !this.walking) {
			if(this.battleHasWalkedBack) {
				var tmpDir;
				tmpX = this.battleX;
				tmpY = this.battleY;
				if(this.walking && !this.walkingHasMoved) switch(this.direction) {
				case 1:
					tmpX -= 1;
					break;
				case 3:
					tmpX += 1;
					break;
				case 2:
					tmpY -= 1;
					break;
				case 0:
					tmpY += 1;
					break;
				}
				this.wildPokemon = new pokemmo.entities.CWildPokemon(this.battleEnemy,tmpX,tmpY,this,this.battleEnemyShiny);
				pokemmo.Renderer.curTransition.step = 7;
			} else {
				this.battleX = this.x;
				this.battleY = this.y;
				this.lockDirection = this.direction;
				this.direction = (this.direction + 2) % 4;
				this.walking = true;
				this.walkingHasMoved = false;
				this.walkingPerc = 0.0;
				this.battleHasWalkedBack = true;
				tmpX = this.battleX;
				tmpY = this.battleY;
				switch(this.direction) {
				case 1:
					tmpX -= 1;
					break;
				case 3:
					tmpX += 1;
					break;
				case 2:
					tmpY -= 1;
					break;
				case 0:
					tmpY += 1;
					break;
				}
				this.battleLastX = tmpX;
				this.battleLastY = tmpY;
				tmpX = this.battleX;
				tmpY = this.battleY;
				switch(this.direction) {
				case 1:
					tmpX -= 2;
					break;
				case 3:
					tmpX += 2;
					break;
				case 2:
					tmpY -= 2;
					break;
				case 0:
					tmpY += 2;
					break;
				}
				if(curMap.isTileSolid(tmpX,tmpY) || curMap.isTileWater(tmpX,tmpY) || curMap.isTileLedge(tmpX,tmpY)) {
					tmpX = this.battleX;
					tmpY = this.battleY;
					switch(this.direction) {
					case 1:
						tmpX -= 1;
						break;
					case 3:
						tmpX += 1;
						break;
					case 2:
						tmpY -= 1;
						break;
					case 0:
						tmpY += 1;
						break;
					}
				}
				this.battleFolX = tmpX;
				this.battleFolY = tmpY;
			}
		}
		if(this.battleHasWalkedBack) {
			this.followerObj.forceTarget = true;
			this.lastX = this.battleFolX;
			this.lastY = this.battleFolY;
		}
	} else {
		this.followerObj.forceTarget = false;
		if(this.wildPokemon != null) {
			this.wildPokemon.destroy();
			this.wildPokemon = null;
		}
		if(this.lockDirection != -1) {
			this.direction = this.lockDirection;
			this.lockDirection = -1;
			this.lastX = this.battleLastX;
			this.lastY = this.battleLastY;
			tmpX = this.battleX;
			tmpY = this.battleY;
			switch(this.direction) {
			case 1:
				tmpX += 1;
				break;
			case 3:
				tmpX -= 1;
				break;
			case 2:
				tmpY += 1;
				break;
			case 0:
				tmpY -= 1;
				break;
			}
			this.followerObj.x = tmpX;
			this.followerObj.y = tmpY;
		}
		this.battleHasWalkedBack = false;
	}
}
pokemmo.CCharacter.prototype.enterDoor = function(door) {
	var me = this;
	var tmpX = this.x;
	var tmpY = this.y;
	var canvas = pokemmo.Main.canvas;
	var ctx = pokemmo.Main.ctx;
	door.open();
	this.walking = false;
	if(this.username == pokemmo.Game.username) {
		pokemmo.Game.curGame.playerCanMove = false;
		pokemmo.Game.curGame.queueLoadMap = true;
	}
	var tmpCount = 0;
	var doorRenderTransition = null;
	doorRenderTransition = function() {
		++tmpCount;
		if(tmpCount < 15) return;
		if(tmpCount == 15) {
			me.walking = true;
			me.noclip = true;
			me.transmitWalk = false;
		}
		me.lastX = tmpX;
		me.lastY = tmpY;
		if(me.username == pokemmo.Game.username) {
			if(tmpCount == 23) pokemmo.Game.curGame.drawPlayerChar = false;
			var perc = pokemmo.Util.clamp((tmpCount - 20) / 10,0,1);
			ctx.fillStyle = "rgba(0,0,0," + perc + ")";
			ctx.fillRect(0,0,canvas.width,canvas.height);
			if(tmpCount == 30) {
				me.noclip = false;
				me.transmitWalk = true;
				pokemmo.Game.curGame.queueLoadMap = false;
				if(pokemmo.Game.curGame.queuedMap != null) pokemmo.Game.loadMap(pokemmo.Game.curGame.queuedMap,pokemmo.Game.curGame.queuedChars);
			}
		} else if(tmpCount == 23) {
			me.destroy();
			pokemmo.Renderer.unHookRender(doorRenderTransition);
		}
	};
	if(this.username == pokemmo.Game.username) pokemmo.Connection.socket.emit("useWarp",{ name : door.name, direction : this.direction});
	pokemmo.Renderer.hookRender(doorRenderTransition);
}
pokemmo.CCharacter.prototype.enterWarpArrow = function(warp) {
	var me = this;
	var tmpX = this.x;
	var tmpY = this.y;
	var ctx = pokemmo.Main.ctx;
	var canvas = pokemmo.Main.canvas;
	warp.disable = true;
	this.walking = false;
	if(this.username == pokemmo.Game.username) {
		pokemmo.Game.curGame.playerCanMove = false;
		pokemmo.Game.curGame.queueLoadMap = true;
	}
	var tmpCount = 0;
	var warpRenderTransition = null;
	warpRenderTransition = function() {
		++tmpCount;
		if(me.username == pokemmo.Game.username) {
			var perc = pokemmo.Util.clamp(tmpCount / 10,0,1);
			ctx.fillStyle = "rgba(0,0,0," + perc + ")";
			ctx.fillRect(0,0,canvas.width,canvas.height);
			if(tmpCount == 10) {
				pokemmo.Game.curGame.queueLoadMap = false;
				if(pokemmo.Game.curGame.queuedMap != null) pokemmo.Game.loadMap(pokemmo.Game.curGame.queuedMap,pokemmo.Game.curGame.queuedChars);
			}
		} else {
			me.destroy();
			pokemmo.Renderer.unHookRender(warpRenderTransition);
		}
	};
	if(this.username == pokemmo.Game.username) pokemmo.Connection.socket.emit("useWarp",{ name : warp.name, direction : this.direction});
	pokemmo.Renderer.hookRender(warpRenderTransition);
}
pokemmo.CCharacter.prototype.enterStairs = function(warp) {
	var me = this;
	var tmpX = this.x;
	var tmpY = this.y;
	var canvas = pokemmo.Main.canvas;
	var ctx = pokemmo.Main.ctx;
	this.walking = true;
	if(this.username == pokemmo.Game.username) {
		pokemmo.Game.curGame.playerCanMove = false;
		pokemmo.Game.curGame.queueLoadMap = true;
	}
	var tmpCount = 0;
	var warpRenderTransition = null;
	warpRenderTransition = function() {
		++tmpCount;
		me.walking = true;
		me.noclip = true;
		me.transmitWalk = false;
		if(me.walkingPerc <= 0.3) me.walkingPerc += 0.3;
		me.lastX = tmpX;
		me.lastY = tmpY;
		if(warp.direction == 0) me.renderOffsetY += 16 / 9; else if(warp.direction == 2) me.renderOffsetY -= 16 / 9; else throw "Assertion error";
		if(me.username == pokemmo.Game.username) {
			var perc = pokemmo.Util.clamp(tmpCount / 10,0,1);
			ctx.fillStyle = "rgba(0,0,0," + perc + ")";
			ctx.fillRect(0,0,canvas.width,canvas.height);
			if(tmpCount == 10) {
				pokemmo.Game.curGame.drawPlayerChar = false;
				me.noclip = false;
				me.transmitWalk = true;
				pokemmo.Game.curGame.queueLoadMap = false;
				if(pokemmo.Game.curGame.queuedMap != null) pokemmo.Game.loadMap(pokemmo.Game.curGame.queuedMap,pokemmo.Game.curGame.queuedChars);
			}
		} else {
			me.renderAlpha = pokemmo.Util.clamp(1 - tmpCount / 10,0,1);
			if(tmpCount == 10) {
				me.destroy();
				pokemmo.Renderer.unHookRender(warpRenderTransition);
			}
		}
	};
	if(this.username == pokemmo.Game.username) pokemmo.Connection.socket.emit("useWarp",{ name : warp.name, direction : this.direction});
	pokemmo.Renderer.hookRender(warpRenderTransition);
}
pokemmo.CCharacter.prototype.useLedge = function() {
	var me = this;
	var frontX = this.getFrontPositionX();
	var frontY = this.getFrontPositionY();
	var destX = this.getFrontPositionX(2);
	var destY = this.getFrontPositionY(2);
	this.walking = true;
	this.noclip = true;
	this.transmitWalk = false;
	this.jumping = true;
	if(this.username == pokemmo.Game.username) pokemmo.Game.curGame.playerCanMove = false;
	var tmpCount = 0;
	var renderFunc = null;
	renderFunc = function() {
		++tmpCount;
		if(me.x != destX || me.y != destY) me.walking = true;
		me.renderOffsetY = Math.min(Math.round(8 / 15 * (tmpCount * tmpCount) + -8 * tmpCount),0);
		if(tmpCount == 18) new pokemmo.entities.CLedgeSmoke(me.x,me.y);
		if(tmpCount >= 20) {
			me.renderOffsetY = 0;
			me.walking = false;
			if(me.username == pokemmo.Game.username) pokemmo.Game.curGame.playerCanMove = true;
			me.noclip = false;
			me.jumping = false;
			me.transmitWalk = true;
			me.freezeTicks = 2;
			me.x = destX;
			me.y = destY;
			me.lastX = me.x;
			me.lastY = me.y;
			pokemmo.Renderer.unHookRender(renderFunc);
		}
	};
	if(this.username == pokemmo.Game.username) pokemmo.Connection.socket.emit("useLedge",{ ack : pokemmo.Connection.lastAckMove, x : frontX, y : frontY});
	pokemmo.Renderer.hookRender(renderFunc);
}
pokemmo.CCharacter.prototype.willMoveIntoAWall = function() {
	var posX = this.getFrontPositionX();
	var posY = this.getFrontPositionY();
	var map = pokemmo.Game.curGame.map;
	return map.isTileSolid(posX,posY) || map.isTileWater(posX,posY) || map.isTileLedge(posX,posY);
}
pokemmo.CCharacter.prototype.getFrontPositionX = function(n) {
	if(n == null) n = 1;
	switch(this.direction) {
	case 1:
		return this.x - n;
	case 3:
		return this.x + n;
	case 2:
		return this.x;
	case 0:
		return this.x;
	}
	return null;
}
pokemmo.CCharacter.prototype.getFrontPositionY = function(n) {
	if(n == null) n = 1;
	switch(this.direction) {
	case 1:
		return this.y;
	case 3:
		return this.y;
	case 2:
		return this.y - n;
	case 0:
		return this.y + n;
	}
	return null;
}
pokemmo.CCharacter.prototype.tickBot = function() {
	if(this.walking) return;
	this.walking = this.x != this.targetX || this.y != this.targetY;
	if(!this.walking) return;
	var lastDirection = this.direction;
	if(Math.abs(this.x - this.targetX) > 0 && this.y == this.targetY) this.direction = this.x < this.targetX?3:1; else if(Math.abs(this.y - this.targetY) > 0 && this.x == this.targetX) this.direction = this.y < this.targetY?0:2; else this.direction = this.targetY < this.y?2:0;
	if(lastDirection != this.direction) this.walkingPerc = 0.0;
}
pokemmo.CCharacter.prototype.render = function(ctx) {
	var me = this;
	if(!this.loaded) return;
	if(this.username == pokemmo.Game.username && !pokemmo.Game.curGame.drawPlayerChar) return;
	var tmpCtx = pokemmo.Main.tmpCtx;
	ctx.save();
	ctx.globalAlpha *= this.renderAlpha;
	if(pokemmo.Renderer.numRTicks - this.createdTick < 10) ctx.globalAlpha *= (pokemmo.Renderer.numRTicks - this.createdTick) / 10;
	var offsetX = pokemmo.Renderer.getOffsetX();
	var offsetY = pokemmo.Renderer.getOffsetY();
	var map = pokemmo.Map.getCurMap();
	var renderPosX = this.getRenderPosX();
	var renderPosY = this.getRenderPosY();
	var dirId = this.direction * 32;
	if(this.lockDirection != -1) dirId = this.lockDirection * 32;
	if(this.username != pokemmo.Game.username && (pokemmo.UI.mouseX >= renderPosX + offsetX - 5 && pokemmo.UI.mouseY >= renderPosY + offsetY - 5 && pokemmo.UI.mouseX < renderPosX + 32 + offsetX + 10 && pokemmo.UI.mouseY < renderPosY + 64 + offsetY + 10)) {
		pokemmo.Renderer.drawOverlay(ctx,renderPosX + offsetX,renderPosY + offsetY,32,64,function(ctx1) {
			ctx1.drawImage(me.image.obj,dirId,Math.floor(me.animationStep) * 64,32,64,0,0,32,64);
		});
		ctx.save();
		ctx.font = "12px Font2";
		ctx.textAlign = "center";
		ctx.fillStyle = "#000000";
		ctx.fillText(this.username,renderPosX + offsetX + 32 / 2 + 1,renderPosY + offsetY + 17);
		ctx.fillStyle = "#FFFFFF";
		ctx.fillText(this.username,renderPosX + offsetX + 32 / 2,renderPosY + offsetY + 16);
		ctx.restore();
	}
	if(this.jumping) ctx.drawImage(pokemmo.Game.res["miscSprites"].obj,0,64,32,32,renderPosX + offsetX,renderPosY + offsetY - this.renderOffsetY + 30,32,32);
	ctx.drawImage(this.image.obj,dirId,Math.floor(this.animationStep) * 64,32,64,renderPosX + offsetX,renderPosY + offsetY,32,64);
	if(map.isTileGrass(this.x,this.y) && !this.walking) ctx.drawImage(pokemmo.Game.res["miscSprites"].obj,0,0,32,32,this.x * map.tilewidth + offsetX,this.y * map.tileheight + offsetY,32,32);
	if(this.inBattle && this.username != pokemmo.Game.username) {
		ctx.save();
		var ly = 0.0;
		ly = (pokemmo.Renderer.numRTicks + this.randInt) % 31 / 30;
		ly *= 2;
		if(ly > 1) ly = 1 - (ly - 1);
		ly *= ly;
		ly *= 10;
		ctx.translate(renderPosX + offsetX + 16,renderPosY + offsetY + 2 + Math.round(ly));
		ctx.rotate((pokemmo.Renderer.numRTicks + this.randInt) % 11 / 10 * Math.PI * 2);
		ctx.drawImage(pokemmo.Game.res["uiCharInBattle"].obj,-10,-10);
		ctx.restore();
	}
	if(pokemmo.Renderer.numRTicks - this.createdTick < 10) ctx.restore();
}
pokemmo.CCharacter.prototype.__class__ = pokemmo.CCharacter;
pokemmo.Map = function(id,data) {
	if( id === $_ ) return;
	this.id = id;
	this.tilesets = [];
	this.layers = [];
	this.width = data.width;
	this.height = data.height;
	this.tilesets = [];
	this.layers = [];
	this.tilewidth = data.tilewidth;
	this.tileheight = data.tileheight;
	this.properties = data.properties;
	var _g1 = 0, _g = data.tilesets.length;
	while(_g1 < _g) {
		var i = _g1++;
		this.tilesets.push(new pokemmo.Tileset(data.tilesets[i]));
	}
	var _g1 = 0, _g = data.layers.length;
	while(_g1 < _g) {
		var i = _g1++;
		var layer = new pokemmo.Layer(data.layers[i]);
		if(layer.properties.data_layer == "1") this.dataLayer = layer; else this.layers.push(layer);
	}
}
pokemmo.Map.__name__ = ["pokemmo","Map"];
pokemmo.Map.cur = null;
pokemmo.Map.getCurMap = function() {
	return pokemmo.Game.curGame.map;
}
pokemmo.Map.prototype.id = null;
pokemmo.Map.prototype.game = null;
pokemmo.Map.prototype.properties = null;
pokemmo.Map.prototype.tilesets = null;
pokemmo.Map.prototype.layers = null;
pokemmo.Map.prototype.dataLayer = null;
pokemmo.Map.prototype.width = null;
pokemmo.Map.prototype.height = null;
pokemmo.Map.prototype.tilewidth = null;
pokemmo.Map.prototype.tileheight = null;
pokemmo.Map.prototype.cacheMap = null;
pokemmo.Map.prototype.cacheOffsetX = null;
pokemmo.Map.prototype.cacheOffsetY = null;
pokemmo.Map.prototype.render = function(ctx) {
	if(this.cacheMap != this || this.cacheOffsetX != pokemmo.Renderer.getOffsetX() || this.cacheOffsetY != pokemmo.Renderer.getOffsetY()) {
		pokemmo.Main.mapCacheCtx.fillStyle = "#000000";
		pokemmo.Main.mapCacheCtx.fillRect(0,0,pokemmo.Main.mapCacheCanvas.width,pokemmo.Main.mapCacheCanvas.height);
		var _g = 0, _g1 = this.layers;
		while(_g < _g1.length) {
			var layer = _g1[_g];
			++_g;
			if(layer.properties.overchars == "1") continue;
			if(layer.properties.animated == "1") continue;
			layer.render(pokemmo.Main.mapCacheCtx,this);
		}
		ctx.drawImage(pokemmo.Main.mapCacheCanvas,0,0);
		this.cacheMap = this;
		this.cacheOffsetX = pokemmo.Renderer.getOffsetX();
		this.cacheOffsetY = pokemmo.Renderer.getOffsetY();
	} else ctx.drawImage(pokemmo.Main.mapCacheCanvas,0,0);
}
pokemmo.Map.prototype.renderAnimated = function(ctx) {
	var _g = 0, _g1 = this.layers;
	while(_g < _g1.length) {
		var layer = _g1[_g];
		++_g;
		if(layer.properties.animated != "1") continue;
		layer.render(ctx,this);
	}
}
pokemmo.Map.prototype.renderOver = function(ctx) {
	var _g = 0, _g1 = this.layers;
	while(_g < _g1.length) {
		var layer = _g1[_g];
		++_g;
		if(layer.properties.overchars != "1") continue;
		layer.render(ctx,this);
	}
}
pokemmo.Map.prototype.isTileSolid = function(x,y) {
	return this.hasTileProp(x,y,"solid");
}
pokemmo.Map.prototype.isTileWater = function(x,y) {
	return this.hasTileProp(x,y,"water");
}
pokemmo.Map.prototype.isTileGrass = function(x,y) {
	return this.hasTileProp(x,y,"grass");
}
pokemmo.Map.prototype.isTileLedge = function(x,y) {
	return this.hasTileProp(x,y,"ledge");
}
pokemmo.Map.prototype.getLedgeDir = function(x,y) {
	var layer = this.dataLayer;
	var j = y * layer.width + x;
	var tileid = layer.data[j];
	if(tileid == null || tileid == 0) return -1;
	var tileset = pokemmo.Tileset.getTilesetOfTile(this,tileid);
	if(tileset == null) throw "Tileset is null";
	if(tileset.tileproperties[tileid - tileset.firstgid].ledge == "1") return Number(tileset.tileproperties[tileid - tileset.firstgid].ledge_dir) || 0;
	return -1;
}
pokemmo.Map.prototype.hasTileProp = function(x,y,prop) {
	var layer = this.dataLayer;
	var j = y * layer.width + x;
	var tileid = layer.data[j];
	if(tileid == null || tileid == 0) return false;
	var tileset = pokemmo.Tileset.getTilesetOfTile(this,tileid);
	if(tileset == null) throw "Tileset is null";
	if(tileset.tileproperties[tileid - tileset.firstgid][prop] == "1") return true;
	return false;
}
pokemmo.Map.prototype.__class__ = pokemmo.Map;
pokemmo.entities.CStairs = function(name,x,y,direction,fromDir) {
	if( name === $_ ) return;
	pokemmo.entities.CWarp.call(this,name,x,y);
	this.direction = direction;
	this.fromDir = fromDir;
}
pokemmo.entities.CStairs.__name__ = ["pokemmo","entities","CStairs"];
pokemmo.entities.CStairs.__super__ = pokemmo.entities.CWarp;
for(var k in pokemmo.entities.CWarp.prototype ) pokemmo.entities.CStairs.prototype[k] = pokemmo.entities.CWarp.prototype[k];
pokemmo.entities.CStairs.prototype.fromDir = null;
pokemmo.entities.CStairs.prototype.canWarp = function(chr) {
	return chr.direction == this.fromDir;
}
pokemmo.entities.CStairs.prototype.__class__ = pokemmo.entities.CStairs;
Hash = function(p) {
	if( p === $_ ) return;
	this.h = {}
	if(this.h.__proto__ != null) {
		this.h.__proto__ = null;
		delete(this.h.__proto__);
	}
}
Hash.__name__ = ["Hash"];
Hash.prototype.h = null;
Hash.prototype.set = function(key,value) {
	this.h["$" + key] = value;
}
Hash.prototype.get = function(key) {
	return this.h["$" + key];
}
Hash.prototype.exists = function(key) {
	try {
		key = "$" + key;
		return this.hasOwnProperty.call(this.h,key);
	} catch( e ) {
		for(var i in this.h) if( i == key ) return true;
		return false;
	}
}
Hash.prototype.remove = function(key) {
	if(!this.exists(key)) return false;
	delete(this.h["$" + key]);
	return true;
}
Hash.prototype.keys = function() {
	var a = new Array();
	for(var i in this.h) a.push(i.substr(1));
	return a.iterator();
}
Hash.prototype.iterator = function() {
	return { ref : this.h, it : this.keys(), hasNext : function() {
		return this.it.hasNext();
	}, next : function() {
		var i = this.it.next();
		return this.ref["$" + i];
	}};
}
Hash.prototype.toString = function() {
	var s = new StringBuf();
	s.b[s.b.length] = "{" == null?"null":"{";
	var it = this.keys();
	while( it.hasNext() ) {
		var i = it.next();
		s.b[s.b.length] = i == null?"null":i;
		s.b[s.b.length] = " => " == null?"null":" => ";
		s.add(Std.string(this.get(i)));
		if(it.hasNext()) s.b[s.b.length] = ", " == null?"null":", ";
	}
	s.b[s.b.length] = "}" == null?"null":"}";
	return s.b.join("");
}
Hash.prototype.__class__ = Hash;
pokemmo.Game = function(p) {
	if( p === $_ ) return;
	this.loaded = false;
	pokemmo.Game.loadError = false;
	this.inBattle = false;
	this.queueLoadMap = false;
	this.gameObjects = [];
	this.characters = [];
	this.cachedImages = new Hash();
	this.playerCanMove = true;
	this.drawPlayerChar = true;
	this.drawPlayerFollower = true;
	pokemmo.Renderer.resetHooks();
}
pokemmo.Game.__name__ = ["pokemmo","Game"];
pokemmo.Game.state = null;
pokemmo.Game.username = null;
pokemmo.Game.accountLevel = null;
pokemmo.Game.curGame = null;
pokemmo.Game.pokemonParty = null;
pokemmo.Game.loadError = null;
pokemmo.Game.res = null;
pokemmo.Game.pokemonData = null;
pokemmo.Game.movesData = null;
pokemmo.Game.playerBackspriteType = null;
pokemmo.Game.loadedBasicUI = null;
pokemmo.Game.setup = function() {
	pokemmo.Game.loadError = false;
	pokemmo.Game.loadedBasicUI = false;
	pokemmo.Game.state = pokemmo.GameState.ST_UNKNOWN;
	pokemmo.Game.res = ({});
	pokemmo.Game.accountLevel = 0;
}
pokemmo.Game.setPokemonParty = function(arr) {
	var _g1 = 0, _g = arr.length;
	while(_g1 < _g) {
		var i = _g1++;
		arr[i].icon = pokemmo.Game.curGame != null?pokemmo.Game.curGame.getImage("resources/picons/" + arr[i].id + "_1.png"):new pokemmo.ImageResource("resources/picons/" + arr[i].id + "_1.png");
		if(pokemmo.Game.curGame != null) {
			pokemmo.Game.curGame.getImage("resources/back/" + arr[i].id + ".png");
			pokemmo.Game.curGame.getImage("resources/followers/" + arr[i].id + ".png");
		} else {
			new Image().src = "resources/back/" + arr[i].id + ".png";
			new Image().src = "resources/followers/" + arr[i].id + ".png";
		}
	}
	pokemmo.Game.pokemonParty = arr;
}
pokemmo.Game.loadMap = function(id,chars) {
	var g = pokemmo.Game.curGame = new pokemmo.Game();
	pokemmo.Game.state = pokemmo.GameState.ST_LOADING;
	if(!pokemmo.Game.loadedBasicUI) {
		pokemmo.Game.loadedBasicUI = true;
		pokemmo.Game.loadImageResource("miscSprites","resources/tilesets/misc.png");
		pokemmo.Game.loadImageResource("uiPokemon","resources/ui/pokemon.png");
		pokemmo.Game.loadImageResource("uiChat","resources/ui/chat.png");
		pokemmo.Game.loadImageResource("uiCharInBattle","resources/ui/char_in_battle.png");
		pokemmo.Game.loadImageResource("battleTextBackground","resources/ui/battle_text.png");
		pokemmo.Game.loadImageResource("battleMoveMenu","resources/ui/battle_move_menu.png");
		pokemmo.Game.loadImageResource("battleTrainerStatus","resources/ui/battle_trainer_status.png");
		pokemmo.Game.loadImageResource("battleMisc","resources/ui/battle_misc.png");
		pokemmo.Game.loadImageResource("battlePokeballs","resources/ui/battle_pokeballs.png");
		pokemmo.Game.loadImageResource("battleActionMenu","resources/ui/battle_action_menu.png");
		pokemmo.Game.loadImageResource("types","resources/ui/types.png");
		pokemmo.Game.loadImageResource("battlePokemonBar","resources/ui/battle_pokemon_bar.png");
		pokemmo.Game.loadImageResource("battleHealthBar","resources/ui/battle_healthbar.png");
		pokemmo.Game.loadImageResource("battleEnemyBar","resources/ui/battle_enemy_bar.png");
		pokemmo.Game.loadImageResource("battleIntroPokeball","resources/ui/battle_intro_pokeball.png");
		pokemmo.Game.loadImageResource("animatedTileset","resources/tilesets/animated.png");
		pokemmo.Game.loadImageResource("battleYesNo","resources/ui/battle_yesno.png");
		pokemmo.Game.loadImageResource("battleLearnMove","resources/ui/battle_learnmove.png");
		pokemmo.Game.loadImageResource("battleLearnMoveSelection","resources/ui/battle_learnmove_selection.png");
		pokemmo.Game.loadJSON("data/pokemon.json",function(data) {
			pokemmo.Game.pokemonData = data;
		});
		pokemmo.Game.loadJSON("data/moves.json",function(data) {
			pokemmo.Game.movesData = data;
		});
	}
	pokemmo.Game.loadJSON("resources/maps/" + id + ".json",function(data) {
		var map = new pokemmo.Map(id,data);
		var _g = 0, _g1 = map.tilesets;
		while(_g < _g1.length) {
			var tileset = _g1[_g];
			++_g;
			if(!tileset.loaded) {
				if(tileset.error) {
					pokemmo.Game.loadError = true;
					throw "loadError";
					return;
				} else {
					++pokemmo.Game.pendingLoad;
					tileset.onload = function() {
						--pokemmo.Game.pendingLoad;
					};
					tileset.onerror = function() {
						--pokemmo.Game.pendingLoad;
						pokemmo.Game.loadError = true;
						throw "loadError";
					};
				}
			}
		}
		if(map.properties.preload_pokemon != null) {
			var arr = map.properties.preload_pokemon.split(",");
			var _g = 0;
			while(_g < arr.length) {
				var pk = arr[_g];
				++_g;
				pokemmo.Game.curGame.getImage("resources/followers/" + pk + ".png");
				pokemmo.Game.curGame.getImage("resources/sprites/" + pk + ".png");
			}
		}
		pokemmo.Game.curGame.loaded = true;
		pokemmo.Game.curGame.map = map;
		pokemmo.Game.curGame.parseMapObjects();
		var arr = chars;
		var _g = 0;
		while(_g < arr.length) {
			var chrData = arr[_g];
			++_g;
			var chr = new pokemmo.CCharacter(chrData);
			if(chr.username == pokemmo.Game.username) chr.freezeTicks = 10;
		}
	});
}
pokemmo.Game.loadImageResource = function(id,src) {
	++pokemmo.Game.pendingLoad;
	return pokemmo.Game.res[id] = new pokemmo.ImageResource(src,function() {
		--pokemmo.Game.pendingLoad;
	},function() {
		--pokemmo.Game.pendingLoad;
		pokemmo.Game.loadError = true;
		throw "loadError";
	});
}
pokemmo.Game.loadJSON = function(src,onload) {
	++pokemmo.Game.pendingLoad;
	var obj = ({});
	obj.cache = true;
	obj.dataType = "text";
	obj.success = function(data,textStatus,jqXHR) {
		--pokemmo.Game.pendingLoad;
		onload(JSON.parse(data));
	};
	obj.error = function(jqXHR,textStatus,errorThrown) {
		--pokemmo.Game.pendingLoad;
		pokemmo.Game.loadError = true;
		throw "loadError";
	};
	pokemmo.Main.jq.ajax(src,obj);
}
pokemmo.Game.getRes = function(id) {
	return pokemmo.Game.res[id];
}
pokemmo.Game.setRes = function(id,v) {
	pokemmo.Game.res[id] = v;
}
pokemmo.Game.getPokemonData = function(id) {
	return pokemmo.Game.pokemonData[id];
}
pokemmo.Game.getMoveData = function(id) {
	return pokemmo.Game.movesData[id.toLowerCase()];
}
pokemmo.Game.prototype.gameObjects = null;
pokemmo.Game.prototype.characters = null;
pokemmo.Game.prototype.cachedImages = null;
pokemmo.Game.prototype.queueLoadMap = null;
pokemmo.Game.prototype.queuedMap = null;
pokemmo.Game.prototype.queuedChars = null;
pokemmo.Game.prototype.loaded = null;
pokemmo.Game.prototype.inBattle = null;
pokemmo.Game.prototype.battle = null;
pokemmo.Game.prototype.map = null;
pokemmo.Game.prototype.playerCanMove = null;
pokemmo.Game.prototype.drawPlayerChar = null;
pokemmo.Game.prototype.drawPlayerFollower = null;
pokemmo.Game.prototype.initBattle = function(b) {
	this.inBattle = true;
	this.battle = b;
	return this.battle;
}
pokemmo.Game.prototype.tick = function() {
	if(pokemmo.Game.state != pokemmo.GameState.ST_MAP) return;
	var arr = this.gameObjects.copy();
	var _g1 = 0, _g = arr.length;
	while(_g1 < _g) {
		var i = _g1++;
		arr[i].tick();
	}
	if(pokemmo.Renderer.numRTicks % 30 * 60 * 10 == 0) this.cachedImages = new Hash();
}
pokemmo.Game.prototype.renderObjects = function(ctx) {
	var arr = [];
	var icx = Math.floor(pokemmo.Renderer.cameraX);
	var icy = Math.floor(pokemmo.Renderer.cameraY);
	var fcx = icx + pokemmo.Main.screenWidth / this.map.tilewidth;
	var fcy = icy + pokemmo.Main.screenHeight / this.map.tileheight;
	var _g1 = 0, _g = this.gameObjects.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(this.gameObjects[i].x + 2 > icx && this.gameObjects[i].y + 2 > icy && this.gameObjects[i].x - 2 < fcx && this.gameObjects[i].y - 2 < fcy) arr.push(this.gameObjects[i]);
	}
	var A_FIRST = -1;
	var B_FIRST = 1;
	arr.sort(function(a,b) {
		if(a.y < b.y) return A_FIRST;
		if(a.y > b.y) return B_FIRST;
		if(a.y == b.y) {
			if(Std["is"](a,pokemmo.CCharacter)) {
				if(a.username == pokemmo.Game.username && Std["is"](b,pokemmo.CCharacter)) return B_FIRST;
			}
			if(Std["is"](b,pokemmo.CCharacter)) {
				if(b.username == pokemmo.Game.username && Std["is"](a,pokemmo.CCharacter)) return A_FIRST;
			}
			if(a.renderPriority > b.renderPriority) return A_FIRST;
			if(b.renderPriority > a.renderPriority) return B_FIRST;
			if(Std["is"](a,pokemmo.entities.CGrassAnimation)) return B_FIRST;
			if(Std["is"](b,pokemmo.entities.CGrassAnimation)) return A_FIRST;
			if(Std["is"](a,pokemmo.CCharacter) && Std["is"](b,pokemmo.entities.CFollower)) return B_FIRST; else if(Std["is"](b,pokemmo.CCharacter) && Std["is"](a,pokemmo.entities.CFollower)) return A_FIRST;
			if(a.randInt > b.randInt) return B_FIRST;
			if(a.randInt < b.randInt) return A_FIRST;
			return 0;
		}
		return 0;
	});
	var _g1 = 0, _g = arr.length;
	while(_g1 < _g) {
		var i = _g1++;
		arr[i].render(ctx);
	}
}
pokemmo.Game.prototype.getPlayerChar = function() {
	return this.getCharByUsername(pokemmo.Game.username);
}
pokemmo.Game.prototype.getCharByUsername = function(username) {
	var _g1 = 0, _g = this.characters.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(this.characters[i].username == username) return this.characters[i];
	}
	return null;
}
pokemmo.Game.prototype.getImage = function(src,onload,onerror) {
	var res;
	if(this.cachedImages.exists(src)) {
		res = this.cachedImages.get(src);
		res.addLoadHook(onload);
		res.addErrorHook(onerror);
		return res;
	}
	res = new pokemmo.ImageResource(src,onload,onerror);
	this.cachedImages.set(src,res);
	return res;
}
pokemmo.Game.prototype.parseMapObjects = function() {
	var _g = 0, _g1 = this.map.layers;
	while(_g < _g1.length) {
		var layer = _g1[_g];
		++_g;
		if(layer.type != "objectgroup") continue;
		var _g2 = 0, _g3 = layer.objects;
		while(_g2 < _g3.length) {
			var obj = _g3[_g2];
			++_g2;
			switch(obj.type) {
			case "warp":
				if(obj.properties.type == "door") new pokemmo.entities.CDoor(obj.name,Math.floor(obj.x / this.map.tilewidth),Math.floor(obj.y / this.map.tileheight)); else if(obj.properties.type == "arrow") new pokemmo.entities.CWarpArrow(obj.name,Math.floor(obj.x / this.map.tilewidth),Math.floor(obj.y / this.map.tileheight)); else if(obj.properties.type == "stairs_up") new pokemmo.entities.CStairs(obj.name,Math.floor(obj.x / this.map.tilewidth),Math.floor(obj.y / this.map.tileheight),2,Std.parseInt(obj.properties.from_dir)); else if(obj.properties.type == "stairs_down") new pokemmo.entities.CStairs(obj.name,Math.floor(obj.x / this.map.tilewidth),Math.floor(obj.y / this.map.tileheight),0,Std.parseInt(obj.properties.from_dir));
				break;
			}
		}
	}
}
pokemmo.Game.prototype.__class__ = pokemmo.Game;
pokemmo.GameState = { __ename__ : ["pokemmo","GameState"], __constructs__ : ["ST_UNKNOWN","ST_LOADING","ST_MAP","ST_DISCONNECTED","ST_TITLE","ST_NEWGAME","ST_REGISTER"] }
pokemmo.GameState.ST_UNKNOWN = ["ST_UNKNOWN",0];
pokemmo.GameState.ST_UNKNOWN.toString = $estr;
pokemmo.GameState.ST_UNKNOWN.__enum__ = pokemmo.GameState;
pokemmo.GameState.ST_LOADING = ["ST_LOADING",1];
pokemmo.GameState.ST_LOADING.toString = $estr;
pokemmo.GameState.ST_LOADING.__enum__ = pokemmo.GameState;
pokemmo.GameState.ST_MAP = ["ST_MAP",2];
pokemmo.GameState.ST_MAP.toString = $estr;
pokemmo.GameState.ST_MAP.__enum__ = pokemmo.GameState;
pokemmo.GameState.ST_DISCONNECTED = ["ST_DISCONNECTED",3];
pokemmo.GameState.ST_DISCONNECTED.toString = $estr;
pokemmo.GameState.ST_DISCONNECTED.__enum__ = pokemmo.GameState;
pokemmo.GameState.ST_TITLE = ["ST_TITLE",4];
pokemmo.GameState.ST_TITLE.toString = $estr;
pokemmo.GameState.ST_TITLE.__enum__ = pokemmo.GameState;
pokemmo.GameState.ST_NEWGAME = ["ST_NEWGAME",5];
pokemmo.GameState.ST_NEWGAME.toString = $estr;
pokemmo.GameState.ST_NEWGAME.__enum__ = pokemmo.GameState;
pokemmo.GameState.ST_REGISTER = ["ST_REGISTER",6];
pokemmo.GameState.ST_REGISTER.toString = $estr;
pokemmo.GameState.ST_REGISTER.__enum__ = pokemmo.GameState;
Std = function() { }
Std.__name__ = ["Std"];
Std["is"] = function(v,t) {
	return js.Boot.__instanceof(v,t);
}
Std.string = function(s) {
	return js.Boot.__string_rec(s,"");
}
Std["int"] = function(x) {
	if(x < 0) return Math.ceil(x);
	return Math.floor(x);
}
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && x.charCodeAt(1) == 120) v = parseInt(x);
	if(isNaN(v)) return null;
	return v;
}
Std.parseFloat = function(x) {
	return parseFloat(x);
}
Std.random = function(x) {
	return Math.floor(Math.random() * x);
}
Std.prototype.__class__ = Std;
pokemmo.Move = function(p) {
}
pokemmo.Move.__name__ = ["pokemmo","Move"];
pokemmo.Move.list = null;
pokemmo.Move.createList = function() {
	pokemmo.Move.list = new Hash();
	pokemmo.Move.list.set("def",new pokemmo.moves.MDefault());
}
pokemmo.Move.getMove = function(n) {
	if(pokemmo.Move.list == null) pokemmo.Move.createList();
	if(!pokemmo.Move.list.exists(n)) return pokemmo.Move.list.get("def");
	return pokemmo.Move.list.get(n);
}
pokemmo.Move.prototype.start = function() {
}
pokemmo.Move.prototype.render = function(ctx,battle) {
}
pokemmo.Move.prototype.__class__ = pokemmo.Move;
EReg = function(r,opt) {
	if( r === $_ ) return;
	opt = opt.split("u").join("");
	this.r = new RegExp(r,opt);
}
EReg.__name__ = ["EReg"];
EReg.prototype.r = null;
EReg.prototype.match = function(s) {
	this.r.m = this.r.exec(s);
	this.r.s = s;
	this.r.l = RegExp.leftContext;
	this.r.r = RegExp.rightContext;
	return this.r.m != null;
}
EReg.prototype.matched = function(n) {
	return this.r.m != null && n >= 0 && n < this.r.m.length?this.r.m[n]:(function($this) {
		var $r;
		throw "EReg::matched";
		return $r;
	}(this));
}
EReg.prototype.matchedLeft = function() {
	if(this.r.m == null) throw "No string matched";
	if(this.r.l == null) return this.r.s.substr(0,this.r.m.index);
	return this.r.l;
}
EReg.prototype.matchedRight = function() {
	if(this.r.m == null) throw "No string matched";
	if(this.r.r == null) {
		var sz = this.r.m.index + this.r.m[0].length;
		return this.r.s.substr(sz,this.r.s.length - sz);
	}
	return this.r.r;
}
EReg.prototype.matchedPos = function() {
	if(this.r.m == null) throw "No string matched";
	return { pos : this.r.m.index, len : this.r.m[0].length};
}
EReg.prototype.split = function(s) {
	var d = "#__delim__#";
	return s.replace(this.r,d).split(d);
}
EReg.prototype.replace = function(s,by) {
	return s.replace(this.r,by);
}
EReg.prototype.customReplace = function(s,f) {
	var buf = new StringBuf();
	while(true) {
		if(!this.match(s)) break;
		buf.add(this.matchedLeft());
		buf.add(f(this));
		s = this.matchedRight();
	}
	buf.b[buf.b.length] = s == null?"null":s;
	return buf.b.join("");
}
EReg.prototype.__class__ = EReg;
if(!pokemmo.moves) pokemmo.moves = {}
pokemmo.moves.MDefault = function(p) {
	if( p === $_ ) return;
	pokemmo.Move.call(this);
}
pokemmo.moves.MDefault.__name__ = ["pokemmo","moves","MDefault"];
pokemmo.moves.MDefault.__super__ = pokemmo.Move;
for(var k in pokemmo.Move.prototype ) pokemmo.moves.MDefault.prototype[k] = pokemmo.Move.prototype[k];
pokemmo.moves.MDefault.prototype.render = function(ctx,battle) {
	var now = battle.now;
	if(battle.curAction.player == 0) {
		battle.canRenderEnemy = Math.floor((now - battle.moveStartTime) / 100) % 2 == 1;
		battle.shakeEnemyStatus = true;
	} else {
		battle.canRenderPlayerPokemon = Math.floor((now - battle.moveStartTime) / 100) % 2 == 1;
		battle.shakePokemonStatus = true;
	}
	if(now - battle.moveStartTime > 500) {
		battle.canRenderEnemy = true;
		battle.canRenderPlayerPokemon = true;
		battle.moveFinished();
	}
}
pokemmo.moves.MDefault.prototype.__class__ = pokemmo.moves.MDefault;
pokemmo.entities.CDoor = function(name,x,y) {
	if( name === $_ ) return;
	pokemmo.entities.CWarp.call(this,name,x,y);
	this.renderPriority = 100;
	this.openStep = 0;
}
pokemmo.entities.CDoor.__name__ = ["pokemmo","entities","CDoor"];
pokemmo.entities.CDoor.__super__ = pokemmo.entities.CWarp;
for(var k in pokemmo.entities.CWarp.prototype ) pokemmo.entities.CDoor.prototype[k] = pokemmo.entities.CWarp.prototype[k];
pokemmo.entities.CDoor.prototype.openStep = null;
pokemmo.entities.CDoor.prototype.open = function() {
	this.openStep = 1;
}
pokemmo.entities.CDoor.prototype.canWarp = function(obj) {
	return pokemmo.entities.CWarp.prototype.canWarp.call(this,obj);
}
pokemmo.entities.CDoor.prototype.render = function(ctx) {
	if(this.disable) this.openStep = 0;
	if(this.openStep > 30) this.openStep = 0;
	var curMap = pokemmo.Map.getCurMap();
	ctx.drawImage(pokemmo.Game.res["miscSprites"].obj,64,32 * Math.min(Math.floor(this.openStep / 4),3),32,32,this.x * curMap.tilewidth + pokemmo.Renderer.getOffsetX(),this.y * curMap.tileheight + pokemmo.Renderer.getOffsetY(),32,32);
	if(this.openStep > 0) ++this.openStep;
}
pokemmo.entities.CDoor.prototype.__class__ = pokemmo.entities.CDoor;
pokemmo.Tileset = function(data) {
	if( data === $_ ) return;
	var me = this;
	this.loaded = false;
	this.error = false;
	this.tileproperties = [];
	this.imagewidth = data.imagewidth;
	this.imageheight = data.imageheight;
	this.tilewidth = data.tilewidth;
	this.tileheight = data.tileheight;
	this.firstgid = data.firstgid;
	if(data.image == "../tilesets/data.png") this.loaded = true; else {
		this.image = new Image();
		this.image.onload = function() {
			if(me.onload != null) me.onload();
		};
		this.image.onerror = function() {
			if(me.onerror != null) me.onerror();
		};
		this.image.src = "resources/" + data.image.slice(3);
	}
	var _g = 0, _g1 = Reflect.fields(data.tileproperties);
	while(_g < _g1.length) {
		var i = _g1[_g];
		++_g;
		if(!data.tileproperties.hasOwnProperty(i)) continue;
		this.tileproperties[i] = data.tileproperties[i];
	}
	var _g1 = 0, _g = Math.floor(this.imagewidth / this.tilewidth * (this.imageheight / this.tileheight));
	while(_g1 < _g) {
		var i = _g1++;
		if(!this.tileproperties[i]) this.tileproperties[i] = { };
	}
}
pokemmo.Tileset.__name__ = ["pokemmo","Tileset"];
pokemmo.Tileset.getTilesetOfTile = function(map,n) {
	var tilesets = map.tilesets;
	var i = tilesets.length;
	var f = null;
	while(i-- > 0) if(n >= tilesets[i].firstgid) {
		f = tilesets[i];
		break;
	}
	return f;
}
pokemmo.Tileset.prototype.loaded = null;
pokemmo.Tileset.prototype.error = null;
pokemmo.Tileset.prototype.onload = null;
pokemmo.Tileset.prototype.onerror = null;
pokemmo.Tileset.prototype.image = null;
pokemmo.Tileset.prototype.firstgid = null;
pokemmo.Tileset.prototype.imagewidth = null;
pokemmo.Tileset.prototype.imageheight = null;
pokemmo.Tileset.prototype.tilewidth = null;
pokemmo.Tileset.prototype.tileheight = null;
pokemmo.Tileset.prototype.tileproperties = null;
pokemmo.Tileset.prototype.__class__ = pokemmo.Tileset;
pokemmo.ImageResource = function(src,onload,onerror) {
	if( src === $_ ) return;
	this.loaded = false;
	this.error = false;
	this.loadHooks = [];
	this.errorHooks = [];
	if(onload != null) this.loadHooks.push(onload);
	if(onerror != null) this.errorHooks.push(onerror);
	this.obj = new Image();
	this.obj.onload = $closure(this,"onLoad");
	this.obj.src = src;
}
pokemmo.ImageResource.__name__ = ["pokemmo","ImageResource"];
pokemmo.ImageResource.prototype.obj = null;
pokemmo.ImageResource.prototype.loaded = null;
pokemmo.ImageResource.prototype.error = null;
pokemmo.ImageResource.prototype.loadHooks = null;
pokemmo.ImageResource.prototype.errorHooks = null;
pokemmo.ImageResource.prototype.addLoadHook = function(func) {
	if(func == null) return;
	if(this.loaded) setTimeout(func,0); else this.loadHooks.push(func);
}
pokemmo.ImageResource.prototype.addErrorHook = function(func) {
	if(func == null) return;
	if(this.error) setTimeout(func,0); else this.errorHooks.push(func);
}
pokemmo.ImageResource.prototype.onLoad = function() {
	this.loaded = true;
	var _g1 = 0, _g = this.loadHooks.length;
	while(_g1 < _g) {
		var i = _g1++;
		this.loadHooks[i]();
	}
	this.loadHooks = null;
}
pokemmo.ImageResource.prototype.onError = function() {
	this.error = true;
	var _g1 = 0, _g = this.errorHooks.length;
	while(_g1 < _g) {
		var i = _g1++;
		this.errorHooks[i]();
	}
	this.errorHooks = null;
}
pokemmo.ImageResource.prototype.__class__ = pokemmo.ImageResource;
pokemmo.Connection = function() { }
pokemmo.Connection.__name__ = ["pokemmo","Connection"];
pokemmo.Connection.socket = null;
pokemmo.Connection.setup = function() {
	pokemmo.Connection.socket = io.connect("http://localhost:2828");
	pokemmo.Connection.socket.on("connect",pokemmo.Connection.onConnect);
	pokemmo.Connection.socket.on("disconnect",pokemmo.Connection.onDisconnect);
	pokemmo.Connection.socket.on("setInfo",pokemmo.Connection.onSetInfo);
	pokemmo.Connection.socket.on("loadMap",pokemmo.Connection.onLoadMap);
	pokemmo.Connection.socket.on("invalidMove",pokemmo.Connection.onInvalidMove);
	pokemmo.Connection.socket.on("update",pokemmo.Connection.onUpdate);
	pokemmo.Connection.socket.on("battleInit",pokemmo.Connection.onBattleInit);
	pokemmo.Connection.socket.on("battleWild",pokemmo.Connection.onBattleWild);
	pokemmo.Connection.socket.on("battleTurn",pokemmo.Connection.onBattleTurn);
	pokemmo.Connection.socket.on("loginFail",pokemmo.Connection.onLoginFail);
	pokemmo.Connection.socket.on("newGame",pokemmo.Connection.onNewGame);
	pokemmo.Connection.socket.on("startGame",pokemmo.Connection.onStartGame);
}
pokemmo.Connection.onConnect = function(data) {
	pokemmo.Main.log("Connected");
}
pokemmo.Connection.onDisconnect = function(data) {
	pokemmo.Game.state = pokemmo.GameState.ST_DISCONNECTED;
	pokemmo.Game.curGame = null;
	while(pokemmo.UI.inputs.length > 0) pokemmo.UI.removeInput(pokemmo.UI.inputs[0]);
	pokemmo.Connection.socket.disconnect();
}
pokemmo.Connection.onSetInfo = function(data) {
	pokemmo.Game.setPokemonParty(data.pokemon);
	pokemmo.Game.accountLevel = data.accountLevel;
}
pokemmo.Connection.onLoadMap = function(data) {
	if(pokemmo.Game.curGame != null && pokemmo.Game.curGame.queueLoadMap) {
		pokemmo.Game.curGame.queuedMap = data.mapid;
		pokemmo.Game.curGame.queuedChars = data.chars;
		return;
	}
	pokemmo.Game.loadMap(data.mapid,data.chars);
}
pokemmo.Connection.onInvalidMove = function(data) {
	pokemmo.Connection.lastAckMove = data.ack;
	var chr = pokemmo.Game.curGame.getPlayerChar();
	chr.x = data.x;
	chr.y = data.y;
	chr.walking = false;
	chr.walkingPerc = 0.0;
	chr.tick();
	pokemmo.Main.log("Invalid move!");
	if(chr.freezeTicks < 5) chr.freezeTicks = 5;
}
pokemmo.Connection.onUpdate = function(data) {
	if(Std["is"](data,String)) data = JSON.parse(data);
	if(pokemmo.Game.curGame == null) return;
	if(!pokemmo.Game.curGame.loaded) return;
	if(data.map != pokemmo.Game.curGame.map.id) return;
	if(data.chars == null) data.chars = [];
	if(data.messages == null) data.messages = [];
	if(data.cremoved == null) data.cremoved = [];
	if(data.warpsUsed == null) data.warpsUsed = [];
	var cremoved = data.cremoved;
	var _g = 0, _g1 = data.warpsUsed;
	while(_g < _g1.length) {
		var warp = _g1[_g];
		++_g;
		cremoved.remove(warp.username);
		if(warp.username == pokemmo.Game.username) continue;
		(function(warp1) {
			var chr = pokemmo.Game.curGame.getCharByUsername(warp1.username);
			var tmpWarp = pokemmo.entities.CWarp.getWarpByName(warp1.warpName);
			chr.canUpdate = false;
			var animation = function() {
				chr.direction = warp1.direction;
				if(Std["is"](tmpWarp,pokemmo.entities.CDoor)) chr.enterDoor(tmpWarp); else if(Std["is"](tmpWarp,pokemmo.entities.CWarpArrow)) chr.enterWarpArrow(tmpWarp); else if(Std["is"](tmpWarp,pokemmo.entities.CStairs)) chr.enterStairs(tmpWarp);
			};
			if(chr.x != warp1.x || chr.y != warp1.y || chr.walking) {
				chr.targetX = warp1.x;
				chr.targetY = warp1.y;
				chr.onTarget = animation;
			} else animation();
		})(warp);
	}
	var chars = data.chars;
	var _g1 = 0, _g = chars.length;
	while(_g1 < _g) {
		var i = _g1++;
		var charData = chars[i];
		var chr = pokemmo.Game.curGame.getCharByUsername(charData.username);
		if(chr != null) chr.update(charData); else chr = new pokemmo.CCharacter(charData);
	}
	var _g1 = 0, _g = cremoved.length;
	while(_g1 < _g) {
		var i = _g1++;
		var chr = pokemmo.Game.curGame.getCharByUsername(cremoved[i]);
		if(chr != null) chr.destroy();
	}
	var _g = 0, _g1 = data.messages;
	while(_g < _g1.length) {
		var m = _g1[_g];
		++_g;
		m.timestamp = Date.now().getTime();
		pokemmo.Chat.pushMessage(m);
	}
}
pokemmo.Connection.onBattleInit = function(data) {
	var battle = pokemmo.Game.curGame.initBattle(new pokemmo.Battle(data));
	var chr = pokemmo.Game.curGame.getPlayerChar();
	if(chr != null) {
		chr.inBattle = true;
		chr.battleEnemy = battle.enemyPokemon.id;
		chr.battleEnemyShiny = battle.enemyPokemon.shiny;
	}
	pokemmo.Renderer.startTransition(new pokemmo.transitions.BattleTransition001()).step = -1;
}
pokemmo.Connection.onBattleWild = function(data) {
}
pokemmo.Connection.onBattleTurn = function(data) {
	pokemmo.Game.curGame.battle.resultQueue = pokemmo.Game.curGame.battle.resultQueue.concat(data.results);
	pokemmo.Game.curGame.battle.runQueue();
}
pokemmo.Connection.onLoginFail = function(data) {
	pokemmo.TitleScreen.loginFailed();
}
pokemmo.Connection.onNewGame = function(data) {
	pokemmo.Game.username = data.username;
	pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeOut(10)).onComplete = function() {
		pokemmo.TitleScreen.destroy();
		pokemmo.Game.state = pokemmo.GameState.ST_NEWGAME;
		pokemmo.NewGameScreen.init(data.starters,data.characters);
	};
}
pokemmo.Connection.onStartGame = function(data) {
	pokemmo.Game.username = data.username;
	pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeOut(10)).onComplete = function() {
		pokemmo.TitleScreen.destroy();
		pokemmo.Game.state = pokemmo.GameState.ST_UNKNOWN;
		pokemmo.Connection.socket.emit("startGame",{ });
	};
}
pokemmo.Connection.prototype.__class__ = pokemmo.Connection;
Version = function() { }
Version.__name__ = ["Version"];
Version.prototype.__class__ = Version;
pokemmo.Main = function() { }
pokemmo.Main.__name__ = ["pokemmo","Main"];
pokemmo.Main.isPhone = null;
pokemmo.Main.screenWidth = null;
pokemmo.Main.screenHeight = null;
pokemmo.Main.onScreenCanvas = null;
pokemmo.Main.onScreenCtx = null;
pokemmo.Main.tmpCanvas = null;
pokemmo.Main.tmpCtx = null;
pokemmo.Main.mapCacheCanvas = null;
pokemmo.Main.mapCacheCtx = null;
pokemmo.Main.canvas = null;
pokemmo.Main.ctx = null;
pokemmo.Main.container = null;
pokemmo.Main.main = function() {
	Array.prototype.remove = function(e){
			var i = 0;
			var arr = this;
			
			if((i = arr.indexOf(e)) != -1){
				arr.splice(i, 1);
				return true;
			}
			return false;
		};;
	Array.prototype.removeLast = function(e){
			var i = 0;
			var arr = this;
			
			if((i = arr.lastIndexOf(e)) != -1){
				arr.splice(i, 1);
				return true;
			}
			return false;
		};;
	pokemmo.Main.isPhone = new EReg("(iPhone|iPod)","i").match(js.Lib.window.navigator.userAgent);
	pokemmo.Main.screenWidth = pokemmo.Main.isPhone?480:800;
	pokemmo.Main.screenHeight = pokemmo.Main.isPhone?320:600;
	js.Lib.window.initGame = pokemmo.Main.initGame;
}
pokemmo.Main.tick = function() {
	pokemmo.UI.tick();
	if(pokemmo.Game.state == pokemmo.GameState.ST_MAP) {
		if(pokemmo.Game.curGame != null) pokemmo.Game.curGame.tick();
	}
	pokemmo.Renderer.render();
}
pokemmo.Main.log = function(obj) {
	console.log(obj);
}
pokemmo.Main.initGame = function(canvas_,container_) {
	pokemmo.Main.container = container_;
	pokemmo.Main.onScreenCanvas = canvas_;
	pokemmo.Main.onScreenCtx = pokemmo.Main.onScreenCanvas.getContext("2d");
	pokemmo.Main.canvas = js.Lib.document.createElement("canvas");
	pokemmo.Main.ctx = pokemmo.Main.canvas.getContext("2d");
	pokemmo.Main.tmpCanvas = js.Lib.document.createElement("canvas");
	pokemmo.Main.tmpCtx = pokemmo.Main.tmpCanvas.getContext("2d");
	pokemmo.Main.mapCacheCanvas = js.Lib.document.createElement("canvas");
	pokemmo.Main.mapCacheCtx = pokemmo.Main.mapCacheCanvas.getContext("2d");
	pokemmo.Main.jq(window).mousemove(function(e) {
		var offset = pokemmo.Main.jq(pokemmo.Main.onScreenCanvas).offset();
		pokemmo.UI.mouseX = e.pageX - offset.left;
		pokemmo.UI.mouseY = e.pageY - offset.top;
	});
	pokemmo.Main.jq(window).resize(function() {
		if(pokemmo.Main.isPhone) {
			pokemmo.Main.canvas.width = pokemmo.Main.jq(window).width();
			pokemmo.Main.canvas.height = pokemmo.Main.jq(window).height();
		} else {
			pokemmo.Main.canvas.width = 800;
			pokemmo.Main.canvas.height = 600;
			pokemmo.Main.container.style.top = "50%";
			pokemmo.Main.container.style.left = "50%";
			pokemmo.Main.container.style.position = "fixed";
			pokemmo.Main.container.style.marginTop = "-300px";
			pokemmo.Main.container.style.marginLeft = "-400px";
		}
		pokemmo.Main.container.width = pokemmo.Main.mapCacheCanvas.width = pokemmo.Main.tmpCanvas.width = pokemmo.Main.onScreenCanvas.width = pokemmo.Main.canvas.width;
		pokemmo.Main.container.height = pokemmo.Main.mapCacheCanvas.height = pokemmo.Main.tmpCanvas.height = pokemmo.Main.onScreenCanvas.height = pokemmo.Main.canvas.height;
		if(pokemmo.Game.curGame != null && pokemmo.Map.getCurMap() != null) pokemmo.Map.getCurMap().cacheMap = null;
		pokemmo.Renderer.render();
	}).resize();
	pokemmo.Main.jq(window).bind("orientationchange",function() {
		window.scrollTo(0,0);
	});
	pokemmo.UI.setup();
	pokemmo.Game.setup();
	pokemmo.Connection.setup();
	pokemmo.Renderer.setup();
	pokemmo.Chat.setup();
	pokemmo.Game.state = pokemmo.GameState.ST_TITLE;
	pokemmo.TitleScreen.setup();
	pokemmo.TitleScreen.init();
	setInterval(pokemmo.Main.tick,1000 / 30);
}
pokemmo.Main.printDebug = function() {
	var w = js.Lib.window.open("","Debug Info");
	w.document.body.innerHTML = "";
	w.document.write(JSON.stringify({ version : { major : 0, minor : 1, build : 1609}}));
}
pokemmo.Main.resolveObject = function(obj,path) {
	var arr = path.split(".");
	while(arr.length > 0) obj = obj[arr.shift()];
	return obj;
}
pokemmo.Main.setTimeout = function(func,delay) {
	setTimeout(func,delay);
}
pokemmo.Main.setInterval = function(func,delay) {
	setInterval(func,delay);
}
pokemmo.Main.clearTmpCanvas = function() {
	pokemmo.Main.tmpCtx.clearRect(0,0,pokemmo.Main.tmpCanvas.width,pokemmo.Main.tmpCanvas.height);
}
pokemmo.Main.prototype.__class__ = pokemmo.Main;
pokemmo.entities.CWarpArrow = function(name,x,y) {
	if( name === $_ ) return;
	pokemmo.entities.CWarp.call(this,name,x,y);
}
pokemmo.entities.CWarpArrow.__name__ = ["pokemmo","entities","CWarpArrow"];
pokemmo.entities.CWarpArrow.__super__ = pokemmo.entities.CWarp;
for(var k in pokemmo.entities.CWarp.prototype ) pokemmo.entities.CWarpArrow.prototype[k] = pokemmo.entities.CWarp.prototype[k];
pokemmo.entities.CWarpArrow.prototype.render = function(ctx) {
	if(this.disable) return;
	var chr = pokemmo.Game.curGame.getPlayerChar();
	if(chr == null) return;
	if(Math.abs(chr.x - this.x) + Math.abs(chr.y - this.y) > 1) return;
	var dir;
	if(chr.x < this.x) dir = 3; else if(chr.x > this.x) dir = 1; else if(chr.y < this.y) dir = 0; else dir = 2;
	if(dir != chr.direction) return;
	var curMap = pokemmo.Map.getCurMap();
	ctx.save();
	ctx.translate(this.x * curMap.tilewidth + pokemmo.Renderer.getOffsetX() + 16,this.y * curMap.tileheight + pokemmo.Renderer.getOffsetY() + 16);
	ctx.rotate(Math.PI / 2 * dir);
	if(pokemmo.Renderer.numRTicks % 30 < 15) ctx.translate(0,4);
	ctx.drawImage(pokemmo.Game.res["miscSprites"].obj,0,32,32,32,-16,-16,32,32);
	ctx.restore();
}
pokemmo.entities.CWarpArrow.prototype.__class__ = pokemmo.entities.CWarpArrow;
js.Lib = function() { }
js.Lib.__name__ = ["js","Lib"];
js.Lib.isIE = null;
js.Lib.isOpera = null;
js.Lib.document = null;
js.Lib.window = null;
js.Lib.alert = function(v) {
	alert(js.Boot.__string_rec(v,""));
}
js.Lib.eval = function(code) {
	return eval(code);
}
js.Lib.setErrorHandler = function(f) {
	js.Lib.onerror = f;
}
js.Lib.prototype.__class__ = js.Lib;
pokemmo.entities.CFollower = function(chr) {
	if( chr === $_ ) return;
	pokemmo.entities.CPokemon.call(this,chr.follower,chr.lastX,chr.lastY,0,chr.followerShiny);
	this.chr = chr;
	this.forceTarget = false;
	this.createdTick = pokemmo.Renderer.numRTicks;
	this.renderPriority = 10;
	this.canIdleJump = true;
}
pokemmo.entities.CFollower.__name__ = ["pokemmo","entities","CFollower"];
pokemmo.entities.CFollower.__super__ = pokemmo.entities.CPokemon;
for(var k in pokemmo.entities.CPokemon.prototype ) pokemmo.entities.CFollower.prototype[k] = pokemmo.entities.CPokemon.prototype[k];
pokemmo.entities.CFollower.prototype.chr = null;
pokemmo.entities.CFollower.prototype.forceTarget = null;
pokemmo.entities.CFollower.prototype.createdTick = null;
pokemmo.entities.CFollower.prototype.lastFollower = null;
pokemmo.entities.CFollower.prototype.render = function(ctx) {
	if(this.chr.follower != null) {
		if(this.lastFollower != this.chr.follower) this.image = pokemmo.Game.curGame.getImage("resources/followers/" + this.chr.follower + ".png");
	} else if(this.image != null) this.image = null;
	this.shiny = this.chr.followerShiny;
	this.lastFollower = this.chr.follower;
	if(this.chr.username == pokemmo.Game.username && !pokemmo.Game.curGame.drawPlayerFollower) return;
	if(this.x == this.chr.x && this.y == this.chr.y && !this.walking && !this.chr.walking) return;
	ctx.save();
	if(pokemmo.Renderer.numRTicks - this.createdTick < 10) ctx.globalAlpha = (pokemmo.Renderer.numRTicks - this.createdTick) / 10;
	pokemmo.entities.CPokemon.prototype.render.call(this,ctx);
	ctx.restore();
}
pokemmo.entities.CFollower.prototype.tick = function() {
	this.targetX = this.chr.lastX;
	this.targetY = this.chr.lastY;
	if(!this.forceTarget && this.chr.walking && !this.chr.walkingHasMoved && this.chr.walkingPerc >= 0.3 && !this.chr.willMoveIntoAWall()) {
		this.targetX = this.chr.x;
		this.targetY = this.chr.y;
	}
	pokemmo.entities.CPokemon.prototype.tick.call(this);
	if(!this.walking) {
		if(this.x < this.chr.x) this.direction = 3; else if(this.x > this.chr.x) this.direction = 1; else if(this.y > this.chr.y) this.direction = 2; else this.direction = 0;
	}
}
pokemmo.entities.CFollower.prototype.__class__ = pokemmo.entities.CFollower;
$_ = {}
js.Boot.__res = {}
js.Boot.__init();
{
	Object.prototype.iterator = function() {
      var o = this.instanceKeys();
      var y = this;
      return {
        cur : 0,
        arr : o,
        hasNext: function() { return this.cur < this.arr.length; },
        next: function() { return y[this.arr[this.cur++]]; }
      };
    }
	Object.prototype.instanceKeys = function(proto) {
      var keys = [];
      proto = !proto;
      for(var i in this) {
        if(proto && Object.prototype[i]) continue;
        keys.push(i);
      }
      return keys;
    }
}
{
	Math.__name__ = ["Math"];
	Math.NaN = Number["NaN"];
	Math.NEGATIVE_INFINITY = Number["NEGATIVE_INFINITY"];
	Math.POSITIVE_INFINITY = Number["POSITIVE_INFINITY"];
	Math.isFinite = function(i) {
		return isFinite(i);
	};
	Math.isNaN = function(i) {
		return isNaN(i);
	};
}
{
	String.prototype.__class__ = String;
	String.__name__ = ["String"];
	Array.prototype.__class__ = Array;
	Array.__name__ = ["Array"];
	Int = { __name__ : ["Int"]};
	Dynamic = { __name__ : ["Dynamic"]};
	Float = Number;
	Float.__name__ = ["Float"];
	Bool = { __ename__ : ["Bool"]};
	Class = { __name__ : ["Class"]};
	Enum = { };
	Void = { __ename__ : ["Void"]};
}
{
	js.Lib.document = document;
	js.Lib.window = window;
	onerror = function(msg,url,line) {
		var f = js.Lib.onerror;
		if( f == null )
			return false;
		return f(msg,[url+":"+line]);
	}
}
{
	var d = Date;
	d.now = function() {
		return new Date();
	};
	d.fromTime = function(t) {
		var d1 = new Date();
		d1["setTime"](t);
		return d1;
	};
	d.fromString = function(s) {
		switch(s.length) {
		case 8:
			var k = s.split(":");
			var d1 = new Date();
			d1["setTime"](0);
			d1["setUTCHours"](k[0]);
			d1["setUTCMinutes"](k[1]);
			d1["setUTCSeconds"](k[2]);
			return d1;
		case 10:
			var k = s.split("-");
			return new Date(k[0],k[1] - 1,k[2],0,0,0);
		case 19:
			var k = s.split(" ");
			var y = k[0].split("-");
			var t = k[1].split(":");
			return new Date(y[0],y[1] - 1,y[2],t[0],t[1],t[2]);
		default:
			throw "Invalid date format : " + s;
		}
	};
	d.prototype["toString"] = function() {
		var date = this;
		var m = date.getMonth() + 1;
		var d1 = date.getDate();
		var h = date.getHours();
		var mi = date.getMinutes();
		var s = date.getSeconds();
		return date.getFullYear() + "-" + (m < 10?"0" + m:"" + m) + "-" + (d1 < 10?"0" + d1:"" + d1) + " " + (h < 10?"0" + h:"" + h) + ":" + (mi < 10?"0" + mi:"" + mi) + ":" + (s < 10?"0" + s:"" + s);
	};
	d.prototype.__class__ = d;
	d.__name__ = ["Date"];
}
pokemmo.Chat.BUBBLE_BORDER_SIZE = 5;
pokemmo.Chat.BUBBLE_MAX_WIDTH = 150;
pokemmo.Chat.inChat = false;
pokemmo.Chat.chatLog = new Array();
pokemmo.Chat.justSentMessage = false;
pokemmo.entities.CPokemon.POKEMON_WIDTH = 64;
pokemmo.entities.CPokemon.POKEMON_HEIGHT = 64;
pokemmo.UI.keysDown = [];
pokemmo.UI.uiAButtonDown = false;
pokemmo.UI.uiBButtonDown = false;
pokemmo.UI.mouseDown = false;
pokemmo.UI.mouseWasDown = false;
pokemmo.UI.mouseDownFuture = false;
pokemmo.UI.fireAHooks = false;
pokemmo.UI.fireBHooks = false;
pokemmo.UI.fireEnterHooks = false;
pokemmo.UI.arrowKeysPressed = new Array();
pokemmo.Renderer.numRTicks = 0;
pokemmo.NewGameScreen.pendingLoad = 0;
pokemmo.TitleScreen.TWITTER_API_URL = "http://search.twitter.com/search.json?q=%23ANN+from:Sonyp_&callback=twitterAPIResult";
pokemmo.PokemonConst.GENDER_UNKNOWN = 0;
pokemmo.PokemonConst.GENDER_MALE = 1;
pokemmo.PokemonConst.GENDER_FEMALE = 2;
pokemmo.PokemonConst.STATUS_NONE = 0;
pokemmo.PokemonConst.STATUS_SLEEP = 1;
pokemmo.PokemonConst.STATUS_FREEZE = 2;
pokemmo.PokemonConst.STATUS_PARALYZE = 3;
pokemmo.PokemonConst.STATUS_POISON = 4;
pokemmo.PokemonConst.STATUS_BURN = 5;
pokemmo.PokemonConst.TYPE_NORMAL = 0;
pokemmo.PokemonConst.TYPE_FIRE = 1;
pokemmo.PokemonConst.TYPE_WATER = 2;
pokemmo.PokemonConst.TYPE_ICE = 3;
pokemmo.PokemonConst.TYPE_ELECTRIC = 4;
pokemmo.PokemonConst.TYPE_GRASS = 5;
pokemmo.PokemonConst.TYPE_GROUND = 6;
pokemmo.PokemonConst.TYPE_ROCK = 7;
pokemmo.PokemonConst.TYPE_FIGHT = 8;
pokemmo.PokemonConst.TYPE_STEEL = 9;
pokemmo.PokemonConst.TYPE_DARK = 10;
pokemmo.PokemonConst.TYPE_PSYCHIC = 11;
pokemmo.PokemonConst.TYPE_FLYING = 12;
pokemmo.PokemonConst.TYPE_BUG = 13;
pokemmo.PokemonConst.TYPE_POISON = 14;
pokemmo.PokemonConst.TYPE_GHOST = 15;
pokemmo.PokemonConst.TYPE_DRAGON = 16;
pokemmo.PokemonConst.TYPE_UNKNOWN = 17;
pokemmo.transitions.BattleTransition001.BAR_HEIGHT = 80;
pokemmo.Battle.BATTLE_WILD = 0;
pokemmo.Battle.BATTLE_TRAINER = 1;
pokemmo.Battle.BATTLE_VERSUS = 2;
pokemmo.CCharacter.CHAR_WIDTH = 32;
pokemmo.CCharacter.CHAR_HEIGHT = 64;
pokemmo.CCharacter.CHAR_MOVE_WAIT = 0.3;
pokemmo.Game.DIR_DOWN = 0;
pokemmo.Game.DIR_LEFT = 1;
pokemmo.Game.DIR_UP = 2;
pokemmo.Game.DIR_RIGHT = 3;
pokemmo.Game.pendingLoad = 0;
pokemmo.Connection.SERVER_HOST = "http://localhost:2828";
pokemmo.Connection.REGSERVER_HOST = "http://localhost:2827";
pokemmo.Connection.lastAckMove = 0;
Version.Major = 0;
Version.Minor = 1;
Version.Build = 1609;
Version.Revision = 0;
pokemmo.Main.window = window;
pokemmo.Main.document = document;
pokemmo.Main.jq = jQuery;
js.Lib.onerror = null;
pokemmo.Main.main()