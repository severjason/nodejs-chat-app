const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const {generateMessage} = require('./utils/messages');
const {removeUser, addUser, getUser, getUsersInRoom} = require('./utils/users');

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT;
const publicDir = path.join(__dirname, '../public');

app.use(express.static(publicDir));

io.on('connection', (socket) => {

  socket.on('join', (options, cb) => {
    const {user, error} = addUser({id: socket.id, ...options});

    if (error) {
      return cb(error);
    }

    socket.join(user.room);
    socket.emit('message', generateMessage('Welcome!'));
    socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    cb();
  });

  socket.on('sendMessage', (message, cb) => {
    const user = getUser(socket.id);
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return cb('Profanity is not allowed!');
    }
    if (user) {
      io.to(user.room).emit('message', generateMessage(message, user.username));
      cb('Delivered!');
    }
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', generateMessage(`${user.username} has left!`));
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room),
      })
    }
  });

  socket.on('sendLocation', ({lat, lng}, cb) => {
    const user = getUser(socket.id);
    if (user) {
      io.to(user.room).emit('locationMessage', generateMessage(`https://google.com/maps?q=${lat},${lng}`, user.username));
      cb();
    }

  })
});

server.listen(PORT, () => {
  console.log(`Listening on ${PORT}`)
});
