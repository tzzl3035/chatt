import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Server } from 'socket.io';
import msgChar from './msgChar.mjs';

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

io.on('connection', socket => {
  socket.on('pre', async msg => {
    let res = await msgChar.find({room: msg});
    io.emit('pre_res', JSON.stringify(res));
  });
  socket.on('send', async msg => {
    let tmp = JSON.parse(msg);
    let data = new msgChar({
      user: tmp.user, 
      room: tmp.room, 
      msg: tmp.msg
    });
    await data.save();
    io.emit('send_res', msg);
  });
});

server.listen(3000, () => {
  console.log('Server running at http://localhost:3000!');
});
