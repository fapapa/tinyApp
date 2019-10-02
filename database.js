const bcrypt = require('bcrypt');

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "userRandomID",
    hits: 0,
    uniqueHits: 0,
    createDate: new Date()
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "user2RandomID",
    hits: 0,
    uniqueHits: 0,
    createDate: new Date()
  }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    hashedPassword: bcrypt.hashSync("sekret", 10)
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    hashedPassword: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

module.exports = { urlDatabase, users };
