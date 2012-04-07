package pokemmo_s;
import js.Node;

/**
 * ...
 * @author Matheus28
 */

class GameData {
	static private var pokemonData:Dynamic;
	static private var movesData:Dynamic;
	
	static public var typeData:Dynamic;
	static public var adminsData:Dynamic;
	
	static private var experienceRequired:Dynamic;
	
	static private var maps:Dynamic;
	static public var mapsInstaces:Array<MapInstance>;
	
	static public function init():Void {
		var sStart;
		
		sStart = Date.now().getTime();
		pokemonData = Utils.recursiveFreeze(Node.parse((~/\/\/[^\n\r]*/gm).replace(Node.fs.readFileSync('data/pokemon.json', 'utf8'), '')));
		Main.log('Loaded pokemon in ' + (Date.now().getTime() - sStart) + ' ms');
		
		movesData = Utils.recursiveFreeze(Node.parse((~/\/\/[^\n\r]*/gm).replace(Node.fs.readFileSync('data/moves.json', 'utf8'), '')));
		typeData = Utils.recursiveFreeze(Node.parse(Node.fs.readFileSync('data/types.json', 'utf8')));
		adminsData = Utils.recursiveFreeze(Node.parse(Node.fs.readFileSync('data/admins.json', 'utf8')));
		experienceRequired = Utils.recursiveFreeze(Node.parse(Node.fs.readFileSync('data/experienceRequired.json', 'utf8')).experienceRequired);
		
		maps = { };
		mapsInstaces = [];
		
		for (id in GameConst.LOAD_MAPS) {
			Reflect.setField(maps, id, new Map(id));
		}
	}
	
	static inline public function getAdminLevel(username:String):Int {
		return adminsData[untyped username] == null ? 0 : adminsData[untyped username].level;
	}
	
	static inline public function getPokemonData(id:String):PokemonData {
		return pokemonData[untyped id];
	}
	
	static inline public function getMoveData(move:String):MoveData {
		return movesData[untyped move];
	}
	
	static inline public function getExperienceRequired(curve:String, level:Int):Int {
		return experienceRequired[level][curveIdToInt(curve)];
	}
	
	static public function curveIdToInt(curve:String):Int {
		switch(curve) {
			case "erratic": return 0;
			case "fast": return 1;
			case "mediumFast": return 2;
			case "mediumSlow": return 3;
			case "slow": return 4;
			case "fluctuating": return 5;
		}
		throw "Invalid curve id: "+curve;
	}
	
	static inline public function getMap(id:String):Map {
		return maps[untyped id];
	}
	
	static public function getTypeEffectiveness(type:String, other:String):Float untyped {
		if(type == null || other == null) return 1.0;
		if(typeData[type][other] == null) return 1.0;
		return typeData[type][other];
	}
}

typedef PokemonData = {
	var name:String;
	var type1:String;
	var type2:String;
	var ability1:String;
	var ability2:String;
	var genderRatio:Float;
	
	var experienceCurve:String;
	var catchRate:Int;
	var baseExp:Int;
	var baseStats:PokemonStats;
	
	var evolveTo:String;
	var evolveLevel:Int;
	
	var learnset:Array<{
		var level:Int;
		var move:String;
	}>;
	
	var learnableTM:Array<String>;
	
	var evYield:PokemonStats;
}

typedef PokemonStats = {
	var hp:Int;
	var atk:Int;
	var def:Int;
	var spAtk:Int;
	var spDef:Int;
	var speed:Int;
}

typedef MoveData = {
	var name:String;
	var type:String;
	var pp:Int;
	var pp_max:Int;
	var power:Int;
	var accuracy:Float;
	var contact:Bool;
	var moveType:String;
	var special:Bool;
	var highCritical:Bool;
	var priority:Null<Int>;
	
	var debuffStat:String;
	var debuffAmount:Int;
	var debuffChance:Float;
	
	var buffUserStat:String;
	var buffUserAmount:Int;
	
	var applyStatus:Int;
	var applyStatusChance:Float;
}