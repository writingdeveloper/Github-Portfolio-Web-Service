const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.set('useCreateIndex', true)

const errorMessageSchema = new Schema({
  accessIpaddress: String,
  errorStatus: String,
  errorFrom: String,
  errorMessage: String,
  timeData: Date,
});

module.exports = mongoose.model("errorMessages", errorMessageSchema);