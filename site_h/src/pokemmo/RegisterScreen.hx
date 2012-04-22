package pokemmo;
import pokemmo.transitions.BlackScreen;
import pokemmo.transitions.FadeIn;
import pokemmo.transitions.FadeOut;
import pokemmo.ui.TextInput;
import pokemmo.ui.UIButton;
import UserAgentContext;

/**
 * ...
 * @author Sonyp
 */

class RegisterScreen {
	static private var regsocket:SocketIOConnection;
	static private var confirmBtn:UIButton;
	static private var cancelBtn:UIButton;
	static private var captchaImage:ImageResource;
	static private var oldCaptchaImage:ImageResource;
	static private var requestInitTime:Float;
	
	static public var usernameTxt:TextInput;
	static public var passwordTxt:TextInput;
	static public var password2Txt:TextInput;
	static public var emailTxt:TextInput;
	static public var captchaTxt:TextInput;
	
	static public var sentRequest:Bool;
	static public var requestError:String;
	static public var captchaChallenge:String;
	
	static public var ignoreDisconnect:Bool;
	
	static public function init():Void {
		regsocket = (untyped io.connect)(Connection.REGSERVER_HOST);
		ignoreDisconnect = false;
		
		confirmBtn = new UIButton(410, 490, 130, 30);
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
		
		cancelBtn = new UIButton(270, 490, 130, 30);
		cancelBtn.drawIdle = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(TitleScreen.titleButtons.obj, 350, 0, 150, 50, cancelBtn.x - 15, cancelBtn.y - 15, 150, 50);
		};
		cancelBtn.drawHover = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(TitleScreen.titleButtons.obj, 350, 50, 150, 50, cancelBtn.x - 15, cancelBtn.y - 15, 150, 50);
		};
		cancelBtn.drawDown = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(TitleScreen.titleButtons.obj, 350, 100, 150, 50, cancelBtn.x - 15, cancelBtn.y - 15, 150, 50);
		};
		cancelBtn.drawDisabled = function(ctx:CanvasRenderingContext2D):Void {
			ctx.drawImage(TitleScreen.titleButtons.obj, 350, 150, 150, 50, cancelBtn.x - 15, cancelBtn.y - 15, 150, 50);
		};
		cancelBtn.onSubmit = onCancel;
		
		usernameTxt = UI.createTextInput(245, 321, 130);
		usernameTxt.maxLength = 10;
		
		passwordTxt = UI.createTextInput(245, 346, 130);
		passwordTxt.maxLength = 64;
		passwordTxt.isPassword = true;
		
		password2Txt = UI.createTextInput(245, 371, 130);
		password2Txt.maxLength = 64;
		password2Txt.isPassword = true;
		
		emailTxt = UI.createTextInput(245, 396, 130);
		emailTxt.maxLength = 100;
		
		captchaTxt = UI.createTextInput(423, 360, 220);
		captchaTxt.maxLength = 100;
		
		UI.pushInput(confirmBtn);
		UI.pushInput(cancelBtn);
		
		regsocket.on('registration', function(data:{var result:String;}){
			requestError = data.result;
			if (requestError == 'success') {
				ignoreDisconnect = true;
				destroy();
				Connection.socket.emit('login', {username: usernameTxt.value, password: passwordTxt.value});
			}else {
				requestInitTime = Date.now().getTime();
				captchaTxt.value = '';
				sentRequest = false;
				
				if (requestError == 'short_password' || requestError == 'long_password' || requestError == 'invalid_password') {
					password2Txt.value = '';
				}
			}
		});
		
		regsocket.on('disconnect', function(data:Dynamic):Void {
			if (ignoreDisconnect) return;
			ignoreDisconnect = true;
			
			Renderer.startTransition(new FadeOut(10)).onComplete = function():Void {
				destroy();
				Game.state = ST_TITLE;
				TitleScreen.init();
				
				Renderer.startTransition(new BlackScreen(10)).onComplete = function():Void {
					Renderer.startTransition(new FadeIn(10));
				}
			};
		});
		
		
		sentRequest = false;
		loadCaptcha();
	}
	
	static public function destroy():Void {
		regsocket.disconnect();
		
		UI.removeInput(confirmBtn);
		UI.removeInput(cancelBtn);
		UI.removeInput(usernameTxt);
		UI.removeInput(passwordTxt);
		UI.removeInput(password2Txt);
		UI.removeInput(emailTxt);
		UI.removeInput(captchaTxt);
	}
	
	static private function onConfirm():Void {
		if (sentRequest) return;
		
		requestError = null;
		requestInitTime = Date.now().getTime();
		
		if (usernameTxt.value.length < 4) {
			requestError = 'short_username';
		}else if (usernameTxt.value.length > 10) {
			requestError = 'long_username';
		}else if (passwordTxt.value.length < 8) {
			requestError = 'short_password';
		}else if (passwordTxt.value.length > 32) {
			requestError = 'long_password';
		}else if (passwordTxt.value != password2Txt.value) {
			requestError = 'mismatch_password';
			passwordTxt.value = '';
			password2Txt.value = '';
		}
		
		if (requestError != null) {
			return;
		}
		
		sentRequest = true;
		oldCaptchaImage = captchaImage;
		loadCaptcha();
		
		regsocket.emit('register', {
			username: usernameTxt.value,
			password: passwordTxt.value,
			challenge: captchaChallenge,
			response: captchaTxt.value,
			email: emailTxt.value
		});
	}
	
	static private function loadCaptcha():Void {
		untyped {
			var b = document.createElement("script");
			b.type = "text/javascript";
			b.src = 'http://www.google.com/recaptcha/api/challenge?k=6Lfxuc4SAAAAAJmKHMi1LS1DkjXj18CvHbd_geFW&ajax=1';
			document.body.appendChild(b);
			
			window.Recaptcha = {
				challenge_callback: gotChallenge
			}
		}
	}
	
	static private function gotChallenge():Void {
		captchaChallenge = untyped RecaptchaState.challenge;
		captchaImage = new ImageResource('http://www.google.com/recaptcha/api/image?c=' + captchaChallenge);
	}
	
	static private function onCancel():Void {
		Renderer.startTransition(new FadeOut(10)).onComplete = function():Void {
			destroy();
			Game.state = ST_TITLE;
			TitleScreen.init();
			Renderer.startTransition(new BlackScreen(5)).onComplete = function():Void {
				Renderer.startTransition(new FadeIn(10));
			}
		};
	}
	
	static public function render(ctx:CanvasRenderingContext2D):Void {
		var now:Float = Date.now().getTime();
		
		var c2 = Math.floor(0xFF * ((now - requestInitTime) / 2000));
		var cstr = '#' + untyped (0xFF0000 | (c2 << 8) | c2).toString(16);
		
		ctx.drawImage(TitleScreen.titleLogo.obj, 117, 80);
		
		Util.drawRoundedRect(145, 275, 250, 150, 15, '#FFFFFF', 0.7);
		
		if ((requestError == 'short_username' || requestError == 'long_username' || requestError == 'invalid_username' || requestError == 'username_already_exists') && (now - requestInitTime < 2000)) {
			Util.drawRoundedRect(245, 321, 135, 18, 5, cstr, 1.0);
		}else {
			Util.drawRoundedRect(245, 321, 135, 18, 5, '#FFFFFF', 1.0);
		}
		
		if ((requestError == 'short_password' || requestError == 'long_password' || requestError == 'invalid_password' || requestError == 'mismatch_password') && (now - requestInitTime < 2000)) {
			Util.drawRoundedRect(245, 346, 135, 18, 5, cstr, 1.0);
		}else {
			Util.drawRoundedRect(245, 346, 135, 18, 5, '#FFFFFF', 1.0);
		}
		
		if (requestError == 'mismatch_password' && (now - requestInitTime < 2000)) {
			Util.drawRoundedRect(245, 371, 135, 18, 5, cstr, 1.0);
		}else{
			Util.drawRoundedRect(245, 371, 135, 18, 5, '#FFFFFF', 1.0);
		}
		
		if (requestError == 'invalid_email' && (now - requestInitTime < 2000)) {
			Util.drawRoundedRect(245, 396, 135, 18, 5, cstr, 1.0);
		}else{
			Util.drawRoundedRect(245, 396, 135, 18, 5, '#FFFFFF', 1.0);
		}
		
		confirmBtn.disabled = captchaImage == null || !captchaImage.loaded || sentRequest;
		usernameTxt.disabled = passwordTxt.disabled = password2Txt.disabled = emailTxt.disabled = captchaTxt.disabled = sentRequest;
		
		ctx.save();
		ctx.fillStyle = '#000000';
		ctx.font = '21px Font3';
		ctx.fillText('Register', 270 - Math.round(ctx.measureText('Register').width / 2), 300);
		ctx.font = '12px Font3';
		ctx.fillText('ID:', 155, 335);
		ctx.fillText('PW:', 155, 360);
		ctx.fillText('PW (Again):', 155, 385);
		ctx.fillText('Email:', 155, 410);
		ctx.restore();
		
		
		if (requestError == 'invalid_captcha' && (now - requestInitTime < 2000)) {
			Util.drawRoundedRect(410, 275, 250, 115, 15, cstr, 0.7);
		}else {
			Util.drawRoundedRect(410, 275, 250, 115, 15, '#FFFFFF', 0.7);
		}
		
		if (sentRequest) {
			if (oldCaptchaImage != null && oldCaptchaImage.loaded) {
				ctx.drawImage(oldCaptchaImage.obj, 423, 285, 225, 42);
			}
		}else{
			if (captchaImage != null && captchaImage.loaded) {
				ctx.drawImage(captchaImage.obj, 423, 285, 225, 42);
			}
		}
		
		Util.drawRoundedRect(423, 360, 225, 18, 5, '#FFFFFF', 1.0);
		
		ctx.fillStyle = '#000000';
		ctx.font = '12px Font3';
		ctx.fillText('Type the words above:', 423 + 225 / 2 - ctx.measureText('Type the words above:').width / 2, 350);
		
		if (sentRequest) {
			ctx.drawImage(TitleScreen.loadingImg.obj, 0, 32 * (Math.floor((now - requestInitTime) / 100) % 12), 32, 32, 384, 440, 32, 32);
		}
		
		if (now - requestInitTime < 4000) {
			var errorMsg = null;
			switch(requestError) {
				case 'short_username': errorMsg = 'Username is too short (min. 4 characters)';
				case 'long_username': errorMsg = 'Username is too long (max. 10 characters)';
				case 'invalid_username': errorMsg = 'Invalid username (alphanumeric and underscore only)';
				case 'username_already_exists': errorMsg = 'Username already exists';
				case 'email_already_registered': errorMsg = 'Email is already registered';
				case 'short_password': errorMsg = 'Password is too short (min. 8 characters)';
				case 'long_password': errorMsg = 'Password is too long (max. 32 characters)';
				case 'invalid_password': errorMsg = 'Invalid password characters (alphanumeric and _!@#$%&*()[]{}.,:;- only)';
				case 'invalid_email': errorMsg = 'Invalid email';
				case 'internal_error': errorMsg = 'Internal Server Error';
				case 'registration_disabled': errorMsg = 'Registration disabled';
				case 'invalid_captcha': errorMsg = 'Invalid captcha';
				case 'mismatch_password': errorMsg = 'Passwords mismatch';
				case 'registered_recently': errorMsg = 'You already registered an account recently';
			}
			
			if (errorMsg != null) {
				ctx.save();
				ctx.fillStyle = 'rgba(200,0,0,' + Util.clamp(4 - (now - requestInitTime) / 1000, 0, 1) + ')';
				ctx.textAlign = 'center';
				ctx.fillText(errorMsg, 400, 465);
				ctx.restore();
			}
		}
	}
}