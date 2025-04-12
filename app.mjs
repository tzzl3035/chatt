import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import msgChar from './msgChar.mjs';
import userListChar from './userListChar.mjs'

const app = express();
const server = createServer(app);
const io = new Server(server);

const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(__dirname, './bootstrap-3.4.1-dist/')));

app.get('/room', (req, res) => {
  res.sendFile(join(__dirname, 'room.html'));
});

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

app.get('/existUser', async (req, res) => {
  let data = await userListChar.find(req.query);
  if(data.length == 0) {
    res.send({yes: 0});
  } else {
    res.send({yes: 1});
  }
});

io.on('connection', socket => {
  socket.on('pre', async msg => {
    let tmp = JSON.parse(msg);
    let res = await msgChar.find({room: tmp.room});
    io.emit('pre_res', JSON.stringify({
      msg: res, 
      room: tmp.room, 
      user: tmp.user
    }));
  });
  socket.on('send', async msg => {
    let tmp = JSON.parse(msg);
    let data = new msgChar({
      user: tmp.user, 
      room: tmp.room, 
      msg: tmp.msg, 
      date: tmp.date
    });
    await data.save();
    io.emit('send_res', msg);
  });
  socket.on('all_user', async msg => {
    let data = await userListChar.find({room: msg});
    io.emit('all_user_res', JSON.stringify(data));
  });
  socket.on('add_user', async msg => {
    let tmp = JSON.parse(msg);
    let data = new userListChar({
      user: tmp.user, 
      room: tmp.room
    });
    await data.save();
    io.emit('add_user_res', msg);
  });
  socket.on('del_user', async msg => {
    let tmp = JSON.parse(msg);
    await userListChar.findOneAndDelete({
      room: tmp.room, 
      user: tmp.user
    });
    io.emit('del_user_res', msg);
  });
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000!');
});
