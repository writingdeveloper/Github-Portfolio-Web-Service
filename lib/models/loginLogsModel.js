const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.set('useCreateIndex', true)

const loginlogsSchema = new Schema({
  login: String,
  id: Number,
  node_id: String,
  provider: String,
  profileURL: String,
  name: String,
  location: String,
  email: String,
  loginTime: {
    type: Date,
    default: Date.now
  },
});

module.exports = mongoose.model("loginlogs", loginlogsSchema);