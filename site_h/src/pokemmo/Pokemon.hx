package pokemmo;

/**
 * ...
 * @author Matheus28
 */

class PokemonConst {
	inline static public var GENDER_UNKNOWN:Int = 0;
	inline static public var GENDER_MALE:Int = 1;
	inline static public var GENDER_FEMALE:Int = 2;
	
	inline static public var STATUS_NONE:Int = 0;
	inline static public var STATUS_SLEEP:Int = 1;
	inline static public var STATUS_FREEZE:Int = 2;
	inline static public var STATUS_PARALYZE:Int = 3;
	inline static public var STATUS_POISON:Int = 4;
	inline static public var STATUS_BURN:Int = 5;
	
	inline static public var TYPE_NORMAL:Int = 0;
	inline static public var TYPE_FIRE:Int = 1;
	inline static public var TYPE_WATER:Int = 2;
	inline static public var TYPE_ICE:Int = 3;
	inline static public var TYPE_ELECTRIC:Int = 4;
	inline static public var TYPE_GRASS:Int = 5;
	inline static public var TYPE_GROUND:Int = 6;
	inline static public var TYPE_ROCK:Int = 7;
	inline static public var TYPE_FIGHT:Int = 8;
	inline static public var TYPE_STEEL:Int = 9;
	inline static public var TYPE_DARK:Int = 10;
	inline static public var TYPE_PSYCHIC:Int = 11;
	inline static public var TYPE_FLYING:Int = 12;
	inline static public var TYPE_BUG:Int = 13;
	inline static public var TYPE_POISON:Int = 14;
	inline static public var TYPE_GHOST:Int = 15;
	inline static public var TYPE_DRAGON:Int = 16;
	inline static public var TYPE_UNKNOWN:Int = 17;
}

typedef Pokemon = {
	public var id:String;
	public var level:Int;
	public var hp:Int;
	public var maxHp:Int;
	public var unique:String;
	public var shiny:Bool;
	public var gender:Int;
	public var nickname:String;
	public var status:Int;
	
	public var sprite:ImageResource;
	public var backsprite:ImageResource;
}

typedef PokemonOwned = {
	> Pokemon,
	public var experience:Int;
	public var experienceNeeded:Int;
	public var atk:Int;
	public var def:Int;
	public var spAtk:Int;
	public var spDef:Int;
	public var speed:Int;
	public var ability:Int;
	public var nature:Int;
	public var moves:Array<String>;
	public var movesPP:Array<Int>;
	public var movesMaxPP:Array<Int>;
	public var training:Float;
	public var virus:Int;
	
	public var icon:ImageResource;
}

typedef PokemonData = {
	var name:String;
}