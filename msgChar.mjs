import mongoose from 'mongoose';

const conn = mongoose.createConnection('mongodb://127.0.0.1:27017/chatt');

const Schema = mongoose.Schema;

const msgCharSchema = new Schema({
  user: String, 
  room: String, 
  msg: String
});

const msgChar = conn.model('msg', msgCharSchema);

export default msgChar;
