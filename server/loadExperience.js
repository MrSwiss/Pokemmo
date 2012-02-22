// Generate experience lookup table
// The table works as this: experienceRequired.fast[100] would be
// the experience that a level 99 pokémon needs to acquire to reach level 100
// (experience needed at level 99, not total)

var MAX_LEVEL = 100;
(function(){
	var arr, func;
	
	experienceRequired.erratic = arr = [0];
	for(var i=1;i<=100;++i){
		if(i <= 50){
			arr[i] = Math.round(i * i * i * (100 - i) / 50);
		}else if(i <= 68){
			arr[i] = Math.round(i * i * i * (150 - i) / 100);
		}else if(i <= 98){
			arr[i] = Math.round((i * i * i * ((1911 - 10 * i) / 3)) / 500);
		}else{
			arr[i] = Math.round(i * i * i * (160 - i) / 100);
		}
	}
	
	{
		var i = MAX_LEVEL + 1;
		while(i-- > 1){
			arr[i] -= arr[i - 1];
		}
	}
	
	experienceRequired.fast = arr = [0];
	for(var i=1;i<=MAX_LEVEL;++i){
		arr[i] = Math.round(4 * i * i * i / 5);
	}
	
	{
		var i = MAX_LEVEL + 1;
		while(i-- > 1){
			arr[i] -= arr[i - 1];
		}
	}
	
	experienceRequired.mediumFast = arr = [0];
	for(var i=1;i<=MAX_LEVEL;++i){
		arr[i] = Math.round(i * i * i);
	}
	
	{
		var i = MAX_LEVEL + 1;
		while(i-- > 1){
			arr[i] -= arr[i - 1];
		}
	}
	
	experienceRequired.mediumSlow = arr = [0];
	for(var i=1;i<=MAX_LEVEL;++i){
		arr[i] = Math.round(6 / 5 * i * i * i - 15 * i * i + 100 * i - 140);
	}
	
	{
		var i = MAX_LEVEL + 1;
		while(i-- > 1){
			arr[i] -= arr[i - 1];
		}
	}
	
	experienceRequired.slow = arr = [0];
	for(var i=1;i<=MAX_LEVEL;++i){
		arr[i] = Math.round(5 * i * i * i / 4);
	}
	
	{
		var i = MAX_LEVEL + 1;
		while(i-- > 1){
			arr[i] -= arr[i - 1];
		}
	}
	
	experienceRequired.fluctuating = arr = [0];
	for(var i=1;i<=MAX_LEVEL;++i){
		if(i <= 15){
			arr[i] = Math.round(i * i * i * (((i + 1) / 3 + 24) / 50));
		}else if(i <= 36){
			arr[i] = Math.round(i * i * i * ((i + 14) / 50));
		}else{
			arr[i] = Math.round(i * i * i * ((i / 2 + 32) / 50));
		}
	}
	
	{
		var i = MAX_LEVEL + 1;
		while(i-- > 1){
			arr[i] -= arr[i - 1];
		}
	}
})();