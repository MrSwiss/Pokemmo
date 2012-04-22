package pokemmo_s;

import pokemmo_s.GameData;

/**
 * ...
 * @author Sonyp
 */

class Pokemon {
	static inline public var MAX_LEVEL:Int = 100;
	static inline public var MAX_MOVES:Int = 4;
	
	static inline public var STATUS_NONE:Int = 0;
	static inline public var STATUS_SLEEP:Int = 1;
	static inline public var STATUS_FREEZE:Int = 2;
	static inline public var STATUS_PARALYZE:Int = 3;
	static inline public var STATUS_POISON:Int = 4;
	static inline public var STATUS_BURN:Int = 5;
	
	static inline public var GENDER_UNKNOWN:Int = 0;
	static inline public var GENDER_MALE:Int = 1;
	static inline public var GENDER_FEMALE:Int = 2;
	
	static inline public var VIRUS_NONE = 0;
	static inline public var VIRUS_POKERUS = 1;
	
	static inline public var NATURE_NONE = 0;
	
	static inline public var BALL_MULT = 0;
	static inline public var BALL_ADD = 1;
	
	// NATURE_{stat increased}_{stat_decreased}
	static inline public var NATURE_ATK_DEF = 1;
	static inline public var NATURE_ATK_SPATK = 2;
	static inline public var NATURE_ATK_SPDEF = 3;
	static inline public var NATURE_ATK_SPEED = 4;
	
	static inline public var NATURE_DEF_ATK = 5;
	static inline public var NATURE_DEF_SPATK = 6;
	static inline public var NATURE_DEF_SPDEF = 7;
	static inline public var NATURE_DEF_SPEED = 8;
	
	static inline public var NATURE_SPATK_ATK = 9;
	static inline public var NATURE_SPATK_DEF = 10;
	static inline public var NATURE_SPATK_SPDEF = 11;
	static inline public var NATURE_SPATK_SPEED = 12;
	
	static inline public var NATURE_SPDEF_ATK = 13;
	static inline public var NATURE_SPDEF_DEF = 14;
	static inline public var NATURE_SPDEF_SPATK = 15;
	static inline public var NATURE_SPDEF_SPEED = 16;
	
	static inline public var NATURE_SPEED_ATK = 17;
	static inline public var NATURE_SPEED_DEF = 18;
	static inline public var NATURE_SPEED_SPATK = 19;
	static inline public var NATURE_SPEED_SPDEF = 20;
	
	// NATURE_NONE_{stat_neutral}
	static inline public var NATURE_NONE_ATK = 21;
	static inline public var NATURE_NONE_DEF = 22;
	static inline public var NATURE_NONE_SPATK = 23;
	static inline public var NATURE_NONE_SPDEF = 24;
	static inline public var NATURE_NONE_SPEED = 25;
	
	static inline public var MAX_EV = 510;
	static inline public var MAX_INDIVIDUAL_EV = 255;
	
	public var id:String;
	public var level:Int;
	public var unique:String;
	public var nickname:String;
	public var gender:Int;
	public var shiny:Bool;
	
	public var hp:Int;
	public var maxHp:Int;
	public var atk:Int;
	public var def:Int;
	public var spAtk:Int;
	public var spDef:Int;
	public var speed:Int;
	
	public var ability:Int;
	public var nature:Int;
	
	public var experience:Int;
	public var experienceNeeded:Int;
	
	public var ivHp:Int;
	public var ivMaxHp:Int;
	public var ivAtk:Int;
	public var ivDef:Int;
	public var ivSpAtk:Int;
	public var ivSpDef:Int;
	public var ivSpeed:Int;
	
	public var evHp:Int;
	public var evMaxHp:Int;
	public var evAtk:Int;
	public var evDef:Int;
	public var evSpAtk:Int;
	public var evSpDef:Int;
	public var evSpeed:Int;
	
	public var status:Int;
	public var virus:Int;
	
	public var moves:Array<String>;
	public var movesPP:Array<Int>;
	public var movesMaxPP:Array<Int>;
	
	public var battleStats:PokemonBattleStats;
	
	static private var pokemonSaveFields = ["id", "level", "unique", "gender", "ability", "experience", "nature", "status", "virus", "shiny", "moves", "movesPP", "movesMaxPP", "hp", "evHp", "evAtk", "evDef", "evSpAtk", "evSpDef", "evSpeed", "ivHp", "ivAtk", "ivDef", "ivSpAtk", "ivSpDef", "ivSpeed"];
	
