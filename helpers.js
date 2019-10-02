const emailLookup = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }

  return undefined;
};

const randomLetter = () => {
  // Get a random number between 1 and 26
  const n = Math.floor(Math.random() * 25) + 1;

  // Turn it into a character A-Z
  return String.fromCharCode(n + 64);
};

const generateRandomString = () => {
  let shortURL = "";

  for (let i = 0; i < 5; i++) {
    shortURL += randomLetter();
  }

  return shortURL;
};

const urlsFor = (user, urlDatabase) => {
  let urls = {};
  if (!user) return urls;

  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === user.id) {
      urls[url] = urlDatabase[url];
    }
  }

  return urls;
};

module.exports = { emailLookup, generateRandomString, urlsFor };
