const nodemailer = require("nodemailer");
const mailConfig = require("config").get("mail");
const transporter = nodemailer.createTransport({ ...mailConfig });

module.exports = transporter;
