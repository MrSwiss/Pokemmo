var VIRUS_NONE = 0;
var VIRUS_POKERUS = 1;


var NATURE_NONE = 0;

// NATURE_{stat increased}_{stat_decreased}
var NATURE_ATK_DEF = 1;
var NATURE_ATK_SPATK = 2;
var NATURE_ATK_SPDEF = 3;
var NATURE_ATK_SPEED = 4;

var NATURE_DEF_ATK = 5;
var NATURE_DEF_SPATK = 6;
var NATURE_DEF_SPDEF = 7;
var NATURE_DEF_SPEED = 8;

var NATURE_SPATK_ATK = 9;
var NATURE_SPATK_DEF = 10;
var NATURE_SPATK_SPDEF = 11;
var NATURE_SPATK_SPEED = 12;

var NATURE_SPDEF_ATK = 13;
var NATURE_SPDEF_DEF = 14;
var NATURE_SPDEF_SPATK = 15;
var NATURE_SPDEF_SPEED = 16;

var NATURE_SPEED_ATK = 17;
var NATURE_SPEED_DEF = 18;
var NATURE_SPEED_SPATK = 19;
var NATURE_SPEED_SPDEF = 20;

// NATURE_NONE_{stat_neutral}
var NATURE_NONE_ATK = 21;
var NATURE_NONE_DEF = 22;
var NATURE_NONE_SPATK = 23;
var NATURE_NONE_SPDEF = 24;
var NATURE_NONE_SPEED = 25;


