import express from 'express';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';
import { rename } from 'node:fs'
import { Server } from 'socket.io';
import multer from 'multer'
import msgChar from './msgChar.mjs';
import userListChar from './userListChar.mjs'
import clearLogChar from './clearLogChar.mjs'

const app = express();
const server = createServer(app);
const io = new Server(server);
const uploads = multer({ dest: 'static/uploads/' });

// 给静态资源加上路由
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(express.static(join(__dirname, './static/')));

app.get('/room', (req, res) => {
  res.sendFile(join(__dirname, 'room.html'));
});

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// 处理文件上传
app.post('/upload', uploads.single('file'), (req, res) => {
  let ext = extname(req.file.originalname);
  let tmp = req.file.filename + ext;
  let OLD = join('./static/uploads', req.file.filename);
  let NEW = join('./static/uploads', tmp);
  rename(OLD, NEW, err => {});
  let oYes = 0;
  if(ext == '.png' || ext == '.jpg' || ext == '.jpeg' || ext == '.gif') 
    oYes = 1;
  res.send({
    yes: oYes,
    url: `uploads/${tmp}`,
    name: req.file.originalname
  });
});

// 用户存在判断 *无需实时，没用socket
app.get('/existUser', async (req, res) => {
  let data = await userListChar.find(req.query);
  if(data.length == 0) {
    res.send({yes: 0});
  } else {
    res.send({yes: 1});
  }
});

// 每日清空用户列表判断，无需实时，没用socket
app.get('/clearUser', async (req, res) => {
  let data = await clearLogChar.find(req.query);
  if(data.length == 0) {
    console.log(`${req.query.date} userList was clear!`);
    let data2 = new clearLogChar(req.query);
    await data2.save();
    await userListChar.deleteMany({});
    res.send({yes: 1});
  }
  else res.send({yes: 0});
});

// socket.io
io.on('connection', socket => {
  // 获取消息列表
  socket.on('pre', async msg => {
    let tmp = JSON.parse(msg);
    let res = await msgChar.find({room: tmp.room});
    io.emit('pre_res', JSON.stringify({
      msg: res, 
      room: tmp.room, 
      user: tmp.user
    }));
  });
  // 发送消息
  socket.on('send', async msg => {
    let tmp = JSON.parse(msg);
    console.log(`[${tmp.date}] [${tmp.room}] ${tmp.user}: ${tmp.msg}`);
    let data = new msgChar({
      user: tmp.user, 
      room: tmp.room, 
      msg: tmp.msg, 
      date: tmp.date
    });
    await data.save();
    io.emit('send_res', msg);
  });
  // 获取用户列表
  socket.on('all_user', async msg => {
    let data = await userListChar.find({room: msg});
    io.emit('all_user_res', JSON.stringify(data));
  });
  // 用户加入
  socket.on('add_user', async msg => {
    let tmp = JSON.parse(msg);
    console.log(`[${tmp.room}] ${tmp.user} was joining.`);
    let data = new userListChar({
      user: tmp.user, 
      room: tmp.room
    });
    await data.save();
    io.emit('add_user_res', msg);
  });
  // 用户退出
  socket.on('del_user', async msg => {
    let tmp = JSON.parse(msg);
    console.log(`[${tmp.room}] ${tmp.user} was leaving.`);
    await userListChar.findOneAndDelete({
      room: tmp.room, 
      user: tmp.user
    });
    io.emit('del_user_res', msg);
  });
});

// 监听3000端口
server.listen(3000, () => {
  console.log('Server running at http://localhost:3000!');
});
