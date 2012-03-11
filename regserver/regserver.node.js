var mongodb = require('mongodb');
var request = require('request');
var crypto = require('crypto');

var captchaPrivateKey = '6Lfxuc4SAAAAANJ74qlKAhY12SzZnp3XEcr9foed';
var captchaPublicKey = '6Lfxuc4SAAAAAJmKHMi1LS1DkjXj18CvHbd_geFW';

var server = new mongodb.Server("127.0.0.1", 27017, {});
var dbclient;
var accounts;

var MAX_ACCOUNTS = 200;

new mongodb.Db('pokemmo', server, {}).open(function (error, client) {
	if(error) throw error;
	dbclient = client;
	
	//dbclient.dropCollection('accounts');
	dbclient.createCollection('accounts', function(){
		accounts = new mongodb.Collection(dbclient, 'accounts');
		accounts.ensureIndex({username: 1}, {unique:true}, function(){});
		//createAccount('Sonyp', '280196aa', 'matheusavs3@gmail.com');
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
	
	if(!isEmail(email)){
		callback('invalid_email');
		return;
	}
	
	var passsalt = sha512(+new Date().getTime() + '#' + Math.random() + '#' + Math.random());
	var passhash = sha512(password, passsalt);
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
		var success = !!arr[0];
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
			
			verifyCaptcha(ip, data.challege, data.response, function(success, result){
				if(!success){
					socket.emit('registration', {result: 'invalid_captcha'});
					return;
				}
				
				createAccount(data.username, data.password, data.email, function(result){
					socket.emit('registration', {result: result});
				});
			});
		});
	});
}