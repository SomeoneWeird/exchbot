var irc = require('irc');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('users.sqlite');

var channel = "#exchbot";

var bot = new irc.Client('irc.freenode.net', 'ExchBot', {
	user: "exchbot",
});

bot.join(channel);

bot.addListener('message', function (from, to, message) { 

	if(!message.substring(0,1)=="$")
		return;

	 
	message = message.substring(1);
	console.log(message);
	var cmd = message.split(' ')[0];

	switch(cmd) {

		case "register": register(from, to, message);
			break;
		case "test": intserttest();
			break;

	}


});

function register(from, to, message) { 

	var args = message.split(" "),
	    nick = args[1],
	    gpg = args[2],
	    reg = 0;

	
	db.all("SELECT * FROM users WHERE nick = '" + nick + "' LIMIT 1;", function(err, rows) {
  		

  		rows.forEach(function (row) {
    		if(row!=undefined) { 
	    		bot.say(channel, from + ": This nick is already being used...");
	    		return;
	    	}
		});

  	});	

  	var stmt = db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?)");
	stmt.run(null, nick, gpg, null, null);

	db.all("SELECT * FROM users WHERE nick = '" + nick + "' LIMIT 1;", function(err, rows) {
  		
  		rows.forEach(function (row) {
    		if(row['nick']!=undefined) { 
	    		bot.say(channel, from + ": Successfully registered user " + nick + " with GPG key " + gpg); 
		    } else {
		    	bot.say(channel, from + ": There was an error registering, please try again later or contact an admin.");
		    }
		});

  	});	
		
}

function inserttest() {
	
	var stmt = db.prepare("INSERT INTO users VALUES (?, ?, ?, ?, ?);");
  	stmt.run(0, "test", "test", "", "");
  	stmt.finalize();

}


process.on('uncaughtException',function(error){

	console.log(error);

});
