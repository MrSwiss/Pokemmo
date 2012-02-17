// Generate experience lookup table
// The table works as this: experienceRequired.fast[100] would be
// the experience that a level 99 pokémon needs to acquire to reach level 100
// (experience needed at level 99, not total)
(function(){
	var arr;
	
	experienceRequired.erratic = arr = [0];
	for(var i=1;i<=100;++i){
		if(i <= 50){
			arr[i] = i * i * i * (100 - i) / 50;
		}else if(n <= 68){
			arr[i] = i * i * i * (150 - i) / 100;
		}else if(n <= 98){
			arr[i] = i * i * i * ((1911 - 10 * i) / 3) / 500
		}else{
			arr[i] = i * i * i * (160 - n) / 100;
		}
	}
	
	experienceRequired.fast = arr = [0];
	for(var i=1;i<=100;++i){
		arr[i] = 4 * i * i * i / 5 - arr[i - 1];
		
		arr[i] = Math.floor(arr[i]);
	}
	
	experienceRequired.mediumFast = arr = [0];
	for(var i=1;i<=100;++i){
		arr[i] = i * i * i - arr[i - 1];
		
		arr[i] = Math.floor(arr[i]);
	}
	
	experienceRequired.mediumSlow = arr = [0];
	for(var i=1;i<=100;++i){
		arr[i] = 6 / 5 * i * i * i - 15 * i * i + 100 * i - 140 - arr[i - 1];
		
		arr[i] = Math.floor(arr[i]);
	}
	
	experienceRequired.slow = arr = [0];
	for(var i=1;i<=100;++i){
		arr[i] = 5 * i * i * i / 4 - arr[i - 1];
		
		arr[i] = Math.floor(arr[i]);
	}
	
	experienceRequired.fluctuating = arr = [0];
	for(var i=1;i<=100;++i){
		if(n <= 15){
			arr[i] = i * i * i * (((n + 1) / 3 + 24) / 50);
		}else if(n <= 36){
			arr[i] = i * i * i * ((n + 14) / 50);
		}else{
			arr[i] = i * i * i * ((n / 2 + 32) / 50)
		}
		
		arr[i] = Math.floor(arr[i]);
	}
})();