package pokemmo;
import pokemmo.transitions.BlackScreen;
import pokemmo.transitions.FadeIn;
import pokemmo.transitions.FadeOut;
import pokemmo.ui.TextInput;
import pokemmo.ui.UIButton;
import UserAgentContext;

/**
 * ...
 * @author Matheus28
 */

class TitleScreen {
	static private var TWITTER_API_URL:String = "http://search.twitter.com/search.json?q=%23ANN+from:Sonyp_&callback=twitterAPIResult";
	
	static private var usernameTxt:TextInput;
	static private var passwordTxt:TextInput;
	static private var loginButton:UIButton;
	static private var registerButton:UIButton;
	static private var donateButton:UIButton;
	
	static public var titleScreen:ImageResource;
	static public var titleLogo:ImageResource;
	static public var titleButtons:ImageResource;
	static public var loadingImg:ImageResource;
	
	static private var sentLogin:Bool;
	static private var loginInitTime:Float;
	
	static private var tweets:Array<Tweet>;
	
	static public function setup():Void {
		titleScreen = Game.loadImageResource('titleScreen', 'resources/ui/title.png');
		titleLogo = Game.loadImageResource('titleLogo', 'resources/ui/title_logo.png');
		titleButtons = Game.loadImageResource('titleButtons', 'resources/ui/title_buttons.png');
		loadingImg = Game.loadImageResource('loading', 'resources/ui/loading.png');
		
		untyped {
			var b = document.createElement("script");
			b.type = "text/javascript";
			b.src = TWITTER_API_URL;
			document.body.appendChild(b);
			
			window.twitterAPIResult = onTwitterResult;
		}
	}
	