	public function new() {
		resetBattleStats();
	}
	
	public function resetBattleStats():Void {
		battleStats = {
			learnableMoves: [],
			atkPower: 0,
			defPower: 0,
			spAtkPower: 0,
			spDefPower: 0,
			speedPower: 0,
			accuracy: 0,
			evasion: 0
		};
	}
	
	public function loadFromSave(sav:PokemonSave):Pokemon {
		for (field in pokemonSaveFields) {
			untyped this[field] = sav[field];
		}
		calculateStats();
		return this;
	}
	
	public function createWild(id_:String, level_:Int):Pokemon {
		id = id_;
		level = level_;
		unique = Utils.createRandomString(16);
		
		if (GameData.getPokemonData(id).genderRatio != -1) {
			gender = (Math.random() < GameData.getPokemonData(id).genderRatio) ? GENDER_MALE : GENDER_FEMALE;
		}else {
			gender = GENDER_UNKNOWN;
		}
		
		nature = Utils.randInt(1, 25);
		
		if (GameData.getPokemonData(id).ability2 != null) {
			ability = Utils.randInt(1, 2);
		}else if (GameData.getPokemonData(id).ability1 != null) {
			ability = 1;
		}else {
			// Not sure if it's possible for a pokemon to have no ability,
			// but make sure we don't fail if it is
			ability = 0;
		}
		
		experience = 0;
		
		hp = atk = def = spAtk = spDef = speed = 0;
		evHp = evAtk = evDef = evSpAtk = evSpDef = evSpeed = 0;
		
		ivHp = Utils.randInt(0, 31);
		ivAtk = Utils.randInt(0, 31);
		ivDef = Utils.randInt(0, 31);
		ivSpAtk = Utils.randInt(0, 31);
		ivSpDef = Utils.randInt(0, 31);
		ivSpeed = Utils.randInt(0, 31);
		
		status = STATUS_NONE;
		
		virus = VIRUS_NONE;
		
		shiny = 1 / 8192 > Math.random();
		
		moves = [null, null, null, null];
		movesPP = [0, 0, 0, 0];
		movesMaxPP = [0, 0, 0, 0];
		
		var j = 0;
		for (i in GameData.getPokemonData(id).learnset) {
			if (GameData.getMoveData(i.move) == null) {
				Main.warn('Move "' + i.move + '" doesn\'t exist for "' + GameData.getPokemonData(id).name + '"');
				continue;
			}
			
			if (i.level > level) continue;
			learnMove(j, i.move);
			
			j = (j + 1) % 4;
		}
		
		
		calculateStats();
		hp = maxHp;
		
		if(moves[0] == null){
			learnMove(0, 'tackle');
		}
		
		return this;
	}
	
	public function generateSave():PokemonSave {
		var sav:PokemonSave = untyped { };
		for (field in pokemonSaveFields) {
			untyped sav[field] = this[field];
		}
		return sav;
	}
	
	public function calculateCatch(ballType:Int, ballValue:Int):Float {
		var chance:Float = (3 * maxHp - 2 * hp) * GameData.getPokemonData(id).catchRate;
		switch(ballType) {
			case BALL_MULT: chance *= ballValue;
			case BALL_ADD: chance += ballValue;
		}
		
		chance /= 3 * maxHp;
		
		switch(status) {
		case STATUS_SLEEP, STATUS_FREEZE:
			chance *= 2;
		case STATUS_PARALYZE, STATUS_POISON, STATUS_BURN:
			chance *= 1.5;
		}
		
		return chance;
	}
	
	inline public function getAbility():String {
		return ability == 0 ? '' : untyped GameData.getPokemonData(id)[untyped 'ability' + ability];
	}
	
	public function learnMove(slot:Int, move:String):Void {
		if (slot < 0 || slot >= MAX_MOVES) return;
		moves[slot] = move;
		movesMaxPP[slot] = movesPP[slot] = GameData.getMoveData(move).pp;
	}
	
