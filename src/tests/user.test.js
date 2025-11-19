const mongoose = require("mongoose");
const User = require("../models/User");
const app = require("./mockApp");
const bcrypt = require("bcrypt");

const request = require("supertest");

describe("Change user data", () => {
  beforeAll(async () => {
    require("./mockDatabase");

    await User.create({
      _id: "5099803df3f4948bd2f98391",
      email: "alyssa@gmail.com",
      password: await bcrypt.hash("test1234", 10),
      displayname: "A2yssa",
    });
  });

  afterAll(async () => {
    mongoose.connection.close();
  });

  test("Update user profile data", async () => {
    let user = await User.findById("5099803df3f4948bd2f98391");

    expect(user.displayname).toMatchInlineSnapshot(`"A2yssa"`);
    expect(user.about).toMatchInlineSnapshot(`undefined`);
    expect(user.status).toMatchInlineSnapshot(`undefined`);
    expect(user.visibility).toMatchInlineSnapshot(`"offline"`);

    await request(app).put("/api/user/profile").send({
      displayname: "Kweebac",
      about: "I code.",
      status: "I code a lot.",
      visibility: "online",
    });

    user = await User.findById("5099803df3f4948bd2f98391");

    expect(user.displayname).toMatchInlineSnapshot(`"Kweebac"`);
    expect(user.about).toMatchInlineSnapshot(`"I code."`);
    expect(user.status).toMatchInlineSnapshot(`"I code a lot."`);
    expect(user.visibility).toMatchInlineSnapshot(`"online"`);
  });

  test("Update user account data", async () => {
    let user = await User.findById("5099803df3f4948bd2f98391");

    expect(user.email).toMatchInlineSnapshot(`"alyssa@gmail.com"`);
    expect(await bcrypt.compare("test1234", user.password)).toMatchInlineSnapshot(`true`);

    await request(app).put("/api/user/account").send({
      currentPassword: "test1234",
      email: "kweeb@gmail.com",
      password: "1234test",
    });

    user = await User.findById("5099803df3f4948bd2f98391");

    expect(user.email).toMatchInlineSnapshot(`"kweeb@gmail.com"`);
    expect(await bcrypt.compare("1234test", user.password)).toMatchInlineSnapshot(`true`);
  });

  test("Delete account", async () => {
    let user = await User.findById("5099803df3f4948bd2f98391");
    expect(user).toBeTruthy();

    await request(app).delete("/api/user").send({
      currentPassword: "1234test",
    });

    user = await User.findById("5099803df3f4948bd2f98391");
    expect(user).toBeFalsy();
  });
});
