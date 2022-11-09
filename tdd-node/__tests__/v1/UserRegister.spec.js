const User = require("../../v1/models/User");
const sequelize = require("../../v1/config/database");
const { newUser } = require("../../__testUtils__/constants");
const { postUser, postToken } = require("../../__testUtils__");
const {
  username_null,
  username_size,
  email_null,
  email_invalid,
  email_in_use,
  password_null,
  password_size,
  password_pattern,
  user_create_success,
} = require("../../__testUtils__/locales/en");
const SMTPServer = require("smtp-server").SMTPServer;

let sentMail, server;
let simulateSMTPFailure = false;

beforeAll(async () => {
  server = new SMTPServer({
    authOptional: true,
    onData(stream, session, callback) {
      let mailBody;
      stream.on("data", (data) => {
        mailBody += data.toString();
      });
      stream.on("end", () => {
        if (simulateSMTPFailure) {
          const err = new Error("invalid mailbox");
          err.responseCode = 533;
          return callback(err);
        }
        sentMail = mailBody;
        callback();
      });
    },
  });
  await server.listen("8587", "localhost");
  await sequelize.sync();
});
beforeEach(() => {
  simulateSMTPFailure = false;
  User.destroy({ truncate: true });
});
afterAll(async () => {
  await server.close();
});

describe("User Registration", () => {
  it("returns 200 OK when signup request is valid", async () => {
    const response = await postUser();
    expect(response.status).toBe(200);
  });

  it("returns a success message when signup request is valid", async () => {
    const response = await postUser();
    expect(response.body.message).toBe(user_create_success);
  });

  it("saves user to database", async () => {
    await postUser();
    const list = await User.findAll();
    expect(list.length).toBe(1);
  });

  it("saves username & email to database", async () => {
    await postUser();
    const list = await User.findAll();
    const savedUser = list[0];
    expect(savedUser.email).toBe(newUser.email);
    expect(savedUser.username).toBe(newUser.username);
  });

  it("hashes the password in database", async () => {
    await postUser();
    const list = await User.findAll();
    const savedUser = list[0];
    expect(savedUser.password).not.toBe(newUser.password);
  });

  it("returns 400 when username is null", async () => {
    const response = await postUser({ ...newUser, username: "" });
    expect(response.status).toBe(400);
  });

  it("returns validation errors when user is invalid ", async () => {
    const response = await postUser({ ...newUser, username: null });
    expect(response.body.validationErrors).not.toBeUndefined();
  });

  it("returns validation message when user sends invalid values ", async () => {
    const response = await postUser({
      ...newUser,
      email: null,
      username: null,
    });
    expect(Object.keys(response.body.validationErrors)).toEqual([
      "username",
      "email",
    ]);
  });

  it("returns validation failure message when error response body validation fails", async () => {
    const {
      body: { message },
    } = await postUser({
      ...newUser,
      username: null,
    });
    expect(message).toBe("validation_failure");
  });
  // it("returns validation message when user sends invalid username ", async () => {
  //   const response = await postUser({
  //     ...newUser,
  //     username: null,
  //   });
  //   expect(response.body.validationErrors.username).toBe(
  //     username_null
  //   );
  // });
  // it("returns validation message when user sends invalid email ", async () => {
  //   const response = await postUser({
  //     ...newUser,
  //     email: null,
  //   });
  //   expect(response.body.validationErrors.email).toBe(
  //     email_null
  //   );
  // });
  // it("returns password validation message when invalid password sent", async () => {
  //   const response = await postUser({
  //     ...newUser,
  //     password: null,
  //   });
  //   expect(response.body.validationErrors.password).toBe(
  //     password_null
  //   );
  // });

  // --- OR ----

  // it.each([
  //   ["username", username_null],
  //   ["email", email_null],
  //   ["password", password_null],
  // ])("when %s is null %s is received", async (field, expectedMsg) => {
  //   const user = {
  //     ...newUser,
  //     [field]: null,
  //   };
  //   const {
  //     body: { validationErrors },
  //   } = await postUser(user);
  //   expect(validationErrors[field]).toBe(expectedMsg);
  // });

  // ------ OR -------

  it.each`
    field         | value               | expectedMessage
    ${"username"} | ${null}             | ${username_null}
    ${"username"} | ${"seyi"}           | ${username_size}
    ${"username"} | ${"cha".repeat(11)} | ${username_size}
    ${"email"}    | ${null}             | ${email_null}
    ${"email"}    | ${"null.com"}       | ${email_invalid}
    ${"email"}    | ${"null@com"}       | ${email_invalid}
    ${"password"} | ${null}             | ${password_null}
    ${"password"} | ${"Pa&&o"}          | ${password_size}
    ${"password"} | ${"nullisH"}        | ${password_pattern}
    ${"password"} | ${"NULL$4444"}      | ${password_pattern}
  `(
    "returns $expectedMessage when $field is $value",
    async ({ field, expectedMessage, value }) => {
      const user = {
        ...newUser,
        [field]: value,
      };
      const {
        body: { validationErrors },
      } = await postUser(user);
      expect(validationErrors[field]).toBe(expectedMessage);
    }
  );

  it(`returns ${email_in_use} when ${email_in_use}`, async () => {
    await User.create(newUser);
    const {
      body: { validationErrors },
    } = await postUser(newUser);
    expect(validationErrors.email).toBe(`${email_in_use}`);
  });

  it("returns errors for both email is not unique and username is null", async () => {
    await User.create({ ...newUser });
    const {
      body: { validationErrors },
    } = await postUser({ ...newUser, username: null });
    expect(Object.keys(validationErrors)).toEqual(["username", "email"]);
  });

  it("creates user with inactive mode", async () => {
    await postUser();
    const [user] = await User.findAll();
    expect(user.inactive).toBe(true);
  });

  it("creates user with inactive mode set to true when falsy inactive mode is set", async () => {
    await postUser({ ...newUser, inactive: true });
    const [user] = await User.findAll();
    expect(user.inactive).toBe(true);
  });

  it("creates activationToken for user", async () => {
    await postUser();
    const [user] = await User.findAll();
    expect(user.activationToken).toBeTruthy();
  });

  it("sends activation email with activationToken", async () => {
    await postUser();
    const [user] = await User.findAll();
    expect(sentMail).toContain(newUser.email);
    expect(sentMail).toContain(user.activationToken);
  });

  it("sends 502 when activation email transport fails ", async () => {
    simulateSMTPFailure = true;
    const { status } = await postUser();
    expect(status).toBe(502);
  });

  it("sends failure message when activation email transport fails ", async () => {
    simulateSMTPFailure = true;
    const {
      body: { message },
    } = await postUser();
    expect(message).toBe("Failed to send message");
  });

  it("does not send mail if user creation fails", async () => {
    simulateSMTPFailure = true;
    await postUser();
    const users = await User.findAll({ where: { email: newUser.email } });
    expect(users.length).toBe(0);
  });
});