	public function calculateStats():Void {
		function calculateSingleStat(base, iv, ev) {
			return (iv + (2 * base) + (ev / 4)) * level / 100 + 5;
		}
		
		maxHp = Math.floor((((ivHp + (2 * GameData.getPokemonData(id).baseStats.hp)) + (evHp / 4) + 100) * level) / 100 + 10);
		var tatk = calculateSingleStat(GameData.getPokemonData(id).baseStats.atk, ivAtk, evAtk);
		var tdef = calculateSingleStat(GameData.getPokemonData(id).baseStats.def, ivDef, evDef);
		var tspAtk = calculateSingleStat(GameData.getPokemonData(id).baseStats.spAtk, ivSpAtk, evSpAtk);
		var tspDef = calculateSingleStat(GameData.getPokemonData(id).baseStats.spDef, ivSpDef, evSpDef);
		var tspeed = calculateSingleStat(GameData.getPokemonData(id).baseStats.speed, ivSpeed, evSpeed);
		
		switch(nature){
			case NATURE_ATK_DEF: tatk *= 1.1; tdef *= 0.9;
			case NATURE_ATK_SPATK: tatk *= 1.1; tspAtk *= 0.9;
			case NATURE_ATK_SPDEF: tatk *= 1.1; tspDef *= 0.9;
			case NATURE_ATK_SPEED: tatk *= 1.1; tspeed *= 0.9;
			
			case NATURE_DEF_ATK: tdef *= 1.1; tatk *= 0.9;
			case NATURE_DEF_SPATK: tdef *= 1.1; tspAtk *= 0.9;
			case NATURE_DEF_SPDEF: tdef *= 1.1; tspDef *= 0.9;
			case NATURE_DEF_SPEED: tdef *= 1.1; tspeed *= 0.9;
			
			case NATURE_SPATK_ATK: tspAtk *= 1.1; tatk *= 0.9;
			case NATURE_SPATK_DEF: tspAtk *= 1.1; tdef *= 0.9;
			case NATURE_SPATK_SPDEF: tspAtk *= 1.1; tspDef *= 0.9;
			case NATURE_SPATK_SPEED: tspAtk *= 1.1; tspeed *= 0.9;
			
			case NATURE_SPDEF_ATK: tspDef *= 1.1; tatk *= 0.9;
			case NATURE_SPDEF_DEF: tspDef *= 1.1; tdef *= 0.9;
			case NATURE_SPDEF_SPATK: tspDef *= 1.1; tspAtk *= 0.9;
			case NATURE_SPDEF_SPEED: tspDef *= 1.1; tspeed *= 0.9;
			
			case NATURE_SPEED_ATK: tspeed *= 1.1; tatk *= 0.9;
			case NATURE_SPEED_DEF: tspeed *= 1.1; tdef *= 0.9;
			case NATURE_SPEED_SPATK: tspeed *= 1.1; tspAtk *= 0.9;
			case NATURE_SPEED_SPDEF: tspeed *= 1.1; tspDef *= 0.9;
		}
		
		atk = Math.floor(tatk);
		def = Math.floor(tdef);
		spAtk = Math.floor(tspAtk);
		spDef = Math.floor(tspDef);
		speed = Math.floor(tspeed);
		
		if(level >= 100){
			experienceNeeded = 0;
		}else{
			experienceNeeded = GameData.getExperienceRequired(GameData.getPokemonData(id).experienceCurve, level);
		}
	}
	
	public function restore():Void {
		hp = maxHp;
		
		for (i in 0...MAX_MOVES) {
			movesPP[i] = movesMaxPP[i];
		}
	}
	
	public function getUsableMoves():Array<String> {
		var arr = [];
		for (i in 0...MAX_MOVES) {
			if (moves[i] == null) continue;
			if (movesPP[i] <= 0) continue;
			arr.push(moves[i]);
		}
		return arr;
	}
	
	public function generateNetworkObject(isOwner:Bool):Dynamic {
		if (isOwner) {
			return {
				id: id,
				level: level,
				hp: hp,
				maxHp: maxHp,
				unique: unique,
				shiny: shiny,
				gender: gender,
				nickname: nickname,
				status: status,
				
				experience: experience,
				experienceNeeded: experienceNeeded,
				atk: atk,
				def: def,
				spAtk: spAtk,
				spDef: spDef,
				speed: speed,
				ability: ability,
				nature: nature,
				moves: moves,
				movesPP: movesPP,
				movesMaxPP: movesMaxPP,
				training: Math.floor((evHp + evAtk + evDef + evSpAtk + evSpDef + evSpeed) / MAX_EV * 100) / 100,
				virus: virus
			};
		}else {
			return {
				id: id,
				level: level,
				hp: hp,
				maxHp: maxHp,
				unique: unique,
				shiny: shiny,
				gender: gender,
				nickname: nickname,
				status: status
			};
		}
	}
	
