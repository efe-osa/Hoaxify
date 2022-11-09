const { getUsers, getUserById, addUsers } = require("../../__testUtils__");
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
  it("returns 10 users and its size when size is set as 1000 and page is 100", async () => {
    await addUsers(11);
    const {
      body: { content, limit },
    } = await getUsers({ page: 100, limit: 1000 });
    expect(limit).toEqual(10);
    expect(content.length).toEqual(10);
  });
});
describe.only("Get User", () => {
  it("returns 404 and message when user not found", async () => {
    const currentTime = new Date().getTime();
    const fiveSecs = 5 * 1000;
    const fiveSecondsAfter = currentTime + fiveSecs;
    const {
      status,
      body: { path, timestamp, message },
    } = await getUserById(1);

    expect(timestamp).toBeLessThan(fiveSecondsAfter);
    expect(timestamp).toBeGreaterThan(currentTime);
    expect(status).toEqual(404);
    expect(path).toEqual("/api/1.0/users/1");
    expect(message).toEqual("user_not_found");
  });
  it("returns user with 200 when fetched by id", async () => {
    await addUsers(11);
    const user = await User.findOne({
      where: {
        id: 1,
      },
    });
    const { body, status } = await getUserById(1);
    expect(status).toEqual(200);
    expect(body.id).toEqual(user.id);
  });
  it("returns user with 404 when inactive user is fetched", async () => {
    await addUsers(11);

    const { body, status } = await getUserById(1);
    expect(status).toEqual(404);
    expect(body.message).toEqual("user_not_found");
  });
});