describe("Account Activation", () => {
  it("activates the account when correct token is sent", async () => {
    await postUser();
    const [{ activationToken }] = await User.findAll();
    await postToken(activationToken);
    const [user] = await User.findAll();
    expect(user.inactive).toBe(false);
  });
  it("removes the activationToken after successful activation", async () => {
    await postUser();
    let [{ activationToken }] = await User.findAll();
    await postToken(activationToken);
    const [user] = await User.findAll();
    expect(user.activationToken).toBeFalsy();
  });
  it("does not activate the account with invalid token", async () => {
    await postUser();
    await postToken("fake-token");
    const [user] = await User.findAll();
    expect(user.inactive).toBe(true);
  });

  it("returns 400 when account activation failed", async () => {
    const { status } = await postToken("fake-token");
    expect(status).toBe(400);
  });

  it("returns error message when account activation failed", async () => {
    const {
      body: { message },
    } = await postToken("fake-token");
    expect(message).toBe(
      "This account is either active or the token is invalid"
    );
  });
});

describe("Error Model", () => {
  it("returns path, timestamp, message and validationErrors in response when validation failure", async () => {
    const { body } = await postUser({ ...newUser, username: null });
    expect(Object.keys(body)).toEqual([
      "path",
      "timestamp",
      "message",
      "validationErrors",
    ]);
  });
  it("returns path, timestamp & message when request and validation fails", async () => {
    const { body } = await postToken("fake-token");
    expect(Object.keys(body)).toEqual(["path", "timestamp", "message"]);
    expect(body.path).toEqual("/api/1.0/users/token/fake-token");
  });
  it("returns timestamp in milliseconds within 5secs in error", async () => {
    const currentTime = new Date().getTime();
    const fiveSecs = 5 * 1000;
    const fiveSecondsAfter = currentTime + fiveSecs;
    const { body } = await postToken("fake-token");
    expect(body.timestamp).toBeGreaterThan(currentTime);
    expect(body.timestamp).toBeLessThan(fiveSecondsAfter);
  });
});
