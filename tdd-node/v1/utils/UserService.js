const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { Op } = require("sequelize");
const hoaxifyDB = require("../config/database");
const { count } = require("../models/User");
const User = require("../models/User");
const EmailService = require("./EmailService");
const EmailException = require("./error/EmailException");
const InvalidTokenException = require("./error/InvalidTokenException");
const UserNotFoundException = require("./error/UserNotFoundException");
const frontend_uri = "http://localhost:3000";

const generateToken = (length) => {
  return crypto.randomBytes(length).toString("hex").substring(0, length);
};

const getOne = async (id) => {
  const user = await User.findOne({
    where: {
      id,
      inactive: false,
    },
    attributes: ["id", "username", "email"],
  });
  if (!user) {
    throw new UserNotFoundException();
  }
  return user;
};

const getAll = async (query) => {
  const { page, limit, text } = query;
  try {
    const count = await User.count({
      where: {
        inactive: {
          [Op.eq]: false,
        },
      },
    });
    const totalPages = Math.ceil(count / limit);
    const offset = page > totalPages ? 0 : page * limit;

    const users = await User.findAll({
      limit,
      attributes: ["id", "username", "email"],
      where: {
        inactive: {
          [Op.eq]: false,
        },
      },
      offset,
    });
    return {
      content: [...users],
      page,
      limit,
      totalPages,
    };
  } catch (reason) {
    throw new Error(reason);
  }
};

const save = async (body) => {
  const { username, email, password } = body;
  const hash = await bcrypt.hash(password, 10);
  const activationToken = generateToken(16);
  const transaction = await hoaxifyDB.transaction();

  const potentialUser = {
    username,
    email,
    password: hash,
    activationToken,
  };

  await User.create(potentialUser, { transaction });
  try {
    const content = `
    <div>
      <b>Please click below link to activate your account</b>
    </div>
    <div>
      <a href="${frontend_uri}/#/login?token=${activationToken}">Activate account</b>
    </div>
    `;
    await EmailService.sendActivationEmail(email, content);
    await transaction.commit();
  } catch (reason) {
    await transaction.rollback();
    throw new EmailException();
  }
};

const findByEmail = async (email) => User.findOne({ where: { email } });

const activateToken = async (token) => {
  const user = await User.findOne({
    where: { activationToken: token },
  });
  if (!user) {
    throw new InvalidTokenException();
  }
  user.inactive = false;
  user.activationToken = null;
  await user.save();
  return user;
};

module.exports = {
  getOne,
  getAll,
  save,
  findByEmail,
  generateToken,
  activateToken,
};
