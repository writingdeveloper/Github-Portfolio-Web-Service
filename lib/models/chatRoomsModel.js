var mongoose = require("mongoose");
var Schema = mongoose.Schema;
mongoose.set('useCreateIndex', true)

const chatRoomsSchema = new Schema({
  roomName  : String,
  chatReceiver: String,
  chatSender: String,
  roomCreated: {
    type: Date,
    default: Date.now()
  }
});
console.log('chatRoomsSchema DB Connect!')

module.exports = mongoose.model("chatRooms", chatRoomsSchema);