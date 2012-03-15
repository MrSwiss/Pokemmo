var mongodb = require('mongodb');
var request = require('request');
var crypto = require('crypto');

var captchaPrivateKey = '6Lfxuc4SAAAAANJ74qlKAhY12SzZnp3XEcr9foed';
var captchaPublicKey = '6Lfxuc4SAAAAAJmKHMi1LS1DkjXj18CvHbd_geFW';

var server = new mongodb.Server("127.0.0.1", 27017, {});
var dbclient;
var accounts;

var MAX_ACCOUNTS = 200;

var lastRegisteredIPs = [];

Array.prototype.remove = function(e){
	var i = 0;
	var arr = this;
	
	while((i = arr.indexOf(e, i)) != -1){
		arr.splice(i, 1);
		return true;
	}
	
	return false;
};

new mongodb.Db('pokemmo', server, {}).open(function (error, client) {
	if(error) throw error;
	dbclient = client;
	
	dbclient.createCollection('accounts', function(){
		accounts = new mongodb.Collection(dbclient, 'accounts');
		accounts.ensureIndex({username: 1}, {unique:true}, function(){});
		accounts.ensureIndex({lcusername: 1}, {unique:true}, function(){});
		startIO();
	});
	
	
}, {strict:true});

function createAccount(username, password, email, callback){
	callback = callback || function(){};
	if(username.length < 4){
		callback('short_username');
		return;
	}
	if(username.length > 10){
		callback('long_username');
		return;
	}
	if(!(/^[a-zA-Z0-9_]{1,10}$/).test(username)){
		callback('invalid_username');
		return;
	}
	if(password.length < 8){
		callback('short_password');
		return;
	}
	if(password.length > 32){
		callback('long_password');
		return;
	}
	if(!(/^[a-zA-Z0-9_!@#$%&*\(\)\[\]\{\}.,:;-]+$/).test(password)){
		callback('invalid_password');
		return;
	}
	
	if(email.length > 100 || !isEmail(email)){
		callback('invalid_email');
		return;
	}
	
	var passsalt = sha512(+new Date().getTime() + '#' + Math.random() + '#' + Math.random());
	var passhash = sha512(password, passsalt);
	
	accounts.count(function(err, count) {
		if(err){
			console.warn(err.message);
			callback('internal_error');
			return;
		}
		
		if(count >= MAX_ACCOUNTS){
			callback('registration_disabled');
			return;
		}
		
		accounts.find({email: email}, {limit: 1}).count(function(err, count){
			if(err){
				console.warn(err.message);
				callback('internal_error');
				return;
			}
			
			if(count > 0){
				callback('email_already_registered');
				return;
			}
			
			accounts.insert({username: username, lcusername: username.toLowerCase(), password: passhash, email: email, salt: passsalt}, {safe: true}, function(err, objects) {
				if(err){
					if(err.code == 11000){
						callback('username_already_exists');
						return;
					}
					console.warn(err.message);
					callback('internal_error');
					return;
				}
				
				callback('success');
			});
		});
	});
}

function sha512(pass, salt){
	var hasher = crypto.createHash('sha512');
	if(salt){
		hasher.update(pass+'#'+salt, 'ascii');
	}else{
		hasher.update(pass, 'ascii');
	}
	return hasher.digest('base64');
}

function isEmail(str){
	return (/^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/).test(str);
}

function verifyCaptcha(ip, challenge, response, callback){
	request({
		url: 'http://www.google.com/recaptcha/api/verify',
		method: 'POST',
		form: {
			'privatekey': captchaPrivateKey,
			'remoteip': ip,
			'challenge': challenge,
			'response': response
		},
	}, function(err, response, str){
		var arr = str.split('\n');
		var success = arr[0] == 'true';
		var result = arr[1];
		callback(success, result);
	});
}

function startIO(){
	accounts.count(function(err, count) {
		console.log('Registered accounts: '+count);
	});
	
	var io = require('socket.io').listen(2827).set('close timeout', 0).set('log level', 3);
	io.sockets.on('connection', function (socket) {
		var ip = socket.handshake.address.address;
		socket.on('register', function(data){
			if(data.username == null || data.password == null || data.challenge == null || data.response == null || data.email == null) return;
			
			if(lastRegisteredIPs.indexOf(ip) !== -1){
				socket.emit('registration', {result: 'registered_recently'});
				return;
			}
			
			verifyCaptcha(ip, data.challenge, data.response, function(success, result){
				if(!success){
					socket.emit('registration', {result: 'invalid_captcha'});
					return;
				}
				
				createAccount(data.username, data.password, data.email, function(result){
					if(result == 'success'){
						lastRegisteredIPs.push(ip);
						setTimeout(function(){lastRegisteredIPs.remove(ip);}, 60 * 60 * 1000);
					}
					socket.emit('registration', {result: result});
				});
			});
		});
	});
}