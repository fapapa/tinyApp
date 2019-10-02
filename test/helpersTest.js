const { assert } = require('chai');
const { emailLookup } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('getUserByEmail', () => {
  it('should return user with valid email', () => {
    const user = emailLookup("user@example.com", testUsers);
    const expectedOutput = "userRandomID";
    assert.equal(user.id, expectedOutput);
  });

  it('should return undefined with an invalid email', () => {
    const noUser = emailLookup("nonexistent@example.com", testUsers);
    const expectedOutput = undefined;
    assert.equal(noUser, expectedOutput);
  });
});
