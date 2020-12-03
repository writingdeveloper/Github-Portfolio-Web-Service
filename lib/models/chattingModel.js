const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.set('useCreateIndex', true)

const chattingsSchema = new Schema({
  roomName: String,
  chatReceiver: String,
  chatSender: String,
  chatMessage: String,
  chatNotice: Number,
  chatCreated: {
    type: Date,
    default: Date.now()
  }
});

module.exports = mongoose.model("chattings", chattingsSchema);