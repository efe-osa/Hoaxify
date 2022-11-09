// class EmailException extends Error {
//   constructor(args) {
//     super(args);
//     this.message = "email_failure";
//   }
// }

// --- FP ----
function EmailException() {
  this.message = "email_failure";
  this.status = 502;
}

module.exports = EmailException;
