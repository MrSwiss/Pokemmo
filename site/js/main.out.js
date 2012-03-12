$estr = function() { return js.Boot.__string_rec(this,''); }
if(typeof pokemmo=='undefined') pokemmo = {}
pokemmo.Chat = function() { }
pokemmo.Chat.__name__ = ["pokemmo","Chat"];
pokemmo.Chat.chatBox = null;
pokemmo.Chat.setup = function() {
	$s.push("pokemmo.Chat::setup");
	var $spos = $s.length;
	pokemmo.Chat.chatBox = document.createElement("input");
	pokemmo.Chat.chatBox.type = "text";
	pokemmo.Chat.chatBox.style.opacity = "0";
	pokemmo.Chat.chatBox.style.position = "fixed";
	pokemmo.Chat.chatBox.maxLength = 128;
	pokemmo.Chat.chatBox.onblur = function(e) {
		$s.push("pokemmo.Chat::setup@26");
		var $spos = $s.length;
		pokemmo.Chat.inChat = false;
		var now = Date.now().getTime();
		var chatLog = pokemmo.Chat.chatLog;
		var _g1 = Math.max(chatLog.length - 12,0), _g = chatLog.length;
		while(_g1 < _g) {
			var i = _g1++;
			chatLog[i].timestamp2 = Math.max(now - 2500,chatLog[i].timestamp2);
		}
		$s.pop();
	};
	pokemmo.Chat.chatBox.onkeydown = function(e) {
		$s.push("pokemmo.Chat::setup@38");
		var $spos = $s.length;
		e = window.event || e;
		if(e.keyCode == 13) pokemmo.Chat.sendMessage();
		$s.pop();
	};
	document.body.appendChild(pokemmo.Chat.chatBox);
	$s.pop();
}
pokemmo.Chat.resetChat = function() {
	$s.push("pokemmo.Chat::resetChat");
	var $spos = $s.length;
	pokemmo.Chat.chatLog = [];
	pokemmo.Chat.chatBox.value = "";
	pokemmo.Chat.inChat = false;
	pokemmo.Chat.justSentMessage = true;
	pokemmo.Main.jq(pokemmo.Chat.chatBox).blur();
	$s.pop();
}
pokemmo.Chat.pushMessage = function(msg) {
	$s.push("pokemmo.Chat::pushMessage");
	var $spos = $s.length;
	var chr = pokemmo.Game.curGame.getPlayerChar();
	msg.timestamp2 = msg.timestamp;
	if(chr != null) {
		if((msg.x - chr.x) * (msg.x - chr.x) + (msg.y - chr.y) * (msg.x - chr.y) > 2025) {
			$s.pop();
			return;
		}
	}
	if(pokemmo.Chat.chatLog.length > 64) pokemmo.Chat.chatLog.shift();
	msg.bubbleLines = [];
	var ctx = pokemmo.Main.ctx;
	ctx.font = "12px Font2";
	var width = Math.round(ctx.measureText(msg.str).width + 10);
	var height = 16;
	msg.bubbleLines.push(msg.str);
	if(width > 150) {
		width = 150;
		do {
			var curLineArr = msg.bubbleLines[msg.bubbleLines.length - 1].split(" ");
			var nextLineArr = [];
			while(ctx.measureText(curLineArr.join(" ")).width > 150) nextLineArr.unshift(curLineArr.pop());
			msg.bubbleLines[msg.bubbleLines.length - 1] = curLineArr.join(" ");
			msg.bubbleLines.push(nextLineArr.join(" "));
			height += 14;
		} while(ctx.measureText(msg.bubbleLines[msg.bubbleLines.length - 1]).width > 150);
	}
	msg.bubbleWidth = width;
	msg.bubbleHeight = height;
	pokemmo.Chat.chatLog.push(msg);
	$s.pop();
}
pokemmo.Chat.sendMessage = function() {
	$s.push("pokemmo.Chat::sendMessage");
	var $spos = $s.length;
	pokemmo.Chat.filterChatText();
	pokemmo.Connection.socket.emit("sendMessage",{ str : pokemmo.Chat.chatBox.value});
	pokemmo.Chat.resetChat();
	pokemmo.Main.jq(pokemmo.Main.onScreenCanvas).focus();
	$s.pop();
}
pokemmo.Chat.render = function(ctx) {
	$s.push("pokemmo.Chat::render");
	var $spos = $s.length;
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
	var BUBBLE_TIME = 2500;
	var CORNER_RADIUS = 10;
	var offx = pokemmo.Renderer.getOffsetX();
	var offy = pokemmo.Renderer.getOffsetY();
	var tmpCanvas = pokemmo.Main.tmpCanvas;
	var tmpCtx = pokemmo.Main.tmpCtx;
	var _g = 0, _g1 = pokemmo.Chat.chatLog;
	while(_g < _g1.length) {
		var msg = _g1[_g];
		++_g;
		if(now - msg.timestamp >= BUBBLE_TIME) continue;
		if(msg.chr == null) msg.chr = pokemmo.Game.curGame.getCharByUsername(msg.username);
		if(msg.chr == null) continue;
		var perc = pokemmo.Util.clamp((BUBBLE_TIME - (now - msg.timestamp)) / 750,0,0.7);
		var x1, y1, width = msg.bubbleWidth, height = msg.bubbleHeight;
		var pos = msg.chr.getRenderPos();
		x1 = pos.x + offx + Math.floor(32 / 2);
		y1 = pos.y + offy + 20;
		x1 -= Math.floor(width / 2);
		y1 -= height;
		y1 -= Math.floor((now - msg.timestamp) / 150);
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
		ctx.drawImage(tmpCanvas,0,0,width,height,x1,y1,width,height);
		ctx.fillStyle = "#000000";
		var _g3 = 0, _g2 = msg.bubbleLines.length;
		while(_g3 < _g2) {
			var i1 = _g3++;
			ctx.fillText(msg.bubbleLines[i1],x1 + 5,y1 + 12 + 14 * i1);
		}
		ctx.restore();
	}
	$s.pop();
}
pokemmo.Chat.filterChatText = function() {
	$s.push("pokemmo.Chat::filterChatText");
	var $spos = $s.length;
	pokemmo.Chat.chatBox.value = new EReg("[^a-zA-Z0-9.,:-=\\(\\)\\[\\]\\{\\}/\\\\ '\"!?@#$%&*]","").replace(pokemmo.Chat.chatBox.value,"");
	$s.pop();
}
pokemmo.Chat.prototype.__class__ = pokemmo.Chat;
pokemmo.Layer = function(data) {
	if( data === $_ ) return;
	$s.push("pokemmo.Layer::new");
	var $spos = $s.length;
	this.data = data.data;
	this.width = data.width;
	this.height = data.height;
	this.x = data.x;
	this.y = data.y;
	this.type = data.type;
	this.properties = data.properties;
	this.objects = data.objects;
	if(this.properties == null) this.properties = { solid : "1", overchars : "0", animated : "0"};
	$s.pop();
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
	$s.push("pokemmo.Layer::render");
	var $spos = $s.length;
	if(this.type != "tilelayer") {
		$s.pop();
		return;
	}
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
	$s.pop();
}
pokemmo.Layer.prototype.__class__ = pokemmo.Layer;
if(!pokemmo.ui) pokemmo.ui = {}
pokemmo.ui.UIInput = function(x,y) {
	if( x === $_ ) return;
	$s.push("pokemmo.ui.UIInput::new");
	var $spos = $s.length;
	this.x = x;
	this.y = y;
	this.disabled = false;
	$s.pop();
}
pokemmo.ui.UIInput.__name__ = ["pokemmo","ui","UIInput"];
pokemmo.ui.UIInput.prototype.x = null;
pokemmo.ui.UIInput.prototype.y = null;
pokemmo.ui.UIInput.prototype.selected = null;
pokemmo.ui.UIInput.prototype.selectedTime = null;
pokemmo.ui.UIInput.prototype.disabled = null;
pokemmo.ui.UIInput.prototype.select = function() {
	$s.push("pokemmo.ui.UIInput::select");
	var $spos = $s.length;
	if(this.selected) {
		$s.pop();
		return;
	}
	if(pokemmo.UI.selectedInput != null) pokemmo.UI.selectedInput.blur();
	pokemmo.UI.selectedInput = this;
	this.selected = true;
	this.selectedTime = Date.now().getTime();
	$s.pop();
}
pokemmo.ui.UIInput.prototype.blur = function() {
	$s.push("pokemmo.ui.UIInput::blur");
	var $spos = $s.length;
	if(!this.selected) {
		$s.pop();
		return;
	}
	this.selected = false;
	pokemmo.UI.selectedInput = null;
	$s.pop();
}
pokemmo.ui.UIInput.prototype.tick = function() {
	$s.push("pokemmo.ui.UIInput::tick");
	var $spos = $s.length;
	$s.pop();
}
pokemmo.ui.UIInput.prototype.render = function(ctx) {
	$s.push("pokemmo.ui.UIInput::render");
	var $spos = $s.length;
	$s.pop();
}
pokemmo.ui.UIInput.prototype.isUnderMouse = function() {
	$s.push("pokemmo.ui.UIInput::isUnderMouse");
	var $spos = $s.length;
	$s.pop();
	return false;
	$s.pop();
}
pokemmo.ui.UIInput.prototype.__class__ = pokemmo.ui.UIInput;
pokemmo.ui.TextInput = function(x,y,width) {
	if( x === $_ ) return;
	$s.push("pokemmo.ui.TextInput::new");
	var $spos = $s.length;
	pokemmo.ui.UIInput.call(this,x,y);
	this.width = width;
	this.height = 18;
	this.selected = false;
	this.isPassword = false;
	this.value = "";
	this.maxLength = 0;
	$s.pop();
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
	$s.push("pokemmo.ui.TextInput::select");
	var $spos = $s.length;
	if(this.selected) {
		$s.pop();
		return;
	}
	pokemmo.ui.UIInput.prototype.select.call(this);
	pokemmo.UI.hiddenInput.value = this.value;
	pokemmo.Main.jq(pokemmo.UI.hiddenInput).focus();
	$s.pop();
}
pokemmo.ui.TextInput.prototype.blur = function() {
	$s.push("pokemmo.ui.TextInput::blur");
	var $spos = $s.length;
	if(!this.selected) {
		$s.pop();
		return;
	}
	pokemmo.ui.UIInput.prototype.blur.call(this);
	pokemmo.UI.hiddenInput.value = "";
	pokemmo.Main.jq(pokemmo.UI.hiddenInput).blur();
	pokemmo.Main.jq(pokemmo.Main.onScreenCanvas).focus();
	$s.pop();
}
pokemmo.ui.TextInput.prototype.tick = function() {
	$s.push("pokemmo.ui.TextInput::tick");
	var $spos = $s.length;
	if(this.disabled) {
		pokemmo.UI.hiddenInput.value = this.value;
		$s.pop();
		return;
	}
	if(this.isUnderMouse()) pokemmo.Main.onScreenCanvas.style.cursor = "text";
	if(this.selected) this.value = pokemmo.UI.hiddenInput.value;
	$s.pop();
}
pokemmo.ui.TextInput.prototype.isUnderMouse = function() {
	$s.push("pokemmo.ui.TextInput::isUnderMouse");
	var $spos = $s.length;
	var $tmp = pokemmo.UI.mouseX >= this.x && pokemmo.UI.mouseY >= this.y && pokemmo.UI.mouseX < this.x + this.width && pokemmo.UI.mouseY < this.y + this.height;
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.ui.TextInput.prototype.render = function(ctx) {
	$s.push("pokemmo.ui.TextInput::render");
	var $spos = $s.length;
	var now = Date.now().getTime();
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
	$s.pop();
}
pokemmo.ui.TextInput.prototype.__class__ = pokemmo.ui.TextInput;
pokemmo.Transition = function(p) {
	if( p === $_ ) return;
	$s.push("pokemmo.Transition::new");
	var $spos = $s.length;
	this.step = 0;
	$s.pop();
}
pokemmo.Transition.__name__ = ["pokemmo","Transition"];
pokemmo.Transition.prototype.step = null;
pokemmo.Transition.prototype.onComplete = null;
pokemmo.Transition.prototype.render = function(ctx) {
	$s.push("pokemmo.Transition::render");
	var $spos = $s.length;
	$s.pop();
}
pokemmo.Transition.prototype.complete = function() {
	$s.push("pokemmo.Transition::complete");
	var $spos = $s.length;
	pokemmo.Renderer.stopTransition();
	if(this.onComplete != null) this.onComplete();
	$s.pop();
}
pokemmo.Transition.prototype.__class__ = pokemmo.Transition;
if(!pokemmo.transitions) pokemmo.transitions = {}
pokemmo.transitions.FadeIn = function(frames) {
	if( frames === $_ ) return;
	$s.push("pokemmo.transitions.FadeIn::new");
	var $spos = $s.length;
	pokemmo.Transition.call(this);
	this.fadeTime = frames;
	$s.pop();
}
pokemmo.transitions.FadeIn.__name__ = ["pokemmo","transitions","FadeIn"];
pokemmo.transitions.FadeIn.__super__ = pokemmo.Transition;
for(var k in pokemmo.Transition.prototype ) pokemmo.transitions.FadeIn.prototype[k] = pokemmo.Transition.prototype[k];
pokemmo.transitions.FadeIn.prototype.fadeTime = null;
pokemmo.transitions.FadeIn.prototype.render = function(ctx) {
	$s.push("pokemmo.transitions.FadeIn::render");
	var $spos = $s.length;
	ctx.fillStyle = "rgba(0,0,0," + pokemmo.Util.clamp(1 - this.step / this.fadeTime,0,1) + ")";
	ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
	++this.step;
	if(this.step >= this.fadeTime) {
		this.complete();
		$s.pop();
		return;
	}
	$s.pop();
}
pokemmo.transitions.FadeIn.prototype.__class__ = pokemmo.transitions.FadeIn;
pokemmo.GameObject = function(x_,y_,direction_) {
	if( x_ === $_ ) return;
	$s.push("pokemmo.GameObject::new");
	var $spos = $s.length;
	if(direction_ == null) direction_ = 0;
	this.x = x_;
	this.y = y_;
	this.direction = direction_;
	this.renderPriority = 0;
	this.randInt = Math.floor(Math.random() * 100000);
	pokemmo.Game.curGame.gameObjects.push(this);
	$s.pop();
}
pokemmo.GameObject.__name__ = ["pokemmo","GameObject"];
pokemmo.GameObject.prototype.x = null;
pokemmo.GameObject.prototype.y = null;
pokemmo.GameObject.prototype.direction = null;
pokemmo.GameObject.prototype.randInt = null;
pokemmo.GameObject.prototype.renderPriority = null;
pokemmo.GameObject.prototype.destroy = function() {
	$s.push("pokemmo.GameObject::destroy");
	var $spos = $s.length;
	pokemmo.Game.curGame.gameObjects.remove(this);
	$s.pop();
}
pokemmo.GameObject.prototype.tick = function() {
	$s.push("pokemmo.GameObject::tick");
	var $spos = $s.length;
	$s.pop();
}
pokemmo.GameObject.prototype.render = function(ctx) {
	$s.push("pokemmo.GameObject::render");
	var $spos = $s.length;
	$s.pop();
}
pokemmo.GameObject.prototype.__class__ = pokemmo.GameObject;
if(!pokemmo.entities) pokemmo.entities = {}
pokemmo.entities.CPokemon = function(id,x,y,dir) {
	if( id === $_ ) return;
	$s.push("pokemmo.entities.CPokemon::new");
	var $spos = $s.length;
	if(dir == null) dir = 0;
	pokemmo.GameObject.call(this,x,y,dir);
	this.image = id == null?null:pokemmo.Game.curGame.getImage("resources/followers/" + id + ".png");
	this.canDrawGrass = true;
	this.walking = false;
	this.walkingPerc = 0.0;
	this.walkingHasMoved = false;
	this.targetX = x;
	this.targetY = y;
	$s.pop();
}
pokemmo.entities.CPokemon.__name__ = ["pokemmo","entities","CPokemon"];
pokemmo.entities.CPokemon.__super__ = pokemmo.GameObject;
for(var k in pokemmo.GameObject.prototype ) pokemmo.entities.CPokemon.prototype[k] = pokemmo.GameObject.prototype[k];
pokemmo.entities.CPokemon.prototype.image = null;
pokemmo.entities.CPokemon.prototype.canDrawGrass = null;
pokemmo.entities.CPokemon.prototype.walking = null;
pokemmo.entities.CPokemon.prototype.walkingPerc = null;
pokemmo.entities.CPokemon.prototype.walkingHasMoved = null;
pokemmo.entities.CPokemon.prototype.targetX = null;
pokemmo.entities.CPokemon.prototype.targetY = null;
pokemmo.entities.CPokemon.prototype.render = function(ctx) {
	$s.push("pokemmo.entities.CPokemon::render");
	var $spos = $s.length;
	var offsetX = pokemmo.Renderer.getOffsetX();
	var offsetY = pokemmo.Renderer.getOffsetY();
	var renderPos = this.getRenderPos();
	var map = pokemmo.Map.getCurMap();
	if(this.image != null && this.image.loaded) {
		ctx.save();
		ctx.drawImage(this.image.obj,64 * this.direction,Math.floor((pokemmo.Renderer.numRTicks + this.randInt) % 10 / 5) * 64,64,64,renderPos.x + offsetX,renderPos.y + offsetY,64,64);
		ctx.restore();
		if(this.canDrawGrass && map.isTileGrass(this.x,this.y) && !this.walking) ctx.drawImage(pokemmo.Game.res["miscSprites"].obj,0,0,32,32,this.x * map.tilewidth + offsetX,this.y * map.tileheight + offsetY,32,32);
	}
	$s.pop();
}
pokemmo.entities.CPokemon.prototype.tick = function() {
	$s.push("pokemmo.entities.CPokemon::tick");
	var $spos = $s.length;
	if(!this.walking) {
		this.walkingHasMoved = false;
		this.walkingPerc = 0.0;
		this.tickBot();
	} else {
		this.walkingPerc += 0.1;
		if(this.walkingPerc >= (1 - 0.3) / 2 && !this.walkingHasMoved) {
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
	$s.pop();
}
pokemmo.entities.CPokemon.prototype.getRenderPos = function() {
	$s.push("pokemmo.entities.CPokemon::getRenderPos");
	var $spos = $s.length;
	var curMap = pokemmo.Map.getCurMap();
	if(!this.walking) {
		var $tmp = { x : Math.floor(this.x * curMap.tilewidth - 64 / 4), y : Math.floor(this.y * curMap.tileheight - 64 / 2)};
		$s.pop();
		return $tmp;
	}
	var destX = this.x * curMap.tilewidth - 64 / 4;
	var destY = this.y * curMap.tileheight - 64 / 2;
	var perc = (this.walkingPerc - 0.3) / (1 - 0.3);
	if(this.walkingPerc > 0.3) {
		if(this.walkingHasMoved) switch(this.direction) {
		case 1:
			destX += curMap.tilewidth * (1 - perc);
			break;
		case 3:
			destX -= curMap.tilewidth * (1 - perc);
			break;
		case 2:
			destY += curMap.tileheight * (1 - perc);
			break;
		case 0:
			destY -= curMap.tileheight * (1 - perc);
			break;
		} else switch(this.direction) {
		case 1:
			destX -= curMap.tilewidth * perc;
			break;
		case 3:
			destX += curMap.tilewidth * perc;
			break;
		case 2:
			destY -= curMap.tileheight * perc;
			break;
		case 0:
			destY += curMap.tileheight * perc;
			break;
		}
	}
	var $tmp = { x : Math.floor(destX), y : Math.floor(destY)};
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.entities.CPokemon.prototype.tickBot = function() {
	$s.push("pokemmo.entities.CPokemon::tickBot");
	var $spos = $s.length;
	if(this.walking) {
		$s.pop();
		return;
	}
	if(Math.abs(this.x - this.targetX) + Math.abs(this.y - this.targetY) > 2) {
		this.x = this.targetX;
		this.y = this.targetY;
		$s.pop();
		return;
	}
	this.walking = this.x != this.targetX || this.y != this.targetY;
	if(!this.walking) {
		$s.pop();
		return;
	}
	var lastDirection = this.direction;
	if(Math.abs(this.x - this.targetX) > 0 && this.y == this.targetY) this.direction = this.x < this.targetX?3:1; else if(Math.abs(this.y - this.targetY) > 0 && this.x == this.targetX) this.direction = this.y < this.targetY?0:2; else this.direction = this.targetY < this.y?2:0;
	if(lastDirection != this.direction) this.walkingPerc = 0.0;
	$s.pop();
}
pokemmo.entities.CPokemon.prototype.__class__ = pokemmo.entities.CPokemon;
pokemmo.Util = function() { }
pokemmo.Util.__name__ = ["pokemmo","Util"];
pokemmo.Util.clamp = function(n,min,max) {
	$s.push("pokemmo.Util::clamp");
	var $spos = $s.length;
	var $tmp = n < min?min:n > max?max:n;
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.Util.or = function(v1,v2) {
	$s.push("pokemmo.Util::or");
	var $spos = $s.length;
	var $tmp = v1?v1:v2;
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.Util.getPokemonDisplayName = function(pk) {
	$s.push("pokemmo.Util::getPokemonDisplayName");
	var $spos = $s.length;
	var $tmp = pokemmo.Util.or(pk.nickname,pokemmo.Game.pokemonData[pk.id].name).toUpperCase();
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.Util.drawRoundedRect = function(x,y,width,height,radius,color,alpha) {
	$s.push("pokemmo.Util::drawRoundedRect");
	var $spos = $s.length;
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
	$s.pop();
}
pokemmo.Util.prototype.__class__ = pokemmo.Util;
pokemmo.transitions.FadeOut = function(frames) {
	if( frames === $_ ) return;
	$s.push("pokemmo.transitions.FadeOut::new");
	var $spos = $s.length;
	pokemmo.Transition.call(this);
	this.fadeTime = frames;
	$s.pop();
}
pokemmo.transitions.FadeOut.__name__ = ["pokemmo","transitions","FadeOut"];
pokemmo.transitions.FadeOut.__super__ = pokemmo.Transition;
for(var k in pokemmo.Transition.prototype ) pokemmo.transitions.FadeOut.prototype[k] = pokemmo.Transition.prototype[k];
pokemmo.transitions.FadeOut.prototype.fadeTime = null;
pokemmo.transitions.FadeOut.prototype.render = function(ctx) {
	$s.push("pokemmo.transitions.FadeOut::render");
	var $spos = $s.length;
	ctx.fillStyle = "rgba(0,0,0," + pokemmo.Util.clamp(this.step / this.fadeTime,0,1) + ")";
	ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
	++this.step;
	if(this.step >= this.fadeTime) {
		this.complete();
		$s.pop();
		return;
	}
	$s.pop();
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
	$s.push("pokemmo.UI::setup");
	var $spos = $s.length;
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
		$s.push("pokemmo.UI::setup@57");
		var $spos = $s.length;
		if(e.keyCode == 13) {
			if(pokemmo.Game.state == pokemmo.GameState.ST_MAP) {
				if(!pokemmo.Chat.inChat && !pokemmo.Chat.justSentMessage) {
					pokemmo.Chat.inChat = true;
					pokemmo.Main.jq(pokemmo.Chat.chatBox).focus();
				}
			} else pokemmo.UI.fireEnterHooks = true;
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
		$s.pop();
	});
	pokemmo.Main.jq(w).keyup(function(e) {
		$s.push("pokemmo.UI::setup@92");
		var $spos = $s.length;
		pokemmo.UI.keysDown[e.keyCode] = false;
		if(e.keyCode == 13) pokemmo.Chat.justSentMessage = false; else if(e.keyCode == 90) pokemmo.UI.uiAButtonDown = false; else if(e.keyCode == 88) pokemmo.UI.uiBButtonDown = false;
		$s.pop();
	});
	pokemmo.Main.jq(w).blur(function() {
		$s.push("pokemmo.UI::setup@103");
		var $spos = $s.length;
		var _g1 = 0, _g = pokemmo.UI.keysDown.length;
		while(_g1 < _g) {
			var i = _g1++;
			pokemmo.UI.keysDown[i] = false;
		}
		pokemmo.UI.mouseDown = false;
		$s.pop();
	});
	pokemmo.Main.jq(w).mousedown(function(e) {
		$s.push("pokemmo.UI::setup@111");
		var $spos = $s.length;
		pokemmo.UI.mouseDown = true;
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
		$s.pop();
	});
	pokemmo.Main.jq(w).mouseup(function() {
		$s.push("pokemmo.UI::setup@131");
		var $spos = $s.length;
		pokemmo.UI.mouseDown = false;
		if(pokemmo.UI.selectedInput != null && pokemmo.UI.selectedInput.isUnderMouse() && Std["is"](pokemmo.UI.selectedInput,pokemmo.ui.UIButton)) {
			var b = pokemmo.UI.selectedInput;
			if(b.instantSubmit) b.submit();
		}
		$s.pop();
	});
	$s.pop();
}
pokemmo.UI.selectNextInput = function() {
	$s.push("pokemmo.UI::selectNextInput");
	var $spos = $s.length;
	if(pokemmo.UI.selectedInput != null) pokemmo.UI.inputs[(pokemmo.UI.inputs.indexOf(pokemmo.UI.selectedInput) + 1) % pokemmo.UI.inputs.length].select(); else if(pokemmo.UI.lastSelectedInput != null) pokemmo.UI.inputs[(pokemmo.UI.inputs.indexOf(pokemmo.UI.lastSelectedInput) + 1) % pokemmo.UI.inputs.length].select(); else if(pokemmo.UI.inputs.length > 0) pokemmo.UI.inputs[0].select();
	if(pokemmo.UI.selectedInput.disabled) {
		var i = pokemmo.UI.inputs.indexOf(pokemmo.UI.selectedInput);
		var _g1 = i, _g = pokemmo.UI.inputs.length;
		while(_g1 < _g) {
			var j = _g1++;
			if(!pokemmo.UI.inputs[j].disabled) {
				pokemmo.UI.inputs[j].select();
				$s.pop();
				return;
			}
		}
		var _g = 0;
		while(_g < i) {
			var j = _g++;
			if(!pokemmo.UI.inputs[j].disabled) {
				pokemmo.UI.inputs[j].select();
				$s.pop();
				return;
			}
		}
	}
	$s.pop();
}
pokemmo.UI.tick = function() {
	$s.push("pokemmo.UI::tick");
	var $spos = $s.length;
	pokemmo.Main.onScreenCanvas.style.cursor = "auto";
	pokemmo.UI.hiddenInput.selectionStart = pokemmo.UI.hiddenInput.value.length;
	pokemmo.UI.hiddenInput.selectionEnd = pokemmo.UI.hiddenInput.value.length;
	if(pokemmo.Renderer.curTransition != null) {
		$s.pop();
		return;
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
		var _g1 = 0, _g = arr.length;
		while(_g1 < _g) {
			var i = _g1++;
			arr[i]();
		}
	}
	if(pokemmo.UI.fireBHooks) {
		pokemmo.UI.fireBHooks = false;
		var arr = pokemmo.UI.BButtonHooks.copy();
		pokemmo.UI.BButtonHooks = [];
		var _g1 = 0, _g = arr.length;
		while(_g1 < _g) {
			var i = _g1++;
			arr[i]();
		}
	}
	if(pokemmo.UI.fireEnterHooks) {
		pokemmo.UI.fireEnterHooks = false;
		var arr = pokemmo.UI.enterButtonHooks.copy();
		pokemmo.UI.enterButtonHooks = [];
		var _g1 = 0, _g = arr.length;
		while(_g1 < _g) {
			var i = _g1++;
			arr[i]();
		}
	}
	var _g1 = 0, _g = pokemmo.UI.arrowKeysPressed.length;
	while(_g1 < _g) {
		var i = _g1++;
		var _g3 = 0, _g2 = pokemmo.UI.dirButtonHooks.length;
		while(_g3 < _g2) {
			var j = _g3++;
			pokemmo.UI.dirButtonHooks[j](pokemmo.UI.arrowKeysPressed[i]);
		}
	}
	while(pokemmo.UI.arrowKeysPressed.length > 0) pokemmo.UI.arrowKeysPressed.pop();
	$s.pop();
}
pokemmo.UI.render = function(ctx) {
	$s.push("pokemmo.UI::render");
	var $spos = $s.length;
	var _g1 = 0, _g = pokemmo.UI.inputs.length;
	while(_g1 < _g) {
		var i = _g1++;
		pokemmo.UI.inputs[i].render(ctx);
	}
	$s.pop();
}
pokemmo.UI.hookAButton = function(func) {
	$s.push("pokemmo.UI::hookAButton");
	var $spos = $s.length;
	pokemmo.UI.AButtonHooks.push(func);
	$s.pop();
}
pokemmo.UI.hookBButton = function(func) {
	$s.push("pokemmo.UI::hookBButton");
	var $spos = $s.length;
	pokemmo.UI.BButtonHooks.push(func);
	$s.pop();
}
pokemmo.UI.hookEnterButton = function(func) {
	$s.push("pokemmo.UI::hookEnterButton");
	var $spos = $s.length;
	pokemmo.UI.enterButtonHooks.push(func);
	$s.pop();
}
pokemmo.UI.unHookAButton = function(func) {
	$s.push("pokemmo.UI::unHookAButton");
	var $spos = $s.length;
	pokemmo.UI.AButtonHooks.remove(func);
	$s.pop();
}
pokemmo.UI.unHookBButton = function(func) {
	$s.push("pokemmo.UI::unHookBButton");
	var $spos = $s.length;
	pokemmo.UI.BButtonHooks.remove(func);
	$s.pop();
}
pokemmo.UI.unHookEnterButton = function(func) {
	$s.push("pokemmo.UI::unHookEnterButton");
	var $spos = $s.length;
	pokemmo.UI.AButtonHooks.remove(func);
	$s.pop();
}
pokemmo.UI.hookDirButtons = function(func) {
	$s.push("pokemmo.UI::hookDirButtons");
	var $spos = $s.length;
	pokemmo.UI.dirButtonHooks.push(func);
	$s.pop();
}
pokemmo.UI.unHookDirButtons = function(func) {
	$s.push("pokemmo.UI::unHookDirButtons");
	var $spos = $s.length;
	pokemmo.UI.dirButtonHooks.remove(func);
	$s.pop();
}
pokemmo.UI.isKeyDown = function(n) {
	$s.push("pokemmo.UI::isKeyDown");
	var $spos = $s.length;
	var $tmp = !!pokemmo.UI.keysDown[n];
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.UI.isMouseInRect = function(x1,y1,x2,y2) {
	$s.push("pokemmo.UI::isMouseInRect");
	var $spos = $s.length;
	var $tmp = pokemmo.UI.mouseX >= x1 && pokemmo.UI.mouseY >= y1 && pokemmo.UI.mouseX < x2 && pokemmo.UI.mouseY < y2;
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.UI.renderPokemonParty = function(ctx) {
	$s.push("pokemmo.UI::renderPokemonParty");
	var $spos = $s.length;
	if(pokemmo.Main.isPhone) {
		$s.pop();
		return;
	}
	pokemmo.Main.tmpCtx.clearRect(0,0,pokemmo.Main.tmpCanvas.width,pokemmo.Main.tmpCanvas.height);
	var x = 10;
	var y = 10;
	var deltaY = 48;
	var pokemonParty = pokemmo.Game.pokemonParty;
	var tmpCtx = pokemmo.Main.tmpCtx;
	var tmpCanvas = pokemmo.Main.tmpCanvas;
	if(pokemonParty == null) {
		$s.pop();
		return;
	}
	var drawStyleText = function(str,x_,y_) {
		$s.push("pokemmo.UI::renderPokemonParty@281");
		var $spos = $s.length;
		tmpCtx.fillStyle = "rgb(0, 0, 0)";
		tmpCtx.fillText(str,x + x_ + 2,y + y_ + 2);
		tmpCtx.fillStyle = "rgb(255, 255, 255)";
		tmpCtx.fillText(str,x + x_,y + y_);
		$s.pop();
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
	$s.pop();
}
pokemmo.UI.createTextInput = function(x,y,width) {
	$s.push("pokemmo.UI::createTextInput");
	var $spos = $s.length;
	var ti = new pokemmo.ui.TextInput(x,y,width);
	pokemmo.UI.inputs.push(ti);
	$s.pop();
	return ti;
	$s.pop();
}
pokemmo.UI.pushInput = function(i) {
	$s.push("pokemmo.UI::pushInput");
	var $spos = $s.length;
	pokemmo.UI.inputs.push(i);
	$s.pop();
}
pokemmo.UI.removeInput = function(i) {
	$s.push("pokemmo.UI::removeInput");
	var $spos = $s.length;
	pokemmo.UI.inputs.remove(i);
	$s.pop();
}
pokemmo.UI.setCursor = function(str) {
	$s.push("pokemmo.UI::setCursor");
	var $spos = $s.length;
	pokemmo.Main.onScreenCanvas.style.cursor = str;
	$s.pop();
}
pokemmo.UI.prototype.__class__ = pokemmo.UI;
Reflect = function() { }
Reflect.__name__ = ["Reflect"];
Reflect.hasField = function(o,field) {
	$s.push("Reflect::hasField");
	var $spos = $s.length;
	if(o.hasOwnProperty != null) {
		var $tmp = o.hasOwnProperty(field);
		$s.pop();
		return $tmp;
	}
	var arr = Reflect.fields(o);
	var $it0 = arr.iterator();
	while( $it0.hasNext() ) {
		var t = $it0.next();
		if(t == field) {
			$s.pop();
			return true;
		}
	}
	$s.pop();
	return false;
	$s.pop();
}
Reflect.field = function(o,field) {
	$s.push("Reflect::field");
	var $spos = $s.length;
	var v = null;
	try {
		v = o[field];
	} catch( e ) {
		$e = [];
		while($s.length >= $spos) $e.unshift($s.pop());
		$s.push($e[0]);
	}
	$s.pop();
	return v;
	$s.pop();
}
Reflect.setField = function(o,field,value) {
	$s.push("Reflect::setField");
	var $spos = $s.length;
	o[field] = value;
	$s.pop();
}
Reflect.callMethod = function(o,func,args) {
	$s.push("Reflect::callMethod");
	var $spos = $s.length;
	var $tmp = func.apply(o,args);
	$s.pop();
	return $tmp;
	$s.pop();
}
Reflect.fields = function(o) {
	$s.push("Reflect::fields");
	var $spos = $s.length;
	if(o == null) {
		var $tmp = new Array();
		$s.pop();
		return $tmp;
	}
	var a = new Array();
	if(o.hasOwnProperty) {
		for(var i in o) if( o.hasOwnProperty(i) ) a.push(i);
	} else {
		var t;
		try {
			t = o.__proto__;
		} catch( e ) {
			$e = [];
			while($s.length >= $spos) $e.unshift($s.pop());
			$s.push($e[0]);
			t = null;
		}
		if(t != null) o.__proto__ = null;
		for(var i in o) if( i != "__proto__" ) a.push(i);
		if(t != null) o.__proto__ = t;
	}
	$s.pop();
	return a;
	$s.pop();
}
Reflect.isFunction = function(f) {
	$s.push("Reflect::isFunction");
	var $spos = $s.length;
	var $tmp = typeof(f) == "function" && f.__name__ == null;
	$s.pop();
	return $tmp;
	$s.pop();
}
Reflect.compare = function(a,b) {
	$s.push("Reflect::compare");
	var $spos = $s.length;
	var $tmp = a == b?0:a > b?1:-1;
	$s.pop();
	return $tmp;
	$s.pop();
}
Reflect.compareMethods = function(f1,f2) {
	$s.push("Reflect::compareMethods");
	var $spos = $s.length;
	if(f1 == f2) {
		$s.pop();
		return true;
	}
	if(!Reflect.isFunction(f1) || !Reflect.isFunction(f2)) {
		$s.pop();
		return false;
	}
	var $tmp = f1.scope == f2.scope && f1.method == f2.method && f1.method != null;
	$s.pop();
	return $tmp;
	$s.pop();
}
Reflect.isObject = function(v) {
	$s.push("Reflect::isObject");
	var $spos = $s.length;
	if(v == null) {
		$s.pop();
		return false;
	}
	var t = typeof(v);
	var $tmp = t == "string" || t == "object" && !v.__enum__ || t == "function" && v.__name__ != null;
	$s.pop();
	return $tmp;
	$s.pop();
}
Reflect.deleteField = function(o,f) {
	$s.push("Reflect::deleteField");
	var $spos = $s.length;
	if(!Reflect.hasField(o,f)) {
		$s.pop();
		return false;
	}
	delete(o[f]);
	$s.pop();
	return true;
	$s.pop();
}
Reflect.copy = function(o) {
	$s.push("Reflect::copy");
	var $spos = $s.length;
	var o2 = { };
	var _g = 0, _g1 = Reflect.fields(o);
	while(_g < _g1.length) {
		var f = _g1[_g];
		++_g;
		o2[f] = Reflect.field(o,f);
	}
	$s.pop();
	return o2;
	$s.pop();
}
Reflect.makeVarArgs = function(f) {
	$s.push("Reflect::makeVarArgs");
	var $spos = $s.length;
	var $tmp = function() {
		$s.push("Reflect::makeVarArgs@108");
		var $spos = $s.length;
		var a = new Array();
		var _g1 = 0, _g = arguments.length;
		while(_g1 < _g) {
			var i = _g1++;
			a.push(arguments[i]);
		}
		var $tmp = f(a);
		$s.pop();
		return $tmp;
		$s.pop();
	};
	$s.pop();
	return $tmp;
	$s.pop();
}
Reflect.prototype.__class__ = Reflect;
pokemmo.transitions.BlackScreen = function(duration) {
	if( duration === $_ ) return;
	$s.push("pokemmo.transitions.BlackScreen::new");
	var $spos = $s.length;
	pokemmo.Transition.call(this);
	this.duration = duration;
	$s.pop();
}
pokemmo.transitions.BlackScreen.__name__ = ["pokemmo","transitions","BlackScreen"];
pokemmo.transitions.BlackScreen.__super__ = pokemmo.Transition;
for(var k in pokemmo.Transition.prototype ) pokemmo.transitions.BlackScreen.prototype[k] = pokemmo.Transition.prototype[k];
pokemmo.transitions.BlackScreen.prototype.duration = null;
pokemmo.transitions.BlackScreen.prototype.render = function(ctx) {
	$s.push("pokemmo.transitions.BlackScreen::render");
	var $spos = $s.length;
	ctx.fillStyle = "#000000";
	ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
	if(this.step >= 0) ++this.step;
	if(this.step >= this.duration) {
		this.complete();
		$s.pop();
		return;
	}
	$s.pop();
}
pokemmo.transitions.BlackScreen.prototype.__class__ = pokemmo.transitions.BlackScreen;
pokemmo.entities.CWarp = function(name,x,y) {
	if( name === $_ ) return;
	$s.push("pokemmo.entities.CWarp::new");
	var $spos = $s.length;
	pokemmo.GameObject.call(this,x,y);
	this.name = name;
	this.disable = false;
	$s.pop();
}
pokemmo.entities.CWarp.__name__ = ["pokemmo","entities","CWarp"];
pokemmo.entities.CWarp.__super__ = pokemmo.GameObject;
for(var k in pokemmo.GameObject.prototype ) pokemmo.entities.CWarp.prototype[k] = pokemmo.GameObject.prototype[k];
pokemmo.entities.CWarp.getWarpAt = function(x,y) {
	$s.push("pokemmo.entities.CWarp::getWarpAt");
	var $spos = $s.length;
	var _g = 0, _g1 = pokemmo.Game.curGame.gameObjects;
	while(_g < _g1.length) {
		var i = _g1[_g];
		++_g;
		if(i.x == x && i.y == y && Std["is"](i,pokemmo.entities.CWarp)) {
			$s.pop();
			return i;
		}
	}
	$s.pop();
	return null;
	$s.pop();
}
pokemmo.entities.CWarp.getWarpByName = function(str) {
	$s.push("pokemmo.entities.CWarp::getWarpByName");
	var $spos = $s.length;
	var _g = 0, _g1 = pokemmo.Game.curGame.gameObjects;
	while(_g < _g1.length) {
		var i = _g1[_g];
		++_g;
		if(Std["is"](i,pokemmo.entities.CWarp) && i.name == str) {
			$s.pop();
			return i;
		}
	}
	$s.pop();
	return null;
	$s.pop();
}
pokemmo.entities.CWarp.prototype.name = null;
pokemmo.entities.CWarp.prototype.disable = null;
pokemmo.entities.CWarp.prototype.__class__ = pokemmo.entities.CWarp;
IntIter = function(min,max) {
	if( min === $_ ) return;
	$s.push("IntIter::new");
	var $spos = $s.length;
	this.min = min;
	this.max = max;
	$s.pop();
}
IntIter.__name__ = ["IntIter"];
IntIter.prototype.min = null;
IntIter.prototype.max = null;
IntIter.prototype.hasNext = function() {
	$s.push("IntIter::hasNext");
	var $spos = $s.length;
	var $tmp = this.min < this.max;
	$s.pop();
	return $tmp;
	$s.pop();
}
IntIter.prototype.next = function() {
	$s.push("IntIter::next");
	var $spos = $s.length;
	var $tmp = this.min++;
	$s.pop();
	return $tmp;
	$s.pop();
}
IntIter.prototype.__class__ = IntIter;
pokemmo.entities.CWildPokemon = function(id,x,y,chr) {
	if( id === $_ ) return;
	$s.push("pokemmo.entities.CWildPokemon::new");
	var $spos = $s.length;
	pokemmo.entities.CPokemon.call(this,id,x,y);
	this.chr = chr;
	this.createdTick = pokemmo.Renderer.numRTicks;
	$s.pop();
}
pokemmo.entities.CWildPokemon.__name__ = ["pokemmo","entities","CWildPokemon"];
pokemmo.entities.CWildPokemon.__super__ = pokemmo.entities.CPokemon;
for(var k in pokemmo.entities.CPokemon.prototype ) pokemmo.entities.CWildPokemon.prototype[k] = pokemmo.entities.CPokemon.prototype[k];
pokemmo.entities.CWildPokemon.prototype.createdTick = null;
pokemmo.entities.CWildPokemon.prototype.chr = null;
pokemmo.entities.CWildPokemon.prototype.tick = function() {
	$s.push("pokemmo.entities.CWildPokemon::tick");
	var $spos = $s.length;
	if(!this.chr.inBattle) {
		this.destroy();
		$s.pop();
		return;
	}
	pokemmo.entities.CPokemon.prototype.tick.call(this);
	if(!this.walking) {
		if(this.x < this.chr.x) this.direction = 3; else if(this.x > this.chr.x) this.direction = 1; else if(this.y > this.chr.y) this.direction = 2; else this.direction = 0;
	}
	$s.pop();
}
pokemmo.entities.CWildPokemon.prototype.render = function(ctx) {
	$s.push("pokemmo.entities.CWildPokemon::render");
	var $spos = $s.length;
	if(this.chr.id == pokemmo.Game.myId && !pokemmo.Game.curGame.drawPlayerChar) {
		$s.pop();
		return;
	}
	ctx.save();
	this.canDrawGrass = pokemmo.Renderer.numRTicks - this.createdTick < 5;
	if(pokemmo.Renderer.numRTicks - this.createdTick < 10) ctx.translate(0,-(Math.floor(-7 / 50 * (pokemmo.Renderer.numRTicks - this.createdTick) * (pokemmo.Renderer.numRTicks - this.createdTick) + 7 / 5 * (pokemmo.Renderer.numRTicks - this.createdTick)) * 8));
	pokemmo.entities.CPokemon.prototype.render.call(this,ctx);
	ctx.restore();
	$s.pop();
}
pokemmo.entities.CWildPokemon.prototype.__class__ = pokemmo.entities.CWildPokemon;
if(typeof js=='undefined') js = {}
js.Boot = function() { }
js.Boot.__name__ = ["js","Boot"];
js.Boot.__unhtml = function(s) {
	$s.push("js.Boot::__unhtml");
	var $spos = $s.length;
	var $tmp = s.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
	$s.pop();
	return $tmp;
	$s.pop();
}
js.Boot.__trace = function(v,i) {
	$s.push("js.Boot::__trace");
	var $spos = $s.length;
	var msg = i != null?i.fileName + ":" + i.lineNumber + ": ":"";
	msg += js.Boot.__unhtml(js.Boot.__string_rec(v,"")) + "<br/>";
	var d = document.getElementById("haxe:trace");
	if(d == null) alert("No haxe:trace element defined\n" + msg); else d.innerHTML += msg;
	$s.pop();
}
js.Boot.__clear_trace = function() {
	$s.push("js.Boot::__clear_trace");
	var $spos = $s.length;
	var d = document.getElementById("haxe:trace");
	if(d != null) d.innerHTML = "";
	$s.pop();
}
js.Boot.__closure = function(o,f) {
	$s.push("js.Boot::__closure");
	var $spos = $s.length;
	var m = o[f];
	if(m == null) {
		$s.pop();
		return null;
	}
	var f1 = function() {
		$s.push("js.Boot::__closure@67");
		var $spos = $s.length;
		var $tmp = m.apply(o,arguments);
		$s.pop();
		return $tmp;
		$s.pop();
	};
	f1.scope = o;
	f1.method = m;
	$s.pop();
	return f1;
	$s.pop();
}
js.Boot.__string_rec = function(o,s) {
	$s.push("js.Boot::__string_rec");
	var $spos = $s.length;
	if(o == null) {
		$s.pop();
		return "null";
	}
	if(s.length >= 5) {
		$s.pop();
		return "<...>";
	}
	var t = typeof(o);
	if(t == "function" && (o.__name__ != null || o.__ename__ != null)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__ != null) {
				if(o.length == 2) {
					var $tmp = o[0];
					$s.pop();
					return $tmp;
				}
				var str = o[0] + "(";
				s += "\t";
				var _g1 = 2, _g = o.length;
				while(_g1 < _g) {
					var i = _g1++;
					if(i != 2) str += "," + js.Boot.__string_rec(o[i],s); else str += js.Boot.__string_rec(o[i],s);
				}
				var $tmp = str + ")";
				$s.pop();
				return $tmp;
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
			$s.pop();
			return str;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			$e = [];
			while($s.length >= $spos) $e.unshift($s.pop());
			$s.push($e[0]);
			$s.pop();
			return "???";
		}
		if(tostr != null && tostr != Object.toString) {
			var s2 = o.toString();
			if(s2 != "[object Object]") {
				$s.pop();
				return s2;
			}
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
		$s.pop();
		return str;
	case "function":
		$s.pop();
		return "<function>";
	case "string":
		$s.pop();
		return o;
	default:
		var $tmp = String(o);
		$s.pop();
		return $tmp;
	}
	$s.pop();
}
js.Boot.__interfLoop = function(cc,cl) {
	$s.push("js.Boot::__interfLoop");
	var $spos = $s.length;
	if(cc == null) {
		$s.pop();
		return false;
	}
	if(cc == cl) {
		$s.pop();
		return true;
	}
	var intf = cc.__interfaces__;
	if(intf != null) {
		var _g1 = 0, _g = intf.length;
		while(_g1 < _g) {
			var i = _g1++;
			var i1 = intf[i];
			if(i1 == cl || js.Boot.__interfLoop(i1,cl)) {
				$s.pop();
				return true;
			}
		}
	}
	var $tmp = js.Boot.__interfLoop(cc.__super__,cl);
	$s.pop();
	return $tmp;
	$s.pop();
}
js.Boot.__instanceof = function(o,cl) {
	$s.push("js.Boot::__instanceof");
	var $spos = $s.length;
	try {
		if(o instanceof cl) {
			if(cl == Array) {
				var $tmp = o.__enum__ == null;
				$s.pop();
				return $tmp;
			}
			$s.pop();
			return true;
		}
		if(js.Boot.__interfLoop(o.__class__,cl)) {
			$s.pop();
			return true;
		}
	} catch( e ) {
		$e = [];
		while($s.length >= $spos) $e.unshift($s.pop());
		$s.push($e[0]);
		if(cl == null) {
			$s.pop();
			return false;
		}
	}
	switch(cl) {
	case Int:
		var $tmp = Math.ceil(o%2147483648.0) === o;
		$s.pop();
		return $tmp;
	case Float:
		var $tmp = typeof(o) == "number";
		$s.pop();
		return $tmp;
	case Bool:
		var $tmp = o === true || o === false;
		$s.pop();
		return $tmp;
	case String:
		var $tmp = typeof(o) == "string";
		$s.pop();
		return $tmp;
	case Dynamic:
		$s.pop();
		return true;
	default:
		if(o == null) {
			$s.pop();
			return false;
		}
		var $tmp = o.__enum__ == cl || cl == Class && o.__name__ != null || cl == Enum && o.__ename__ != null;
		$s.pop();
		return $tmp;
	}
	$s.pop();
}
js.Boot.__init = function() {
	$s.push("js.Boot::__init");
	var $spos = $s.length;
	js.Lib.isIE = typeof document!='undefined' && document.all != null && typeof window!='undefined' && window.opera == null;
	js.Lib.isOpera = typeof window!='undefined' && window.opera != null;
	Array.prototype.copy = Array.prototype.slice;
	Array.prototype.insert = function(i,x) {
		$s.push("js.Boot::__init@205");
		var $spos = $s.length;
		this.splice(i,0,x);
		$s.pop();
	};
	Array.prototype.remove = Array.prototype.indexOf?function(obj) {
		$s.push("js.Boot::__init@208");
		var $spos = $s.length;
		var idx = this.indexOf(obj);
		if(idx == -1) {
			$s.pop();
			return false;
		}
		this.splice(idx,1);
		$s.pop();
		return true;
		$s.pop();
	}:function(obj) {
		$s.push("js.Boot::__init@213");
		var $spos = $s.length;
		var i = 0;
		var l = this.length;
		while(i < l) {
			if(this[i] == obj) {
				this.splice(i,1);
				$s.pop();
				return true;
			}
			i++;
		}
		$s.pop();
		return false;
		$s.pop();
	};
	Array.prototype.iterator = function() {
		$s.push("js.Boot::__init@225");
		var $spos = $s.length;
		var $tmp = { cur : 0, arr : this, hasNext : function() {
			$s.push("js.Boot::__init@225@229");
			var $spos = $s.length;
			var $tmp = this.cur < this.arr.length;
			$s.pop();
			return $tmp;
			$s.pop();
		}, next : function() {
			$s.push("js.Boot::__init@225@232");
			var $spos = $s.length;
			var $tmp = this.arr[this.cur++];
			$s.pop();
			return $tmp;
			$s.pop();
		}};
		$s.pop();
		return $tmp;
		$s.pop();
	};
	if(String.prototype.cca == null) String.prototype.cca = String.prototype.charCodeAt;
	String.prototype.charCodeAt = function(i) {
		$s.push("js.Boot::__init@239");
		var $spos = $s.length;
		var x = this.cca(i);
		if(x != x) {
			$s.pop();
			return null;
		}
		$s.pop();
		return x;
		$s.pop();
	};
	var oldsub = String.prototype.substr;
	String.prototype.substr = function(pos,len) {
		$s.push("js.Boot::__init@246");
		var $spos = $s.length;
		if(pos != null && pos != 0 && len != null && len < 0) {
			$s.pop();
			return "";
		}
		if(len == null) len = this.length;
		if(pos < 0) {
			pos = this.length + pos;
			if(pos < 0) pos = 0;
		} else if(len < 0) len = this.length + len - pos;
		var $tmp = oldsub.apply(this,[pos,len]);
		$s.pop();
		return $tmp;
		$s.pop();
	};
	$closure = js.Boot.__closure;
	$s.pop();
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
	$s.push("pokemmo.Renderer::setup");
	var $spos = $s.length;
	pokemmo.Renderer.resetHooks();
	$s.pop();
}
pokemmo.Renderer.render = function() {
	$s.push("pokemmo.Renderer::render");
	var $spos = $s.length;
	if(pokemmo.Renderer.willRender) {
		$s.pop();
		return;
	}
	pokemmo.Renderer.willRender = true;
	var func = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || window.webkitRequestAnimationFrame || window.oRequestAnimationFrame;
	if(func == null) func = function(tmp) {
		$s.push("pokemmo.Renderer::render@31");
		var $spos = $s.length;
		setTimeout(pokemmo.Renderer.realRender,1);
		$s.pop();
	};
	func(pokemmo.Renderer.realRender);
	$s.pop();
}
pokemmo.Renderer.getOffsetX = function() {
	$s.push("pokemmo.Renderer::getOffsetX");
	var $spos = $s.length;
	var $tmp = Math.floor(pokemmo.Game.curGame.map.tilewidth * -pokemmo.Renderer.cameraX);
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.Renderer.getOffsetY = function() {
	$s.push("pokemmo.Renderer::getOffsetY");
	var $spos = $s.length;
	var $tmp = Math.floor(pokemmo.Game.curGame.map.tileheight * -pokemmo.Renderer.cameraY);
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.Renderer.hookRender = function(func) {
	$s.push("pokemmo.Renderer::hookRender");
	var $spos = $s.length;
	if(pokemmo.Renderer.renderHooks.indexOf(func) != -1) {
		$s.pop();
		return;
	}
	pokemmo.Renderer.renderHooks.push(func);
	$s.pop();
}
pokemmo.Renderer.unHookRender = function(func) {
	$s.push("pokemmo.Renderer::unHookRender");
	var $spos = $s.length;
	var i = pokemmo.Renderer.renderHooks.indexOf(func);
	if(i != -1) pokemmo.Renderer.renderHooks.splice(i,1);
	$s.pop();
}
pokemmo.Renderer.resetHooks = function() {
	$s.push("pokemmo.Renderer::resetHooks");
	var $spos = $s.length;
	pokemmo.Renderer.renderHooks = [];
	pokemmo.Renderer.gameRenderHooks = [];
	$s.pop();
}
pokemmo.Renderer.realRender = function() {
	$s.push("pokemmo.Renderer::realRender");
	var $spos = $s.length;
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
		null;
		break;
	case 2:
		if(g == null) {
			$s.pop();
			return;
		}
		var map = g.map;
		if(map == null) throw "No map in memory";
		var chr = g.getPlayerChar();
		if(chr != null) {
			var charRenderPos = chr.getRenderPos();
			pokemmo.Renderer.cameraX = charRenderPos.x / map.tilewidth + 1 - pokemmo.Main.screenWidth / map.tilewidth / 2;
			pokemmo.Renderer.cameraY = charRenderPos.y / map.tileheight - pokemmo.Main.screenHeight / map.tileheight / 2;
		}
		map.render(ctx);
		map.renderAnimated(ctx);
		pokemmo.Game.curGame.renderObjects(ctx);
		map.renderOver(ctx);
		var _g1 = 0, _g = pokemmo.Renderer.gameRenderHooks.length;
		while(_g1 < _g) {
			var i = _g1++;
			pokemmo.Renderer.gameRenderHooks[i]();
		}
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
		pokemmo.UI.render(ctx);
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
				$s.push("pokemmo.Renderer::realRender@130");
				var $spos = $s.length;
				ctx.fillStyle = "#000000";
				ctx.globalAlpha = 1 - step / 8;
				ctx.fillRect(0,0,canvas.width,canvas.height);
				ctx.globalAlpha = 1;
				++step;
				if(step >= 8) pokemmo.Renderer.unHookRender(func);
				$s.pop();
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
		pokemmo.UI.render(ctx);
		break;
	case 6:
		pokemmo.RegisterScreen.render(ctx);
		pokemmo.UI.render(ctx);
		break;
	case 5:
		pokemmo.NewGameScreen.render(ctx);
		pokemmo.UI.render(ctx);
		break;
	}
	if(pokemmo.Renderer.curTransition != null) pokemmo.Renderer.curTransition.render(ctx);
	onScreenCtx.clearRect(0,0,onScreenCanvas.width,onScreenCanvas.height);
	onScreenCtx.drawImage(canvas,0,0);
	++pokemmo.Renderer.numRTicks;
	$s.pop();
}
pokemmo.Renderer.drawOverlay = function(ctx,x,y,width,height,drawFunc) {
	$s.push("pokemmo.Renderer::drawOverlay");
	var $spos = $s.length;
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
	$s.pop();
}
pokemmo.Renderer.drawShadowText2 = function(ctx,str,x,y,color,shadowColor) {
	$s.push("pokemmo.Renderer::drawShadowText2");
	var $spos = $s.length;
	ctx.fillStyle = shadowColor;
	ctx.fillText(str,x + 2,y);
	ctx.fillText(str,x,y + 2);
	ctx.fillText(str,x + 2,y + 2);
	ctx.fillStyle = color;
	ctx.fillText(str,x,y);
	$s.pop();
}
pokemmo.Renderer.startTransition = function(t) {
	$s.push("pokemmo.Renderer::startTransition");
	var $spos = $s.length;
	pokemmo.Renderer.curTransition = t;
	$s.pop();
	return t;
	$s.pop();
}
pokemmo.Renderer.stopTransition = function() {
	$s.push("pokemmo.Renderer::stopTransition");
	var $spos = $s.length;
	pokemmo.Renderer.curTransition = null;
	$s.pop();
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
	$s.push("pokemmo.NewGameScreen::init");
	var $spos = $s.length;
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
		$s.push("pokemmo.NewGameScreen::init@68");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,200,0,150,50,pokemmo.NewGameScreen.confirmBtn.x - 15,pokemmo.NewGameScreen.confirmBtn.y - 15,150,50);
		$s.pop();
	};
	pokemmo.NewGameScreen.confirmBtn.drawHover = function(ctx) {
		$s.push("pokemmo.NewGameScreen::init@71");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,200,50,150,50,pokemmo.NewGameScreen.confirmBtn.x - 15,pokemmo.NewGameScreen.confirmBtn.y - 15,150,50);
		$s.pop();
	};
	pokemmo.NewGameScreen.confirmBtn.drawDown = function(ctx) {
		$s.push("pokemmo.NewGameScreen::init@74");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,200,100,150,50,pokemmo.NewGameScreen.confirmBtn.x - 15,pokemmo.NewGameScreen.confirmBtn.y - 15,150,50);
		$s.pop();
	};
	pokemmo.NewGameScreen.confirmBtn.drawDisabled = function(ctx) {
		$s.push("pokemmo.NewGameScreen::init@77");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,200,150,150,50,pokemmo.NewGameScreen.confirmBtn.x - 15,pokemmo.NewGameScreen.confirmBtn.y - 15,150,50);
		$s.pop();
	};
	pokemmo.NewGameScreen.confirmBtn.onSubmit = pokemmo.NewGameScreen.onConfirm;
	pokemmo.UI.inputs.push(pokemmo.NewGameScreen.confirmBtn);
	var createArrow = function(x,y,dir,func) {
		$s.push("pokemmo.NewGameScreen::init@83");
		var $spos = $s.length;
		var arrow = new pokemmo.ui.UIButton(x,y,32,32);
		arrow.drawIdle = function(ctx) {
			$s.push("pokemmo.NewGameScreen::init@83@85");
			var $spos = $s.length;
			ctx.drawImage(pokemmo.NewGameScreen.arrows.obj,dir * 32,0,32,32,arrow.x,arrow.y,32,32);
			$s.pop();
		};
		arrow.drawHover = function(ctx) {
			$s.push("pokemmo.NewGameScreen::init@83@88");
			var $spos = $s.length;
			ctx.drawImage(pokemmo.NewGameScreen.arrows.obj,dir * 32,32,32,32,arrow.x,arrow.y,32,32);
			$s.pop();
		};
		arrow.drawDown = function(ctx) {
			$s.push("pokemmo.NewGameScreen::init@83@91");
			var $spos = $s.length;
			ctx.drawImage(pokemmo.NewGameScreen.arrows.obj,dir * 32,64,32,32,arrow.x,arrow.y,32,32);
			$s.pop();
		};
		arrow.onSubmit = func;
		pokemmo.UI.inputs.push(arrow);
		$s.pop();
		return arrow;
		$s.pop();
	};
	pokemmo.NewGameScreen.arrowPokLeft = createArrow(260,430,1,function() {
		$s.push("pokemmo.NewGameScreen::init@99");
		var $spos = $s.length;
		if(--pokemmo.NewGameScreen.curStarter < 0) pokemmo.NewGameScreen.curStarter += starters.length;
		$s.pop();
	});
	pokemmo.NewGameScreen.arrowPokRight = createArrow(305,430,3,function() {
		$s.push("pokemmo.NewGameScreen::init@102");
		var $spos = $s.length;
		if(++pokemmo.NewGameScreen.curStarter >= starters.length) pokemmo.NewGameScreen.curStarter -= starters.length;
		$s.pop();
	});
	pokemmo.NewGameScreen.arrowCharLeft = createArrow(468,430,1,function() {
		$s.push("pokemmo.NewGameScreen::init@106");
		var $spos = $s.length;
		if(--pokemmo.NewGameScreen.curChar < 0) pokemmo.NewGameScreen.curChar += chars.length;
		$s.pop();
	});
	pokemmo.NewGameScreen.arrowCharRight = createArrow(513,430,3,function() {
		$s.push("pokemmo.NewGameScreen::init@109");
		var $spos = $s.length;
		if(++pokemmo.NewGameScreen.curChar >= chars.length) pokemmo.NewGameScreen.curChar -= chars.length;
		$s.pop();
	});
	$s.pop();
}
pokemmo.NewGameScreen.onImageLoad = function() {
	$s.push("pokemmo.NewGameScreen::onImageLoad");
	var $spos = $s.length;
	--pokemmo.NewGameScreen.pendingLoad;
	if(pokemmo.NewGameScreen.pendingLoad == 0) pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeIn(10));
	$s.pop();
}
pokemmo.NewGameScreen.onImageError = function() {
	$s.push("pokemmo.NewGameScreen::onImageError");
	var $spos = $s.length;
	$s.pop();
}
pokemmo.NewGameScreen.onConfirm = function() {
	$s.push("pokemmo.NewGameScreen::onConfirm");
	var $spos = $s.length;
	pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeOut(10)).onComplete = function() {
		$s.push("pokemmo.NewGameScreen::onConfirm@128");
		var $spos = $s.length;
		pokemmo.NewGameScreen.destroy();
		pokemmo.Game.state = pokemmo.GameState.ST_LOADING;
		pokemmo.Connection.socket.emit("newGame",{ starter : pokemmo.NewGameScreen.starters[pokemmo.NewGameScreen.curStarter], character : pokemmo.NewGameScreen.chars[pokemmo.NewGameScreen.curChar]});
		$s.pop();
	};
	$s.pop();
}
pokemmo.NewGameScreen.destroy = function() {
	$s.push("pokemmo.NewGameScreen::destroy");
	var $spos = $s.length;
	pokemmo.UI.inputs.remove(pokemmo.NewGameScreen.confirmBtn);
	pokemmo.UI.inputs.remove(pokemmo.NewGameScreen.arrowPokLeft);
	pokemmo.UI.inputs.remove(pokemmo.NewGameScreen.arrowPokRight);
	pokemmo.UI.inputs.remove(pokemmo.NewGameScreen.arrowCharLeft);
	pokemmo.UI.inputs.remove(pokemmo.NewGameScreen.arrowCharRight);
	$s.pop();
}
pokemmo.NewGameScreen.render = function(ctx) {
	$s.push("pokemmo.NewGameScreen::render");
	var $spos = $s.length;
	if(pokemmo.NewGameScreen.pendingLoad > 0) {
		ctx.fillStyle = "#000000";
		ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
		ctx.fillStyle = "#FFFFFF";
		ctx.font = "12pt Courier New";
		ctx.fillText("Loading... " + pokemmo.NewGameScreen.pendingLoad,10,30);
		$s.pop();
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
	$s.pop();
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
pokemmo.RegisterScreen.init = function() {
	$s.push("pokemmo.RegisterScreen::init");
	var $spos = $s.length;
	pokemmo.RegisterScreen.regsocket = io.connect("http://localhost:2827");
	pokemmo.RegisterScreen.confirmBtn = new pokemmo.ui.UIButton(410,490,130,30);
	pokemmo.RegisterScreen.confirmBtn.drawIdle = function(ctx) {
		$s.push("pokemmo.RegisterScreen::init@36");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,200,0,150,50,pokemmo.RegisterScreen.confirmBtn.x - 15,pokemmo.RegisterScreen.confirmBtn.y - 15,150,50);
		$s.pop();
	};
	pokemmo.RegisterScreen.confirmBtn.drawHover = function(ctx) {
		$s.push("pokemmo.RegisterScreen::init@39");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,200,50,150,50,pokemmo.RegisterScreen.confirmBtn.x - 15,pokemmo.RegisterScreen.confirmBtn.y - 15,150,50);
		$s.pop();
	};
	pokemmo.RegisterScreen.confirmBtn.drawDown = function(ctx) {
		$s.push("pokemmo.RegisterScreen::init@42");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,200,100,150,50,pokemmo.RegisterScreen.confirmBtn.x - 15,pokemmo.RegisterScreen.confirmBtn.y - 15,150,50);
		$s.pop();
	};
	pokemmo.RegisterScreen.confirmBtn.drawDisabled = function(ctx) {
		$s.push("pokemmo.RegisterScreen::init@45");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,200,150,150,50,pokemmo.RegisterScreen.confirmBtn.x - 15,pokemmo.RegisterScreen.confirmBtn.y - 15,150,50);
		$s.pop();
	};
	pokemmo.RegisterScreen.confirmBtn.onSubmit = pokemmo.RegisterScreen.onConfirm;
	pokemmo.UI.inputs.push(pokemmo.RegisterScreen.confirmBtn);
	pokemmo.RegisterScreen.cancelBtn = new pokemmo.ui.UIButton(270,490,130,30);
	pokemmo.RegisterScreen.cancelBtn.drawIdle = function(ctx) {
		$s.push("pokemmo.RegisterScreen::init@52");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,350,0,150,50,pokemmo.RegisterScreen.cancelBtn.x - 15,pokemmo.RegisterScreen.cancelBtn.y - 15,150,50);
		$s.pop();
	};
	pokemmo.RegisterScreen.cancelBtn.drawHover = function(ctx) {
		$s.push("pokemmo.RegisterScreen::init@55");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,350,50,150,50,pokemmo.RegisterScreen.cancelBtn.x - 15,pokemmo.RegisterScreen.cancelBtn.y - 15,150,50);
		$s.pop();
	};
	pokemmo.RegisterScreen.cancelBtn.drawDown = function(ctx) {
		$s.push("pokemmo.RegisterScreen::init@58");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,350,100,150,50,pokemmo.RegisterScreen.cancelBtn.x - 15,pokemmo.RegisterScreen.cancelBtn.y - 15,150,50);
		$s.pop();
	};
	pokemmo.RegisterScreen.cancelBtn.drawDisabled = function(ctx) {
		$s.push("pokemmo.RegisterScreen::init@61");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,350,150,150,50,pokemmo.RegisterScreen.cancelBtn.x - 15,pokemmo.RegisterScreen.cancelBtn.y - 15,150,50);
		$s.pop();
	};
	pokemmo.RegisterScreen.cancelBtn.onSubmit = pokemmo.RegisterScreen.onCancel;
	pokemmo.UI.inputs.push(pokemmo.RegisterScreen.cancelBtn);
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
	pokemmo.RegisterScreen.regsocket.on("registration",function(data) {
		$s.push("pokemmo.RegisterScreen::init@84");
		var $spos = $s.length;
		pokemmo.RegisterScreen.requestError = data.result;
		if(pokemmo.RegisterScreen.requestError == "success") {
			pokemmo.RegisterScreen.destroy();
			pokemmo.Connection.socket.emit("login",{ username : pokemmo.RegisterScreen.usernameTxt.value, password : pokemmo.RegisterScreen.passwordTxt.value});
		} else {
			pokemmo.RegisterScreen.requestInitTime = Date.now().getTime();
			pokemmo.RegisterScreen.captchaTxt.value = "";
			pokemmo.RegisterScreen.sentRequest = false;
			if(pokemmo.RegisterScreen.requestError == "short_password" || pokemmo.RegisterScreen.requestError == "long_password" || pokemmo.RegisterScreen.requestError == "invalid_password") pokemmo.RegisterScreen.password2Txt.value = "";
		}
		$s.pop();
	});
	pokemmo.RegisterScreen.sentRequest = false;
	pokemmo.RegisterScreen.loadCaptcha();
	$s.pop();
}
pokemmo.RegisterScreen.destroy = function() {
	$s.push("pokemmo.RegisterScreen::destroy");
	var $spos = $s.length;
	pokemmo.RegisterScreen.regsocket.disconnect();
	pokemmo.UI.inputs.remove(pokemmo.RegisterScreen.confirmBtn);
	pokemmo.UI.inputs.remove(pokemmo.RegisterScreen.cancelBtn);
	pokemmo.UI.inputs.remove(pokemmo.RegisterScreen.usernameTxt);
	pokemmo.UI.inputs.remove(pokemmo.RegisterScreen.passwordTxt);
	pokemmo.UI.inputs.remove(pokemmo.RegisterScreen.password2Txt);
	pokemmo.UI.inputs.remove(pokemmo.RegisterScreen.emailTxt);
	pokemmo.UI.inputs.remove(pokemmo.RegisterScreen.captchaTxt);
	$s.pop();
}
pokemmo.RegisterScreen.onConfirm = function() {
	$s.push("pokemmo.RegisterScreen::onConfirm");
	var $spos = $s.length;
	pokemmo.RegisterScreen.requestError = null;
	pokemmo.RegisterScreen.requestInitTime = Date.now().getTime();
	if(pokemmo.RegisterScreen.usernameTxt.value.length < 4) pokemmo.RegisterScreen.requestError = "short_username"; else if(pokemmo.RegisterScreen.usernameTxt.value.length > 10) pokemmo.RegisterScreen.requestError = "long_username"; else if(pokemmo.RegisterScreen.passwordTxt.value.length < 8) pokemmo.RegisterScreen.requestError = "short_password"; else if(pokemmo.RegisterScreen.passwordTxt.value.length > 32) pokemmo.RegisterScreen.requestError = "long_password"; else if(pokemmo.RegisterScreen.passwordTxt.value != pokemmo.RegisterScreen.password2Txt.value) pokemmo.RegisterScreen.requestError = "mismatch_password";
	if(pokemmo.RegisterScreen.requestError != null) {
		$s.pop();
		return;
	}
	pokemmo.RegisterScreen.sentRequest = true;
	pokemmo.RegisterScreen.oldCaptchaImage = pokemmo.RegisterScreen.captchaImage;
	pokemmo.RegisterScreen.loadCaptcha();
	pokemmo.RegisterScreen.regsocket.emit("register",{ username : pokemmo.RegisterScreen.usernameTxt.value, password : pokemmo.RegisterScreen.passwordTxt.value, challenge : pokemmo.RegisterScreen.captchaChallenge, response : pokemmo.RegisterScreen.captchaTxt.value, email : pokemmo.RegisterScreen.emailTxt.value});
	$s.pop();
}
pokemmo.RegisterScreen.loadCaptcha = function() {
	$s.push("pokemmo.RegisterScreen::loadCaptcha");
	var $spos = $s.length;
	var b = document.createElement("script");
	b.type = "text/javascript";
	b.src = "http://www.google.com/recaptcha/api/challenge?k=6Lfxuc4SAAAAAJmKHMi1LS1DkjXj18CvHbd_geFW&ajax=1";
	document.body.appendChild(b);
	window.Recaptcha = { challenge_callback : pokemmo.RegisterScreen.gotChallenge};
	$s.pop();
}
pokemmo.RegisterScreen.gotChallenge = function() {
	$s.push("pokemmo.RegisterScreen::gotChallenge");
	var $spos = $s.length;
	pokemmo.RegisterScreen.captchaChallenge = RecaptchaState.challenge;
	pokemmo.RegisterScreen.captchaImage = new pokemmo.ImageResource("http://www.google.com/recaptcha/api/image?c=" + pokemmo.RegisterScreen.captchaChallenge);
	$s.pop();
}
pokemmo.RegisterScreen.onCancel = function() {
	$s.push("pokemmo.RegisterScreen::onCancel");
	var $spos = $s.length;
	pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeOut(10)).onComplete = function() {
		$s.push("pokemmo.RegisterScreen::onCancel@168");
		var $spos = $s.length;
		pokemmo.RegisterScreen.destroy();
		pokemmo.Game.state = pokemmo.GameState.ST_TITLE;
		pokemmo.TitleScreen.init();
		pokemmo.Renderer.startTransition(new pokemmo.transitions.BlackScreen(5)).onComplete = function() {
			$s.push("pokemmo.RegisterScreen::onCancel@168@172");
			var $spos = $s.length;
			pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeIn(10));
			$s.pop();
		};
		$s.pop();
	};
	$s.pop();
}
pokemmo.RegisterScreen.render = function(ctx) {
	$s.push("pokemmo.RegisterScreen::render");
	var $spos = $s.length;
	var now = Date.now().getTime();
	var c2 = Math.floor(255 * ((now - pokemmo.RegisterScreen.requestInitTime) / 2000));
	var cstr = "#" + (16711680 | c2 << 8 | c2).toString(16);
	ctx.drawImage(pokemmo.TitleScreen.titleLogo.obj,117,80);
	pokemmo.Util.drawRoundedRect(145,275,250,150,15,"#FFFFFF",0.7);
	if((pokemmo.RegisterScreen.requestError == "short_username" || pokemmo.RegisterScreen.requestError == "long_username" || pokemmo.RegisterScreen.requestError == "invalid_username" || pokemmo.RegisterScreen.requestError == "username_already_exists") && now - pokemmo.RegisterScreen.requestInitTime < 2000) pokemmo.Util.drawRoundedRect(245,321,135,18,5,cstr,1.0); else pokemmo.Util.drawRoundedRect(245,321,135,18,5,"#FFFFFF",1.0);
	if((pokemmo.RegisterScreen.requestError == "short_password" || pokemmo.RegisterScreen.requestError == "long_password" || pokemmo.RegisterScreen.requestError == "invalid_password") && now - pokemmo.RegisterScreen.requestInitTime < 2000) pokemmo.Util.drawRoundedRect(245,346,135,18,5,cstr,1.0); else pokemmo.Util.drawRoundedRect(245,346,135,18,5,"#FFFFFF",1.0);
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
	if(now - pokemmo.RegisterScreen.requestInitTime < 2000) {
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
		}
		if(errorMsg != null) {
			ctx.save();
			ctx.fillStyle = "rgba(200,0,0," + pokemmo.Util.clamp(1 - (now - pokemmo.RegisterScreen.requestInitTime) / 2000,0,1) + ")";
			ctx.textAlign = "center";
			ctx.fillText(errorMsg,400,465);
			ctx.restore();
		}
	}
	$s.pop();
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
pokemmo.TitleScreen.setup = function() {
	$s.push("pokemmo.TitleScreen::setup");
	var $spos = $s.length;
	pokemmo.TitleScreen.titleScreen = pokemmo.Game.loadImageResource("titleScreen","resources/ui/title.png");
	pokemmo.TitleScreen.titleLogo = pokemmo.Game.loadImageResource("titleLogo","resources/ui/title_logo.png");
	pokemmo.TitleScreen.titleButtons = pokemmo.Game.loadImageResource("titleButtons","resources/ui/title_buttons.png");
	pokemmo.TitleScreen.loadingImg = pokemmo.Game.loadImageResource("loading","resources/ui/loading.png");
	$s.pop();
}
pokemmo.TitleScreen.init = function() {
	$s.push("pokemmo.TitleScreen::init");
	var $spos = $s.length;
	pokemmo.TitleScreen.usernameTxt = pokemmo.UI.createTextInput(350,321,130);
	pokemmo.TitleScreen.usernameTxt.maxLength = 10;
	pokemmo.TitleScreen.passwordTxt = pokemmo.UI.createTextInput(350,346,130);
	pokemmo.TitleScreen.passwordTxt.maxLength = 64;
	pokemmo.TitleScreen.passwordTxt.isPassword = true;
	pokemmo.TitleScreen.loginButton = new pokemmo.ui.UIButton(455,375,30,30);
	pokemmo.TitleScreen.loginButton.drawIdle = function(ctx) {
		$s.push("pokemmo.TitleScreen::init@45");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,0,0,50,50,445,365,50,50);
		$s.pop();
	};
	pokemmo.TitleScreen.loginButton.drawHover = function(ctx) {
		$s.push("pokemmo.TitleScreen::init@48");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,0,50,50,50,445,365,50,50);
		$s.pop();
	};
	pokemmo.TitleScreen.loginButton.drawDown = function(ctx) {
		$s.push("pokemmo.TitleScreen::init@51");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,0,100,50,50,445,365,50,50);
		$s.pop();
	};
	pokemmo.TitleScreen.loginButton.drawDisabled = function(ctx) {
		$s.push("pokemmo.TitleScreen::init@54");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,0,150,50,50,445,365,50,50);
		$s.pop();
	};
	pokemmo.TitleScreen.loginButton.onSubmit = pokemmo.TitleScreen.onLoginSubmit;
	pokemmo.UI.inputs.push(pokemmo.TitleScreen.loginButton);
	pokemmo.TitleScreen.registerButton = new pokemmo.ui.UIButton(310,375,130,30);
	pokemmo.TitleScreen.registerButton.drawIdle = function(ctx) {
		$s.push("pokemmo.TitleScreen::init@61");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,50,0,150,50,300,365,150,50);
		$s.pop();
	};
	pokemmo.TitleScreen.registerButton.drawHover = function(ctx) {
		$s.push("pokemmo.TitleScreen::init@64");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,50,50,150,50,300,365,150,50);
		$s.pop();
	};
	pokemmo.TitleScreen.registerButton.drawDown = function(ctx) {
		$s.push("pokemmo.TitleScreen::init@67");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,50,100,150,50,300,365,150,50);
		$s.pop();
	};
	pokemmo.TitleScreen.registerButton.drawDisabled = function(ctx) {
		$s.push("pokemmo.TitleScreen::init@70");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,50,150,150,50,300,365,150,50);
		$s.pop();
	};
	pokemmo.TitleScreen.registerButton.onSubmit = pokemmo.TitleScreen.onRegisterSubmit;
	pokemmo.UI.inputs.push(pokemmo.TitleScreen.registerButton);
	pokemmo.TitleScreen.donateButton = new pokemmo.ui.UIButton(305,470,190,30);
	pokemmo.TitleScreen.donateButton.drawIdle = function(ctx) {
		$s.push("pokemmo.TitleScreen::init@77");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,500,0,210,50,295,460,210,50);
		$s.pop();
	};
	pokemmo.TitleScreen.donateButton.drawHover = function(ctx) {
		$s.push("pokemmo.TitleScreen::init@80");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,500,50,210,50,295,460,210,50);
		$s.pop();
	};
	pokemmo.TitleScreen.donateButton.drawDown = function(ctx) {
		$s.push("pokemmo.TitleScreen::init@83");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,500,100,210,50,295,460,210,50);
		$s.pop();
	};
	pokemmo.TitleScreen.donateButton.drawDisabled = function(ctx) {
		$s.push("pokemmo.TitleScreen::init@86");
		var $spos = $s.length;
		ctx.drawImage(pokemmo.TitleScreen.titleButtons.obj,500,150,210,50,295,460,210,50);
		$s.pop();
	};
	pokemmo.TitleScreen.donateButton.instantSubmit = true;
	pokemmo.TitleScreen.donateButton.onSubmit = function() {
		$s.push("pokemmo.TitleScreen::init@90");
		var $spos = $s.length;
		window.open("https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=QBXGPHQPQ5G5Y","_blank");
		$s.pop();
	};
	pokemmo.UI.inputs.push(pokemmo.TitleScreen.donateButton);
	pokemmo.UI.enterButtonHooks.push(pokemmo.TitleScreen.onEnterButton);
	$s.pop();
}
pokemmo.TitleScreen.destroy = function() {
	$s.push("pokemmo.TitleScreen::destroy");
	var $spos = $s.length;
	pokemmo.UI.inputs.remove(pokemmo.TitleScreen.usernameTxt);
	pokemmo.UI.inputs.remove(pokemmo.TitleScreen.passwordTxt);
	pokemmo.UI.inputs.remove(pokemmo.TitleScreen.loginButton);
	pokemmo.UI.inputs.remove(pokemmo.TitleScreen.registerButton);
	pokemmo.UI.inputs.remove(pokemmo.TitleScreen.donateButton);
	$s.pop();
}
pokemmo.TitleScreen.onLoginSubmit = function() {
	$s.push("pokemmo.TitleScreen::onLoginSubmit");
	var $spos = $s.length;
	if(pokemmo.TitleScreen.sentLogin) {
		$s.pop();
		return;
	}
	pokemmo.TitleScreen.sentLogin = true;
	pokemmo.TitleScreen.loginInitTime = Date.now().getTime();
	pokemmo.Connection.socket.emit("login",{ username : pokemmo.TitleScreen.usernameTxt.value, password : pokemmo.TitleScreen.passwordTxt.value});
	$s.pop();
}
pokemmo.TitleScreen.onRegisterSubmit = function() {
	$s.push("pokemmo.TitleScreen::onRegisterSubmit");
	var $spos = $s.length;
	if(pokemmo.TitleScreen.sentLogin) {
		$s.pop();
		return;
	}
	pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeOut(10)).onComplete = function() {
		$s.push("pokemmo.TitleScreen::onRegisterSubmit@116");
		var $spos = $s.length;
		pokemmo.TitleScreen.destroy();
		pokemmo.Game.state = pokemmo.GameState.ST_REGISTER;
		pokemmo.RegisterScreen.init();
		pokemmo.RegisterScreen.usernameTxt.value = pokemmo.TitleScreen.usernameTxt.value;
		pokemmo.RegisterScreen.passwordTxt.value = pokemmo.TitleScreen.passwordTxt.value;
		pokemmo.Renderer.startTransition(new pokemmo.transitions.BlackScreen(5)).onComplete = function() {
			$s.push("pokemmo.TitleScreen::onRegisterSubmit@116@122");
			var $spos = $s.length;
			pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeIn(10));
			$s.pop();
		};
		$s.pop();
	};
	$s.pop();
}
pokemmo.TitleScreen.loginFailed = function() {
	$s.push("pokemmo.TitleScreen::loginFailed");
	var $spos = $s.length;
	pokemmo.TitleScreen.sentLogin = false;
	pokemmo.TitleScreen.loginInitTime = Date.now().getTime();
	$s.pop();
}
pokemmo.TitleScreen.onEnterButton = function() {
	$s.push("pokemmo.TitleScreen::onEnterButton");
	var $spos = $s.length;
	if(pokemmo.UI.selectedInput == pokemmo.TitleScreen.usernameTxt || pokemmo.UI.selectedInput == pokemmo.TitleScreen.passwordTxt) pokemmo.TitleScreen.onLoginSubmit();
	pokemmo.UI.enterButtonHooks.push(pokemmo.TitleScreen.onEnterButton);
	$s.pop();
}
pokemmo.TitleScreen.render = function(ctx) {
	$s.push("pokemmo.TitleScreen::render");
	var $spos = $s.length;
	var canvas = ctx.canvas;
	if(!pokemmo.TitleScreen.titleScreen.loaded || !pokemmo.TitleScreen.titleButtons.loaded || !pokemmo.TitleScreen.titleLogo.loaded || !pokemmo.TitleScreen.loadingImg.loaded) {
		ctx.fillStyle = "#000000";
		ctx.fillRect(0,0,canvas.width,canvas.height);
		$s.pop();
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
		ctx.drawImage(pokemmo.TitleScreen.loadingImg.obj,0,32 * (Math.floor((now - pokemmo.TitleScreen.loginInitTime) / 100) % 12),32,32,384,430,32,32);
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
	if(!pokemmo.TitleScreen.sentLogin && now - pokemmo.TitleScreen.loginInitTime < 2000) {
		ctx.fillStyle = "rgba(200,0,0," + pokemmo.Util.clamp(1 - (now - pokemmo.TitleScreen.loginInitTime) / 2000,0,1) + ")";
		ctx.textAlign = "center";
		ctx.fillText("Invalid username or password",400,430);
	}
	ctx.restore();
	$s.pop();
}
pokemmo.TitleScreen.prototype.__class__ = pokemmo.TitleScreen;
pokemmo.PokemonConst = function() { }
pokemmo.PokemonConst.__name__ = ["pokemmo","PokemonConst"];
pokemmo.PokemonConst.prototype.__class__ = pokemmo.PokemonConst;
StringBuf = function(p) {
	if( p === $_ ) return;
	$s.push("StringBuf::new");
	var $spos = $s.length;
	this.b = new Array();
	$s.pop();
}
StringBuf.__name__ = ["StringBuf"];
StringBuf.prototype.add = function(x) {
	$s.push("StringBuf::add");
	var $spos = $s.length;
	this.b[this.b.length] = x == null?"null":x;
	$s.pop();
}
StringBuf.prototype.addSub = function(s,pos,len) {
	$s.push("StringBuf::addSub");
	var $spos = $s.length;
	this.b[this.b.length] = s.substr(pos,len);
	$s.pop();
}
StringBuf.prototype.addChar = function(c) {
	$s.push("StringBuf::addChar");
	var $spos = $s.length;
	this.b[this.b.length] = String.fromCharCode(c);
	$s.pop();
}
StringBuf.prototype.toString = function() {
	$s.push("StringBuf::toString");
	var $spos = $s.length;
	var $tmp = this.b.join("");
	$s.pop();
	return $tmp;
	$s.pop();
}
StringBuf.prototype.b = null;
StringBuf.prototype.__class__ = StringBuf;
pokemmo.transitions.BattleTransition001 = function(p) {
	if( p === $_ ) return;
	$s.push("pokemmo.transitions.BattleTransition001::new");
	var $spos = $s.length;
	pokemmo.Transition.call(this);
	$s.pop();
}
pokemmo.transitions.BattleTransition001.__name__ = ["pokemmo","transitions","BattleTransition001"];
pokemmo.transitions.BattleTransition001.__super__ = pokemmo.Transition;
for(var k in pokemmo.Transition.prototype ) pokemmo.transitions.BattleTransition001.prototype[k] = pokemmo.Transition.prototype[k];
pokemmo.transitions.BattleTransition001.prototype.render = function(ctx) {
	$s.push("pokemmo.transitions.BattleTransition001::render");
	var $spos = $s.length;
	if(this.step < 0) {
		$s.pop();
		return;
	}
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
	$s.pop();
}
pokemmo.transitions.BattleTransition001.prototype.__class__ = pokemmo.transitions.BattleTransition001;
pokemmo.entities.CGrassAnimation = function(x,y) {
	if( x === $_ ) return;
	$s.push("pokemmo.entities.CGrassAnimation::new");
	var $spos = $s.length;
	pokemmo.GameObject.call(this,x,y);
	this.createdTick = pokemmo.Renderer.numRTicks;
	$s.pop();
}
pokemmo.entities.CGrassAnimation.__name__ = ["pokemmo","entities","CGrassAnimation"];
pokemmo.entities.CGrassAnimation.__super__ = pokemmo.GameObject;
for(var k in pokemmo.GameObject.prototype ) pokemmo.entities.CGrassAnimation.prototype[k] = pokemmo.GameObject.prototype[k];
pokemmo.entities.CGrassAnimation.prototype.createdTick = null;
pokemmo.entities.CGrassAnimation.prototype.render = function(ctx) {
	$s.push("pokemmo.entities.CGrassAnimation::render");
	var $spos = $s.length;
	var tick = this.createdTick;
	if(pokemmo.Renderer.numRTicks - tick >= 16) {
		this.destroy();
		$s.pop();
		return;
	}
	var curMap = pokemmo.Map.getCurMap();
	ctx.drawImage(pokemmo.Game.res["miscSprites"].obj,32,32 * Math.floor((pokemmo.Renderer.numRTicks - tick) / 4),32,32,this.x * curMap.tilewidth + pokemmo.Renderer.getOffsetX(),this.y * curMap.tileheight + pokemmo.Renderer.getOffsetY(),32,32);
	$s.pop();
}
pokemmo.entities.CGrassAnimation.prototype.__class__ = pokemmo.entities.CGrassAnimation;
pokemmo.ui.UIButton = function(x,y,width,height) {
	if( x === $_ ) return;
	$s.push("pokemmo.ui.UIButton::new");
	var $spos = $s.length;
	pokemmo.ui.UIInput.call(this,x,y);
	this.width = width;
	this.height = height;
	this.mouseWasDown = false;
	this.keyWasDown = false;
	this.instantSubmit = false;
	$s.pop();
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
	$s.push("pokemmo.ui.UIButton::tick");
	var $spos = $s.length;
	if(this.disabled) {
		$s.pop();
		return;
	}
	if(this.isUnderMouse()) pokemmo.Main.onScreenCanvas.style.cursor = "pointer";
	$s.pop();
}
pokemmo.ui.UIButton.prototype.submit = function() {
	$s.push("pokemmo.ui.UIButton::submit");
	var $spos = $s.length;
	if(this.onSubmit != null) this.onSubmit();
	this.mouseWasDown = false;
	this.keyWasDown = false;
	$s.pop();
}
pokemmo.ui.UIButton.prototype.render = function(ctx) {
	$s.push("pokemmo.ui.UIButton::render");
	var $spos = $s.length;
	if(this.disabled) {
		this.mouseWasDown = false;
		this.keyWasDown = false;
		this.drawDisabled(ctx);
		$s.pop();
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
	$s.pop();
}
pokemmo.ui.UIButton.prototype.isUnderMouse = function() {
	$s.push("pokemmo.ui.UIButton::isUnderMouse");
	var $spos = $s.length;
	var $tmp = pokemmo.UI.mouseX >= this.x && pokemmo.UI.mouseY >= this.y && pokemmo.UI.mouseX < this.x + this.width && pokemmo.UI.mouseY < this.y + this.height;
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.ui.UIButton.prototype.__class__ = pokemmo.ui.UIButton;
pokemmo.Battle = function(type) {
	if( type === $_ ) return;
	$s.push("pokemmo.Battle::new");
	var $spos = $s.length;
	this.type = type;
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
	$s.pop();
}
pokemmo.Battle.__name__ = ["pokemmo","Battle"];
pokemmo.Battle.prototype.step = null;
pokemmo.Battle.prototype.type = null;
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
pokemmo.Battle.prototype.finishX = null;
pokemmo.Battle.prototype.finishY = null;
pokemmo.Battle.prototype.finishMap = null;
pokemmo.Battle.prototype.finishMapChars = null;
pokemmo.Battle.prototype.runningQueue = null;
pokemmo.Battle.prototype.render = function(ctx) {
	$s.push("pokemmo.Battle::render");
	var $spos = $s.length;
	var me = this;
	this.now = Date.now().getTime();
	ctx.save();
	ctx.translate(pokemmo.Main.isPhone?0:160,pokemmo.Main.isPhone?0:140);
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
		this.setBattleText("Wild " + pokemmo.Util.getPokemonDisplayName(this.enemyPokemon) + " appeared!",-1,function() {
			$s.push("pokemmo.Battle::render@132");
			var $spos = $s.length;
			var pk = me.curPokemon;
			me.setBattleText("Go! " + pokemmo.Util.getPokemonDisplayName(me.curPokemon) + "!");
			me.step = pokemmo.BATTLE_STEP.BATTLE_STEP_GO_POKEMON;
			me.animStep = 0;
			me.selectedMove = 0;
			$s.pop();
		});
	}
	ctx.restore();
	$s.pop();
}
pokemmo.Battle.prototype.drawBottomPanel = function(ctx) {
	$s.push("pokemmo.Battle::drawBottomPanel");
	var $spos = $s.length;
	var me = this;
	ctx.drawImage(pokemmo.Game.res["battleTextBackground"].obj,2,228);
	if(this.text != "") {
		var str = this.text.substr(0,Math.floor((this.now - this.textTime) / 30));
		ctx.font = "24px Font2";
		var maxWidth = this.step == pokemmo.BATTLE_STEP.BATTLE_STEP_ACTION_MENU?150:420;
		if(ctx.measureText(str).width > maxWidth) {
			var firstLine = str;
			var secondLine = "";
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
				if(this.textDelay == 0) {
					if(this.textOnComplete != null) this.textOnComplete();
				} else if(this.textDelay != -1) {
					if(this.textOnComplete != null) setTimeout(function() {
						$s.push("pokemmo.Battle::drawBottomPanel@196");
						var $spos = $s.length;
						me.textOnComplete();
						$s.pop();
					},this.textDelay);
				} else pokemmo.UI.AButtonHooks.push(this.textOnComplete);
			} else if(this.textDelay == -1 && this.now - this.textCompletedTime > 100) {
				var tmp = Math.floor(this.now % 1000 / 250);
				if(tmp == 3) tmp = 1;
				tmp *= 2;
				ctx.drawImage(pokemmo.Game.res["battleMisc"].obj,0,0,32,32,24 + ctx.measureText(str).width,240 + tmp,32,32);
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
	$s.pop();
}
pokemmo.Battle.prototype.drawFightMenu = function(ctx) {
	$s.push("pokemmo.Battle::drawFightMenu");
	var $spos = $s.length;
	ctx.drawImage(pokemmo.Game.res["battleMoveMenu"].obj,2,228);
	var x1 = 40;
	var y1 = 268;
	var n = this.curPokemon.moves[0].toUpperCase();
	ctx.font = "24px Font2";
	ctx.fillStyle = "rgb(208,208,208)";
	ctx.fillText(n,x1,y1 + 2);
	ctx.fillText(n,x1 + 2,y1);
	ctx.fillStyle = "rgb(72,72,72)";
	ctx.fillText(n,x1,y1);
	ctx.drawImage(pokemmo.Game.res["battleMisc"].obj,96,0,32,32,x1 - 28 + Math.floor(this.now % 1000 / 500) * 2,y1 - 22,32,32);
	ctx.drawImage(pokemmo.Game.res["types"].obj,0,0,64,24,390,284,64,24);
	$s.pop();
}
pokemmo.Battle.prototype.renderEnemy = function(ctx) {
	$s.push("pokemmo.Battle::renderEnemy");
	var $spos = $s.length;
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
	$s.pop();
}
pokemmo.Battle.prototype.drawGoPokemonAnimation = function(ctx) {
	$s.push("pokemmo.Battle::drawGoPokemonAnimation");
	var $spos = $s.length;
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
	$s.pop();
}
pokemmo.Battle.prototype.drawPlayerPokemon = function(ctx) {
	$s.push("pokemmo.Battle::drawPlayerPokemon");
	var $spos = $s.length;
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
	$s.pop();
}
pokemmo.Battle.prototype.drawEnemyStatus = function(ctx) {
	$s.push("pokemmo.Battle::drawEnemyStatus");
	var $spos = $s.length;
	ctx.save();
	if(this.shakeEnemyStatus && pokemmo.Renderer.numRTicks % 2 == 0) ctx.translate(0,2);
	ctx.drawImage(pokemmo.Game.res["battleEnemyBar"].obj,26,32);
	ctx.drawImage(pokemmo.Game.res["battleHealthBar"].obj,0,0,1,6,104,66,96,6);
	var hpPerc = this.enemyPokemon.hp / this.enemyPokemon.maxHp;
	if(hpPerc > 0.50) ctx.drawImage(pokemmo.Game.res["battleHealthBar"].obj,0,6,1,6,104,66,Math.floor(48 * hpPerc) * 2,6); else if(hpPerc >= 0.20) ctx.drawImage(pokemmo.Game.res["battleHealthBar"].obj,0,12,1,6,104,66,Math.floor(48 * hpPerc) * 2,6); else ctx.drawImage(pokemmo.Game.res["battleHealthBar"].obj,0,18,1,6,104,66,Math.ceil(48 * hpPerc) * 2,6);
	var pokemonName = pokemmo.Util.getPokemonDisplayName(this.enemyPokemon);
	var pokemonLevel = "Lv" + this.enemyPokemon.level;
	var lvlX = 168 - (this.enemyPokemon.level < 10?0:this.enemyPokemon.level < 100?8:16);
	ctx.font = "21px Font2";
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
	$s.pop();
}
pokemmo.Battle.prototype.drawPokemonStatus = function(ctx) {
	$s.push("pokemmo.Battle::drawPokemonStatus");
	var $spos = $s.length;
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
	var pokemonName = pokemmo.Util.getPokemonDisplayName(this.curPokemon);
	var pokemonLevel = "Lv" + this.curPokemon.level;
	var lvlX = 412 - (this.curPokemon.level < 10?0:this.curPokemon.level < 100?8:16);
	var maxHpX = 422 - (this.curPokemon.maxHp >= 100?8:0);
	ctx.font = "21px Font2";
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
	$s.pop();
}
pokemmo.Battle.prototype.openActionMenu = function() {
	$s.push("pokemmo.Battle::openActionMenu");
	var $spos = $s.length;
	var me = this;
	this.runningQueue = false;
	this.step = pokemmo.BATTLE_STEP.BATTLE_STEP_ACTION_MENU;
	this.setBattleText("What will " + pokemmo.Util.getPokemonDisplayName(this.curPokemon) + " do?");
	pokemmo.UI.AButtonHooks.push(function() {
		$s.push("pokemmo.Battle::openActionMenu@471");
		var $spos = $s.length;
		if(me.selectedAction != 0) {
			me.openActionMenu();
			$s.pop();
			return;
		}
		switch(me.selectedAction) {
		case 0:
			me.openFightMenu();
			break;
		}
		$s.pop();
	});
	$s.pop();
}
pokemmo.Battle.prototype.openFightMenu = function() {
	$s.push("pokemmo.Battle::openFightMenu");
	var $spos = $s.length;
	var me = this;
	this.step = pokemmo.BATTLE_STEP.BATTLE_STEP_FIGHT_MENU;
	var aAction, bAction = null;
	aAction = function() {
		$s.push("pokemmo.Battle::openFightMenu@490");
		var $spos = $s.length;
		pokemmo.UI.BButtonHooks.remove(bAction);
		me.setBattleText(null);
		me.step = pokemmo.BATTLE_STEP.BATTLE_STEP_TURN;
		pokemmo.Connection.socket.emit("battleMove",{ move : me.selectedMove});
		$s.pop();
	};
	bAction = function() {
		$s.push("pokemmo.Battle::openFightMenu@497");
		var $spos = $s.length;
		pokemmo.UI.AButtonHooks.remove(aAction);
		me.openActionMenu();
		me.textTime = 0;
		$s.pop();
	};
	pokemmo.UI.AButtonHooks.push(aAction);
	pokemmo.UI.BButtonHooks.push(bAction);
	$s.pop();
}
pokemmo.Battle.prototype.setBattleText = function(str,delay,onComplete) {
	$s.push("pokemmo.Battle::setBattleText");
	var $spos = $s.length;
	this.text = str == null?"":str;
	this.textTime = this.now;
	if(delay == null) delay = Math.NaN;
	this.textDelay = delay;
	this.textOnComplete = onComplete;
	this.textCompleted = false;
	$s.pop();
}
pokemmo.Battle.prototype.runQueue = function(force) {
	$s.push("pokemmo.Battle::runQueue");
	var $spos = $s.length;
	if(force == null) force = false;
	var me = this;
	if(!force && this.runningQueue) {
		$s.pop();
		return;
	}
	this.runningQueue = true;
	if(this.resultQueue.length == 0) {
		this.openActionMenu();
		$s.pop();
		return;
	}
	var action = this.resultQueue.shift();
	this.curAction = action;
	var actionPlayerPokemon = action.player == 0?this.curPokemon:this.enemyPokemon;
	switch(action.type) {
	case "moveAttack":
		this.setBattleText(pokemmo.Util.or(actionPlayerPokemon.nickname,pokemmo.Game.pokemonData[actionPlayerPokemon.id].name).toUpperCase() + " used " + action.value.move.toUpperCase() + "!");
		setTimeout(function() {
			$s.push("pokemmo.Battle::runQueue@535");
			var $spos = $s.length;
			me.moveStartTime = Date.now().getTime();
			me.playMove(action.value.move);
			$s.pop();
		},1000);
		break;
	case "moveMiss":
		this.setBattleText(pokemmo.Util.or(actionPlayerPokemon.nickname,pokemmo.Game.pokemonData[actionPlayerPokemon.id].name).toUpperCase() + " used " + action.value.toUpperCase() + "!");
		setTimeout(function() {
			$s.push("pokemmo.Battle::runQueue@541");
			var $spos = $s.length;
			me.setBattleText("But it missed!");
			setTimeout(function() {
				$s.push("pokemmo.Battle::runQueue@541@543");
				var $spos = $s.length;
				me.runQueue(true);
				$s.pop();
			},1000);
			$s.pop();
		},1000);
		break;
	case "pokemonDefeated":
		var attacker;
		var defeated;
		if(action.player == 0) {
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
		this.setBattleText((this.type == 0 && action.player == 0?"Wild ":"") + pokemmo.Util.or(defeated.nickname,pokemmo.Game.pokemonData[defeated.id].name).toUpperCase() + " fainted!",-1,function() {
			$s.push("pokemmo.Battle::runQueue@562");
			var $spos = $s.length;
			if(action.player == 0) me.setBattleText(pokemmo.Util.or(attacker.nickname,pokemmo.Game.pokemonData[attacker.id].name).toUpperCase() + " gained " + action.value + " EXP. Points!",-1,function() {
				$s.push("pokemmo.Battle::runQueue@562@564");
				var $spos = $s.length;
				me.animateExp();
				$s.pop();
			}); else me.runQueue(true);
			$s.pop();
		});
		break;
	case "win":
		pokemmo.Game.setPokemonParty(action.value.pokemon);
		this.finishX = action.value.x;
		this.finishY = action.value.y;
		this.finishMap = action.value.map;
		this.finishMapChars = action.value.mapChars;
		if(this.type == 0 && action.player == 0) {
			this.finish();
			$s.pop();
			return;
		}
		this.finish();
		break;
	case "switchFainted":
		if(action.player != 0) {
			this.setBattleText("The opponent is selecting another pokemon");
			this.runningQueue = false;
			$s.pop();
			return;
		}
		break;
	case "fleeFail":
		null;
		break;
	case "pokemonLevelup":
		this.runQueue(true);
		break;
	}
	$s.pop();
}
pokemmo.Battle.prototype.animateHp = function() {
	$s.push("pokemmo.Battle::animateHp");
	var $spos = $s.length;
	var me = this;
	var action = this.curAction;
	var renderFunc = null;
	renderFunc = function() {
		$s.push("pokemmo.Battle::animateHp@605");
		var $spos = $s.length;
		var result = action.value.resultHp;
		var pok;
		if(action.player == 1) pok = me.curPokemon; else pok = me.enemyPokemon;
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
			setTimeout(function() {
				$s.push("pokemmo.Battle::animateHp@605@629");
				var $spos = $s.length;
				me.runQueue(true);
				$s.pop();
			},100);
		}
		$s.pop();
	};
	pokemmo.Renderer.hookRender(renderFunc);
	$s.pop();
}
pokemmo.Battle.prototype.animateExp = function() {
	$s.push("pokemmo.Battle::animateExp");
	var $spos = $s.length;
	var me = this;
	var action = this.curAction;
	if(action.player != 0 || this.curPokemon.level >= 100) {
		this.runQueue(true);
		$s.pop();
		return;
	}
	this.textDelay = 1 / 0;
	var expGained = action.value;
	var step = Math.ceil(expGained / 100);
	var renderFunc = null;
	renderFunc = function() {
		$s.push("pokemmo.Battle::animateExp@648");
		var $spos = $s.length;
		var pok = me.curPokemon;
		if(step > expGained) step = expGained;
		pok.experience += step;
		expGained -= step;
		if(pok.experience >= pok.experienceNeeded) {
			expGained += pok.experience - pok.experienceNeeded;
			var info = me.resultQueue.shift();
			if(info.type != "pokemonLevelup") throw "Assertion failed";
			var backsprite = me.curPokemon.backsprite;
			me.curPokemon = info.value;
			me.curPokemon.backsprite = backsprite;
			pok = me.curPokemon;
			pok.experience = 0;
		}
		if(expGained <= 0) {
			pokemmo.Renderer.unHookRender(renderFunc);
			setTimeout(function() {
				$s.push("pokemmo.Battle::animateExp@648@673");
				var $spos = $s.length;
				me.runQueue(true);
				$s.pop();
			},100);
		}
		$s.pop();
	};
	pokemmo.Renderer.hookRender(renderFunc);
	$s.pop();
}
pokemmo.Battle.prototype.playMove = function(n) {
	$s.push("pokemmo.Battle::playMove");
	var $spos = $s.length;
	var m = pokemmo.Move.getMove(n);
	this.curMove = m;
	m.start();
	$s.pop();
}
pokemmo.Battle.prototype.moveFinished = function() {
	$s.push("pokemmo.Battle::moveFinished");
	var $spos = $s.length;
	this.curMove = null;
	this.shakeEnemyStatus = false;
	this.shakePokemonStatus = false;
	var action = this.curAction;
	if(action.type == "moveAttack") {
		if(action.value.effec == 0) this.setBattleText("It's not effective...",0,$closure(this,"animateHp")); else if(action.value.effec < 1) this.setBattleText("It's not very effective...",0,$closure(this,"animateHp")); else if(action.value.effec > 1) this.setBattleText("It's very effective!",0,$closure(this,"animateHp")); else this.animateHp();
	} else this.runQueue(true);
	$s.pop();
}
pokemmo.Battle.prototype.buttonHandler = function(dir) {
	$s.push("pokemmo.Battle::buttonHandler");
	var $spos = $s.length;
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
	}
	$s.pop();
}
pokemmo.Battle.prototype.finish = function() {
	$s.push("pokemmo.Battle::finish");
	var $spos = $s.length;
	var me = this;
	pokemmo.UI.dirButtonHooks.remove($closure(this,"buttonHandler"));
	var step = 0;
	var func = null;
	var ctx = pokemmo.Main.ctx;
	var canvas = pokemmo.Main.canvas;
	func = function() {
		$s.push("pokemmo.Battle::finish@747");
		var $spos = $s.length;
		ctx.fillStyle = "#000000";
		if(step < 15) {
			ctx.globalAlpha = step / 15;
			ctx.fillRect(0,0,canvas.width,canvas.height);
			ctx.globalAlpha = 1;
		} else if(step < 20) {
			ctx.globalAlpha = 1;
			ctx.fillRect(0,0,canvas.width,canvas.height);
			if(step == 15) {
				if(me.finishMap == pokemmo.Map.getCurMap().id) {
					var chr = pokemmo.Game.curGame.getPlayerChar();
					if(chr != null) {
						chr.x = me.finishX;
						chr.y = me.finishY;
					}
				} else {
					pokemmo.Renderer.unHookRender(func);
					pokemmo.Game.loadMap(me.finishMap,me.finishMapChars);
				}
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
		$s.pop();
	};
	pokemmo.Renderer.hookRender(func);
	$s.pop();
}
pokemmo.Battle.prototype.__class__ = pokemmo.Battle;
pokemmo.BATTLE_STEP = { __ename__ : ["pokemmo","BATTLE_STEP"], __constructs__ : ["BATTLE_STEP_TRANSITION","BATTLE_STEP_POKEMON_APPEARED_TMP","BATTLE_STEP_POKEMON_APPEARED","BATTLE_STEP_GO_POKEMON","BATTLE_STEP_ACTION_MENU","BATTLE_STEP_FIGHT_MENU","BATTLE_STEP_TURN"] }
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
pokemmo.CCharacter = function(data) {
	if( data === $_ ) return;
	$s.push("pokemmo.CCharacter::new");
	var $spos = $s.length;
	var me = this;
	pokemmo.GameObject.call(this,data.x,data.y,data.direction);
	this.id = data.id;
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
	this.image = pokemmo.Game.curGame.getImage("resources/chars/" + data.type + ".png",function() {
		$s.push("pokemmo.CCharacter::new@93");
		var $spos = $s.length;
		me.loaded = true;
		$s.pop();
	});
	pokemmo.Game.curGame.characters.push(this);
	this.followerObj = new pokemmo.entities.CFollower(this);
	$s.pop();
}
pokemmo.CCharacter.__name__ = ["pokemmo","CCharacter"];
pokemmo.CCharacter.__super__ = pokemmo.GameObject;
for(var k in pokemmo.GameObject.prototype ) pokemmo.CCharacter.prototype[k] = pokemmo.GameObject.prototype[k];
pokemmo.CCharacter.prototype.id = null;
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
pokemmo.CCharacter.prototype.walking = null;
pokemmo.CCharacter.prototype.walkingHasMoved = null;
pokemmo.CCharacter.prototype.walkingPerc = null;
pokemmo.CCharacter.prototype.lastMoveTick = null;
pokemmo.CCharacter.prototype.canUpdate = null;
pokemmo.CCharacter.prototype.onTarget = null;
pokemmo.CCharacter.prototype.battleEnemy = null;
pokemmo.CCharacter.prototype.image = null;
pokemmo.CCharacter.prototype.freezeTicks = null;
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
	$s.push("pokemmo.CCharacter::destroy");
	var $spos = $s.length;
	pokemmo.GameObject.prototype.destroy.call(this);
	pokemmo.Game.curGame.characters.remove(this);
	this.inBattle = false;
	this.followerObj.destroy();
	if(this.wildPokemon != null) this.wildPokemon.destroy();
	$s.pop();
}
pokemmo.CCharacter.prototype.isControllable = function() {
	$s.push("pokemmo.CCharacter::isControllable");
	var $spos = $s.length;
	var $tmp = this.id == pokemmo.Game.myId && !pokemmo.Game.curGame.inBattle && pokemmo.Game.curGame.playerCanMove && !pokemmo.Chat.inChat && this.freezeTicks == 0;
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.CCharacter.prototype.getRenderPos = function() {
	$s.push("pokemmo.CCharacter::getRenderPos");
	var $spos = $s.length;
	if(!this.walking) {
		var $tmp = { x : Math.floor(this.x * pokemmo.Map.getCurMap().tilewidth + this.renderOffsetX), y : Math.floor(this.y * pokemmo.Map.getCurMap().tileheight - 64 / 2 + this.renderOffsetY)};
		$s.pop();
		return $tmp;
	}
	var destX = this.x * pokemmo.Map.getCurMap().tilewidth;
	var destY = this.y * pokemmo.Map.getCurMap().tileheight - 64 / 2;
	var perc = (this.walkingPerc - 0.3) * (1.0 / 0.7);
	if(this.walkingPerc >= 0.3) {
		if(this.walkingHasMoved) switch(this.direction) {
		case 1:
			destX += pokemmo.Map.getCurMap().tilewidth * (1 - perc);
			break;
		case 3:
			destX -= pokemmo.Map.getCurMap().tilewidth * (1 - perc);
			break;
		case 2:
			destY += pokemmo.Map.getCurMap().tileheight * (1 - perc);
			break;
		case 0:
			destY -= pokemmo.Map.getCurMap().tileheight * (1 - perc);
			break;
		} else switch(this.direction) {
		case 1:
			destX -= pokemmo.Map.getCurMap().tilewidth * perc;
			break;
		case 3:
			destX += pokemmo.Map.getCurMap().tilewidth * perc;
			break;
		case 2:
			destY -= pokemmo.Map.getCurMap().tileheight * perc;
			break;
		case 0:
			destY += pokemmo.Map.getCurMap().tileheight * perc;
			break;
		}
	}
	var $tmp = { x : Math.floor(destX + this.renderOffsetX), y : Math.floor(destY + this.renderOffsetY)};
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.CCharacter.prototype.tick = function() {
	$s.push("pokemmo.CCharacter::tick");
	var $spos = $s.length;
	pokemmo.GameObject.prototype.tick.call(this);
	this.tickWalking();
	if(this.id == pokemmo.Game.myId) this.tickWildBattle(); else if(this.x == this.targetX && this.y == this.targetY && !this.walking) {
		if(this.onTarget != null) {
			this.onTarget();
			this.onTarget = null;
		}
	}
	if(this.freezeTicks > 0) --this.freezeTicks;
	$s.pop();
}
pokemmo.CCharacter.prototype.tickWalking = function() {
	$s.push("pokemmo.CCharacter::tickWalking");
	var $spos = $s.length;
	var curMap = pokemmo.Game.curGame.map;
	if(!this.walking) {
		this.walkingHasMoved = false;
		this.walkingPerc = 0.0;
		if(this.id == pokemmo.Game.myId) {
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
					$s.pop();
					return;
				}
			}
			break;
		case 0:
			if(!!!pokemmo.UI.keysDown[40]) {
				if(this.walkingPerc < 0.3) {
					this.walking = false;
					pokemmo.Connection.socket.emit("turn",{ dir : this.direction});
					$s.pop();
					return;
				}
			}
			break;
		case 3:
			if(!!!pokemmo.UI.keysDown[39]) {
				if(this.walkingPerc < 0.3) {
					this.walking = false;
					pokemmo.Connection.socket.emit("turn",{ dir : this.direction});
					$s.pop();
					return;
				}
			}
			break;
		case 2:
			if(!!!pokemmo.UI.keysDown[38]) {
				if(this.walkingPerc < 0.3) {
					this.walking = false;
					pokemmo.Connection.socket.emit("turn",{ dir : this.direction});
					$s.pop();
					return;
				}
			}
			break;
		}
		this.walkingPerc += 0.10;
		this.animationStep += 0.20;
		if(this.animationStep > 4.0) this.animationStep -= 4.0;
		if(this.walkingPerc >= 0.7 / 2 && !this.walkingHasMoved) {
			if(this.id == pokemmo.Game.myId && !this.noclip) {
				var tmpPos = this.getFrontPosition();
				var tmpWarp = pokemmo.entities.CWarp.getWarpAt(tmpPos.x,tmpPos.y);
				if(tmpWarp != null) {
					if(Std["is"](tmpWarp,pokemmo.entities.CDoor)) this.enterDoor(tmpWarp); else if(Std["is"](tmpWarp,pokemmo.entities.CWarpArrow)) this.enterWarpArrow(tmpWarp); else if(Std["is"](tmpWarp,pokemmo.entities.CStairs)) this.enterStairs(tmpWarp);
					$s.pop();
					return;
				} else if(this.willMoveIntoAWall()) {
					pokemmo.Connection.socket.emit("turn",{ dir : this.direction});
					this.walking = false;
					$s.pop();
					return;
				}
			}
			if(!pokemmo.Game.curGame.inBattle || this.id != pokemmo.Game.myId) {
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
			if(this.id == pokemmo.Game.myId && this.transmitWalk) pokemmo.Connection.socket.emit("walk",{ ack : pokemmo.Connection.lastAckMove, x : this.x, y : this.y, dir : this.direction});
		}
		if(this.walkingPerc >= 1.0) {
			if(this.id == pokemmo.Game.myId) {
				if(!pokemmo.Game.curGame.inBattle && !this.willMoveIntoAWall() && (this.direction == 1 && !!pokemmo.UI.keysDown[37] || this.direction == 0 && !!pokemmo.UI.keysDown[40] || this.direction == 3 && !!pokemmo.UI.keysDown[39] || this.direction == 2 && !!pokemmo.UI.keysDown[38])) {
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
	$s.pop();
}
pokemmo.CCharacter.prototype.tickWildBattle = function() {
	$s.push("pokemmo.CCharacter::tickWildBattle");
	var $spos = $s.length;
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
				this.wildPokemon = new pokemmo.entities.CWildPokemon(this.battleEnemy,tmpX,tmpY,this);
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
				if(curMap.isTileSolid(tmpX,tmpY) || curMap.isTileWater(tmpX,tmpY)) {
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
	$s.pop();
}
pokemmo.CCharacter.prototype.enterDoor = function(door) {
	$s.push("pokemmo.CCharacter::enterDoor");
	var $spos = $s.length;
	var me = this;
	var tmpX = this.x;
	var tmpY = this.y;
	var canvas = pokemmo.Main.canvas;
	var ctx = pokemmo.Main.ctx;
	door.open();
	this.walking = false;
	if(this.id == pokemmo.Game.myId) {
		pokemmo.Game.curGame.playerCanMove = false;
		pokemmo.Game.curGame.queueLoadMap = true;
	}
	var tmpCount = 0;
	var doorRenderTransition = null;
	doorRenderTransition = function() {
		$s.push("pokemmo.CCharacter::enterDoor@436");
		var $spos = $s.length;
		++tmpCount;
		if(tmpCount < 15) {
			$s.pop();
			return;
		}
		if(tmpCount == 15) {
			me.walking = true;
			me.noclip = true;
			me.transmitWalk = false;
		}
		me.lastX = tmpX;
		me.lastY = tmpY;
		if(me.id == pokemmo.Game.myId) {
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
		$s.pop();
	};
	if(this.id == pokemmo.Game.myId) pokemmo.Connection.socket.emit("useWarp",{ name : door.name, direction : this.direction});
	pokemmo.Renderer.hookRender(doorRenderTransition);
	$s.pop();
}
pokemmo.CCharacter.prototype.enterWarpArrow = function(warp) {
	$s.push("pokemmo.CCharacter::enterWarpArrow");
	var $spos = $s.length;
	var me = this;
	var tmpX = this.x;
	var tmpY = this.y;
	var ctx = pokemmo.Main.ctx;
	var canvas = pokemmo.Main.canvas;
	warp.disable = true;
	this.walking = false;
	if(this.id == pokemmo.Game.myId) {
		pokemmo.Game.curGame.playerCanMove = false;
		pokemmo.Game.curGame.queueLoadMap = true;
	}
	var tmpCount = 0;
	var warpRenderTransition = null;
	warpRenderTransition = function() {
		$s.push("pokemmo.CCharacter::enterWarpArrow@493");
		var $spos = $s.length;
		++tmpCount;
		if(me.id == pokemmo.Game.myId) {
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
		$s.pop();
	};
	if(this.id == pokemmo.Game.myId) pokemmo.Connection.socket.emit("useWarp",{ name : warp.name, direction : this.direction});
	pokemmo.Renderer.hookRender(warpRenderTransition);
	$s.pop();
}
pokemmo.CCharacter.prototype.enterStairs = function(warp) {
	$s.push("pokemmo.CCharacter::enterStairs");
	var $spos = $s.length;
	var me = this;
	if(this.direction != warp.fromDir) {
		$s.pop();
		return;
	}
	var tmpX = this.x;
	var tmpY = this.y;
	var canvas = pokemmo.Main.canvas;
	var ctx = pokemmo.Main.ctx;
	this.walking = true;
	if(this.id == pokemmo.Game.myId) {
		pokemmo.Game.curGame.playerCanMove = false;
		pokemmo.Game.curGame.queueLoadMap = true;
	}
	var tmpCount = 0;
	var warpRenderTransition = null;
	warpRenderTransition = function() {
		$s.push("pokemmo.CCharacter::enterStairs@536");
		var $spos = $s.length;
		++tmpCount;
		me.walking = true;
		me.noclip = true;
		me.transmitWalk = false;
		if(me.walkingPerc <= 0.3) me.walkingPerc += 0.3;
		me.lastX = tmpX;
		me.lastY = tmpY;
		if(warp.direction == 0) me.renderOffsetY += 16 / 9; else if(warp.direction == 2) me.renderOffsetY -= 16 / 9; else throw "Assertion error";
		if(me.id == pokemmo.Game.myId) {
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
		$s.pop();
	};
	if(this.id == pokemmo.Game.myId) pokemmo.Connection.socket.emit("useWarp",{ name : warp.name, direction : this.direction});
	pokemmo.Renderer.hookRender(warpRenderTransition);
	$s.pop();
}
pokemmo.CCharacter.prototype.willMoveIntoAWall = function() {
	$s.push("pokemmo.CCharacter::willMoveIntoAWall");
	var $spos = $s.length;
	var pos = this.getFrontPosition();
	var map = pokemmo.Game.curGame.map;
	var $tmp = map.isTileSolid(pos.x,pos.y) || map.isTileWater(pos.x,pos.y);
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.CCharacter.prototype.getFrontPosition = function() {
	$s.push("pokemmo.CCharacter::getFrontPosition");
	var $spos = $s.length;
	switch(this.direction) {
	case 1:
		var $tmp = { x : this.x - 1, y : this.y};
		$s.pop();
		return $tmp;
	case 3:
		var $tmp = { x : this.x + 1, y : this.y};
		$s.pop();
		return $tmp;
	case 2:
		var $tmp = { x : this.x, y : this.y - 1};
		$s.pop();
		return $tmp;
	case 0:
		var $tmp = { x : this.x, y : this.y + 1};
		$s.pop();
		return $tmp;
	}
	$s.pop();
	return null;
	$s.pop();
}
pokemmo.CCharacter.prototype.tickBot = function() {
	$s.push("pokemmo.CCharacter::tickBot");
	var $spos = $s.length;
	if(this.walking) {
		$s.pop();
		return;
	}
	this.walking = this.x != this.targetX || this.y != this.targetY;
	if(!this.walking) {
		$s.pop();
		return;
	}
	var lastDirection = this.direction;
	if(Math.abs(this.x - this.targetX) > 0 && this.y == this.targetY) this.direction = this.x < this.targetX?3:1; else if(Math.abs(this.y - this.targetY) > 0 && this.x == this.targetX) this.direction = this.y < this.targetY?0:2; else this.direction = this.targetY < this.y?2:0;
	if(lastDirection != this.direction) this.walkingPerc = 0.0;
	$s.pop();
}
pokemmo.CCharacter.prototype.render = function(ctx) {
	$s.push("pokemmo.CCharacter::render");
	var $spos = $s.length;
	var me = this;
	if(!this.loaded) {
		$s.pop();
		return;
	}
	if(this.id == pokemmo.Game.myId && !pokemmo.Game.curGame.drawPlayerChar) {
		$s.pop();
		return;
	}
	var tmpCtx = pokemmo.Main.tmpCtx;
	ctx.save();
	ctx.globalAlpha *= this.renderAlpha;
	if(pokemmo.Renderer.numRTicks - this.createdTick < 10) ctx.globalAlpha *= (pokemmo.Renderer.numRTicks - this.createdTick) / 10;
	var offsetX = pokemmo.Renderer.getOffsetX();
	var offsetY = pokemmo.Renderer.getOffsetY();
	var renderPos = this.getRenderPos();
	var dirId = this.direction * 32;
	if(this.lockDirection != -1) dirId = this.lockDirection * 32;
	if(this.id != pokemmo.Game.myId && (pokemmo.UI.mouseX >= renderPos.x + offsetX - 5 && pokemmo.UI.mouseY >= renderPos.y + offsetY - 5 && pokemmo.UI.mouseX < renderPos.x + 32 + offsetX + 10 && pokemmo.UI.mouseY < renderPos.y + 64 + offsetY + 10)) {
		pokemmo.Renderer.drawOverlay(ctx,renderPos.x + offsetX,renderPos.y + offsetY,32,64,function(ctx1) {
			$s.push("pokemmo.CCharacter::render@644");
			var $spos = $s.length;
			ctx1.drawImage(me.image.obj,dirId,Math.floor(me.animationStep) * 64,32,64,0,0,32,64);
			$s.pop();
		});
		ctx.save();
		ctx.font = "12px Font2";
		ctx.textAlign = "center";
		ctx.fillStyle = "#000000";
		ctx.fillText(this.username,renderPos.x + offsetX + 32 / 2 + 1,renderPos.y + offsetY + 17);
		ctx.fillStyle = "#FFFFFF";
		ctx.fillText(this.username,renderPos.x + offsetX + 32 / 2,renderPos.y + offsetY + 16);
		ctx.restore();
	}
	ctx.drawImage(this.image.obj,dirId,Math.floor(this.animationStep) * 64,32,64,renderPos.x + offsetX,renderPos.y + offsetY,32,64);
	var map = pokemmo.Game.curGame.map;
	if(map.isTileGrass(this.x,this.y) && !this.walking) ctx.drawImage(pokemmo.Game.res["miscSprites"].obj,0,0,32,32,this.x * map.tilewidth + offsetX,this.y * map.tileheight + offsetY,32,32);
	if(this.inBattle && this.id != pokemmo.Game.myId) {
		ctx.save();
		var ly = 0.0;
		ly = (pokemmo.Renderer.numRTicks + this.randInt) % 31 / 30;
		ly *= 2;
		if(ly > 1) ly = 1 - (ly - 1);
		ly *= ly;
		ly *= 10;
		ctx.translate(renderPos.x + offsetX + 16,renderPos.y + offsetY + 2 + Math.round(ly));
		ctx.rotate((pokemmo.Renderer.numRTicks + this.randInt) % 11 / 10 * Math.PI * 2);
		ctx.drawImage(pokemmo.Game.res["uiCharInBattle"].obj,-10,-10);
		ctx.restore();
	}
	if(pokemmo.Renderer.numRTicks - this.createdTick < 10) ctx.restore();
	$s.pop();
}
pokemmo.CCharacter.prototype.__class__ = pokemmo.CCharacter;
pokemmo.Map = function(id,data) {
	if( id === $_ ) return;
	$s.push("pokemmo.Map::new");
	var $spos = $s.length;
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
		this.layers.push(new pokemmo.Layer(data.layers[i]));
	}
	$s.pop();
}
pokemmo.Map.__name__ = ["pokemmo","Map"];
pokemmo.Map.cur = null;
pokemmo.Map.getCurMap = function() {
	$s.push("pokemmo.Map::getCurMap");
	var $spos = $s.length;
	var $tmp = pokemmo.Game.curGame.map;
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.Map.prototype.id = null;
pokemmo.Map.prototype.game = null;
pokemmo.Map.prototype.properties = null;
pokemmo.Map.prototype.tilesets = null;
pokemmo.Map.prototype.layers = null;
pokemmo.Map.prototype.width = null;
pokemmo.Map.prototype.height = null;
pokemmo.Map.prototype.tilewidth = null;
pokemmo.Map.prototype.tileheight = null;
pokemmo.Map.prototype.cacheMap = null;
pokemmo.Map.prototype.cacheOffsetX = null;
pokemmo.Map.prototype.cacheOffsetY = null;
pokemmo.Map.prototype.render = function(ctx) {
	$s.push("pokemmo.Map::render");
	var $spos = $s.length;
	if(this.cacheMap != this || this.cacheOffsetX != pokemmo.Renderer.getOffsetX() || this.cacheOffsetY != pokemmo.Renderer.getOffsetY()) {
		pokemmo.Main.mapCacheCtx.fillStyle = "#000000";
		pokemmo.Main.mapCacheCtx.fillRect(0,0,pokemmo.Main.mapCacheCanvas.width,pokemmo.Main.mapCacheCanvas.height);
		var _g1 = 0, _g = this.layers.length;
		while(_g1 < _g) {
			var i = _g1++;
			var layer = this.layers[i];
			if(layer.properties.overchars == "1") continue;
			if(layer.properties.animated == "1") continue;
			layer.render(pokemmo.Main.mapCacheCtx,this);
		}
		ctx.drawImage(pokemmo.Main.mapCacheCanvas,0,0);
		this.cacheMap = this;
		this.cacheOffsetX = pokemmo.Renderer.getOffsetX();
		this.cacheOffsetY = pokemmo.Renderer.getOffsetY();
	} else ctx.drawImage(pokemmo.Main.mapCacheCanvas,0,0);
	$s.pop();
}
pokemmo.Map.prototype.renderAnimated = function(ctx) {
	$s.push("pokemmo.Map::renderAnimated");
	var $spos = $s.length;
	var _g1 = 0, _g = this.layers.length;
	while(_g1 < _g) {
		var i = _g1++;
		var layer = this.layers[i];
		if(layer.properties.animated != "1") continue;
		layer.render(ctx,this);
	}
	$s.pop();
}
pokemmo.Map.prototype.renderOver = function(ctx) {
	$s.push("pokemmo.Map::renderOver");
	var $spos = $s.length;
	var _g1 = 0, _g = this.layers.length;
	while(_g1 < _g) {
		var i = _g1++;
		var layer = this.layers[i];
		if(layer.properties.overchars != "1") continue;
		layer.render(ctx,this);
	}
	$s.pop();
}
pokemmo.Map.prototype.isTileSolid = function(x,y) {
	$s.push("pokemmo.Map::isTileSolid");
	var $spos = $s.length;
	var $tmp = this.hasTileProp(x,y,"solid");
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.Map.prototype.isTileWater = function(x,y) {
	$s.push("pokemmo.Map::isTileWater");
	var $spos = $s.length;
	var $tmp = this.hasTileProp(x,y,"water");
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.Map.prototype.isTileGrass = function(x,y) {
	$s.push("pokemmo.Map::isTileGrass");
	var $spos = $s.length;
	var $tmp = this.hasTileProp(x,y,"grass");
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.Map.prototype.isTileLedge = function(x,y) {
	$s.push("pokemmo.Map::isTileLedge");
	var $spos = $s.length;
	var $tmp = this.hasTileProp(x,y,"ledge");
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.Map.prototype.hasTileProp = function(x,y,prop) {
	$s.push("pokemmo.Map::hasTileProp");
	var $spos = $s.length;
	var _g1 = 0, _g = this.layers.length;
	while(_g1 < _g) {
		var i = _g1++;
		var layer = this.layers[i];
		if(layer.type != "tilelayer") continue;
		if(layer.properties.solid == "0") continue;
		var j = y * layer.width + x;
		var tileid = layer.data[j];
		if(tileid == null || tileid == 0) continue;
		var tileset = pokemmo.Tileset.getTilesetOfTile(this,tileid);
		if(tileset == null) throw "Tileset is null";
		if(tileset.tileproperties[tileid - tileset.firstgid][prop] == "1") {
			$s.pop();
			return true;
		}
	}
	$s.pop();
	return false;
	$s.pop();
}
pokemmo.Map.prototype.__class__ = pokemmo.Map;
pokemmo.entities.CStairs = function(name,x,y,direction,fromDir) {
	if( name === $_ ) return;
	$s.push("pokemmo.entities.CStairs::new");
	var $spos = $s.length;
	pokemmo.entities.CWarp.call(this,name,x,y);
	this.direction = direction;
	this.fromDir = fromDir;
	$s.pop();
}
pokemmo.entities.CStairs.__name__ = ["pokemmo","entities","CStairs"];
pokemmo.entities.CStairs.__super__ = pokemmo.entities.CWarp;
for(var k in pokemmo.entities.CWarp.prototype ) pokemmo.entities.CStairs.prototype[k] = pokemmo.entities.CWarp.prototype[k];
pokemmo.entities.CStairs.prototype.fromDir = null;
pokemmo.entities.CStairs.prototype.__class__ = pokemmo.entities.CStairs;
Hash = function(p) {
	if( p === $_ ) return;
	$s.push("Hash::new");
	var $spos = $s.length;
	this.h = {}
	if(this.h.__proto__ != null) {
		this.h.__proto__ = null;
		delete(this.h.__proto__);
	}
	$s.pop();
}
Hash.__name__ = ["Hash"];
Hash.prototype.h = null;
Hash.prototype.set = function(key,value) {
	$s.push("Hash::set");
	var $spos = $s.length;
	this.h["$" + key] = value;
	$s.pop();
}
Hash.prototype.get = function(key) {
	$s.push("Hash::get");
	var $spos = $s.length;
	var $tmp = this.h["$" + key];
	$s.pop();
	return $tmp;
	$s.pop();
}
Hash.prototype.exists = function(key) {
	$s.push("Hash::exists");
	var $spos = $s.length;
	try {
		key = "$" + key;
		var $tmp = this.hasOwnProperty.call(this.h,key);
		$s.pop();
		return $tmp;
	} catch( e ) {
		$e = [];
		while($s.length >= $spos) $e.unshift($s.pop());
		$s.push($e[0]);
		for(var i in this.h) if( i == key ) return true;
		$s.pop();
		return false;
	}
	$s.pop();
}
Hash.prototype.remove = function(key) {
	$s.push("Hash::remove");
	var $spos = $s.length;
	if(!this.exists(key)) {
		$s.pop();
		return false;
	}
	delete(this.h["$" + key]);
	$s.pop();
	return true;
	$s.pop();
}
Hash.prototype.keys = function() {
	$s.push("Hash::keys");
	var $spos = $s.length;
	var a = new Array();
	for(var i in this.h) a.push(i.substr(1));
	var $tmp = a.iterator();
	$s.pop();
	return $tmp;
	$s.pop();
}
Hash.prototype.iterator = function() {
	$s.push("Hash::iterator");
	var $spos = $s.length;
	var $tmp = { ref : this.h, it : this.keys(), hasNext : function() {
		$s.push("Hash::iterator@75");
		var $spos = $s.length;
		var $tmp = this.it.hasNext();
		$s.pop();
		return $tmp;
		$s.pop();
	}, next : function() {
		$s.push("Hash::iterator@76");
		var $spos = $s.length;
		var i = this.it.next();
		var $tmp = this.ref["$" + i];
		$s.pop();
		return $tmp;
		$s.pop();
	}};
	$s.pop();
	return $tmp;
	$s.pop();
}
Hash.prototype.toString = function() {
	$s.push("Hash::toString");
	var $spos = $s.length;
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
	var $tmp = s.b.join("");
	$s.pop();
	return $tmp;
	$s.pop();
}
Hash.prototype.__class__ = Hash;
pokemmo.Game = function(p) {
	if( p === $_ ) return;
	$s.push("pokemmo.Game::new");
	var $spos = $s.length;
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
	$s.pop();
}
pokemmo.Game.__name__ = ["pokemmo","Game"];
pokemmo.Game.state = null;
pokemmo.Game.username = null;
pokemmo.Game.myId = null;
pokemmo.Game.curGame = null;
pokemmo.Game.pokemonParty = null;
pokemmo.Game.loadError = null;
pokemmo.Game.res = null;
pokemmo.Game.pokemonData = null;
pokemmo.Game.loadedBasicUI = null;
pokemmo.Game.setup = function() {
	$s.push("pokemmo.Game::setup");
	var $spos = $s.length;
	pokemmo.Game.loadError = false;
	pokemmo.Game.loadedBasicUI = false;
	pokemmo.Game.state = pokemmo.GameState.ST_UNKNOWN;
	pokemmo.Game.res = ({});
	$s.pop();
}
pokemmo.Game.setPokemonParty = function(arr) {
	$s.push("pokemmo.Game::setPokemonParty");
	var $spos = $s.length;
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
	$s.pop();
}
pokemmo.Game.loadMap = function(id,chars) {
	$s.push("pokemmo.Game::loadMap");
	var $spos = $s.length;
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
		pokemmo.Game.loadJSON("data/pokemon.json",function(data) {
			$s.push("pokemmo.Game::loadMap@88");
			var $spos = $s.length;
			pokemmo.Game.pokemonData = data;
			$s.pop();
		});
	}
	pokemmo.Game.loadJSON("resources/maps/" + id + ".json",function(data) {
		$s.push("pokemmo.Game::loadMap@93");
		var $spos = $s.length;
		var map = new pokemmo.Map(id,data);
		var _g1 = 0, _g = map.tilesets.length;
		while(_g1 < _g) {
			var i = _g1++;
			var tileset = map.tilesets[i];
			if(!tileset.loaded) {
				if(tileset.error) {
					pokemmo.Game.loadError = true;
					throw "loadError";
					$s.pop();
					return;
				} else {
					++pokemmo.Game.pendingLoad;
					tileset.onload = function() {
						$s.push("pokemmo.Game::loadMap@93@104");
						var $spos = $s.length;
						--pokemmo.Game.pendingLoad;
						$s.pop();
					};
					tileset.onerror = function() {
						$s.push("pokemmo.Game::loadMap@93@108");
						var $spos = $s.length;
						--pokemmo.Game.pendingLoad;
						pokemmo.Game.loadError = true;
						throw "loadError";
						$s.pop();
					};
				}
			}
		}
		if(map.properties.preload_pokemon != null) {
			var arr = map.properties.preload_pokemon.split(",");
			var _g1 = 0, _g = arr.length;
			while(_g1 < _g) {
				var i = _g1++;
				pokemmo.Game.curGame.getImage("resources/followers/" + arr[i] + ".png");
				pokemmo.Game.curGame.getImage("resources/sprites/" + arr[i] + ".png");
			}
		}
		pokemmo.Game.curGame.loaded = true;
		pokemmo.Game.curGame.map = map;
		pokemmo.Game.curGame.parseMapObjects();
		var arr = chars;
		var _g1 = 0, _g = arr.length;
		while(_g1 < _g) {
			var i = _g1++;
			var chr = new pokemmo.CCharacter(arr[i]);
			if(chr.id == pokemmo.Game.myId) chr.freezeTicks = 10;
		}
		$s.pop();
	});
	$s.pop();
}
pokemmo.Game.loadImageResource = function(id,src) {
	$s.push("pokemmo.Game::loadImageResource");
	var $spos = $s.length;
	++pokemmo.Game.pendingLoad;
	var $tmp = pokemmo.Game.res[id] = new pokemmo.ImageResource(src,function() {
		$s.push("pokemmo.Game::loadImageResource@140");
		var $spos = $s.length;
		--pokemmo.Game.pendingLoad;
		$s.pop();
	},function() {
		$s.push("pokemmo.Game::loadImageResource@142");
		var $spos = $s.length;
		--pokemmo.Game.pendingLoad;
		pokemmo.Game.loadError = true;
		throw "loadError";
		$s.pop();
	});
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.Game.loadJSON = function(src,onload) {
	$s.push("pokemmo.Game::loadJSON");
	var $spos = $s.length;
	++pokemmo.Game.pendingLoad;
	var obj = ({});
	obj.cache = true;
	obj.dataType = "text";
	obj.success = function(data,textStatus,jqXHR) {
		$s.push("pokemmo.Game::loadJSON@154");
		var $spos = $s.length;
		--pokemmo.Game.pendingLoad;
		onload(JSON.parse(data));
		$s.pop();
	};
	obj.error = function(jqXHR,textStatus,errorThrown) {
		$s.push("pokemmo.Game::loadJSON@158");
		var $spos = $s.length;
		--pokemmo.Game.pendingLoad;
		pokemmo.Game.loadError = true;
		throw "loadError";
		$s.pop();
	};
	pokemmo.Main.jq.ajax(src,obj);
	$s.pop();
}
pokemmo.Game.getRes = function(id) {
	$s.push("pokemmo.Game::getRes");
	var $spos = $s.length;
	var $tmp = pokemmo.Game.res[id];
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.Game.setRes = function(id,v) {
	$s.push("pokemmo.Game::setRes");
	var $spos = $s.length;
	pokemmo.Game.res[id] = v;
	$s.pop();
}
pokemmo.Game.getPokemonData = function(id) {
	$s.push("pokemmo.Game::getPokemonData");
	var $spos = $s.length;
	var $tmp = pokemmo.Game.pokemonData[id];
	$s.pop();
	return $tmp;
	$s.pop();
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
pokemmo.Game.prototype.initBattle = function(type) {
	$s.push("pokemmo.Game::initBattle");
	var $spos = $s.length;
	this.inBattle = true;
	this.battle = new pokemmo.Battle(type);
	var $tmp = this.battle;
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.Game.prototype.tick = function() {
	$s.push("pokemmo.Game::tick");
	var $spos = $s.length;
	if(pokemmo.Game.state != pokemmo.GameState.ST_MAP) {
		$s.pop();
		return;
	}
	var arr = this.gameObjects.copy();
	var _g1 = 0, _g = arr.length;
	while(_g1 < _g) {
		var i = _g1++;
		arr[i].tick();
	}
	$s.pop();
}
pokemmo.Game.prototype.renderObjects = function(ctx) {
	$s.push("pokemmo.Game::renderObjects");
	var $spos = $s.length;
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
		$s.push("pokemmo.Game::renderObjects@243");
		var $spos = $s.length;
		if(Std["is"](a,pokemmo.CCharacter) && a.id == pokemmo.Game.myId) {
			if(Std["is"](b,pokemmo.entities.CGrassAnimation)) {
				$s.pop();
				return A_FIRST;
			}
			$s.pop();
			return B_FIRST;
		}
		if(Std["is"](b,pokemmo.CCharacter) && b.id == pokemmo.Game.myId) {
			if(Std["is"](a,pokemmo.entities.CGrassAnimation)) {
				$s.pop();
				return B_FIRST;
			}
			$s.pop();
			return A_FIRST;
		}
		if(Std["is"](a,pokemmo.CCharacter) && Std["is"](b,pokemmo.entities.CFollower)) {
			$s.pop();
			return B_FIRST;
		}
		if(Std["is"](b,pokemmo.CCharacter) && Std["is"](a,pokemmo.entities.CFollower)) {
			$s.pop();
			return A_FIRST;
		}
		if(a.y < b.y) {
			$s.pop();
			return A_FIRST;
		}
		if(a.y > b.y) {
			$s.pop();
			return B_FIRST;
		}
		if(a.y == b.y) {
			if(a.renderPriority > b.renderPriority) {
				$s.pop();
				return A_FIRST;
			}
			if(b.renderPriority > a.renderPriority) {
				$s.pop();
				return B_FIRST;
			}
			if(Std["is"](a,pokemmo.entities.CGrassAnimation)) {
				$s.pop();
				return B_FIRST;
			}
			if(Std["is"](b,pokemmo.entities.CGrassAnimation)) {
				$s.pop();
				return A_FIRST;
			}
			if(Std["is"](a,pokemmo.CCharacter) && Std["is"](b,pokemmo.entities.CFollower)) {
				$s.pop();
				return B_FIRST;
			} else if(Std["is"](b,pokemmo.CCharacter) && Std["is"](a,pokemmo.entities.CFollower)) {
				$s.pop();
				return A_FIRST;
			}
			if(a.randInt > b.randInt) {
				$s.pop();
				return B_FIRST;
			}
			if(a.randInt < b.randInt) {
				$s.pop();
				return A_FIRST;
			}
			$s.pop();
			return 0;
		}
		$s.pop();
		return 0;
		$s.pop();
	});
	var _g1 = 0, _g = arr.length;
	while(_g1 < _g) {
		var i = _g1++;
		arr[i].render(ctx);
	}
	$s.pop();
}
pokemmo.Game.prototype.getPlayerChar = function() {
	$s.push("pokemmo.Game::getPlayerChar");
	var $spos = $s.length;
	var $tmp = this.getCharById(pokemmo.Game.myId);
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.Game.prototype.getCharById = function(id) {
	$s.push("pokemmo.Game::getCharById");
	var $spos = $s.length;
	var _g1 = 0, _g = this.characters.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(this.characters[i].id == id) {
			var $tmp = this.characters[i];
			$s.pop();
			return $tmp;
		}
	}
	$s.pop();
	return null;
	$s.pop();
}
pokemmo.Game.prototype.getCharByUsername = function(username) {
	$s.push("pokemmo.Game::getCharByUsername");
	var $spos = $s.length;
	var _g1 = 0, _g = this.characters.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(this.characters[i].username == username) {
			var $tmp = this.characters[i];
			$s.pop();
			return $tmp;
		}
	}
	$s.pop();
	return null;
	$s.pop();
}
pokemmo.Game.prototype.getImage = function(src,onload,onerror) {
	$s.push("pokemmo.Game::getImage");
	var $spos = $s.length;
	var res;
	if(this.cachedImages.exists(src)) {
		res = this.cachedImages.get(src);
		res.addLoadHook(onload);
		res.addErrorHook(onerror);
		$s.pop();
		return res;
	}
	res = new pokemmo.ImageResource(src,onload,onerror);
	this.cachedImages.set(src,res);
	$s.pop();
	return res;
	$s.pop();
}
pokemmo.Game.prototype.parseMapObjects = function() {
	$s.push("pokemmo.Game::parseMapObjects");
	var $spos = $s.length;
	var _g1 = 0, _g = this.map.layers.length;
	while(_g1 < _g) {
		var i = _g1++;
		if(this.map.layers[i].type != "objectgroup") continue;
		var objects = this.map.layers[i].objects;
		var _g3 = 0, _g2 = objects.length;
		while(_g3 < _g2) {
			var k = _g3++;
			var obj = objects[k];
			switch(obj.type) {
			case "warp":
				if(obj.properties.type == "door") new pokemmo.entities.CDoor(obj.name,Math.floor(obj.x / this.map.tilewidth),Math.floor(obj.y / this.map.tileheight)); else if(obj.properties.type == "arrow") new pokemmo.entities.CWarpArrow(obj.name,Math.floor(obj.x / this.map.tilewidth),Math.floor(obj.y / this.map.tileheight)); else if(obj.properties.type == "stairs_up") new pokemmo.entities.CStairs(obj.name,Math.floor(obj.x / this.map.tilewidth),Math.floor(obj.y / this.map.tileheight),2,Std.parseInt(obj.properties.from_dir)); else if(obj.properties.type == "stairs_down") new pokemmo.entities.CStairs(obj.name,Math.floor(obj.x / this.map.tilewidth),Math.floor(obj.y / this.map.tileheight),0,Std.parseInt(obj.properties.from_dir));
				break;
			}
		}
	}
	$s.pop();
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
	$s.push("Std::is");
	var $spos = $s.length;
	var $tmp = js.Boot.__instanceof(v,t);
	$s.pop();
	return $tmp;
	$s.pop();
}
Std.string = function(s) {
	$s.push("Std::string");
	var $spos = $s.length;
	var $tmp = js.Boot.__string_rec(s,"");
	$s.pop();
	return $tmp;
	$s.pop();
}
Std["int"] = function(x) {
	$s.push("Std::int");
	var $spos = $s.length;
	if(x < 0) {
		var $tmp = Math.ceil(x);
		$s.pop();
		return $tmp;
	}
	var $tmp = Math.floor(x);
	$s.pop();
	return $tmp;
	$s.pop();
}
Std.parseInt = function(x) {
	$s.push("Std::parseInt");
	var $spos = $s.length;
	var v = parseInt(x,10);
	if(v == 0 && x.charCodeAt(1) == 120) v = parseInt(x);
	if(isNaN(v)) {
		$s.pop();
		return null;
	}
	var $tmp = v;
	$s.pop();
	return $tmp;
	$s.pop();
}
Std.parseFloat = function(x) {
	$s.push("Std::parseFloat");
	var $spos = $s.length;
	var $tmp = parseFloat(x);
	$s.pop();
	return $tmp;
	$s.pop();
}
Std.random = function(x) {
	$s.push("Std::random");
	var $spos = $s.length;
	var $tmp = Math.floor(Math.random() * x);
	$s.pop();
	return $tmp;
	$s.pop();
}
Std.prototype.__class__ = Std;
pokemmo.Move = function(p) {
	$s.push("pokemmo.Move::new");
	var $spos = $s.length;
	$s.pop();
}
pokemmo.Move.__name__ = ["pokemmo","Move"];
pokemmo.Move.list = null;
pokemmo.Move.createList = function() {
	$s.push("pokemmo.Move::createList");
	var $spos = $s.length;
	pokemmo.Move.list = new Hash();
	pokemmo.Move.list.set("def",new pokemmo.moves.MDefault());
	$s.pop();
}
pokemmo.Move.getMove = function(n) {
	$s.push("pokemmo.Move::getMove");
	var $spos = $s.length;
	if(pokemmo.Move.list == null) pokemmo.Move.createList();
	if(!pokemmo.Move.list.exists(n)) {
		var $tmp = pokemmo.Move.list.get("def");
		$s.pop();
		return $tmp;
	}
	var $tmp = pokemmo.Move.list.get(n);
	$s.pop();
	return $tmp;
	$s.pop();
}
pokemmo.Move.prototype.start = function() {
	$s.push("pokemmo.Move::start");
	var $spos = $s.length;
	$s.pop();
}
pokemmo.Move.prototype.render = function(ctx,battle) {
	$s.push("pokemmo.Move::render");
	var $spos = $s.length;
	$s.pop();
}
pokemmo.Move.prototype.__class__ = pokemmo.Move;
EReg = function(r,opt) {
	if( r === $_ ) return;
	$s.push("EReg::new");
	var $spos = $s.length;
	opt = opt.split("u").join("");
	this.r = new RegExp(r,opt);
	$s.pop();
}
EReg.__name__ = ["EReg"];
EReg.prototype.r = null;
EReg.prototype.match = function(s) {
	$s.push("EReg::match");
	var $spos = $s.length;
	this.r.m = this.r.exec(s);
	this.r.s = s;
	this.r.l = RegExp.leftContext;
	this.r.r = RegExp.rightContext;
	var $tmp = this.r.m != null;
	$s.pop();
	return $tmp;
	$s.pop();
}
EReg.prototype.matched = function(n) {
	$s.push("EReg::matched");
	var $spos = $s.length;
	var $tmp = this.r.m != null && n >= 0 && n < this.r.m.length?this.r.m[n]:(function($this) {
		var $r;
		throw "EReg::matched";
		return $r;
	}(this));
	$s.pop();
	return $tmp;
	$s.pop();
}
EReg.prototype.matchedLeft = function() {
	$s.push("EReg::matchedLeft");
	var $spos = $s.length;
	if(this.r.m == null) throw "No string matched";
	if(this.r.l == null) {
		var $tmp = this.r.s.substr(0,this.r.m.index);
		$s.pop();
		return $tmp;
	}
	var $tmp = this.r.l;
	$s.pop();
	return $tmp;
	$s.pop();
}
EReg.prototype.matchedRight = function() {
	$s.push("EReg::matchedRight");
	var $spos = $s.length;
	if(this.r.m == null) throw "No string matched";
	if(this.r.r == null) {
		var sz = this.r.m.index + this.r.m[0].length;
		var $tmp = this.r.s.substr(sz,this.r.s.length - sz);
		$s.pop();
		return $tmp;
	}
	var $tmp = this.r.r;
	$s.pop();
	return $tmp;
	$s.pop();
}
EReg.prototype.matchedPos = function() {
	$s.push("EReg::matchedPos");
	var $spos = $s.length;
	if(this.r.m == null) throw "No string matched";
	var $tmp = { pos : this.r.m.index, len : this.r.m[0].length};
	$s.pop();
	return $tmp;
	$s.pop();
}
EReg.prototype.split = function(s) {
	$s.push("EReg::split");
	var $spos = $s.length;
	var d = "#__delim__#";
	var $tmp = s.replace(this.r,d).split(d);
	$s.pop();
	return $tmp;
	$s.pop();
}
EReg.prototype.replace = function(s,by) {
	$s.push("EReg::replace");
	var $spos = $s.length;
	var $tmp = s.replace(this.r,by);
	$s.pop();
	return $tmp;
	$s.pop();
}
EReg.prototype.customReplace = function(s,f) {
	$s.push("EReg::customReplace");
	var $spos = $s.length;
	var buf = new StringBuf();
	while(true) {
		if(!this.match(s)) break;
		buf.add(this.matchedLeft());
		buf.add(f(this));
		s = this.matchedRight();
	}
	buf.b[buf.b.length] = s == null?"null":s;
	var $tmp = buf.b.join("");
	$s.pop();
	return $tmp;
	$s.pop();
}
EReg.prototype.__class__ = EReg;
if(!pokemmo.moves) pokemmo.moves = {}
pokemmo.moves.MDefault = function(p) {
	if( p === $_ ) return;
	$s.push("pokemmo.moves.MDefault::new");
	var $spos = $s.length;
	pokemmo.Move.call(this);
	$s.pop();
}
pokemmo.moves.MDefault.__name__ = ["pokemmo","moves","MDefault"];
pokemmo.moves.MDefault.__super__ = pokemmo.Move;
for(var k in pokemmo.Move.prototype ) pokemmo.moves.MDefault.prototype[k] = pokemmo.Move.prototype[k];
pokemmo.moves.MDefault.prototype.render = function(ctx,battle) {
	$s.push("pokemmo.moves.MDefault::render");
	var $spos = $s.length;
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
	$s.pop();
}
pokemmo.moves.MDefault.prototype.__class__ = pokemmo.moves.MDefault;
pokemmo.entities.CDoor = function(name,x,y) {
	if( name === $_ ) return;
	$s.push("pokemmo.entities.CDoor::new");
	var $spos = $s.length;
	pokemmo.entities.CWarp.call(this,name,x,y);
	this.renderPriority = 100;
	this.openStep = 0;
	$s.pop();
}
pokemmo.entities.CDoor.__name__ = ["pokemmo","entities","CDoor"];
pokemmo.entities.CDoor.__super__ = pokemmo.entities.CWarp;
for(var k in pokemmo.entities.CWarp.prototype ) pokemmo.entities.CDoor.prototype[k] = pokemmo.entities.CWarp.prototype[k];
pokemmo.entities.CDoor.prototype.openStep = null;
pokemmo.entities.CDoor.prototype.open = function() {
	$s.push("pokemmo.entities.CDoor::open");
	var $spos = $s.length;
	this.openStep = 1;
	$s.pop();
}
pokemmo.entities.CDoor.prototype.render = function(ctx) {
	$s.push("pokemmo.entities.CDoor::render");
	var $spos = $s.length;
	if(this.disable) this.openStep = 0;
	if(this.openStep > 30) this.openStep = 0;
	var curMap = pokemmo.Map.getCurMap();
	ctx.drawImage(pokemmo.Game.res["miscSprites"].obj,64,32 * Math.min(Math.floor(this.openStep / 4),3),32,32,this.x * curMap.tilewidth + pokemmo.Renderer.getOffsetX(),this.y * curMap.tileheight + pokemmo.Renderer.getOffsetY(),32,32);
	if(this.openStep > 0) ++this.openStep;
	$s.pop();
}
pokemmo.entities.CDoor.prototype.__class__ = pokemmo.entities.CDoor;
pokemmo.Tileset = function(data) {
	if( data === $_ ) return;
	$s.push("pokemmo.Tileset::new");
	var $spos = $s.length;
	var me = this;
	this.loaded = false;
	this.error = false;
	this.tileproperties = [];
	this.imagewidth = data.imagewidth;
	this.imageheight = data.imageheight;
	this.tilewidth = data.tilewidth;
	this.tileheight = data.tileheight;
	this.firstgid = data.firstgid;
	this.image = new Image();
	this.image.onload = function() {
		$s.push("pokemmo.Tileset::new@35");
		var $spos = $s.length;
		if(me.onload != null) me.onload();
		$s.pop();
	};
	this.image.onerror = function() {
		$s.push("pokemmo.Tileset::new@39");
		var $spos = $s.length;
		if(me.onerror != null) me.onerror();
		$s.pop();
	};
	this.image.src = "resources/" + data.image.slice(3);
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
	$s.pop();
}
pokemmo.Tileset.__name__ = ["pokemmo","Tileset"];
pokemmo.Tileset.getTilesetOfTile = function(map,n) {
	$s.push("pokemmo.Tileset::getTilesetOfTile");
	var $spos = $s.length;
	var tilesets = map.tilesets;
	var i = tilesets.length;
	var f = null;
	while(i-- > 0) if(n >= tilesets[i].firstgid) {
		f = tilesets[i];
		break;
	}
	$s.pop();
	return f;
	$s.pop();
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
pokemmo.Connection = function() { }
pokemmo.Connection.__name__ = ["pokemmo","Connection"];
pokemmo.Connection.socket = null;
pokemmo.Connection.setup = function() {
	$s.push("pokemmo.Connection::setup");
	var $spos = $s.length;
	pokemmo.Connection.socket = io.connect("http://localhost:2828");
	pokemmo.Connection.socket.on("connect",function(data) {
		$s.push("pokemmo.Connection::setup@33");
		var $spos = $s.length;
		pokemmo.Main.log("Connected");
		$s.pop();
	});
	pokemmo.Connection.socket.on("disconnect",function(data) {
		$s.push("pokemmo.Connection::setup@37");
		var $spos = $s.length;
		pokemmo.Game.state = pokemmo.GameState.ST_DISCONNECTED;
		pokemmo.Game.curGame = null;
		$s.pop();
	});
	pokemmo.Connection.socket.on("setInfo",function(data) {
		$s.push("pokemmo.Connection::setup@42");
		var $spos = $s.length;
		pokemmo.Main.log("setInfo: " + data.id);
		pokemmo.Game.myId = data.id;
		pokemmo.Game.setPokemonParty(data.pokemon);
		$s.pop();
	});
	pokemmo.Connection.socket.on("loadMap",function(data) {
		$s.push("pokemmo.Connection::setup@48");
		var $spos = $s.length;
		if(pokemmo.Game.curGame != null && pokemmo.Game.curGame.queueLoadMap) {
			pokemmo.Game.curGame.queuedMap = data.mapid;
			pokemmo.Game.curGame.queuedChars = data.chars;
			$s.pop();
			return;
		}
		pokemmo.Game.loadMap(data.mapid,data.chars);
		$s.pop();
	});
	pokemmo.Connection.socket.on("invalidMove",function(data) {
		$s.push("pokemmo.Connection::setup@57");
		var $spos = $s.length;
		pokemmo.Connection.lastAckMove = data.ack;
		var chr = pokemmo.Game.curGame.getPlayerChar();
		chr.x = data.x;
		chr.y = data.y;
		chr.walking = false;
		chr.tick();
		pokemmo.Main.log("Invalid move!");
		$s.pop();
	});
	pokemmo.Connection.socket.on("update",function(data) {
		$s.push("pokemmo.Connection::setup@69");
		var $spos = $s.length;
		if(Std["is"](data,String)) data = JSON.parse(data);
		if(pokemmo.Game == null) {
			$s.pop();
			return;
		}
		if(!pokemmo.Game.curGame.loaded) {
			$s.pop();
			return;
		}
		if(data.map != pokemmo.Game.curGame.map.id) {
			$s.pop();
			return;
		}
		if(data.chars == null) data.chars = [];
		if(data.messages == null) data.messages = [];
		if(data.cremoved == null) data.cremoved = [];
		if(data.warpsUsed == null) data.warpsUsed = [];
		var cremoved = data.cremoved;
		var _g1 = 0, _g = data.warpsUsed.length;
		while(_g1 < _g) {
			var i = [_g1++];
			var warp = data.warpsUsed[i[0]];
			cremoved.remove(warp.id);
			if(warp.id == pokemmo.Game.myId) continue;
			((function(i) {
				$s.push("pokemmo.Connection::setup@69@103");
				var $spos = $s.length;
				var $tmp = function(warp1) {
					$s.push("pokemmo.Connection::setup@69@103@103");
					var $spos = $s.length;
					var chr = pokemmo.Game.curGame.getCharById(warp1.id);
					var tmpWarp = pokemmo.entities.CWarp.getWarpByName(data.warpsUsed[i[0]].warpName);
					chr.canUpdate = false;
					var animation = (function() {
						$s.push("pokemmo.Connection::setup@69@103@103@110");
						var $spos = $s.length;
						var $tmp = function() {
							$s.push("pokemmo.Connection::setup@69@103@103@110@110");
							var $spos = $s.length;
							chr.direction = warp1.direction;
							if(Std["is"](tmpWarp,pokemmo.entities.CDoor)) chr.enterDoor(tmpWarp); else if(Std["is"](tmpWarp,pokemmo.entities.CWarpArrow)) chr.enterWarpArrow(tmpWarp); else if(Std["is"](tmpWarp,pokemmo.entities.CStairs)) chr.enterStairs(tmpWarp);
							$s.pop();
						};
						$s.pop();
						return $tmp;
						$s.pop();
					})();
					if(chr.x != data.warpsUsed[i[0]].x || chr.y != data.warpsUsed[i[0]].y || chr.walking) {
						chr.targetX = warp1.x;
						chr.targetY = warp1.y;
						chr.onTarget = animation;
					} else animation();
					$s.pop();
				};
				$s.pop();
				return $tmp;
				$s.pop();
			})(i))(warp);
		}
		var chars = data.chars;
		var _g1 = 0, _g = chars.length;
		while(_g1 < _g) {
			var i = _g1++;
			var charData = chars[i];
			var chr = pokemmo.Game.curGame.getCharById(charData.id);
			if(chr != null) chr.follower = charData.follower;
			if(charData.id == pokemmo.Game.myId) {
				var src = "resources/chars_sprites/" + charData.type + ".png";
				if(pokemmo.Game.res["playerBacksprite"] == null || pokemmo.Game.res["playerBacksprite"].obj.src != src) pokemmo.Game.res["playerBacksprite"] = new pokemmo.ImageResource("resources/chars_sprites/" + charData.type + ".png");
				continue;
			}
			if(chr != null) {
				if(!chr.canUpdate) continue;
				chr.inBattle = charData.inBattle;
				chr.battleEnemy = charData.battleEnemy;
				chr.targetX = charData.x;
				chr.targetY = charData.y;
				chr.targetDirection = charData.direction;
				chr.lastX = charData.lastX;
				chr.lastY = charData.lastY;
				if(chr.x == charData.x && chr.y == charData.y) chr.direction = charData.direction; else if(Math.abs(chr.x - charData.x) <= 1 && Math.abs(chr.y - charData.y) <= 1 || chr.x - 2 == charData.x && chr.y == charData.y || chr.x + 2 == charData.x && chr.y == charData.y || chr.x == charData.x && chr.y - 2 == charData.y || chr.x == charData.x && chr.y + 2 == charData.y) {
				} else {
					chr.direction = charData.direction;
					chr.x = charData.x;
					chr.y = charData.y;
				}
			} else chr = new pokemmo.CCharacter(charData);
		}
		var _g1 = 0, _g = cremoved.length;
		while(_g1 < _g) {
			var i = _g1++;
			var chr = pokemmo.Game.curGame.getCharById(cremoved[i]);
			if(chr != null) chr.destroy();
		}
		var _g1 = 0, _g = data.messages.length;
		while(_g1 < _g) {
			var i = _g1++;
			var m = data.messages[i];
			m.timestamp = Date.now().getTime();
			pokemmo.Chat.pushMessage(m);
		}
		$s.pop();
	});
	pokemmo.Connection.socket.on("battleWild",function(data) {
		$s.push("pokemmo.Connection::setup@197");
		var $spos = $s.length;
		var battle = pokemmo.Game.curGame.initBattle(0);
		battle.x = data.x;
		battle.y = data.y;
		battle.background = pokemmo.Game.curGame.getImage("resources/ui/battle_background1.png");
		var enemy = data.battle.enemy;
		battle.enemyPokemon = enemy;
		battle.enemyPokemon.sprite = pokemmo.Game.curGame.getImage("resources/sprites" + (battle.enemyPokemon.shiny?"_shiny":"") + "/" + battle.enemyPokemon.id + ".png");
		battle.curPokemon = data.battle.curPokemon;
		battle.curPokemon.backsprite = pokemmo.Game.curGame.getImage("resources/back" + (battle.curPokemon.shiny?"_shiny":"") + "/" + battle.curPokemon.id + ".png");
		var chr = pokemmo.Game.curGame.getPlayerChar();
		if(chr != null) {
			chr.inBattle = true;
			chr.battleEnemy = battle.enemyPokemon.id;
		}
		pokemmo.Renderer.startTransition(new pokemmo.transitions.BattleTransition001()).step = -1;
		$s.pop();
	});
	pokemmo.Connection.socket.on("battleTurn",function(data) {
		$s.push("pokemmo.Connection::setup@229");
		var $spos = $s.length;
		pokemmo.Game.curGame.battle.resultQueue = pokemmo.Game.curGame.battle.resultQueue.concat(data.results);
		pokemmo.Game.curGame.battle.runQueue();
		$s.pop();
	});
	pokemmo.Connection.socket.on("loginFail",function(data) {
		$s.push("pokemmo.Connection::setup@234");
		var $spos = $s.length;
		pokemmo.TitleScreen.loginFailed();
		$s.pop();
	});
	pokemmo.Connection.socket.on("newGame",function(data) {
		$s.push("pokemmo.Connection::setup@238");
		var $spos = $s.length;
		pokemmo.Game.username = data.username;
		pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeOut(10)).onComplete = function() {
			$s.push("pokemmo.Connection::setup@238@244");
			var $spos = $s.length;
			pokemmo.TitleScreen.destroy();
			pokemmo.Game.state = pokemmo.GameState.ST_NEWGAME;
			pokemmo.NewGameScreen.init(data.starters,data.characters);
			$s.pop();
		};
		$s.pop();
	});
	pokemmo.Connection.socket.on("startGame",function(data) {
		$s.push("pokemmo.Connection::setup@251");
		var $spos = $s.length;
		pokemmo.Game.username = data.username;
		pokemmo.Renderer.startTransition(new pokemmo.transitions.FadeOut(10)).onComplete = function() {
			$s.push("pokemmo.Connection::setup@251@256");
			var $spos = $s.length;
			pokemmo.TitleScreen.destroy();
			pokemmo.Connection.socket.emit("startGame",{ });
			$s.pop();
		};
		$s.pop();
	});
	$s.pop();
}
pokemmo.Connection.prototype.__class__ = pokemmo.Connection;
pokemmo.ImageResource = function(src,onload,onerror) {
	if( src === $_ ) return;
	$s.push("pokemmo.ImageResource::new");
	var $spos = $s.length;
	this.loaded = false;
	this.error = false;
	this.loadHooks = [];
	this.errorHooks = [];
	if(onload != null) this.loadHooks.push(onload);
	if(onerror != null) this.errorHooks.push(onerror);
	this.obj = new Image();
	this.obj.onload = $closure(this,"onLoad");
	this.obj.src = src;
	$s.pop();
}
pokemmo.ImageResource.__name__ = ["pokemmo","ImageResource"];
pokemmo.ImageResource.prototype.obj = null;
pokemmo.ImageResource.prototype.loaded = null;
pokemmo.ImageResource.prototype.error = null;
pokemmo.ImageResource.prototype.loadHooks = null;
pokemmo.ImageResource.prototype.errorHooks = null;
pokemmo.ImageResource.prototype.addLoadHook = function(func) {
	$s.push("pokemmo.ImageResource::addLoadHook");
	var $spos = $s.length;
	if(func == null) {
		$s.pop();
		return;
	}
	if(this.loaded) setTimeout(func,0); else this.loadHooks.push(func);
	$s.pop();
}
pokemmo.ImageResource.prototype.addErrorHook = function(func) {
	$s.push("pokemmo.ImageResource::addErrorHook");
	var $spos = $s.length;
	if(func == null) {
		$s.pop();
		return;
	}
	if(this.error) setTimeout(func,0); else this.errorHooks.push(func);
	$s.pop();
}
pokemmo.ImageResource.prototype.onLoad = function() {
	$s.push("pokemmo.ImageResource::onLoad");
	var $spos = $s.length;
	this.loaded = true;
	var _g1 = 0, _g = this.loadHooks.length;
	while(_g1 < _g) {
		var i = _g1++;
		this.loadHooks[i]();
	}
	this.loadHooks = null;
	$s.pop();
}
pokemmo.ImageResource.prototype.onError = function() {
	$s.push("pokemmo.ImageResource::onError");
	var $spos = $s.length;
	this.error = true;
	var _g1 = 0, _g = this.errorHooks.length;
	while(_g1 < _g) {
		var i = _g1++;
		this.errorHooks[i]();
	}
	this.errorHooks = null;
	$s.pop();
}
pokemmo.ImageResource.prototype.__class__ = pokemmo.ImageResource;
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
	$s.push("pokemmo.Main::main");
	var $spos = $s.length;
	Array.prototype.remove = function(e){
			var i = 0;
			var arr = this;
			
			if((i = arr.indexOf(e, i)) != -1){
				arr.splice(i, 1);
				return true;
			}
			return false;
		};;
	pokemmo.Main.isPhone = new EReg("(iPhone|iPod)","i").match(js.Lib.window.navigator.userAgent);
	pokemmo.Main.screenWidth = pokemmo.Main.isPhone?480:800;
	pokemmo.Main.screenHeight = pokemmo.Main.isPhone?320:600;
	js.Lib.window.initGame = pokemmo.Main.initGame;
	$s.pop();
}
pokemmo.Main.tick = function() {
	$s.push("pokemmo.Main::tick");
	var $spos = $s.length;
	pokemmo.UI.tick();
	if(pokemmo.Game.state == pokemmo.GameState.ST_MAP) {
		if(pokemmo.Game.curGame != null) pokemmo.Game.curGame.tick();
	}
	pokemmo.Renderer.render();
	$s.pop();
}
pokemmo.Main.log = function(obj) {
	$s.push("pokemmo.Main::log");
	var $spos = $s.length;
	console.log(obj);
	$s.pop();
}
pokemmo.Main.initGame = function(canvas_,container_) {
	$s.push("pokemmo.Main::initGame");
	var $spos = $s.length;
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
		$s.push("pokemmo.Main::initGame@88");
		var $spos = $s.length;
		var offset = pokemmo.Main.jq(pokemmo.Main.onScreenCanvas).offset();
		pokemmo.UI.mouseX = e.pageX - offset.left;
		pokemmo.UI.mouseY = e.pageY - offset.top;
		$s.pop();
	});
	pokemmo.Main.jq(window).resize(function() {
		$s.push("pokemmo.Main::initGame@94");
		var $spos = $s.length;
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
		$s.pop();
	}).resize();
	pokemmo.Main.jq(window).bind("orientationchange",function() {
		$s.push("pokemmo.Main::initGame@117");
		var $spos = $s.length;
		window.scrollTo(0,0);
		$s.pop();
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
	$s.pop();
}
pokemmo.Main.setTimeout = function(func,delay) {
	$s.push("pokemmo.Main::setTimeout");
	var $spos = $s.length;
	setTimeout(func,delay);
	$s.pop();
}
pokemmo.Main.setInterval = function(func,delay) {
	$s.push("pokemmo.Main::setInterval");
	var $spos = $s.length;
	setInterval(func,delay);
	$s.pop();
}
pokemmo.Main.clearTmpCanvas = function() {
	$s.push("pokemmo.Main::clearTmpCanvas");
	var $spos = $s.length;
	pokemmo.Main.tmpCtx.clearRect(0,0,pokemmo.Main.tmpCanvas.width,pokemmo.Main.tmpCanvas.height);
	$s.pop();
}
pokemmo.Main.prototype.__class__ = pokemmo.Main;
pokemmo.entities.CWarpArrow = function(name,x,y) {
	if( name === $_ ) return;
	$s.push("pokemmo.entities.CWarpArrow::new");
	var $spos = $s.length;
	pokemmo.entities.CWarp.call(this,name,x,y);
	$s.pop();
}
pokemmo.entities.CWarpArrow.__name__ = ["pokemmo","entities","CWarpArrow"];
pokemmo.entities.CWarpArrow.__super__ = pokemmo.entities.CWarp;
for(var k in pokemmo.entities.CWarp.prototype ) pokemmo.entities.CWarpArrow.prototype[k] = pokemmo.entities.CWarp.prototype[k];
pokemmo.entities.CWarpArrow.prototype.render = function(ctx) {
	$s.push("pokemmo.entities.CWarpArrow::render");
	var $spos = $s.length;
	if(this.disable) {
		$s.pop();
		return;
	}
	var chr = pokemmo.Game.curGame.getPlayerChar();
	if(chr == null) {
		$s.pop();
		return;
	}
	if(Math.abs(chr.x - this.x) + Math.abs(chr.y - this.y) > 1) {
		$s.pop();
		return;
	}
	var dir;
	if(chr.x < this.x) dir = 3; else if(chr.x > this.x) dir = 1; else if(chr.y < this.y) dir = 0; else dir = 2;
	if(dir != chr.direction) {
		$s.pop();
		return;
	}
	var curMap = pokemmo.Map.getCurMap();
	ctx.save();
	ctx.translate(this.x * curMap.tilewidth + pokemmo.Renderer.getOffsetX() + 16,this.y * curMap.tileheight + pokemmo.Renderer.getOffsetY() + 16);
	ctx.rotate(Math.PI / 2 * dir);
	if(pokemmo.Renderer.numRTicks % 30 < 15) ctx.translate(0,4);
	ctx.drawImage(pokemmo.Game.res["miscSprites"].obj,0,32,32,32,-16,-16,32,32);
	ctx.restore();
	$s.pop();
}
pokemmo.entities.CWarpArrow.prototype.__class__ = pokemmo.entities.CWarpArrow;
js.Lib = function() { }
js.Lib.__name__ = ["js","Lib"];
js.Lib.isIE = null;
js.Lib.isOpera = null;
js.Lib.document = null;
js.Lib.window = null;
js.Lib.alert = function(v) {
	$s.push("js.Lib::alert");
	var $spos = $s.length;
	alert(js.Boot.__string_rec(v,""));
	$s.pop();
}
js.Lib.eval = function(code) {
	$s.push("js.Lib::eval");
	var $spos = $s.length;
	var $tmp = eval(code);
	$s.pop();
	return $tmp;
	$s.pop();
}
js.Lib.setErrorHandler = function(f) {
	$s.push("js.Lib::setErrorHandler");
	var $spos = $s.length;
	js.Lib.onerror = f;
	$s.pop();
}
js.Lib.prototype.__class__ = js.Lib;
pokemmo.entities.CFollower = function(chr) {
	if( chr === $_ ) return;
	$s.push("pokemmo.entities.CFollower::new");
	var $spos = $s.length;
	pokemmo.entities.CPokemon.call(this,chr.follower,chr.lastX,chr.lastY);
	this.chr = chr;
	this.forceTarget = false;
	this.createdTick = pokemmo.Renderer.numRTicks;
	$s.pop();
}
pokemmo.entities.CFollower.__name__ = ["pokemmo","entities","CFollower"];
pokemmo.entities.CFollower.__super__ = pokemmo.entities.CPokemon;
for(var k in pokemmo.entities.CPokemon.prototype ) pokemmo.entities.CFollower.prototype[k] = pokemmo.entities.CPokemon.prototype[k];
pokemmo.entities.CFollower.prototype.chr = null;
pokemmo.entities.CFollower.prototype.forceTarget = null;
pokemmo.entities.CFollower.prototype.createdTick = null;
pokemmo.entities.CFollower.prototype.render = function(ctx) {
	$s.push("pokemmo.entities.CFollower::render");
	var $spos = $s.length;
	if(this.chr.follower != null) {
		var src = "resources/followers/" + this.chr.follower + ".png";
		if(this.image == null || this.image.obj.src != src) this.image = pokemmo.Game.curGame.getImage(src);
	} else if(this.image != null) this.image = null;
	if(this.chr.id == pokemmo.Game.myId && !pokemmo.Game.curGame.drawPlayerFollower) {
		$s.pop();
		return;
	}
	if(this.x == this.chr.x && this.y == this.chr.y && !this.walking && !this.chr.walking) {
		$s.pop();
		return;
	}
	if(pokemmo.Renderer.numRTicks - this.createdTick < 10) {
		ctx.save();
		ctx.globalAlpha = (pokemmo.Renderer.numRTicks - this.createdTick) / 10;
	}
	pokemmo.entities.CPokemon.prototype.render.call(this,ctx);
	if(pokemmo.Renderer.numRTicks - this.createdTick < 10) ctx.restore();
	$s.pop();
}
pokemmo.entities.CFollower.prototype.tick = function() {
	$s.push("pokemmo.entities.CFollower::tick");
	var $spos = $s.length;
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
	$s.pop();
}
pokemmo.entities.CFollower.prototype.__class__ = pokemmo.entities.CFollower;
$_ = {}
js.Boot.__res = {}
$s = [];
$e = [];
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
		$s.push("pokemmo.entities.CFollower::tick");
		var $spos = $s.length;
		var $tmp = isFinite(i);
		$s.pop();
		return $tmp;
		$s.pop();
	};
	Math.isNaN = function(i) {
		$s.push("pokemmo.entities.CFollower::tick");
		var $spos = $s.length;
		var $tmp = isNaN(i);
		$s.pop();
		return $tmp;
		$s.pop();
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
		var stack = $s.copy();
		var f = js.Lib.onerror;
		$s.splice(0,$s.length);
		if( f == null ) {
			var i = stack.length;
			var s = "";
			while( --i >= 0 )
				s += "Called from "+stack[i]+"\n";
			alert(msg+"\n\n"+s);
			return false;
		}
		return f(msg,stack);
	}
}
{
	var d = Date;
	d.now = function() {
		$s.push("pokemmo.entities.CFollower::tick");
		var $spos = $s.length;
		var $tmp = new Date();
		$s.pop();
		return $tmp;
		$s.pop();
	};
	d.fromTime = function(t) {
		$s.push("pokemmo.entities.CFollower::tick");
		var $spos = $s.length;
		var d1 = new Date();
		d1["setTime"](t);
		$s.pop();
		return d1;
		$s.pop();
	};
	d.fromString = function(s) {
		$s.push("pokemmo.entities.CFollower::tick");
		var $spos = $s.length;
		switch(s.length) {
		case 8:
			var k = s.split(":");
			var d1 = new Date();
			d1["setTime"](0);
			d1["setUTCHours"](k[0]);
			d1["setUTCMinutes"](k[1]);
			d1["setUTCSeconds"](k[2]);
			$s.pop();
			return d1;
		case 10:
			var k = s.split("-");
			var $tmp = new Date(k[0],k[1] - 1,k[2],0,0,0);
			$s.pop();
			return $tmp;
		case 19:
			var k = s.split(" ");
			var y = k[0].split("-");
			var t = k[1].split(":");
			var $tmp = new Date(y[0],y[1] - 1,y[2],t[0],t[1],t[2]);
			$s.pop();
			return $tmp;
		default:
			throw "Invalid date format : " + s;
		}
		$s.pop();
	};
	d.prototype["toString"] = function() {
		$s.push("pokemmo.entities.CFollower::tick");
		var $spos = $s.length;
		var date = this;
		var m = date.getMonth() + 1;
		var d1 = date.getDate();
		var h = date.getHours();
		var mi = date.getMinutes();
		var s = date.getSeconds();
		var $tmp = date.getFullYear() + "-" + (m < 10?"0" + m:"" + m) + "-" + (d1 < 10?"0" + d1:"" + d1) + " " + (h < 10?"0" + h:"" + h) + ":" + (mi < 10?"0" + mi:"" + mi) + ":" + (s < 10?"0" + s:"" + s);
		$s.pop();
		return $tmp;
		$s.pop();
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
pokemmo.UI.fireAHooks = false;
pokemmo.UI.fireBHooks = false;
pokemmo.UI.fireEnterHooks = false;
pokemmo.UI.arrowKeysPressed = new Array();
pokemmo.Renderer.numRTicks = 0;
pokemmo.NewGameScreen.pendingLoad = 0;
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
pokemmo.Battle.PLAYER_SELF = 0;
pokemmo.Battle.PLAYER_ENEMY = 1;
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
pokemmo.Main.window = window;
pokemmo.Main.document = document;
pokemmo.Main.jq = jQuery;
js.Lib.onerror = null;
pokemmo.Main.main()