const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1:${port}`);

const io = socketio(app);

const users = {};

const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online`,
    };

    socket.name = data.name;
    socket.emit('msg', joinMsg);

    socket.join('room1');
    users[data.name] = data;
      
    //console.dir(users);

    const response = {
      name: 'server',
      msg: `${data.name} has joined the room.`,
    };

    socket.broadcast.to('room1').emit('msg', response);
    io.sockets.in('room1').emit('updateUserCount', `There are ${Object.keys(users).length} users online.`);

    console.log(`${data.name} joined`);

    socket.emit('msg', { name: 'server', msg: 'You joined the room' });
  });
};

const onMsg = (sock) => {
  const socket = sock;

  socket.on('msgToServer', (data) => {
      const cmd = data.msg.split(" ");
      if(cmd[0] === '/roll'){
          io.sockets.in('room1').emit('msg', { name: 'server', msg: `${socket.name} rolls a ${Math.floor(Math.random() * Math.floor(6)) + 1} on a 6-sided die`});
      }
      
      else if (cmd[0] === '/ping'){
          io.sockets.in('room1').emit('msg', { name: 'server', msg: `Pong!`});
      }
            
        else if(cmd[0] === '/me'){
            let toSend = "";
            for(let i = 1; i < cmd.length; i++){
                toSend += cmd[i] + " ";
            }
      io.sockets.in('room1').emit('msg', { name: 'server', msg: `${socket.name + " " + toSend}` });
  }
      
    else{
        io.sockets.in('room1').emit('msg', { name: socket.name, msg: data.msg });
    }
  });
};

const onDisconnect = (sock) => {
    const socket = sock;
    
    
    socket.on('disconnect', () => {
        io.sockets.in('room1').emit('msg', { name: 'server', msg: `${socket.name} has left the room.`});
        delete users[socket.name];
        io.sockets.in('room1').emit('updateUserCount', `There are ${Object.keys(users).length} users online.`);
    });
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');
