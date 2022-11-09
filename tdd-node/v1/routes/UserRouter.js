const express = require("express");
const UserService = require("../utils/UserService");
const { check, validationResult } = require("express-validator");
const ValidationException = require("../utils/error/ValidationException");
const pagination = require("../middleware/paginagtion");
const router = express.Router();

router.post(
  "/users",
  check("username")
    .notEmpty()
    .withMessage("username_null")
    .bail()
    .isLength({ min: 5, max: 12 })
    .withMessage("username_size"),
  check("email")
    .notEmpty()
    .withMessage("email_null")
    .bail()
    .isEmail()
    .withMessage("email_invalid")
    .bail()
    .custom(async (email) => {
      const user = await UserService.findByEmail(email);
      if (user) throw new Error("email_in_use");
    }),
  check("password")
    .notEmpty()
    .withMessage("password_null")
    .bail()
    .isLength({ min: 6 })
    .withMessage("password_size")
    .bail()
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
    .withMessage("password_pattern"),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return next(new ValidationException(errors.array()));
    }
    try {
      await UserService.save(req.body);
      return res.send({ message: req.t("user_create_success") });
    } catch (error) {
      return next(error);
    }
  }
);

router.post("/users/token/:token", async (req, res, next) => {
  const { token } = req.params;
  try {
    await UserService.activateToken(token);
    return res.send();
  } catch (reason) {
    return next(reason);
  }
});

router.get("/users", pagination, async (req, res, next) => {
  const { limit, page } = req.pagination;
  try {
    const users = await UserService.getAll({ limit, page, text: "" });
    return res.send(users);
  } catch (error) {
    next(error);
  }
});

router.get("/users/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await UserService.getOne(+id);
    return res.send(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
