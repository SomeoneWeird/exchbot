var irc = require('irc');

var channel = "#exchbot";

var bot = new irc.Client('irc.freenode.net', 'ExchBot', {
	user: "exchbot",
});

bot.join(channel);

bot.addListener('message', function (from, to, message) { 

	if(message.substring(0,1)=="$") { 
		message = message.substring(1);
		console.log(message);
	} else {
		return;
	}

	//console.log(message);
	//bot.say(channel, message);

	switch(message) {
		case "register": register(from, to, message);
			break;
	}

});

function register(from, to, message) { 

	var args = message.split(" ");
	var nick = args[1];
	var gpg = args[2];

	bot.say(channel, "registing " + nick + " with gpg key " + gpg);
	

		
}



process.on('uncaughtException',function(error){

	console.log(error);

});
