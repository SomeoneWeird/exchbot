var irc = require('irc');
var util = require('util');
var exec = require('child_process').exec;
var mysql = require('db-mysql');
var db = new mysql.Database({
					hostname: 'localhost',
					user: 'exchbot',
					password: 'exchbot',
					database: 'exchbot'
			})





// Setup IRC bot.

var channel = "#exchbot";

var bot = new irc.Client('irc.freenode.net', 'ExchBot', {
	user: "exchbot",
});

bot.join(channel);

// Set Database events.

db.on('error', function(error) {
    console.log('ERROR: ' + error);
});

db.on('ready', function(server) {
    console.log('Connected to database.');
});

// Connect to database

db.connect();

// Add IRC listeners

bot.addListener('message', function (from, to, message) { 

	if(!message.substring(0,1)=="$")
		return;

	 
	console.log(message);
	message = message.substring(1);
	var cmd = message.split(' ')[0];

	switch(cmd) {

		case "register": register(from, to, message);
			break;
		//case "login": requestauth(from, to, message);
		//	break;
		case "test": inserttest();
			break;

	}


});

function register(from, to, message) { 

	var args = message.split(" "),
	    nick = args[1],
	    gpg = args[2];

	if(!((gpg.length==8)||(gpg.length==16))){
		bot.say(channel, from + ": Invalid GPG Length, please submit your 8 or 16 Key ID.");
	} else {
			    
		if(getPGPkey(gpg)==1) {
			
			db.query().
	        select('*').
	        from('users').
	        where('nick = ?', [ nick ]).
	        execute(function(error, rows, cols) {

	                if (error) {
	                        console.log('ERROR: ' + error);
	                        return;
	                }

	                if(rows.length==0) {
	                	
	                	db.query().
			        		insert('users',
			            		[ 'nick', 'gpgkey' ],
			            		[ nick, gpg ]
			        		).
			        		execute(function(error, result) {
			                	if (error) {
			                        console.log('ERROR: ' + error);
			                        return;
			                	} else {
			                		console.log('GENERATED id: ' + result.id);
			                		bot.say(channel, from + ": Successfully registered.");
								}
			       			});

	                } else {

	                	bot.say(channel, from + ": Nickname already in use, please try again.");

	                }

	                
	        });
	    
		}

	}
		
}


function inserttest() {
	
	var stmt = db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?);");
  	stmt.run(null, "test", "test", "", "");
  	stmt.finalize();

}

// Retrieve GPG key from mit.pgp.edu

function getGPGkey(keyid) {
	
	var process = exec("gpg --keyserver pgp.mit.edu --recv-key 0x" + keyid, function(err, stdout, stderr) {
		
		if(!((err)||(stderr))) {
			return 1;
		}
		console.log(stdout);
		return 0;

	});

}

// Catch exceptions

process.on('uncaughtException',function(error){

	console.log(error);

});
