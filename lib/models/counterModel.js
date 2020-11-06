const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.set('useCreateIndex', true)

const counterSchema = new Schema({
  count : Number,
  userName: String,
  userNumber: Number,
  repoName: String,
  repoNumber: Number,
  type: Number,
  viewDate: {
    type: String,
    default: Date.now()
  }
});

module.exports = mongoose.model("counters", counterSchema);