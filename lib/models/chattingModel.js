const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.set('useCreateIndex', true)

const chattingsSchema = new Schema({
  roomName: String,
  chatReceiver: String,
  chatSender: String,
  chatMessage: String,
  chatNotice: {
    type: Number,
    default: 1
  },
  chatCreated: {
    type: Date,
    default: Date.now()
  }
});
console.log('chattingsSchema DB Connect!')

module.exports = mongoose.model("chattings", chattingsSchema);