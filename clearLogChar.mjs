import mongoose from 'mongoose';

const conn = mongoose.createConnection('mongodb://127.0.0.1:27017/chatt');

const Schema = mongoose.Schema;

const clearLogSchema = new Schema({
  date: String
});

const clearLogChar = conn.model('clearLog', clearLogSchema);

export default clearLogChar;
