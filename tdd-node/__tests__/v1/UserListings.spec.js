const { getUsers, addUsers } = require("../../__testUtils__");
const sequelize = require("../../v1/config/database");
const User = require("../../v1/models/User");

beforeAll(async () => {
  await sequelize.sync();
});

beforeEach(() => {
  return User.destroy({ truncate: true });
});

describe("User Listings", () => {
  it("returns 200 OK when no users in database", async () => {
    const { status } = await getUsers();
    expect(status).toBe(200);
  });

  // --PAGINATION--
  it("returns page object as response body", async () => {
    const { body } = await getUsers();
    expect(body).toEqual({
      content: [],
      page: 0,
      limit: 10,
      totalPages: 0,
    });
  });
  it("returns 10 users in page content", async () => {
    await addUsers(11);
    const {
      body: { content: users },
    } = await getUsers();
    expect(users.length).toBe(10);
  });
  it("returns 6 users in page content where are 6 active and 5 inactive users", async () => {
    await addUsers(6, 6);
    const {
      body: { content: users },
    } = await getUsers();
    expect(users.length).toBe(6);
  });
  it("returns only id, username and email in content array for user", async () => {
    await addUsers(11);
    const {
      body: {
        content: [user],
      },
    } = await getUsers();
    expect(Object.keys(user)).toEqual(["id", "username", "email"]);
  });
  it("returns 2 totalPages when users are 22", async () => {
    await addUsers(15, 7);
    const {
      body: { totalPages },
    } = await getUsers();
    expect(totalPages).toEqual(2);
  });
  it("returns first page of users when page is less than zero", async () => {
    await addUsers(11);
    const {
      body: { content },
    } = await getUsers({ page: -21 });
    expect(content[0].username).toEqual("hoaxuser0");
  });
  it("returns second page of users when page is 1", async () => {
    await addUsers(11);
    const {
      body: { content },
    } = await getUsers({ page: 1 });
    expect(content[0].username).toEqual("hoaxuser10");
  });
  it("returns 5 users and its size when size is set as 5 and page as 1", async () => {
    await addUsers(11);
    const {
      body: { content, limit },
    } = await getUsers({ page: 1, limit: 5 });
    expect(content.length).toEqual(5);
    expect(content[content.length - 1].username).toEqual("hoaxuser9");
    expect(limit).toEqual(5);
  });
});
