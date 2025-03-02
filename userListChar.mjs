import mongoose from 'mongoose';

const conn = mongoose.createConnection('mongodb://127.0.0.1:27017/chatt');

const Schema = mongoose.Schema;

const userListSchema = new Schema({
  room: String, 
  user: String
});

const userListChar = conn.model('userList', userListSchema);

export default userListChar;