function Pokemon(arg1, arg2){
	var self = this;
	
	var MAX_EV = 510;
	var MAX_INDIVIDUAL_EV = 255;
	
	self.battleStats = {};
	
	// Data to be sent to clients battling this pokemon
	self.publicInfo = {
		get id(){return self.id},
		get level(){return self.level},
		get hp(){return self.hp},
		get maxHp(){return self.maxHp},
		get unique(){return self.unique},
		get shiny(){return self.shiny},
		get gender(){return self.gender},
		get nickname(){return self.nickname},
		get status(){return self.status}
	};
	
	// Information available to the pokemon owner
	self.ownerInfo = {
		get id(){return self.id},
		get level(){return self.level},
		get hp(){return self.hp},
		get maxHp(){return self.maxHp},
		get unique(){return self.unique},
		get shiny(){return self.shiny},
		get gender(){return self.gender},
		get nickname(){return self.nickname},
		get status(){return self.status},
		
		get experience(){return self.experience},
		get experienceNeeded(){return self.experienceNeeded},
		get atk(){return self.atk},
		get def(){return self.def},
		get spAtk(){return self.spAtk},
		get spDef(){return self.spDef},
		get speed(){return self.speed},
		get ability(){return self.ability},
		get nature(){return self.nature},
		get moves(){return self.moves},
		get movesPP(){return self.movesPP},
		get movesMaxPP(){return self.movesMaxPP},
		get training(){return (self.evHp + self.evAtk + self.evDef + self.evSpAtk + self.evSpDef + self.evSpeed) / MAX_EV},
		get virus(){return self.virus}
	};
	
	self.getSaveObject = function(){
		return {
			id: self.id,
			level: self.level,
			unique: self.unique,
			gender: self.gender,
			ability: self.ability,
			experience: self.experience,
			nature: self.nature,
			status: self.status,
			virus: self.virus,
			shiny: self.shiny,
			moves: self.moves,
			movesPP: self.movesPP,
			movesMaxPP: self.movesMaxPP,
			
			hp: self.hp,
			
			evHp: self.evHp,
			evAtk: self.evAtk,
			evDef: self.evDef,
			evSpAtk: self.evSpAtk,
			evSpDef: self.evSpDef,
			evSpeed: self.evSpeed,
			
			ivHp: self.ivHp,
			ivAtk: self.ivAtk,
			ivDef: self.ivDef,
			ivSpAtk: self.ivSpAtk,
			ivSpDef: self.ivSpDef,
			ivSpeed: self.ivSpeed
		};
	}
	
	
	self.loadSaveObject = function(obj){
		for(var i in obj){
			self[i] = obj[i];
		}
		self.calculateStats();
	}
	
	self.calculateExpGain = function(isTrainer){
		return Math.ceil(((isTrainer ? 1.5 : 1) * pokemonData[self.id].baseExp * self.level) / 7);
	}
	
	self.addEV = function(data){
		var total = self.evHp + self.evAtk + self.evDef + self.SpAtk + self.evSpDef + self.evSpeed;
		var tmp;
		if(total >= MAX_EV) return;
		
		var evs = [
			['hp', 'evHp'],
			['atk', 'evAtk'],
			['def', 'evDef'],
			['spAtk', 'evSpAtk'],
			['spDef', 'evSpDef'],
			['speed', 'evSpeed']
		];
		
		for(var i in evs){
			if(data[evs[i][0]]){
				tmp = data[evs[i][0]];
				// If adding this ev will exceed the max total ev, lower the amount of given EV
				if(total + tmp > MAX_EV) tmp = MAX_EV - total;
				
				// Do not let it go over the maximum individual EV
				self[evs[i][1]] = Math.min(self[evs[i][1]] + tmp, MAX_INDIVIDUAL_EV);
				
				total += tmp;
				if(total >= MAX_EV) return;
			}
		}
	}
	
	self.calculateStats = function(){
		function calculateSingleStat(base, iv, ev){
			return (iv + (2 * base) + (ev / 4)) * self.level / 100 + 5;
		}
		
		self.maxHp = Math.floor((((self.ivHp + (2 * pokemonData[self.id].baseStats.hp)) + (self.evHp / 4) + 100) * self.level) / 100 + 10);
		self.atk = calculateSingleStat(pokemonData[self.id].baseStats.atk, self.ivAtk, self.evAtk);
		self.def = calculateSingleStat(pokemonData[self.id].baseStats.def, self.ivDef, self.evDef);
		self.spAtk = calculateSingleStat(pokemonData[self.id].baseStats.spAtk, self.ivSpAtk, self.evSpAtk);
		self.spDef = calculateSingleStat(pokemonData[self.id].baseStats.spDef, self.ivSpDef, self.evSpDef);
		self.speed = calculateSingleStat(pokemonData[self.id].baseStats.speed, self.ivSpeed, self.evSpeed);
		
		switch(self.nature){
			case NATURE_ATK_DEF: self.atk *= 1.1; self.def *= 0.9; break;
			case NATURE_ATK_SPATK: self.atk *= 1.1; self.spAtk *= 0.9; break;
			case NATURE_ATK_SPDEF: self.atk *= 1.1; self.spDef *= 0.9; break;
			case NATURE_ATK_SPEED: self.atk *= 1.1; self.speed *= 0.9; break;

			case NATURE_DEF_ATK: self.def *= 1.1; self.atk *= 0.9; break;
			case NATURE_DEF_SPATK: self.def *= 1.1; self.spAtk *= 0.9; break;
			case NATURE_DEF_SPDEF: self.def *= 1.1; self.spDef *= 0.9; break;
			case NATURE_DEF_SPEED: self.def *= 1.1; self.speed *= 0.9; break;

			case NATURE_SPATK_ATK: self.spAtk *= 1.1; self.atk *= 0.9; break;
			case NATURE_SPATK_DEF: self.spAtk *= 1.1; self.def *= 0.9; break;
			case NATURE_SPATK_SPDEF: self.spAtk *= 1.1; self.spDef *= 0.9; break;
			case NATURE_SPATK_SPEED: self.spAtk *= 1.1; self.speed *= 0.9; break;

			case NATURE_SPDEF_ATK: self.spDef *= 1.1; self.atk *= 0.9; break;
			case NATURE_SPDEF_DEF: self.spDef *= 1.1; self.def *= 0.9; break;
			case NATURE_SPDEF_SPATK: self.spDef *= 1.1; self.spAtk *= 0.9; break;
			case NATURE_SPDEF_SPEED: self.spDef *= 1.1; self.speed *= 0.9; break;

			case NATURE_SPEED_ATK: self.speed *= 1.1; self.atk *= 0.9; break;
			case NATURE_SPEED_DEF: self.speed *= 1.1; self.def *= 0.9; break;
			case NATURE_SPEED_SPATK: self.speed *= 1.1; self.spAtk *= 0.9; break;
			case NATURE_SPEED_SPDEF: self.speed *= 1.1; self.spDef *= 0.9; break;
		}
		
		self.atk = Math.floor(self.atk);
		self.def = Math.floor(self.def);
		self.spAtk = Math.floor(self.spAtk);
		self.spDef = Math.floor(self.spDef);
		self.speed = Math.floor(self.speed);
		
		if(self.level >= 100){
			self.experienceNeeded = 0;
		}else{
			self.experienceNeeded = experienceRequired[pokemonData[self.id].experienceCurve][self.level + 1];
		}
	}
	
	self.levelUp = function(){
		self.level += 1;
		self.calculateStats();
		
		if(self.battleStats){
			for(var i=0;i<learnset.length;++i){
				if(movesData[learnset[i].move] == null){
					console.warn('Move "'+learnset[i].move+'" doesn\'t exist for '+pokemonData[self.id].name);
					continue;
				}
				
				if(movesData[learnset[i].move].level != self.level) continue;
				self.battleStats.learnableMoves.push(learnset[i].move);
			}
		}
	}
	
	self.learnMove = function(slot, move){
		self.moves[slot] = move;
		self.movesMaxPP[slot] = self.movesPP[slot] = Number(movesData[move].pp);
	}
	
	self.getAbility = function(){
		if(self.ability == 0) return '';
		return pokemonData[self.id]['ability'+self.ability];
	}
	
	self.calculateCatch = function(ballValue, ballType){
		var chance = (3 * self.maxHp - 2 * self.hp) * pokemonData[self.id].catchRate;
		switch(ballType){
			case BALL_MULT:
				chance *= ballValue;
			break;
			case BALL_ADD:
				chance += ballValue;
			break;
		}
		chance /= 3 * self.maxHp;
		switch(self.status){
			case STATUS_SLEEP:
			case STATUS_FREEZE:
				chance *= 2;
			break;
			case STATUS_PARALYZE:
			case STATUS_POISON:
			case STATUS_BURN:
				chance *= 1.5;
			break;
		}
		
		return chance;
	}
	
	self.restore = function(){
		self.hp = self.maxHp;
		for(var i = 0; i < 4; ++i){
			self.movesPP[i] = self.movesMaxPP[i];
		}
	}
	
	self.getUsableMoves = function(){
		var list = [];
		for(var i=0;i<self.moves.length;++i){
			if(self.moves[i] == null) continue;
			if(self.movesPP[i] <= 0) continue;
			list.push(i);
		}
		return list;
	}
	
	if(arg1 && arg2 == null){
		self.loadSaveObject(arg1);
	}else{
		self.id = String(arg1);
		self.level = Math.min(Math.max(2, arg2), 100);
		
		self.unique = generateRandomString(16);
		
		self.nickname = null;
		self.gender = GENDER_UNKNOWN;
		
		if(Number(pokemonData[self.id].genderRatio) != -1){
			self.gender = (Math.random() < Number(pokemonData[self.id].genderRatio)) ? GENDER_MALE : GENDER_FEMALE;
		}
		
		self.hp = 0;
		self.maxHp = 0;
		self.atk = 0;
		self.def = 0;
		self.spAtk = 0;
		self.spDef = 0;
		self.speed = 0;
		
		self.ability = 0;
		self.nature = 1 + Math.floor(Math.random() * 25)
		
		// If it has 2 available abilities, choose one of them randomly
		if(pokemonData[self.id].ability2){
			self.ability = Math.floor(Math.random() * 2) + 1;
		}else if(pokemonData[self.id].ability1){
			self.ability = 1;
		}
		
		self.experience = 0;
		self.experienceNeeded = 0;
		
		self.evHp = 0;
		self.evAtk = 0;
		self.evDef = 0;
		self.evSpAtk = 0;
		self.evSpDef = 0;
		self.evSpeed = 0;
		
		self.ivHp = Math.floor(Math.random() * 32);
		self.ivAtk = Math.floor(Math.random() * 32);
		self.ivDef = Math.floor(Math.random() * 32);
		self.ivSpAtk = Math.floor(Math.random() * 32);
		self.ivSpDef = Math.floor(Math.random() * 32);
		self.ivSpeed = Math.floor(Math.random() * 32);
		
		self.status = STATUS_NONE;
		
		self.virus = VIRUS_NONE;
		
		self.shiny = (1/8192 > Math.random());
		self.moves = [null, null, null, null];
		self.movesPP = [0, 0, 0, 0];
		self.movesMaxPP = [0, 0, 0, 0];
		// Make it learn the 4 highest level moves for his level
		var j = 0;
		var learnset = pokemonData[self.id].learnset;
		for(var i=0;i<learnset.length;++i){
			if(movesData[learnset[i].move] == null){
				console.warn('Move "'+learnset[i].move+'" doesn\'t exist for '+pokemonData[self.id].name);
				continue;
			}
			if(learnset[i].level > self.level) continue;
			self.learnMove(j, learnset[i].move);
			
			j = (j+1) % 4;
		}
		
		self.calculateStats();
		self.hp = self.maxHp;
	}
}