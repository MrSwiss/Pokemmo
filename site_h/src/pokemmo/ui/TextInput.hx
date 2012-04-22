package pokemmo.ui;

import pokemmo.UI;
import UserAgentContext;

/**
 * ...
 * @author Sonyp
 */

class TextInput extends UIInput {
	public var width:Int;
	public var height:Int;
	
	public var value:String;
	public var isPassword:Bool;
	public var maxLength:Int;
	public function new(x:Int, y:Int, width:Int):Void {
		super(x, y);
		this.width = width;
		this.height = 18;
		selected = false;
		isPassword = false;
		value = '';
		maxLength = 0;
	}
	
	override public function select():Void {
		if (selected) return;
		super.select();
		
		UI.hiddenInput.value = value;
		Main.jq(UI.hiddenInput).focus();
	}
	
	override public function blur():Void {
		if (!selected) return;
		super.blur();
		UI.hiddenInput.value = '';
		Main.jq(UI.hiddenInput).blur();
		Main.jq(Main.onScreenCanvas).focus();
	}
	
	override public function tick():Void {
		if (disabled) {
			UI.hiddenInput.value = value;
			return;
		}
		
		if (selected) {
			value = UI.hiddenInput.value;
		}
	}
	
	override public function isUnderMouse():Bool {
		return UI.mouseX >= x && UI.mouseY >= y && UI.mouseX < x + width && UI.mouseY < y + height;
	}
	
	override public function render(ctx:CanvasRenderingContext2D):Void {
		var now = Date.now().getTime();
		
		if (isUnderMouse()) {
			UI.setCursor('text');
		}
		
		if (maxLength > 0) {
			if (value.length > maxLength) {
				value = value.substr(0, maxLength);
				UI.hiddenInput.value = value;
			}
		}
		
		ctx.font = '12px Arial';
		ctx.fillStyle = '#000000';
		
		var str = value;
		if (isPassword) str = (~/./g).replace(str, '*');
		
		var txtWidth = 0;
		
		if (str.length > 0) {
			while(true){
				txtWidth = Math.ceil(ctx.measureText(str).width);
				if (txtWidth < width - 8) {
					break;
				}else{
					str = str.substr(1);
				}
			}
			
			ctx.fillText(str, x + 5, y + 14);
		}
		
		
		if (selected && (now - selectedTime) % 1000 < 500) {
			ctx.fillRect(x + 6 + txtWidth, y + 2, 1, 14);
		}
	}
}