const transporter = require("../config/transport");

const transportMail = async (from, to, html) => {
  return transporter.sendMail({
    from,
    to,
    html,
  });
};

const sendFrom = (from) => async (to, content) => {
  return await transportMail(from, to, content);
};

const sendActivationEmail = sendFrom("Hoaxify <noreply@hoaxify.com>");

module.exports = {
  sendActivationEmail,
};
