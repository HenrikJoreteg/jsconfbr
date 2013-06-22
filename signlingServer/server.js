var io = require('socket.io').listen(3000, {'log level': 2}),
    users = {};

io.on('connection', function (client) { 
    client.on('id', function (name) {
        users[name] = client;
        client.name = name;
    });

    client.on('message', function (msg) { 
        var otherClient = users[msg.to];
        if (otherClient) { 
            delete msg.to;
            msg.from = client.name;
            otherClient.emit('message', msg);
        }
    });
});
