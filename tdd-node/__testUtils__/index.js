const request = require("supertest");
const app = require("../v1/app");
const User = require("../v1/models/User");
const { newUser } = require("./constants");

function get(url) {
  const agent = request(app).get(url);
  return agent;
}
function post(url, options = {}) {
  const agent = request(app).post(url);
  if (Object.values(options).length > 0) {
    agent.set({ ...options });
  }
  return agent;
}

const addUsers = async (activeSize = 0, inactiveSize = 0) => {
  for (let idx = 0; idx <= activeSize + inactiveSize; idx++) {
    await User.create({
      ...newUser,
      email: `user1${idx}@test.com`,
      username: `hoaxuser${idx}`,
      inactive: idx >= activeSize,
    });
  }
};
const getUsers = async (query) => {
  return get("/api/1.0/users").query(query);
};
const postUser = async (user = newUser, options = {}) => {
  return post("/api/1.0/users", options).send(user);
};
const postToken = async (token, options = {}) => {
  return post(`/api/1.0/users/token/${token}`, options).send();
};

module.exports = {
  addUsers,
  get,
  getUsers,
  post,
  postUser,
  postToken,
};