	static public function init():Void {
		usernameTxt = UI.createTextInput(350, 321, 130);
		usernameTxt.maxLength = 10;
		
		passwordTxt = UI.createTextInput(350, 346, 130);
		passwordTxt.maxLength = 64;
		passwordTxt.isPassword = true;
		
		loginButton = new UIButton(455, 375, 30, 30);
		loginButton.drawIdle = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(titleButtons.obj, 0, 0, 50, 50, 445, 365, 50, 50);
		};
		loginButton.drawHover = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(titleButtons.obj, 0, 50, 50, 50, 445, 365, 50, 50);
		};
		loginButton.drawDown = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(titleButtons.obj, 0, 100, 50, 50, 445, 365, 50, 50);
		};
		loginButton.drawDisabled = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(titleButtons.obj, 0, 150, 50, 50, 445, 365, 50, 50);
		};
		loginButton.onSubmit = onLoginSubmit;
		UI.pushInput(loginButton);
		
		registerButton = new UIButton(310, 375, 130, 30);
		registerButton.drawIdle = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(titleButtons.obj, 50, 0, 150, 50, 300, 365, 150, 50);
		};
		registerButton.drawHover = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(titleButtons.obj, 50, 50, 150, 50, 300, 365, 150, 50);
		};
		registerButton.drawDown = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(titleButtons.obj, 50, 100, 150, 50, 300, 365, 150, 50);
		};
		registerButton.drawDisabled = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(titleButtons.obj, 50, 150, 150, 50, 300, 365, 150, 50);
		};
		registerButton.onSubmit = onRegisterSubmit;
		UI.pushInput(registerButton);
		
		donateButton = new UIButton(305, 470, 190, 30);
		donateButton.drawIdle = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(titleButtons.obj, 500, 0, 210, 50, 295, 460, 210, 50);
		};
		donateButton.drawHover = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(titleButtons.obj, 500, 50, 210, 50, 295, 460, 210, 50);
		};
		donateButton.drawDown = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(titleButtons.obj, 500, 100, 210, 50, 295, 460, 210, 50);
		};
		donateButton.drawDisabled = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(titleButtons.obj, 500, 150, 210, 50, 295, 460, 210, 50);
		};
		donateButton.instantSubmit = true;
		donateButton.onSubmit = function():Void {
			(untyped __js__('window')).open('https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=QBXGPHQPQ5G5Y', '_blank');
		}
		UI.pushInput(donateButton);
		
		usernameTxt.select();
		
		UI.hookEnterButton(onEnterButton);
	}
	
	static public function destroy():Void {
		UI.removeInput(usernameTxt);
		UI.removeInput(passwordTxt);
		UI.removeInput(loginButton);
		UI.removeInput(registerButton);
		UI.removeInput(donateButton);
	}
	
	static private function onTwitterResult(data:Dynamic) {
		tweets = data.results;
	}
	
	static private function onLoginSubmit():Void {
		if (sentLogin) return;
		if (usernameTxt.value.length < 4 || passwordTxt.value.length < 8) return;
		sentLogin = true;
		loginInitTime = Date.now().getTime();
		Connection.socket.emit('login', {username: usernameTxt.value, password: passwordTxt.value});
	}
	
	static private function onRegisterSubmit():Void {
		if (sentLogin) return;
		Renderer.startTransition(new FadeOut(10)).onComplete = function():Void {
			destroy();
			Game.state = ST_REGISTER;
			RegisterScreen.init();
			RegisterScreen.usernameTxt.value = usernameTxt.value;
			RegisterScreen.passwordTxt.value = passwordTxt.value;
			Renderer.startTransition(new BlackScreen(5)).onComplete = function():Void {
				Renderer.startTransition(new FadeIn(10));
			}
		};
	}
	
	static public function loginFailed():Void {
		sentLogin = false;
		loginInitTime = Date.now().getTime();
		passwordTxt.value = '';
	}
	
	static private function onEnterButton():Void {
		if(UI.selectedInput == usernameTxt || UI.selectedInput == passwordTxt) onLoginSubmit();
		UI.hookEnterButton(onEnterButton);
	}
	
	static public function render(ctx:CanvasRenderingContext2D):Void {
		var canvas = ctx.canvas;
		
		if (!titleScreen.loaded || !titleButtons.loaded || !titleLogo.loaded || !loadingImg.loaded) {
			ctx.fillStyle = '#000000';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			return;
		}
		
		var now = Date.now().getTime();
		
		ctx.drawImage(titleScreen.obj, 0, 0);
		ctx.drawImage(titleLogo.obj, 117, 80);
		
		if(sentLogin){
			usernameTxt.disabled = true;
			passwordTxt.disabled = true;
			loginButton.disabled = true;
			registerButton.disabled = true;
			
			Util.drawRoundedRect(300, 275, 200, 140, 15, '#FFFFFF', 0.35);
			
			Util.drawRoundedRect(350, 321, 135, 18, 5, '#FFFFFF', 0.5);
			Util.drawRoundedRect(350, 346, 135, 18, 5, '#FFFFFF', 0.5);
			
			ctx.drawImage(loadingImg.obj, 0, 32 * (Math.floor((now - loginInitTime) / 100) % 12), 32, 32, 384, 425, 32, 32);
		}else {
			usernameTxt.disabled = false;
			passwordTxt.disabled = false;
			loginButton.disabled = usernameTxt.value.length < 4 || passwordTxt.value.length < 8;
			registerButton.disabled = false;
			
			Util.drawRoundedRect(300, 275, 200, 140, 15, '#FFFFFF', 0.7);
			
			Util.drawRoundedRect(350, 321, 135, 18, 5, '#FFFFFF', 1.0);
			Util.drawRoundedRect(350, 346, 135, 18, 5, '#FFFFFF', 1.0);
		
		}
		
		
		
		ctx.save();
		ctx.fillStyle = '#000000';
		ctx.font = '21px Font3';
		ctx.fillText('Login', 400 - Math.round(ctx.measureText('Login').width / 2), 300);
		ctx.font = '12px Font3';
		ctx.fillText('ID:', 310, 335);
		ctx.fillText('PW:', 310, 360);
		
		if (!sentLogin && now - loginInitTime < 4000) {
			ctx.fillStyle = 'rgba(200,0,0,' + Util.clamp(4 - (now - loginInitTime) / 1000, 0, 1) + ')';
			ctx.textAlign = 'center';
			ctx.fillText('Invalid username or password', 400, 430);
		}
		ctx.restore();
		
		
		if (tweets != null && tweets.length > 0) {
			ctx.save();
			var MAX_TWEET_WIDTH = 185;
			var tweetsHeight:Int = 10;
			for (t in tweets) {
				ctx.font = 'italic 12px Courier';
				var w = ctx.measureText(t.text).width;
				if(w < MAX_TWEET_WIDTH){
					tweetsHeight += 15;
				}else {
					tweetsHeight += 15 * Util.reduceTextSize(t.text, MAX_TWEET_WIDTH, ctx).length;
				}
				tweetsHeight += 10;
			}
			
			if (tweetsHeight <= 0) return;
			
			Util.drawRoundedRect(20, 275, 260, tweetsHeight, 15, '#FFFFFF', 0.7);
			
			ctx.translate(30, 300);
			
			for (t in tweets) {
				ctx.fillStyle = '#000000';
				
				ctx.font = 'bold 12px Courier';
				var uw = ctx.measureText(t.from_user_name + ': ').width;
				ctx.fillText(t.from_user_name + ': ', 0, 0);
				
				ctx.font = 'italic 12px Courier';
				var str = t.text.substr("#ANN ".length);
				var w = ctx.measureText(t.text).width;
				
				if(w < MAX_TWEET_WIDTH){
					ctx.fillText(str, uw + 2, 0);
					ctx.translate(0, 15);
				}else {
					var lines = Util.reduceTextSize(str, MAX_TWEET_WIDTH, ctx);
					for (l in lines) {
						ctx.fillText(l, uw + 2, 0);
						ctx.translate(0, 15);
					}
				}
				ctx.translate(0, 10);
			}
			ctx.restore();
			
			ctx.drawImage(ctx.canvas, 0, 0);
		}
		
		ctx.font = '12px Courier';
		ctx.fillStyle = '#000000';
		ctx.fillText('Version: '+Version.Major+"."+Version.Minor+"/"+Version.Build, 10, 600);
	}
}

private typedef Tweet = {
	var text:String;
	var from_user_name:String;
}