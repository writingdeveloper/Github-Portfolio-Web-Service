var mongoose = require("mongoose");
var Schema = mongoose.Schema;
mongoose.set('useCreateIndex', true)

const counterSchema = new Schema({
  userName: String,
  userNumber: Number,
  repoName: String,
  repoNumber: Number,
  count: {
    type: Number,
    default: 1
  },
  viewDate: {
    type: String,
    default: new Date().toISOString().substr(0, 10).replace('T', '')
  }
});
console.log('counterSchema DB Connect!')

module.exports = mongoose.model("counters", counterSchema);