const { DataExchange } = require("aws-sdk");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
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
console.log('counterSchema DB Connect!')

module.exports = mongoose.model("counters", counterSchema);