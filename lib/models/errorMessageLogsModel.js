const mongoose = require("mongoose");
const Schema = mongoose.Schema;
mongoose.set('useCreateIndex', true)

const errorMessageSchema = new Schema({
  SenderIPAdress: String,
  errorMessage: String,
  userAgent: String,
  errorURL: String,
  timeData: Date,

});
console.log('ErrorMessages DB Connect!')

module.exports = mongoose.model("errorMessages", errorMessageSchema);