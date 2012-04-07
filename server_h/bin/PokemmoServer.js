$estr = function() { return js.Boot.__string_rec(this,''); }
if(typeof pokemmo_s=='undefined') pokemmo_s = {}
pokemmo_s.Client = function(socket) {
	if( socket === $_ ) return;
	this.socket = socket;
}
pokemmo_s.Client.__name__ = ["pokemmo_s","Client"];
pokemmo_s.Client.prototype.socket = null;
pokemmo_s.Client.prototype.disconnected = null;
pokemmo_s.Client.prototype.username = null;
pokemmo_s.Client.prototype.loaded = null;
pokemmo_s.Client.prototype.accountLevel = null;
pokemmo_s.Client.prototype.newAccount = null;
pokemmo_s.Client.prototype.money = null;
pokemmo_s.Client.prototype.pokemon = null;
pokemmo_s.Client.prototype.mapInstance = null;
pokemmo_s.Client.prototype.retransmitChar = null;
pokemmo_s.Client.prototype.charX = null;
pokemmo_s.Client.prototype.charY = null;
pokemmo_s.Client.prototype.charDirection = null;
pokemmo_s.Client.prototype.charLastX = null;
pokemmo_s.Client.prototype.charLastY = null;
pokemmo_s.Client.prototype.charType = null;
pokemmo_s.Client.prototype.respawnLocation = null;
pokemmo_s.Client.prototype.lastAckMove = null;
pokemmo_s.Client.prototype.__class__ = pokemmo_s.Client;
pokemmo_s.GameConst = function() { }
pokemmo_s.GameConst.__name__ = ["pokemmo_s","GameConst"];
pokemmo_s.GameConst.prototype.__class__ = pokemmo_s.GameConst;
if(typeof js=='undefined') js = {}
js.NodeC = function() { }
js.NodeC.__name__ = ["js","NodeC"];
js.NodeC.prototype.__class__ = js.NodeC;
js.Node = function() { }
js.Node.__name__ = ["js","Node"];
js.Node.require = null;
js.Node.querystring = null;
js.Node.util = null;
js.Node.fs = null;
js.Node.dgram = null;
js.Node.net = null;
js.Node.os = null;
js.Node.http = null;
js.Node.https = null;
js.Node.path = null;
js.Node.url = null;
js.Node.dns = null;
js.Node.vm = null;
js.Node.process = null;
js.Node.tty = null;
js.Node.assert = null;
js.Node.crypto = null;
js.Node.tls = null;
js.Node.repl = null;
js.Node.childProcess = null;
js.Node.console = null;
js.Node.cluster = null;
js.Node.setTimeout = null;
js.Node.clearTimeout = null;
js.Node.setInterval = null;
js.Node.clearInterval = null;
js.Node.global = null;
js.Node.__filename = null;
js.Node.__dirname = null;
js.Node.module = null;
js.Node.stringify = null;
js.Node.parse = null;
js.Node.queryString = null;
js.Node.newSocket = function(options) {
	return new js.Node.net.Socket(options);
}
js.Node.prototype.__class__ = js.Node;
pokemmo_s.GameData = function() { }
pokemmo_s.GameData.__name__ = ["pokemmo_s","GameData"];
pokemmo_s.GameData.pokemonData = null;
pokemmo_s.GameData.movesData = null;
pokemmo_s.GameData.typeData = null;
pokemmo_s.GameData.adminsData = null;
pokemmo_s.GameData.experienceRequired = null;
pokemmo_s.GameData.maps = null;
pokemmo_s.GameData.init = function() {
	pokemmo_s.GameData.pokemonData = pokemmo_s.Utils.recursiveFreeze(js.Node.parse(new EReg("//[^\n\r]*","gm").replace(js.Node.fs.readFileSync("data/pokemon.json","utf8"),"")));
	pokemmo_s.GameData.movesData = pokemmo_s.Utils.recursiveFreeze(js.Node.parse(js.Node.fs.readFileSync("data/moves.json","utf8")));
	pokemmo_s.GameData.typeData = pokemmo_s.Utils.recursiveFreeze(js.Node.parse(js.Node.fs.readFileSync("data/types.json","utf8")));
	pokemmo_s.GameData.adminsData = pokemmo_s.Utils.recursiveFreeze(js.Node.parse(js.Node.fs.readFileSync("data/admins.json","utf8")));
	pokemmo_s.GameData.experienceRequired = pokemmo_s.Utils.recursiveFreeze(js.Node.parse(js.Node.fs.readFileSync("data/experienceRequired.json","utf8")).experienceRequired);
	var _g = 0, _g1 = pokemmo_s.GameConst.LOAD_MAPS;
	while(_g < _g1.length) {
		var id = _g1[_g];
		++_g;
		pokemmo_s.GameData.maps[id] = new pokemmo_s.Map(id);
	}
}
pokemmo_s.GameData.getPokemonData = function(id) {
	return pokemmo_s.GameData.pokemonData[id];
}
pokemmo_s.GameData.getMoveData = function(move) {
	return pokemmo_s.GameData.movesData[move];
}
pokemmo_s.GameData.getExperienceRequired = function(curve,level) {
	return pokemmo_s.GameData.experienceRequired[pokemmo_s.GameData.curveIdToInt(curve)][level];
}
pokemmo_s.GameData.curveIdToInt = function(curve) {
	switch(curve) {
	case "erratic":
		return 0;
	case "fast":
		return 1;
	case "mediumFast":
		return 2;
	case "mediumSlow":
		return 3;
	case "slow":
		return 4;
	case "fluctuating":
		return 5;
	}
	throw "Invalid curve id: " + curve;
}
pokemmo_s.GameData.getMap = function(id) {
	return pokemmo_s.GameData.maps[id];
}
pokemmo_s.GameData.prototype.__class__ = pokemmo_s.GameData;
StringTools = function() { }
StringTools.__name__ = ["StringTools"];
StringTools.urlEncode = function(s) {
	return encodeURIComponent(s);
}
StringTools.urlDecode = function(s) {
	return decodeURIComponent(s.split("+").join(" "));
}
StringTools.htmlEscape = function(s) {
	return s.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
}
StringTools.htmlUnescape = function(s) {
	return s.split("&gt;").join(">").split("&lt;").join("<").split("&amp;").join("&");
}
StringTools.startsWith = function(s,start) {
	return s.length >= start.length && s.substr(0,start.length) == start;
}
StringTools.endsWith = function(s,end) {
	var elen = end.length;
	var slen = s.length;
	return slen >= elen && s.substr(slen - elen,elen) == end;
}
StringTools.isSpace = function(s,pos) {
	var c = s.charCodeAt(pos);
	return c >= 9 && c <= 13 || c == 32;
}
StringTools.ltrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,r)) r++;
	if(r > 0) return s.substr(r,l - r); else return s;
}
StringTools.rtrim = function(s) {
	var l = s.length;
	var r = 0;
	while(r < l && StringTools.isSpace(s,l - r - 1)) r++;
	if(r > 0) return s.substr(0,l - r); else return s;
}
StringTools.trim = function(s) {
	return StringTools.ltrim(StringTools.rtrim(s));
}
StringTools.rpad = function(s,c,l) {
	var sl = s.length;
	var cl = c.length;
	while(sl < l) if(l - sl < cl) {
		s += c.substr(0,l - sl);
		sl = l;
	} else {
		s += c;
		sl += cl;
	}
	return s;
}
StringTools.lpad = function(s,c,l) {
	var ns = "";
	var sl = s.length;
	if(sl >= l) return s;
	var cl = c.length;
	while(sl < l) if(l - sl < cl) {
		ns += c.substr(0,l - sl);
		sl = l;
	} else {
		ns += c;
		sl += cl;
	}
	return ns + s;
}
StringTools.replace = function(s,sub,by) {
	return s.split(sub).join(by);
}
StringTools.hex = function(n,digits) {
	var s = "";
	var hexChars = "0123456789ABCDEF";
	do {
		s = hexChars.charAt(n & 15) + s;
		n >>>= 4;
	} while(n > 0);
	if(digits != null) while(s.length < digits) s = "0" + s;
	return s;
}
StringTools.fastCodeAt = function(s,index) {
	return s.cca(index);
}
StringTools.isEOF = function(c) {
	return c != c;
}
StringTools.prototype.__class__ = StringTools;
Reflect = function() { }
Reflect.__name__ = ["Reflect"];
Reflect.hasField = function(o,field) {
	if(o.hasOwnProperty != null) return o.hasOwnProperty(field);
	var arr = Reflect.fields(o);
	var $it0 = arr.iterator();
	while( $it0.hasNext() ) {
		var t = $it0.next();
		if(t == field) return true;
	}
	return false;
}
Reflect.field = function(o,field) {
	var v = null;
	try {
		v = o[field];
	} catch( e ) {
	}
	return v;
}
Reflect.setField = function(o,field,value) {
	o[field] = value;
}
Reflect.callMethod = function(o,func,args) {
	return func.apply(o,args);
}
Reflect.fields = function(o) {
	if(o == null) return new Array();
	var a = new Array();
	if(o.hasOwnProperty) {
		for(var i in o) if( o.hasOwnProperty(i) ) a.push(i);
	} else {
		var t;
		try {
			t = o.__proto__;
		} catch( e ) {
			t = null;
		}
		if(t != null) o.__proto__ = null;
		for(var i in o) if( i != "__proto__" ) a.push(i);
		if(t != null) o.__proto__ = t;
	}
	return a;
}
Reflect.isFunction = function(f) {
	return typeof(f) == "function" && f.__name__ == null;
}
Reflect.compare = function(a,b) {
	return a == b?0:a > b?1:-1;
}
Reflect.compareMethods = function(f1,f2) {
	if(f1 == f2) return true;
	if(!Reflect.isFunction(f1) || !Reflect.isFunction(f2)) return false;
	return f1.scope == f2.scope && f1.method == f2.method && f1.method != null;
}
Reflect.isObject = function(v) {
	if(v == null) return false;
	var t = typeof(v);
	return t == "string" || t == "object" && !v.__enum__ || t == "function" && v.__name__ != null;
}
Reflect.deleteField = function(o,f) {
	if(!Reflect.hasField(o,f)) return false;
	delete(o[f]);
	return true;
}
Reflect.copy = function(o) {
	var o2 = { };
	var _g = 0, _g1 = Reflect.fields(o);
	while(_g < _g1.length) {
		var f = _g1[_g];
		++_g;
		o2[f] = Reflect.field(o,f);
	}
	return o2;
}
Reflect.makeVarArgs = function(f) {
	return function() {
		var a = new Array();
		var _g1 = 0, _g = arguments.length;
		while(_g1 < _g) {
			var i = _g1++;
			a.push(arguments[i]);
		}
		return f(a);
	};
}
Reflect.prototype.__class__ = Reflect;
pokemmo_s.Pokemon = function(p) {
	if( p === $_ ) return;
	this.resetBattleStats();
}
pokemmo_s.Pokemon.__name__ = ["pokemmo_s","Pokemon"];
pokemmo_s.Pokemon.prototype.id = null;
pokemmo_s.Pokemon.prototype.level = null;
pokemmo_s.Pokemon.prototype.unique = null;
pokemmo_s.Pokemon.prototype.nickname = null;
pokemmo_s.Pokemon.prototype.gender = null;
pokemmo_s.Pokemon.prototype.shiny = null;
pokemmo_s.Pokemon.prototype.hp = null;
pokemmo_s.Pokemon.prototype.maxHp = null;
pokemmo_s.Pokemon.prototype.atk = null;
pokemmo_s.Pokemon.prototype.def = null;
pokemmo_s.Pokemon.prototype.spAtk = null;
pokemmo_s.Pokemon.prototype.spDef = null;
pokemmo_s.Pokemon.prototype.speed = null;
pokemmo_s.Pokemon.prototype.ability = null;
pokemmo_s.Pokemon.prototype.nature = null;
pokemmo_s.Pokemon.prototype.experience = null;
pokemmo_s.Pokemon.prototype.experienceNeeded = null;
pokemmo_s.Pokemon.prototype.ivHp = null;
pokemmo_s.Pokemon.prototype.ivMaxHp = null;
pokemmo_s.Pokemon.prototype.ivAtk = null;
pokemmo_s.Pokemon.prototype.ivDef = null;
pokemmo_s.Pokemon.prototype.ivSpAtk = null;
pokemmo_s.Pokemon.prototype.ivSpDef = null;
pokemmo_s.Pokemon.prototype.ivSpeed = null;
pokemmo_s.Pokemon.prototype.evHp = null;
pokemmo_s.Pokemon.prototype.evMaxHp = null;
pokemmo_s.Pokemon.prototype.evAtk = null;
pokemmo_s.Pokemon.prototype.evDef = null;
pokemmo_s.Pokemon.prototype.evSpAtk = null;
pokemmo_s.Pokemon.prototype.evSpDef = null;
pokemmo_s.Pokemon.prototype.evSpeed = null;
pokemmo_s.Pokemon.prototype.status = null;
pokemmo_s.Pokemon.prototype.virus = null;
pokemmo_s.Pokemon.prototype.moves = null;
pokemmo_s.Pokemon.prototype.movesPP = null;
pokemmo_s.Pokemon.prototype.movesMaxPP = null;
pokemmo_s.Pokemon.prototype.battleStats = null;
pokemmo_s.Pokemon.prototype.resetBattleStats = function() {
	this.battleStats = { learnableMoves : []};
}
pokemmo_s.Pokemon.prototype.loadFromSave = function(sav) {
	var _g = 0, _g1 = Type.getClassFields(Type.resolveClass("PokemonSave"));
	while(_g < _g1.length) {
		var field = _g1[_g];
		++_g;
		this[field] = sav[field];
	}
}
pokemmo_s.Pokemon.prototype.createWild = function(id_,level_) {
	this.id = id_;
	this.level = level_;
	this.unique = pokemmo_s.Utils.createRandomString(16);
	if(pokemmo_s.GameData.pokemonData[this.id].genderRatio != -1) this.gender = Math.random() < pokemmo_s.GameData.pokemonData[this.id].genderRatio?1:2; else this.gender = 0;
	this.nature = 1 + Math.floor(25 * Math.random());
	if(pokemmo_s.GameData.pokemonData[this.id].ability2 != null) this.ability = 1 + Math.floor(2 * Math.random()); else if(pokemmo_s.GameData.pokemonData[this.id].ability1 != null) this.ability = 1; else this.ability = 0;
	this.experience = 0;
	this.hp = this.atk = this.def = this.spAtk = this.spDef = this.speed = 0;
	this.evHp = this.evAtk = this.evDef = this.evSpAtk = this.evSpDef = this.evSpeed = 0;
	this.ivHp = Math.floor(32 * Math.random());
	this.ivAtk = Math.floor(32 * Math.random());
	this.ivDef = Math.floor(32 * Math.random());
	this.ivSpAtk = Math.floor(32 * Math.random());
	this.ivSpDef = Math.floor(32 * Math.random());
	this.ivSpeed = Math.floor(32 * Math.random());
	this.status = 0;
	this.virus = 0;
	this.shiny = 1 / 8192 > Math.random();
	this.moves = [null,null,null,null];
	var j = 0;
	var _g = 0, _g1 = pokemmo_s.GameData.pokemonData[this.id].learnset;
	while(_g < _g1.length) {
		var i = _g1[_g];
		++_g;
		if(pokemmo_s.GameData.movesData[i.move] == null) {
			console.warn("Move \"" + i.move + "\" doesn't exist for \"" + pokemmo_s.GameData.pokemonData[this.id].name + "\"");
			continue;
		}
		if(i.level > this.level) continue;
		this.learnMove(j,i.move);
		j = (j + 1) % 4;
	}
	this.calculateStats();
	this.hp = this.maxHp;
	if(this.moves[0] == null) this.learnMove(0,"tackle");
	return this;
}
pokemmo_s.Pokemon.prototype.generateSave = function() {
	var sav = { };
	var _g = 0, _g1 = Type.getClassFields(Type.resolveClass("PokemonSave"));
	while(_g < _g1.length) {
		var field = _g1[_g];
		++_g;
		sav[field] = this[field];
	}
	return sav;
}
pokemmo_s.Pokemon.prototype.calculateCatch = function(ballType,ballValue) {
	var chance = (3 * this.maxHp - 2 * this.hp) * pokemmo_s.GameData.pokemonData[this.id].catchRate;
	switch(ballType) {
	case 0:
		chance *= ballValue;
		break;
	case 1:
		chance += ballValue;
		break;
	}
	chance /= 3 * this.maxHp;
	switch(this.status) {
	case 1:case 2:
		chance *= 2;
		break;
	case 3:case 4:case 5:
		chance *= 1.5;
		break;
	}
	return chance;
}
pokemmo_s.Pokemon.prototype.getAbility = function() {
	return this.ability == 0?"":pokemmo_s.GameData.pokemonData[this.id]["ability" + this.ability];
}
pokemmo_s.Pokemon.prototype.learnMove = function(slot,move) {
	this.moves[slot] = move;
	this.movesMaxPP[slot] = this.movesPP[slot] = pokemmo_s.GameData.movesData[move].pp;
}
pokemmo_s.Pokemon.prototype.calculateStats = function() {
	var me = this;
	var calculateSingleStat = function(base,iv,ev) {
		return (iv + 2 * base + ev / 4) * me.level / 100 + 5;
	};
	this.maxHp = Math.floor((this.ivHp + 2 * pokemmo_s.GameData.pokemonData[this.id].baseStats.hp + this.evHp / 4 + 100) * this.level / 100 + 10);
	var tatk = calculateSingleStat(pokemmo_s.GameData.pokemonData[this.id].baseStats.atk,this.ivAtk,this.evAtk);
	var tdef = calculateSingleStat(pokemmo_s.GameData.pokemonData[this.id].baseStats.def,this.ivDef,this.evDef);
	var tspAtk = calculateSingleStat(pokemmo_s.GameData.pokemonData[this.id].baseStats.spAtk,this.ivSpAtk,this.evSpAtk);
	var tspDef = calculateSingleStat(pokemmo_s.GameData.pokemonData[this.id].baseStats.spDef,this.ivSpDef,this.evSpDef);
	var tspeed = calculateSingleStat(pokemmo_s.GameData.pokemonData[this.id].baseStats.speed,this.ivSpeed,this.evSpeed);
	switch(this.nature) {
	case 1:
		tatk *= 1.1;
		tdef *= 0.9;
		break;
	case 2:
		tatk *= 1.1;
		tspAtk *= 0.9;
		break;
	case 3:
		tatk *= 1.1;
		tspDef *= 0.9;
		break;
	case 4:
		tatk *= 1.1;
		tspeed *= 0.9;
		break;
	case 5:
		tdef *= 1.1;
		tatk *= 0.9;
		break;
	case 6:
		tdef *= 1.1;
		tspAtk *= 0.9;
		break;
	case 7:
		tdef *= 1.1;
		tspDef *= 0.9;
		break;
	case 8:
		tdef *= 1.1;
		tspeed *= 0.9;
		break;
	case 9:
		tspAtk *= 1.1;
		tatk *= 0.9;
		break;
	case 10:
		tspAtk *= 1.1;
		tdef *= 0.9;
		break;
	case 11:
		tspAtk *= 1.1;
		tspDef *= 0.9;
		break;
	case 12:
		tspAtk *= 1.1;
		tspeed *= 0.9;
		break;
	case 13:
		tspDef *= 1.1;
		tatk *= 0.9;
		break;
	case 14:
		tspDef *= 1.1;
		tdef *= 0.9;
		break;
	case 15:
		tspDef *= 1.1;
		tspAtk *= 0.9;
		break;
	case 16:
		tspDef *= 1.1;
		tspeed *= 0.9;
		break;
	case 17:
		tspeed *= 1.1;
		tatk *= 0.9;
		break;
	case 18:
		tspeed *= 1.1;
		tdef *= 0.9;
		break;
	case 19:
		tspeed *= 1.1;
		tspAtk *= 0.9;
		break;
	case 20:
		tspeed *= 1.1;
		tspDef *= 0.9;
		break;
	}
	this.atk = Math.floor(tatk);
	this.def = Math.floor(tdef);
	this.spAtk = Math.floor(tspAtk);
	this.spDef = Math.floor(tspDef);
	this.speed = Math.floor(tspeed);
	if(this.level >= 100) this.experienceNeeded = 0; else this.experienceNeeded = pokemmo_s.GameData.experienceRequired[pokemmo_s.GameData.curveIdToInt(pokemmo_s.GameData.pokemonData[this.id].experienceCurve)][this.level];
}
pokemmo_s.Pokemon.prototype.restore = function() {
	this.hp = this.maxHp;
	var _g = 0;
	while(_g < 4) {
		var i = _g++;
		this.movesPP[i] = this.movesMaxPP[i];
	}
}
pokemmo_s.Pokemon.prototype.getUsableMoves = function() {
	var arr = [];
	var _g = 0;
	while(_g < 4) {
		var i = _g++;
		if(this.moves[i] == null) continue;
		if(this.movesPP[i] <= 0) continue;
		arr.push(this.moves[i]);
	}
	return arr;
}
pokemmo_s.Pokemon.prototype.calculateExpGain = function(isTrainer) {
	return Math.ceil((isTrainer?1.5:1) * pokemmo_s.GameData.pokemonData[this.id].baseExp * this.level / 7);
}
pokemmo_s.Pokemon.prototype.addEV = function(data) {
	var total = this.evHp + this.evAtk + this.evDef + this.evSpAtk + this.evSpDef + this.evSpeed;
	var tmp;
	if(total >= 510) return;
	var _g = 0, _g1 = [["hp","evHp"],["atk","evAtk"],["def","evDef"],["spAtk","evSpAtk"],["spDef","evSpDef"],["speed","evSpeed"]];
	while(_g < _g1.length) {
		var i = _g1[_g];
		++_g;
		if(data[i[0]] != null && data[i[0]] > 0) {
			tmp = data[i[0]];
			if(total + tmp > 510) tmp = 510 - total;
			this[data[i[1]]] += data[i[0]];
			total += tmp;
			if(total >= 510) return;
		}
	}
}
pokemmo_s.Pokemon.prototype.levelUp = function() {
	var oldMaxHp = this.maxHp;
	this.level += 1;
	this.calculateStats();
	if(this.hp > 0) this.hp += this.maxHp - oldMaxHp;
	var data = pokemmo_s.GameData.pokemonData[this.id];
	if(data.evolveLevel != null && this.level >= data.evolveLevel) {
		this.id = data.evolveTo;
		data = pokemmo_s.GameData.pokemonData[this.id];
	}
	var learnset = data.learnset;
	var movesLearned = [];
	var _g = 0;
	while(_g < learnset.length) {
		var m = learnset[_g];
		++_g;
		if(pokemmo_s.GameData.movesData[m.move] == null) {
			console.warn("Move \"" + m.move + "\" doesn't exist for " + pokemmo_s.GameData.pokemonData[this.id].name);
			continue;
		}
		if(m.level == -1 && this.moves.indexOf(m.move) == -1) {
		} else if(m.level != this.level) continue;
		var learnedMove = false;
		var _g1 = 0;
		while(_g1 < 4) {
			var i = _g1++;
			if(this.moves[i] == null) {
				this.learnMove(i,m.move);
				movesLearned.push(m.move);
				learnedMove = true;
				break;
			}
		}
		if(!learnedMove) this.battleStats.learnableMoves.push(m.move);
	}
	return { movesLearned : movesLearned};
}
pokemmo_s.Pokemon.prototype.__class__ = pokemmo_s.Pokemon;
pokemmo_s.Utils = function() { }
pokemmo_s.Utils.__name__ = ["pokemmo_s","Utils"];
pokemmo_s.Utils.createRandomString = function(len) {
	var i = len;
	var str = "";
	while(i-- > 0) str += pokemmo_s.exts.StringExt.getRandomChar("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ");
	return str;
}
pokemmo_s.Utils.randInt = function(min,max) {
	return min + Math.floor((max - min + 1) * Math.random());
}
pokemmo_s.Utils.recursiveFreeze = function(obj) {
	var rec = pokemmo_s.Utils.recursiveFreeze;
	for(var i in obj)if(typeof obj[i] == 'object')rec(obj[i]);Object.freeze(obj);;
	return obj;
}
pokemmo_s.Utils.sha512 = function(pass,salt) {
	var hasher = js.Node.crypto.createHash("sha512");
	if(salt == null) hasher.update(pass,"ascii"); else hasher.update(pass + "#" + salt,"ascii");
	return hasher.digest("base64");
}
pokemmo_s.Utils.prototype.__class__ = pokemmo_s.Utils;
pokemmo_s.Main = function() { }
pokemmo_s.Main.__name__ = ["pokemmo_s","Main"];
pokemmo_s.Main.main = function() {
	js.Node.assert.equal(pokemmo_s.GameData.experienceRequired[pokemmo_s.GameData.curveIdToInt("slow")][14],788);
	pokemmo_s.GameData.init();
	pokemmo_s.MasterConnector.connect(pokemmo_s.GameServer.start);
}
pokemmo_s.Main.log = function(obj) {
	console.log(obj);
}
pokemmo_s.Main.warn = function(obj) {
	console.warn(obj);
}
pokemmo_s.Main.error = function(obj) {
	console.error(obj);
}
pokemmo_s.Main.prototype.__class__ = pokemmo_s.Main;
pokemmo_s.MasterConnector = function() { }
pokemmo_s.MasterConnector.__name__ = ["pokemmo_s","MasterConnector"];
pokemmo_s.MasterConnector.mongodb = null;
pokemmo_s.MasterConnector.loggedInUsers = null;
pokemmo_s.MasterConnector.savingUsers = null;
pokemmo_s.MasterConnector.dbserver = null;
pokemmo_s.MasterConnector.dbclient = null;
pokemmo_s.MasterConnector.dbaccounts = null;
pokemmo_s.MasterConnector.dbchars = null;
pokemmo_s.MasterConnector.connect = function(func) {
	pokemmo_s.MasterConnector.mongodb = js.Node.require("mongodb");
	var tmongodb = pokemmo_s.MasterConnector.mongodb;
	pokemmo_s.MasterConnector.dbserver = new tmongodb.Server('127.0.0.1', 27017, { } );
	var tdbserver = pokemmo_s.MasterConnector.dbserver;
	new mdb.Db('pokemmo', tdbserver, {}).open(function(error,client) {
		if(error) throw error;
		var tdbclient = pokemmo_s.MasterConnector.dbclient = client;
		pokemmo_s.MasterConnector.dbclient.createCollection("accounts",function() {
			pokemmo_s.MasterConnector.dbaccounts = new mongodb.Collection(tdbclient, 'accounts');
			pokemmo_s.MasterConnector.dbaccounts.ensureIndex({ username : 1},{ unique : true},function() {
			});
			pokemmo_s.MasterConnector.dbaccounts.ensureIndex({ lcusername : 1},{ unique : true},function() {
			});
			pokemmo_s.MasterConnector.dbclient.createCollection("characters",function() {
				pokemmo_s.MasterConnector.dbchars = new mongodb.Collection(tdbclient, 'characters');
				pokemmo_s.MasterConnector.dbchars.ensureIndex({ username : 1},{ unique : true},function() {
				});
				func();
			});
		});
	},{ strict : true});
}
pokemmo_s.MasterConnector.isUser = function(username,func) {
	func(pokemmo_s.MasterConnector.savingUsers.indexOf(username) != -1);
}
pokemmo_s.MasterConnector.loginUser = function(username,password,func) {
	if(pokemmo_s.MasterConnector.savingUsers.indexOf(username) != -1 || pokemmo_s.MasterConnector.loggedInUsers.indexOf(username) != -1) {
		func("logged_in_already",null);
		return;
	}
	pokemmo_s.MasterConnector.dbaccounts.find({ lcusername : username.toLowerCase()},{ limit : 1}).toArray(function(err,docs) {
		if(err || docs.length == 0) {
			func("wrong_username",null);
			return;
		}
		var hashedpass = docs[0].password;
		var salt = docs[0].salt;
		pokemmo_s.MasterConnector.loggedInUsers.push(username);
		func(pokemmo_s.Utils.sha512(password,salt) == hashedpass?"success":"wrong_password",docs[0].username);
	});
}
pokemmo_s.MasterConnector.loadClient = function(username,func) {
	pokemmo_s.MasterConnector.dbchars.find({ username : username},{ limit : 1}).toArray(function(err,docs) {
		if(err) {
			js.Node.console.warn("Error while trying to load client char: " + err.message);
			func(false,null);
			return;
		}
		if(docs.length > 0) func(true,docs[0]); else func(false,null);
	});
}
pokemmo_s.MasterConnector.prototype.__class__ = pokemmo_s.MasterConnector;
StringBuf = function(p) {
	if( p === $_ ) return;
	this.b = new Array();
}
StringBuf.__name__ = ["StringBuf"];
StringBuf.prototype.add = function(x) {
	this.b[this.b.length] = x == null?"null":x;
}
StringBuf.prototype.addSub = function(s,pos,len) {
	this.b[this.b.length] = s.substr(pos,len);
}
StringBuf.prototype.addChar = function(c) {
	this.b[this.b.length] = String.fromCharCode(c);
}
StringBuf.prototype.toString = function() {
	return this.b.join("");
}
StringBuf.prototype.b = null;
StringBuf.prototype.__class__ = StringBuf;
pokemmo_s.MapInstance = function(map) {
	if( map === $_ ) return;
	this.map = map;
}
pokemmo_s.MapInstance.__name__ = ["pokemmo_s","MapInstance"];
pokemmo_s.MapInstance.prototype.map = null;
pokemmo_s.MapInstance.prototype.__class__ = pokemmo_s.MapInstance;
pokemmo_s.GameServer = function() { }
pokemmo_s.GameServer.__name__ = ["pokemmo_s","GameServer"];
pokemmo_s.GameServer.clients = null;
pokemmo_s.GameServer.start = function() {
	pokemmo_s.GameServer.clients = [];
	var io = js.Node.require("socket.io").listen(2828).set("close timeout",0).set("log level",0);
	io.sockets.on("connection",function(socket) {
		pokemmo_s.GameServer.clients.push(new pokemmo_s.Client(socket));
	});
}
pokemmo_s.GameServer.prototype.__class__ = pokemmo_s.GameServer;
if(!pokemmo_s.exts) pokemmo_s.exts = {}
pokemmo_s.exts.StringExt = function() { }
pokemmo_s.exts.StringExt.__name__ = ["pokemmo_s","exts","StringExt"];
pokemmo_s.exts.StringExt.getRandomChar = function(str) {
	return str.charAt(Math.floor(str.length * Math.random()));
}
pokemmo_s.exts.StringExt.prototype.__class__ = pokemmo_s.exts.StringExt;
if(typeof haxe=='undefined') haxe = {}
if(!haxe.io) haxe.io = {}
haxe.io.Bytes = function(length,b) {
	if( length === $_ ) return;
	this.length = length;
	this.b = b;
}
haxe.io.Bytes.__name__ = ["haxe","io","Bytes"];
haxe.io.Bytes.alloc = function(length) {
	var a = new Array();
	var _g = 0;
	while(_g < length) {
		var i = _g++;
		a.push(0);
	}
	return new haxe.io.Bytes(length,a);
}
haxe.io.Bytes.ofString = function(s) {
	var a = new Array();
	var _g1 = 0, _g = s.length;
	while(_g1 < _g) {
		var i = _g1++;
		var c = s.cca(i);
		if(c <= 127) a.push(c); else if(c <= 2047) {
			a.push(192 | c >> 6);
			a.push(128 | c & 63);
		} else if(c <= 65535) {
			a.push(224 | c >> 12);
			a.push(128 | c >> 6 & 63);
			a.push(128 | c & 63);
		} else {
			a.push(240 | c >> 18);
			a.push(128 | c >> 12 & 63);
			a.push(128 | c >> 6 & 63);
			a.push(128 | c & 63);
		}
	}
	return new haxe.io.Bytes(a.length,a);
}
haxe.io.Bytes.ofData = function(b) {
	return new haxe.io.Bytes(b.length,b);
}
haxe.io.Bytes.prototype.length = null;
haxe.io.Bytes.prototype.b = null;
haxe.io.Bytes.prototype.get = function(pos) {
	return this.b[pos];
}
haxe.io.Bytes.prototype.set = function(pos,v) {
	this.b[pos] = v & 255;
}
haxe.io.Bytes.prototype.blit = function(pos,src,srcpos,len) {
	if(pos < 0 || srcpos < 0 || len < 0 || pos + len > this.length || srcpos + len > src.length) throw haxe.io.Error.OutsideBounds;
	var b1 = this.b;
	var b2 = src.b;
	if(b1 == b2 && pos > srcpos) {
		var i = len;
		while(i > 0) {
			i--;
			b1[i + pos] = b2[i + srcpos];
		}
		return;
	}
	var _g = 0;
	while(_g < len) {
		var i = _g++;
		b1[i + pos] = b2[i + srcpos];
	}
}
haxe.io.Bytes.prototype.sub = function(pos,len) {
	if(pos < 0 || len < 0 || pos + len > this.length) throw haxe.io.Error.OutsideBounds;
	return new haxe.io.Bytes(len,this.b.slice(pos,pos + len));
}
haxe.io.Bytes.prototype.compare = function(other) {
	var b1 = this.b;
	var b2 = other.b;
	var len = this.length < other.length?this.length:other.length;
	var _g = 0;
	while(_g < len) {
		var i = _g++;
		if(b1[i] != b2[i]) return b1[i] - b2[i];
	}
	return this.length - other.length;
}
haxe.io.Bytes.prototype.readString = function(pos,len) {
	if(pos < 0 || len < 0 || pos + len > this.length) throw haxe.io.Error.OutsideBounds;
	var s = "";
	var b = this.b;
	var fcc = String.fromCharCode;
	var i = pos;
	var max = pos + len;
	while(i < max) {
		var c = b[i++];
		if(c < 128) {
			if(c == 0) break;
			s += fcc(c);
		} else if(c < 224) s += fcc((c & 63) << 6 | b[i++] & 127); else if(c < 240) {
			var c2 = b[i++];
			s += fcc((c & 31) << 12 | (c2 & 127) << 6 | b[i++] & 127);
		} else {
			var c2 = b[i++];
			var c3 = b[i++];
			s += fcc((c & 15) << 18 | (c2 & 127) << 12 | c3 << 6 & 127 | b[i++] & 127);
		}
	}
	return s;
}
haxe.io.Bytes.prototype.toString = function() {
	return this.readString(0,this.length);
}
haxe.io.Bytes.prototype.toHex = function() {
	var s = new StringBuf();
	var chars = [];
	var str = "0123456789abcdef";
	var _g1 = 0, _g = str.length;
	while(_g1 < _g) {
		var i = _g1++;
		chars.push(str.charCodeAt(i));
	}
	var _g1 = 0, _g = this.length;
	while(_g1 < _g) {
		var i = _g1++;
		var c = this.b[i];
		s.b[s.b.length] = String.fromCharCode(chars[c >> 4]);
		s.b[s.b.length] = String.fromCharCode(chars[c & 15]);
	}
	return s.b.join("");
}
haxe.io.Bytes.prototype.getData = function() {
	return this.b;
}
haxe.io.Bytes.prototype.__class__ = haxe.io.Bytes;
IntIter = function(min,max) {
	if( min === $_ ) return;
	this.min = min;
	this.max = max;
}
IntIter.__name__ = ["IntIter"];
IntIter.prototype.min = null;
IntIter.prototype.max = null;
IntIter.prototype.hasNext = function() {
	return this.min < this.max;
}
IntIter.prototype.next = function() {
	return this.min++;
}
IntIter.prototype.__class__ = IntIter;
haxe.io.Error = { __ename__ : ["haxe","io","Error"], __constructs__ : ["Blocked","Overflow","OutsideBounds","Custom"] }
haxe.io.Error.Blocked = ["Blocked",0];
haxe.io.Error.Blocked.toString = $estr;
haxe.io.Error.Blocked.__enum__ = haxe.io.Error;
haxe.io.Error.Overflow = ["Overflow",1];
haxe.io.Error.Overflow.toString = $estr;
haxe.io.Error.Overflow.__enum__ = haxe.io.Error;
haxe.io.Error.OutsideBounds = ["OutsideBounds",2];
haxe.io.Error.OutsideBounds.toString = $estr;
haxe.io.Error.OutsideBounds.__enum__ = haxe.io.Error;
haxe.io.Error.Custom = function(e) { var $x = ["Custom",3,e]; $x.__enum__ = haxe.io.Error; $x.toString = $estr; return $x; }
Std = function() { }
Std.__name__ = ["Std"];
Std["is"] = function(v,t) {
	return js.Boot.__instanceof(v,t);
}
Std.string = function(s) {
	return js.Boot.__string_rec(s,"");
}
Std["int"] = function(x) {
	if(x < 0) return Math.ceil(x);
	return Math.floor(x);
}
Std.parseInt = function(x) {
	var v = parseInt(x,10);
	if(v == 0 && x.charCodeAt(1) == 120) v = parseInt(x);
	if(isNaN(v)) return null;
	return v;
}
Std.parseFloat = function(x) {
	return parseFloat(x);
}
Std.random = function(x) {
	return Math.floor(Math.random() * x);
}
Std.prototype.__class__ = Std;
ValueType = { __ename__ : ["ValueType"], __constructs__ : ["TNull","TInt","TFloat","TBool","TObject","TFunction","TClass","TEnum","TUnknown"] }
ValueType.TNull = ["TNull",0];
ValueType.TNull.toString = $estr;
ValueType.TNull.__enum__ = ValueType;
ValueType.TInt = ["TInt",1];
ValueType.TInt.toString = $estr;
ValueType.TInt.__enum__ = ValueType;
ValueType.TFloat = ["TFloat",2];
ValueType.TFloat.toString = $estr;
ValueType.TFloat.__enum__ = ValueType;
ValueType.TBool = ["TBool",3];
ValueType.TBool.toString = $estr;
ValueType.TBool.__enum__ = ValueType;
ValueType.TObject = ["TObject",4];
ValueType.TObject.toString = $estr;
ValueType.TObject.__enum__ = ValueType;
ValueType.TFunction = ["TFunction",5];
ValueType.TFunction.toString = $estr;
ValueType.TFunction.__enum__ = ValueType;
ValueType.TClass = function(c) { var $x = ["TClass",6,c]; $x.__enum__ = ValueType; $x.toString = $estr; return $x; }
ValueType.TEnum = function(e) { var $x = ["TEnum",7,e]; $x.__enum__ = ValueType; $x.toString = $estr; return $x; }
ValueType.TUnknown = ["TUnknown",8];
ValueType.TUnknown.toString = $estr;
ValueType.TUnknown.__enum__ = ValueType;
Type = function() { }
Type.__name__ = ["Type"];
Type.getClass = function(o) {
	if(o == null) return null;
	if(o.__enum__ != null) return null;
	return o.__class__;
}
Type.getEnum = function(o) {
	if(o == null) return null;
	return o.__enum__;
}
Type.getSuperClass = function(c) {
	return c.__super__;
}
Type.getClassName = function(c) {
	var a = c.__name__;
	return a.join(".");
}
Type.getEnumName = function(e) {
	var a = e.__ename__;
	return a.join(".");
}
Type.resolveClass = function(name) {
	var cl;
	try {
		cl = eval(name);
	} catch( e ) {
		cl = null;
	}
	if(cl == null || cl.__name__ == null) return null;
	return cl;
}
Type.resolveEnum = function(name) {
	var e;
	try {
		e = eval(name);
	} catch( err ) {
		e = null;
	}
	if(e == null || e.__ename__ == null) return null;
	return e;
}
Type.createInstance = function(cl,args) {
	if(args.length <= 3) return new cl(args[0],args[1],args[2]);
	if(args.length > 8) throw "Too many arguments";
	return new cl(args[0],args[1],args[2],args[3],args[4],args[5],args[6],args[7]);
}
Type.createEmptyInstance = function(cl) {
	return new cl($_);
}
Type.createEnum = function(e,constr,params) {
	var f = Reflect.field(e,constr);
	if(f == null) throw "No such constructor " + constr;
	if(Reflect.isFunction(f)) {
		if(params == null) throw "Constructor " + constr + " need parameters";
		return f.apply(e,params);
	}
	if(params != null && params.length != 0) throw "Constructor " + constr + " does not need parameters";
	return f;
}
Type.createEnumIndex = function(e,index,params) {
	var c = e.__constructs__[index];
	if(c == null) throw index + " is not a valid enum constructor index";
	return Type.createEnum(e,c,params);
}
Type.getInstanceFields = function(c) {
	var a = Reflect.fields(c.prototype);
	a.remove("__class__");
	return a;
}
Type.getClassFields = function(c) {
	var a = Reflect.fields(c);
	a.remove("__name__");
	a.remove("__interfaces__");
	a.remove("__super__");
	a.remove("prototype");
	return a;
}
Type.getEnumConstructs = function(e) {
	var a = e.__constructs__;
	return a.copy();
}
Type["typeof"] = function(v) {
	switch(typeof(v)) {
	case "boolean":
		return ValueType.TBool;
	case "string":
		return ValueType.TClass(String);
	case "number":
		if(Math.ceil(v) == v % 2147483648.0) return ValueType.TInt;
		return ValueType.TFloat;
	case "object":
		if(v == null) return ValueType.TNull;
		var e = v.__enum__;
		if(e != null) return ValueType.TEnum(e);
		var c = v.__class__;
		if(c != null) return ValueType.TClass(c);
		return ValueType.TObject;
	case "function":
		if(v.__name__ != null) return ValueType.TObject;
		return ValueType.TFunction;
	case "undefined":
		return ValueType.TNull;
	default:
		return ValueType.TUnknown;
	}
}
Type.enumEq = function(a,b) {
	if(a == b) return true;
	try {
		if(a[0] != b[0]) return false;
		var _g1 = 2, _g = a.length;
		while(_g1 < _g) {
			var i = _g1++;
			if(!Type.enumEq(a[i],b[i])) return false;
		}
		var e = a.__enum__;
		if(e != b.__enum__ || e == null) return false;
	} catch( e ) {
		return false;
	}
	return true;
}
Type.enumConstructor = function(e) {
	return e[0];
}
Type.enumParameters = function(e) {
	return e.slice(2);
}
Type.enumIndex = function(e) {
	return e[1];
}
Type.prototype.__class__ = Type;
js.Lib = function() { }
js.Lib.__name__ = ["js","Lib"];
js.Lib.alert = function(v) {
	js.Node.console.log(js.Boot.__string_rec(v,""));
}
js.Lib.print = function(v) {
	console.log(v);
}
js.Lib.eval = function(code) {
	return eval(code);
}
js.Lib.setErrorHandler = function(f) {
	js.Lib.onerror = f;
}
js.Lib.prototype.__class__ = js.Lib;
js.Boot = function() { }
js.Boot.__name__ = ["js","Boot"];
js.Boot.__unhtml = function(s) {
	return s.split("&").join("&amp;").split("<").join("&lt;").split(">").join("&gt;");
}
js.Boot.__trace = function(v,i) {
	var msg = i != null?i.fileName + ":" + i.lineNumber + ": ":"";
	msg += js.Boot.__string_rec(v,"");
	js.Node.console.log(msg);
}
js.Boot.__clear_trace = function() {
	var d = document.getElementById("haxe:trace");
	if(d != null) d.innerHTML = "";
}
js.Boot.__closure = function(o,f) {
	var m = o[f];
	if(m == null) return null;
	var f1 = function() {
		return m.apply(o,arguments);
	};
	f1.scope = o;
	f1.method = m;
	return f1;
}
js.Boot.__string_rec = function(o,s) {
	if(o == null) return "null";
	if(s.length >= 5) return "<...>";
	var t = typeof(o);
	if(t == "function" && (o.__name__ != null || o.__ename__ != null)) t = "object";
	switch(t) {
	case "object":
		if(o instanceof Array) {
			if(o.__enum__ != null) {
				if(o.length == 2) return o[0];
				var str = o[0] + "(";
				s += "\t";
				var _g1 = 2, _g = o.length;
				while(_g1 < _g) {
					var i = _g1++;
					if(i != 2) str += "," + js.Boot.__string_rec(o[i],s); else str += js.Boot.__string_rec(o[i],s);
				}
				return str + ")";
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
			return str;
		}
		var tostr;
		try {
			tostr = o.toString;
		} catch( e ) {
			return "???";
		}
		if(tostr != null && tostr != Object.toString) {
			var s2 = o.toString();
			if(s2 != "[object Object]") return s2;
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
		return str;
	case "function":
		return "<function>";
	case "string":
		return o;
	default:
		return String(o);
	}
}
js.Boot.__interfLoop = function(cc,cl) {
	if(cc == null) return false;
	if(cc == cl) return true;
	var intf = cc.__interfaces__;
	if(intf != null) {
		var _g1 = 0, _g = intf.length;
		while(_g1 < _g) {
			var i = _g1++;
			var i1 = intf[i];
			if(i1 == cl || js.Boot.__interfLoop(i1,cl)) return true;
		}
	}
	return js.Boot.__interfLoop(cc.__super__,cl);
}
js.Boot.__instanceof = function(o,cl) {
	try {
		if(o instanceof cl) {
			if(cl == Array) return o.__enum__ == null;
			return true;
		}
		if(js.Boot.__interfLoop(o.__class__,cl)) return true;
	} catch( e ) {
		if(cl == null) return false;
	}
	switch(cl) {
	case Int:
		return Math.ceil(o%2147483648.0) === o;
	case Float:
		return typeof(o) == "number";
	case Bool:
		return o === true || o === false;
	case String:
		return typeof(o) == "string";
	case Dynamic:
		return true;
	default:
		if(o == null) return false;
		return o.__enum__ == cl || cl == Class && o.__name__ != null || cl == Enum && o.__ename__ != null;
	}
}
js.Boot.__init = function() {
	Array.prototype.copy = Array.prototype.slice;
	Array.prototype.insert = function(i,x) {
		this.splice(i,0,x);
	};
	Array.prototype.remove = Array.prototype.indexOf?function(obj) {
		var idx = this.indexOf(obj);
		if(idx == -1) return false;
		this.splice(idx,1);
		return true;
	}:function(obj) {
		var i = 0;
		var l = this.length;
		while(i < l) {
			if(this[i] == obj) {
				this.splice(i,1);
				return true;
			}
			i++;
		}
		return false;
	};
	Array.prototype.iterator = function() {
		return { cur : 0, arr : this, hasNext : function() {
			return this.cur < this.arr.length;
		}, next : function() {
			return this.arr[this.cur++];
		}};
	};
	if(String.prototype.cca == null) String.prototype.cca = String.prototype.charCodeAt;
	String.prototype.charCodeAt = function(i) {
		var x = this.cca(i);
		if(x != x) return null;
		return x;
	};
	var oldsub = String.prototype.substr;
	String.prototype.substr = function(pos,len) {
		if(pos != null && pos != 0 && len != null && len < 0) return "";
		if(len == null) len = this.length;
		if(pos < 0) {
			pos = this.length + pos;
			if(pos < 0) pos = 0;
		} else if(len < 0) len = this.length + len - pos;
		return oldsub.apply(this,[pos,len]);
	};
	Function.prototype["$bind"] = function(o) {
		var f = function() {
			return f.method.apply(f.scope,arguments);
		};
		f.scope = o;
		f.method = this;
		return f;
	};
	$closure = js.Boot.__closure;
}
js.Boot.prototype.__class__ = js.Boot;
EReg = function(r,opt) {
	if( r === $_ ) return;
	opt = opt.split("u").join("");
	this.r = new RegExp(r,opt);
}
EReg.__name__ = ["EReg"];
EReg.prototype.r = null;
EReg.prototype.match = function(s) {
	this.r.m = this.r.exec(s);
	this.r.s = s;
	this.r.l = RegExp.leftContext;
	this.r.r = RegExp.rightContext;
	return this.r.m != null;
}
EReg.prototype.matched = function(n) {
	return this.r.m != null && n >= 0 && n < this.r.m.length?this.r.m[n]:(function($this) {
		var $r;
		throw "EReg::matched";
		return $r;
	}(this));
}
EReg.prototype.matchedLeft = function() {
	if(this.r.m == null) throw "No string matched";
	if(this.r.l == null) return this.r.s.substr(0,this.r.m.index);
	return this.r.l;
}
EReg.prototype.matchedRight = function() {
	if(this.r.m == null) throw "No string matched";
	if(this.r.r == null) {
		var sz = this.r.m.index + this.r.m[0].length;
		return this.r.s.substr(sz,this.r.s.length - sz);
	}
	return this.r.r;
}
EReg.prototype.matchedPos = function() {
	if(this.r.m == null) throw "No string matched";
	return { pos : this.r.m.index, len : this.r.m[0].length};
}
EReg.prototype.split = function(s) {
	var d = "#__delim__#";
	return s.replace(this.r,d).split(d);
}
EReg.prototype.replace = function(s,by) {
	return s.replace(this.r,by);
}
EReg.prototype.customReplace = function(s,f) {
	var buf = new StringBuf();
	while(true) {
		if(!this.match(s)) break;
		buf.add(this.matchedLeft());
		buf.add(f(this));
		s = this.matchedRight();
	}
	buf.b[buf.b.length] = s == null?"null":s;
	return buf.b.join("");
}
EReg.prototype.__class__ = EReg;
pokemmo_s.Map = function(id) {
	if( id === $_ ) return;
	this.id = id;
	js.Node.process.stdout.write("Loading: " + id + "...");
	var sStart = Date.now().getTime();
	this.data = js.Node.parse(js.Node.fs.readFileSync("../site/resources/maps/" + id + ".json","utf8"));
	var _g = 0, _g1 = this.data.layers;
	while(_g < _g1.length) {
		var layer = _g1[_g];
		++_g;
		if(layer.type == "tilelayer") {
			if(layer.properties == null || layer.properties.data_layer != "1") continue;
			var j = 0;
			var twidth = this.data.width;
			var theight = this.data.height;
			this.solidData = new Array(twidth);
			var _g2 = 0;
			while(_g2 < twidth) {
				var x = _g2++;
				this.solidData[x] = new Array(height);
				var _g3 = 0;
				while(_g3 < theight) {
					var y = _g3++;
					this.solidData[x][y] = 0;
				}
			}
			var _g2 = 0;
			while(_g2 < twidth) {
				var x = _g2++;
				var _g3 = 0;
				while(_g3 < theight) {
					var y = _g3++;
					var tileid = layer.data[j];
					if(tileid == null || tileid == 0) continue;
					var tileset = this.getTilesetOfTile(tileid);
					if(tileset == null) "Tileset is null";
					var curTilesetTileid = tileid - tileset.firstgid;
					if(tileset.tileproperties[curTilesetTileid] != null) {
						if(tileset.tileproperties[curTilesetTileid].solid == "1") this.solidData[x][y] = 1;
						if(tileset.tileproperties[curTilesetTileid].water == "1") this.solidData[x][y] = 2;
						if(tileset.tileproperties[curTilesetTileid].ledge == "1") {
							this.solidData[x][y] = 3;
							if(tileset.tileproperties[curTilesetTileid].ledge_dir == "1") this.solidData[x][y] = 4; else if(tileset.tileproperties[curTilesetTileid].ledge_dir == "2") this.solidData[x][y] = 5; else if(tileset.tileproperties[curTilesetTileid].ledge_dir == "3") this.solidData[x][y] = 6;
						}
					}
				}
			}
		} else if(layer.type == "objectgroup") {
			var _g2 = 0, _g3 = layer.objects;
			try {
				while(_g2 < _g3.length) {
					var obj = _g3[_g2];
					++_g2;
					var x1 = Math.round(obj.x / this.data.tilewidth);
					var y1 = Math.round(obj.y / this.data.tileheight);
					var x2 = Math.round((obj.x + obj.width) / this.data.tilewidth);
					var y2 = Math.round((obj.y + obj.height) / this.data.tileheight);
					switch(obj.type) {
					case "tall_grass":
						var encounters = js.Node.parse("{\"tmp\":[" + obj.properties.encounters + "]}").tmp;
						this.encounterAreas.push({ x1 : x1, y1 : y1, x2 : x2, y2 : y2, encounters : encounters});
						throw "__break__";
						break;
					case "warp":
						this.warps.set(obj.name,{ x : x1, y : y1, type : obj.properties.type, destination : js.Node.parse(obj.properties.destination)});
						throw "__break__";
						break;
					case "point":
						this.points.set(obj.name,{ mapName : id, x : x1, y : y1, direction : obj.properties.direction == null?0:obj.properties.direction});
						throw "__break__";
						break;
					}
				}
			} catch( e ) { if( e != "__break__" ) throw e; }
		}
	}
	if(this.solidData == null) console.warn("Couldn't find data layer!");
	var sEnd = Date.now().getTime();
	js.Node.process.stdout.write(" (" + (sEnd - sStart) + " ms)\n");
}
pokemmo_s.Map.__name__ = ["pokemmo_s","Map"];
pokemmo_s.Map.prototype.id = null;
pokemmo_s.Map.prototype.data = null;
pokemmo_s.Map.prototype.width = null;
pokemmo_s.Map.prototype.height = null;
pokemmo_s.Map.prototype.solidData = null;
pokemmo_s.Map.prototype.encounterAreas = null;
pokemmo_s.Map.prototype.warps = null;
pokemmo_s.Map.prototype.points = null;
pokemmo_s.Map.prototype.getTilesetOfTile = function(n) {
	var i = this.data.tilesets.length;
	while(i-- > 0) if(n >= this.data.tilesets[i].firstgid) return this.data.tilesets[i];
	return null;
}
pokemmo_s.Map.prototype.__class__ = pokemmo_s.Map;
Hash = function(p) {
	if( p === $_ ) return;
	this.h = {}
	if(this.h.__proto__ != null) {
		this.h.__proto__ = null;
		delete(this.h.__proto__);
	}
}
Hash.__name__ = ["Hash"];
Hash.prototype.h = null;
Hash.prototype.set = function(key,value) {
	this.h["$" + key] = value;
}
Hash.prototype.get = function(key) {
	return this.h["$" + key];
}
Hash.prototype.exists = function(key) {
	try {
		key = "$" + key;
		return this.hasOwnProperty.call(this.h,key);
	} catch( e ) {
		for(var i in this.h) if( i == key ) return true;
		return false;
	}
}
Hash.prototype.remove = function(key) {
	if(!this.exists(key)) return false;
	delete(this.h["$" + key]);
	return true;
}
Hash.prototype.keys = function() {
	var a = new Array();
	for(var i in this.h) a.push(i.substr(1));
	return a.iterator();
}
Hash.prototype.iterator = function() {
	return { ref : this.h, it : this.keys(), hasNext : function() {
		return this.it.hasNext();
	}, next : function() {
		var i = this.it.next();
		return this.ref["$" + i];
	}};
}
Hash.prototype.toString = function() {
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
	return s.b.join("");
}
Hash.prototype.__class__ = Hash;
$_ = {}
js.Boot.__res = {}
js.Boot.__init();
{
	js.Node.__filename = __filename;
	js.Node.__dirname = __dirname;
	js.Node.setTimeout = setTimeout;
	js.Node.clearTimeout = clearTimeout;
	js.Node.setInterval = setInterval;
	js.Node.clearInterval = clearInterval;
	js.Node.global = global;
	js.Node.process = process;
	js.Node.require = require;
	js.Node.console = console;
	js.Node.module = module;
	js.Node.stringify = JSON.stringify;
	js.Node.parse = JSON.parse;
	js.Node.util = js.Node.require("util");
	js.Node.fs = js.Node.require("fs");
	js.Node.net = js.Node.require("net");
	js.Node.http = js.Node.require("http");
	js.Node.https = js.Node.require("https");
	js.Node.path = js.Node.require("path");
	js.Node.url = js.Node.require("url");
	js.Node.os = js.Node.require("os");
	js.Node.crypto = js.Node.require("crypto");
	js.Node.dns = js.Node.require("dns");
	js.Node.queryString = js.Node.require("querystring");
	js.Node.assert = js.Node.require("assert");
	js.Node.childProcess = js.Node.require("child_process");
	js.Node.vm = js.Node.require("vm");
	js.Node.tls = js.Node.require("tls");
	js.Node.dgram = js.Node.require("dgram");
	js.Node.assert = js.Node.require("assert");
	js.Node.repl = js.Node.require("repl");
	js.Node.cluster = js.Node.require("cluster");
}
{
	var d = Date;
	d.now = function() {
		return new Date();
	};
	d.fromTime = function(t) {
		var d1 = new Date();
		d1["setTime"](t);
		return d1;
	};
	d.fromString = function(s) {
		switch(s.length) {
		case 8:
			var k = s.split(":");
			var d1 = new Date();
			d1["setTime"](0);
			d1["setUTCHours"](k[0]);
			d1["setUTCMinutes"](k[1]);
			d1["setUTCSeconds"](k[2]);
			return d1;
		case 10:
			var k = s.split("-");
			return new Date(k[0],k[1] - 1,k[2],0,0,0);
		case 19:
			var k = s.split(" ");
			var y = k[0].split("-");
			var t = k[1].split(":");
			return new Date(y[0],y[1] - 1,y[2],t[0],t[1],t[2]);
		default:
			throw "Invalid date format : " + s;
		}
	};
	d.prototype["toString"] = function() {
		var date = this;
		var m = date.getMonth() + 1;
		var d1 = date.getDate();
		var h = date.getHours();
		var mi = date.getMinutes();
		var s = date.getSeconds();
		return date.getFullYear() + "-" + (m < 10?"0" + m:"" + m) + "-" + (d1 < 10?"0" + d1:"" + d1) + " " + (h < 10?"0" + h:"" + h) + ":" + (mi < 10?"0" + mi:"" + mi) + ":" + (s < 10?"0" + s:"" + s);
	};
	d.prototype.__class__ = d;
	d.__name__ = ["Date"];
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
	Math.__name__ = ["Math"];
	Math.NaN = Number["NaN"];
	Math.NEGATIVE_INFINITY = Number["NEGATIVE_INFINITY"];
	Math.POSITIVE_INFINITY = Number["POSITIVE_INFINITY"];
	Math.isFinite = function(i) {
		return isFinite(i);
	};
	Math.isNaN = function(i) {
		return isNaN(i);
	};
}
onerror = function(msg,url,line) {
		var f = js.Lib.onerror;
		if( f == null )
			return false;
		return f(msg,[url+":"+line]);
	}
pokemmo_s.GameConst.DIR_DOWN = 0;
pokemmo_s.GameConst.DIR_LEFT = 1;
pokemmo_s.GameConst.DIR_UP = 2;
pokemmo_s.GameConst.DIR_RIGHT = 3;
pokemmo_s.GameConst.LOAD_MAPS = ["pallet","pallet_hero_home_1f","pallet_hero_home_2f","pallet_oaklab","pallet_rival_home"];
js.NodeC.UTF8 = "utf8";
js.NodeC.ASCII = "ascii";
js.NodeC.BINARY = "binary";
js.NodeC.BASE64 = "base64";
js.NodeC.HEX = "hex";
js.NodeC.EVENT_EVENTEMITTER_NEWLISTENER = "newListener";
js.NodeC.EVENT_EVENTEMITTER_ERROR = "error";
js.NodeC.EVENT_STREAM_DATA = "data";
js.NodeC.EVENT_STREAM_END = "end";
js.NodeC.EVENT_STREAM_ERROR = "error";
js.NodeC.EVENT_STREAM_CLOSE = "close";
js.NodeC.EVENT_STREAM_DRAIN = "drain";
js.NodeC.EVENT_STREAM_CONNECT = "connect";
js.NodeC.EVENT_STREAM_SECURE = "secure";
js.NodeC.EVENT_STREAM_TIMEOUT = "timeout";
js.NodeC.EVENT_STREAM_PIPE = "pipe";
js.NodeC.EVENT_PROCESS_EXIT = "exit";
js.NodeC.EVENT_PROCESS_UNCAUGHTEXCEPTION = "uncaughtException";
js.NodeC.EVENT_PROCESS_SIGINT = "SIGINT";
js.NodeC.EVENT_PROCESS_SIGUSR1 = "SIGUSR1";
js.NodeC.EVENT_CHILDPROCESS_EXIT = "exit";
js.NodeC.EVENT_HTTPSERVER_REQUEST = "request";
js.NodeC.EVENT_HTTPSERVER_CONNECTION = "connection";
js.NodeC.EVENT_HTTPSERVER_CLOSE = "close";
js.NodeC.EVENT_HTTPSERVER_UPGRADE = "upgrade";
js.NodeC.EVENT_HTTPSERVER_CLIENTERROR = "clientError";
js.NodeC.EVENT_HTTPSERVERREQUEST_DATA = "data";
js.NodeC.EVENT_HTTPSERVERREQUEST_END = "end";
js.NodeC.EVENT_CLIENTREQUEST_RESPONSE = "response";
js.NodeC.EVENT_CLIENTRESPONSE_DATA = "data";
js.NodeC.EVENT_CLIENTRESPONSE_END = "end";
js.NodeC.EVENT_NETSERVER_CONNECTION = "connection";
js.NodeC.EVENT_NETSERVER_CLOSE = "close";
js.NodeC.FILE_READ = "r";
js.NodeC.FILE_READ_APPEND = "r+";
js.NodeC.FILE_WRITE = "w";
js.NodeC.FILE_WRITE_APPEND = "a+";
js.NodeC.FILE_READWRITE = "a";
js.NodeC.FILE_READWRITE_APPEND = "a+";
pokemmo_s.Pokemon.MAX_MOVES = 4;
pokemmo_s.Pokemon.STATUS_NONE = 0;
pokemmo_s.Pokemon.STATUS_SLEEP = 1;
pokemmo_s.Pokemon.STATUS_FREEZE = 2;
pokemmo_s.Pokemon.STATUS_PARALYZE = 3;
pokemmo_s.Pokemon.STATUS_POISON = 4;
pokemmo_s.Pokemon.STATUS_BURN = 5;
pokemmo_s.Pokemon.GENDER_UNKNOWN = 0;
pokemmo_s.Pokemon.GENDER_MALE = 1;
pokemmo_s.Pokemon.GENDER_FEMALE = 2;
pokemmo_s.Pokemon.VIRUS_NONE = 0;
pokemmo_s.Pokemon.VIRUS_POKERUS = 1;
pokemmo_s.Pokemon.NATURE_NONE = 0;
pokemmo_s.Pokemon.BALL_MULT = 0;
pokemmo_s.Pokemon.BALL_ADD = 1;
pokemmo_s.Pokemon.NATURE_ATK_DEF = 1;
pokemmo_s.Pokemon.NATURE_ATK_SPATK = 2;
pokemmo_s.Pokemon.NATURE_ATK_SPDEF = 3;
pokemmo_s.Pokemon.NATURE_ATK_SPEED = 4;
pokemmo_s.Pokemon.NATURE_DEF_ATK = 5;
pokemmo_s.Pokemon.NATURE_DEF_SPATK = 6;
pokemmo_s.Pokemon.NATURE_DEF_SPDEF = 7;
pokemmo_s.Pokemon.NATURE_DEF_SPEED = 8;
pokemmo_s.Pokemon.NATURE_SPATK_ATK = 9;
pokemmo_s.Pokemon.NATURE_SPATK_DEF = 10;
pokemmo_s.Pokemon.NATURE_SPATK_SPDEF = 11;
pokemmo_s.Pokemon.NATURE_SPATK_SPEED = 12;
pokemmo_s.Pokemon.NATURE_SPDEF_ATK = 13;
pokemmo_s.Pokemon.NATURE_SPDEF_DEF = 14;
pokemmo_s.Pokemon.NATURE_SPDEF_SPATK = 15;
pokemmo_s.Pokemon.NATURE_SPDEF_SPEED = 16;
pokemmo_s.Pokemon.NATURE_SPEED_ATK = 17;
pokemmo_s.Pokemon.NATURE_SPEED_DEF = 18;
pokemmo_s.Pokemon.NATURE_SPEED_SPATK = 19;
pokemmo_s.Pokemon.NATURE_SPEED_SPDEF = 20;
pokemmo_s.Pokemon.NATURE_NONE_ATK = 21;
pokemmo_s.Pokemon.NATURE_NONE_DEF = 22;
pokemmo_s.Pokemon.NATURE_NONE_SPATK = 23;
pokemmo_s.Pokemon.NATURE_NONE_SPDEF = 24;
pokemmo_s.Pokemon.NATURE_NONE_SPEED = 25;
pokemmo_s.Pokemon.MAX_EV = 510;
pokemmo_s.Pokemon.MAX_INDIVIDUAL_EV = 255;
js.Lib.onerror = null;
pokemmo_s.Map.SD_NONE = 0;
pokemmo_s.Map.SD_SOLID = 1;
pokemmo_s.Map.SD_WATER = 2;
pokemmo_s.Map.SD_LEDGE_DOWN = 3;
pokemmo_s.Map.SD_LEDGE_LEFT = 4;
pokemmo_s.Map.SD_LEDGE_UP = 5;
pokemmo_s.Map.SD_LEDGE_RIGHT = 6;
pokemmo_s.Map.LAYER_TILELAYER = "tilelayer";
pokemmo_s.Map.LAYER_OBJECTGROUP = "objectgroup";
pokemmo_s.Main.main()