module.exports = function(cb){
  var nodemailer = require("nodemailer");
  this.engines.nodemailer = nodemailer;
  cb();
}