	public function calculateExpGain(isTrainer:Bool):Int {
		return Math.ceil(((isTrainer ? 1.5 : 1) * GameData.getPokemonData(id).baseExp * level) / 7);
	}
	
	public function buffBattleStat(stat:String, value:Int):Void {
		switch(stat) {
			case 'atk': battleStats.atkPower = Utils.clamp(battleStats.atkPower + value, -6, 6);
			case 'def': battleStats.defPower = Utils.clamp(battleStats.defPower + value, -6, 6);
			case 'spAtk': battleStats.spAtkPower = Utils.clamp(battleStats.spAtkPower + value, -6, 6);
			case 'spDef': battleStats.spDefPower = Utils.clamp(battleStats.spDefPower + value, -6, 6);
			case 'speed': battleStats.speedPower = Utils.clamp(battleStats.speedPower + value, -6, 6);
			case 'accuracy': battleStats.accuracy = Utils.clamp(battleStats.accuracy + value, -6, 6);
			case 'evasion': battleStats.evasion = Utils.clamp(battleStats.evasion + value, -6, 6);
		}
	}
	
	public function addEV(data:PokemonStats):Void {
		var total = evHp + evAtk + evDef + evSpAtk + evSpDef + evSpeed;
		var tmp:Int;
		if(total >= MAX_EV) return;
		
		untyped for(i in [
			['hp', 'evHp'],
			['atk', 'evAtk'],
			['def', 'evDef'],
			['spAtk', 'evSpAtk'],
			['spDef', 'evSpDef'],
			['speed', 'evSpeed']
		]){
			if (data[i[0]] != null && data[i[0]] > 0) {
				tmp = data[i[0]];
				if (total + tmp > MAX_EV) tmp = MAX_EV - total;
				
				this[data[i[1]]] += data[i[0]];
				
				total += tmp;
				if(total >= MAX_EV) return;
			}
		}
	}
	
	public function levelUp(): {
		var movesLearned:Array<String>;
	} {
		var oldMaxHp = maxHp;
		
		level += 1;
		calculateStats();
		
		if (hp > 0) hp += maxHp - oldMaxHp;
		
		var data = GameData.getPokemonData(id);
		
		if (data.evolveLevel != null && level >= data.evolveLevel) {
			id = data.evolveTo;
			data = GameData.getPokemonData(id);
		}
		
		var learnset = data.learnset;
		var movesLearned = [];
		
		for (m in learnset) {
			if (GameData.getMoveData(m.move) == null) {
				Main.warn('Move "'+m.move+'" doesn\'t exist for '+GameData.getPokemonData(id).name);
				continue;
			}
			
			if (m.level == -1 && moves.indexOf(m.move) == -1) {
				// Moves that learn during an evolution
			}else if (m.level != level) {
				// Not on right level to learn this move
				continue;
			}
			
			var learnedMove:Bool = false;
			for (i in 0...MAX_MOVES) {
				if (moves[i] == null) {
					learnMove(i, m.move);
					movesLearned.push(m.move);
					learnedMove = true;
					break;
				}
			}
			
			if (!learnedMove) {
				battleStats.learnableMoves.push(m.move);
			}
		}
		
		return {
			movesLearned: movesLearned
		};
	}
}

typedef PokemonSave = {
	var id:String;
	var level:Int;
	var unique:String;
	var gender:Int;
	var ability:Int;
	var experience:Int;
	var nature:Int;
	var status:Int;
	var virus:Int;
	var shiny:Bool;
	var moves:Array<String>;
	var movesPP:Array<Int>;
	var movesMaxPP:Array<Int>;
	
	var hp:Int;
	
	var evHp:Int;
	var evAtk:Int;
	var evDef:Int;
	var evSpAtk:Int;
	var evSpDef:Int;
	var evSpeed:Int;
	
	var ivHp:Int;
	var ivAtk:Int;
	var ivDef:Int;
	var ivSpAtk:Int;
	var ivSpDef:Int;
	var ivSpeed:Int;
}

typedef PokemonBattleStats = {
	var learnableMoves:Array<String>;
	
	var atkPower:Int;
	var defPower:Int;
	var spAtkPower:Int;
	var spDefPower:Int;
	var speedPower:Int;
	var accuracy:Int;
	var evasion:Int;
};