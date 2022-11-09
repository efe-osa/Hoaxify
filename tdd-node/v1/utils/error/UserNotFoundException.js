module.exports = function UserNotFoundException() {
  this.message = "user_not_found";
  this.status = 404;
};
