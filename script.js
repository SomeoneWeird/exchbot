var irc = require('irc');
var util = require('util');
var exec = require('child_process').exec;
var mysql = require('db-mysql');
var spawn = require('child_process').spawn;
var carrier = require('carrier');
var microtime = require('microtime');
var gist = require('gist');
var mtgoxAPI = require('./mtgox.js');
var mtgox = new mtgoxAPI({key : 'key', secret : 'secret'}); // yeah... remind me not to commit my api secret next time...

var db = new mysql.Database({
					hostname: 'localhost',
					user: 'exchbot',
					password: 'exchbot',
					database: 'exchbot'
			})


var users = new Array();


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

	if(!message.substring(0,1)=="\$")
		return;

	message = message.substring(1);
	var cmd = message.split(' ')[0];

	switch(cmd) {

		case "register": register(from, to, message);
			break;
		case "login": requestauth(from, to, message);
			break;
		case "verify": verifyauth(from, to, message);
			break;
		case "logout": logout(from);
			break;
		case "rollcall": rollcall(from);
			break;
	
	}


});

// Check if users logged in...

function isLoggedIn(from) {
	
	for(var i = 0; i < users.length; i++) {
		if(loggedin[i].user==from) {
			return true;
		}
		return false;
	}
}

function register(from, to, message) { 

	var args = message.split(" "),
	    nick = args[1],
	    gpg = args[2],
	    email = args[3];

	if(!((gpg.length==8)||(gpg.length==16))){
		bot.say(channel, from + ": Invalid GPG Length, please submit your 8 or 16 character Key ID.");
	} else {
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
			            		[ 'nick', 'gpgkey', 'email' ],
			            		[ nick, gpg, email ]
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

// Request GPG authentication string

function requestauth(from, to, message) {

	var args = message.split(" "),
	    nick = args[1],
		nonce = Math.floor(Math.random()*1000000000000001),
	    verifystring = nick + ":exchbot:" + microtime.now() + ":" + nonce;

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
			                	bot.say(channel, from + ": No such nickname, please register.");
			                	return; 
			                }
			                
			                console.log(verifystring);
			               	exec("echo \"" + verifystring + "\" > " + nick + ".txt");
			                db.query().update('users').set({ 'verify': verifystring }).where('nick = ?', [nick]).execute(function(error, result) { if(error) console.log(err); });
			               	exec('gpg -ae -r ' + rows[0].email + ' ' + nick + ".txt");
							var proc = spawn('cat', [nick + ".txt.asc"]), my_carrier, out;
							my_carrier = carrier.carry(proc.stdout);
							my_carrier.on('line', function(line) {
								out += line + "\n";
							});
							my_carrier.on('end', function(a) {
								gist.create(out, function (url) {
  								bot.say(channel, from + ": " + url);
							});

							exec("rm " + nick + ".txt " + nick + ".txt.asc");
					});
	                
	        });
	    
}

function verifyauth(from, to, message) {
	
		var args = message.split(" "),
	    verify = args[1],
		temp = verify.split(":"),
	    nick = temp[0];

	    db.query().
	    	select("*").
	    		from('users').
	    			where("nick = ?", [ nick ] ).
	    				execute(function(error, rows, cols) {
	    					if(error) {
	    						console.log(error);
	    						return;
	    					} else if(rows.length>1) {
	    						bot.say(channel, from + ": There seems to be more than 1 of that nick in the database, please contact an admin.");
	    						return;
	    					} else if(rows.length==1) {
	    						
	    						if(rows[0].verify==verify) {
	    							bot.say(channel, from + ": You are now logged in..");
	    							login(nick, from);
	    							db.query().update('users').set({ 'verify': ''}).where("nick = ?", [ nick ]).execute(function(err, rows, cols) { if(err) console.log(err); });
	    						} else {
	    							bot.say(channel, from + ": Invalid verification string.");
	    						}

	    					} else {
	    						bot.say(channel, from + ": Something went wrong, please try again later.");
	    					}

	    				});


}

// Actually log person in..

function login(nick, from) {
	
	var user = new Object();
	user.nick = nick;
	user.user = from;
	users.push(JSON.stringify(user)); 

}

// Log the user out...

function logout(nick) {
	users.pop(nick);
	bot.say(channel, nick + ": You are now logged out.");
}

// Catch exceptions

process.on('uncaughtException',function(error){

	console.log(error);

});
