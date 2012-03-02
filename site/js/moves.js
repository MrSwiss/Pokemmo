
moves['def'] = (function(){
	function render(){
		var now = +new Date();
		
		if(battle.curAction.player == 0){
			battle.renderVars.dontRenderEnemy = (Math.floor((now - moveStartTime)/100) % 2) == 0;
			battle.renderVars.shakeEnemyStatus = true;
		}else{
			battle.renderVars.dontRenderPokemon = (Math.floor((now - moveStartTime)/100) % 2) == 0;
			battle.renderVars.shakePokemonStatus = true;
		}
		
		if(now - moveStartTime > 500){
			battle.renderVars.dontRenderEnemy = false;
			battle.renderVars.dontRenderPokemon = false;
			unHookRender(render);
			battleMoveFinish();
		}
	}
	
	return function(){
		hookRender(render);
	}
})();
