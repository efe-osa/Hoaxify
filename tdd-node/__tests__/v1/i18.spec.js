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
} = require("../../__testUtils__/locales/fr");

beforeAll(() => sequelize.sync());
beforeEach(() => User.destroy({ truncate: true }));

describe("Internationalization", () => {
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
      } = await postUser(user, { "accept-language": "fr" });
      expect(validationErrors[field]).toBe(expectedMessage);
    }
  );
  it(`returns ${email_in_use} when ${email_in_use}`, async () => {
    await User.create({ ...newUser });
    const {
      body: { validationErrors },
    } = await postUser(newUser, { "accept-language": "fr" });
    expect(validationErrors.email).toBe(`${email_in_use}`);
  });
  it("returns a success message when signup request is valid", async () => {
    const {
      body: { message },
    } = await postUser(newUser, { "accept-language": "fr" });

    expect(message).toBe(user_create_success);
  });
  it("returns error message when account activation failed", async () => {
    const {
      body: { message },
    } = await postToken("fake-token", {
      "accept-language": "fr",
    });
    expect(message).toBe(
      "This account is either active or the token is invalid"
    );
  });
});
