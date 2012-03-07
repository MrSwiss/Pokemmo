package pokemmo;

import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class Chat {
	static public var inChat:Bool = false;
	static public var chatLog:Array<ChatLogEntry> = { new Array<ChatLogEntry>(); }
	static public var justSentMessage:Bool = false;
	static public var chatBox:HTMLInputElement;
	
	static public function setup():Void {
		chatBox = untyped document.createElement('input');
		chatBox.type = 'text';
		untyped chatBox.style.opacity = '0';
		chatBox.style.position = 'fixed';
		chatBox.maxLength = 128;
		
		chatBox.onblur = function(e:Event) {
			Chat.inChat = false;
			
			// Force the messages to fade out again, a little faster though
			var now = Date.now().getTime();
			
			var chatLog = Chat.chatLog;
			for (i in untyped Math.max(chatLog.length - 12, 0)...chatLog.length) {
				chatLog[i].timestamp = Math.max(now - 2500, chatLog[i].timestamp);
			}
		}
		
		chatBox.onkeydown = function(e:Event):Void {
			untyped e = window.event || e;
			if (e.keyCode == 13) {
				sendMessage();
			}
		}
		
		untyped __js__("document").body.appendChild(chatBox);
	}
	
	static public function sendMessage():Void {
		filterChatText();
		Connection.socket.emit('sendMessage', {str:chatBox.value } );
		chatBox.value = '';
		inChat = false;
		justSentMessage = true;
		Main.jq(chatBox).blur();
		Main.jq(Main.onScreenCanvas).focus();
	}
	
	static public function render(ctx:CanvasRenderingContext2D):Void {
		if (inChat && chatBox.value.length > 0) filterChatText();
		
		var x = 20;
		var y = 380;
		
		ctx.font = '12px Font2';
		
		if(inChat){
			ctx.globalAlpha = 0.5;
			ctx.drawImage(Game.getRes('uiChat').obj, x, y);
		}
		
		ctx.globalAlpha = 1;
		ctx.fillStyle = 'rgb(0, 0, 0)';
		
		var str = chatBox.value;
		while(true){
			var w = ctx.measureText(str).width;
			if(w < 440){
				ctx.fillText(str, x + 8, y + 193);
				if(inChat){
					if (Date.now().getTime()%1000 < 500){
						ctx.fillRect(x + 10 + w, y + 184, 1, 10);
					}
				}
				break;
			}else{
				str = str.substr(1);
			}
		}
		
		
		var i = chatLog.length;
		var now = Date.now().getTime();
		for (i in untyped Math.max(chatLog.length - 12, 0)...chatLog.length) {
			if(!inChat) ctx.globalAlpha = Util.clamp(5 - (now - chatLog[i].timestamp)/1000 + 2, 0, 1);
			var str;
			
			if(!inChat){
				ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
				ctx.fillRect(x + 6, y + 169 - (14 * (chatLog.length - i)), ctx.measureText(chatLog[i].username + ': ' + chatLog[i].str).width + 6, 14);
			}
			
			str = chatLog[i].username + ': ';
			ctx.fillStyle = 'rgb(0, 0, 0)';
			ctx.fillText(str, x + 11, y + 181 - (14 * (chatLog.length - i)));
			
			ctx.fillStyle = 'rgb(255, 255, 0)';
			ctx.fillText(str, x + 10, y + 180 - (14 * (chatLog.length - i)));
			
			var usernameWidth = ctx.measureText(str).width;
			
			str = chatLog[i].str;
			
			ctx.fillStyle = 'rgb(0, 0, 0)';
			ctx.fillText(str, x + 11 + usernameWidth, y + 181 - (14 * (chatLog.length - i)));
			
			
			ctx.fillStyle = 'rgb(255, 255, 255)';
			ctx.fillText(str, x + 10 + usernameWidth, y + 180 - (14 * (chatLog.length - i)));
			
			
		}
		
		ctx.globalAlpha = 1;
	}
	
	static private function filterChatText():Void {
		chatBox.value = (~/[^a-zA-Z0-9.,:-=\(\)\[\]\{\}\/\\ '"!?@#$%&*]/).replace(chatBox.value, '');
	}
}

typedef ChatLogEntry = {
	var username:String;
	var str:String;
	var timestamp:Float;
}