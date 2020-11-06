const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.set('useCreateIndex', true)

const chatRoomsSchema = new Schema({
  roomName: {
    type: String,
    unique: true
  },
  participant: {
    type: [String]
  },
  chatReceiver: String,
  chatSender: String,
  roomCreated: {
    type: Date,
    default: Date.now()
  }
});

module.exports = mongoose.model("chatrooms", chatRoomsSchema);