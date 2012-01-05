var microtime = require('microtime');
var http = require('http');



function mtgox_getbalance(key, secret) { 

	return mtgox_base("info.php", key, secret);

}

function mtgox_base(path, key, secret) {


	// generate the extra headers 
	var header = array(	'Rest-Key: ' + key, 
						'Rest-Sign: ' + base64_encode(hash_hmac('sha512', post_data, base64_decode(secret), true)), );

	var options = {
  		host: 'https://mtgox.com',
  		port: 80,
  		path: '/api/0/' + path,
  		method: 'POST',
  		headers: header
	};


	// generate a nonce as microtime, with as-string handling to avoid problems with 32bits systems
	 
	var mt = microtime.now().split(' '); 
	var req['nonce'] = mt[1].substr(mt[0], 2, 6);   

	// generate the POST data string 
	var post_data = http_build_query(eq, '', '&');  
	 



	curl_setopt(ch, CURLOPT_POSTFIELDS, post_data); 
	curl_setopt(ch, CURLOPT_HTTPHEADER, headers);  
	 // run the query 
	 var res = curl_exec(ch);
	 if (res === false) console.log('Could not get reply: ' + curl_error(ch)); 

	 var dec = json_decode(res, true); 
	 if (!dec) console.log('Invalid data received, please make sure connection is working and requested API exists'); 
	 	return dec; 

	 
}