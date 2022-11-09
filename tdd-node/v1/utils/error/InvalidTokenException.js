function InvalidTokenException() {
  this.message = "account_activation_failure";
  this.status = 400;
}

module.exports = InvalidTokenException;
