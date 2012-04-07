package pokemmo_s;
import haxe.macro.Context;
import haxe.macro.Expr;

/**
 * ...
 * @author Matheus28
 */

class MacroUtils {
	@:macro static public function verifyStructure(data:Expr, cls:Expr):Expr {
		function toExpr(e:ExprDef):Expr return { expr:e, pos: Context.currentPos() };
		var exprs:Array<Expr>;
		
		var objVars:Array<{ name : String, type : Null<ComplexType>, expr : Null<Expr> }> = [];
		
		switch(cls.expr) {
			case ExprDef.EBlock(exprs):
				for (tmp in exprs) {
					var t;
					switch(tmp.expr) {
						case ExprDef.EVars(vars):
							for (i in vars) objVars.push(i);
						default: throw "Invalid type";
					}
				}
			default: throw "Invalid type";
		}
		
		
		
		
		var top = null;
		for (v in objVars) {
			var type:Expr;
			switch(v.type) {
				case TPath(p):
					type = toExpr(EConst(CType(p.name)));
					var cmp = toExpr(ECall(Context.parse("Std.is", Context.currentPos()), [toExpr(EField(data, v.name)), type]));
					if (top == null) {
						top = cmp;
					}else {
						top = toExpr(EBinop(Binop.OpBoolAnd, top, cmp));
					}
				default: throw "Invalid type";
			}
			
			
		}
		
		return toExpr(EUnop(OpNot, false, top));
	}
}