var fs = require('fs');

var pokemonData = JSON.parse(fs.readFileSync('data/pokemon.json', 'utf8'));
var movesData = JSON.parse(fs.readFileSync('data/moves.json', 'utf8'));
var typeData = JSON.parse(fs.readFileSync('data/types.json', 'utf8'));


var cPokemonData = {};
for(var i in pokemonData){
	var d = pokemonData[i];
	var c = cPokemonData[i] = {
		name: d.name,
		type1: d.type1
	};
	
	if(d.type2) c.type2 = d.type2;
};

fs.writeFileSync('../site/data/pokemon.json', JSON.stringify(cPokemonData), 'utf8');
