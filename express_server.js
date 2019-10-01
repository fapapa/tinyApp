const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "userRandomID" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "user2RandomID" }
};

const users = {
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

const emailLookup = (email) => {
  for (const user in users) {
    if (users[user].email === email) {
      return users[user];
    }
  }

  return undefined;
};

const urlsFor = (user) => {
  let urls = {};
  if (!user) return urls;

  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === user.id) {
      urls[url] = urlDatabase[url];
    }
  }

  return urls;
};

app.get('/', (req, res) => {
  res.send('Hello!');
});

app.get('/login', (req, res) => {
  res.render('login', {user: undefined});
});

app.post('/login', (req, res) => {
  if (req.body.email && req.body.password) {
    const user = emailLookup(req.body.email);
    if (user.password === req.body.password) {
      res.cookie('user_id', user.id);
      res.redirect('/urls');
    } else {
      res.status(403);
      res.send('Password incorrect');
    }
  } else {
    res.status(403);
    res.send('No user with that email address exists');
  }
});

app.get('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get('/register', (req, res) => {
  res.render('register', {user: undefined});
});

app.post('/register', (req, res) => {
  if (req.body.email === "" || req.body.email === "") {
    res.status(400);
    res.send("Neither email nor password can be blank.");
  }
  if (emailLookup(req.body.email)) {
    res.status(400);
    res.send("Email already exists; please sign in instead");
  }

  const uID = generateRandomString();
  users[uID] = {};
  const user = users[uID];
  user.id = uID;
  user.email = req.body.email;
  user.pasword = req.body.password;

  res.cookie('user_id', uID);
  console.log(users);
  res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {
  res.redirect(urlDatabase[req.params.shortURL]);
});

app.get('/urls', (req, res) => {
  const user = users[req.cookies["user_id"]];
  const userURLs = urlsFor(user);
  let templateVars = {
    urls: userURLs,
    user: user
  };

  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls/new', (req, res) => {
  if (req.cookies["user_id"] && users[req.cookies["user_id"]]) {
    let templateVars = { user: users[req.cookies["user_id"]] };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  const user = users[req.cookies["user_id"]];
  const userURLs = urlsFor(user);
  let templateVars = { user };
  if (userURLs[req.params.shortURL]) {
    templateVars.shortURL = req.params.shortURL;
    templateVars.longURL = userURLs[req.params.shortURL].longURL;
  } else {
    templateVars.longURL = null;
  }

  res.render('urls_show', templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  const user = users[req.cookies["user_id"]];
  const userURLs = urlsFor(user);

  if (userURLs[req.params.shortURL]) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect(`/urls/${req.params.shortURL}`);
  }

  res.status(400);
  res.send("Access denied");
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const user = users[req.cookies["user_id"]];
  const userURLs = urlsFor(user);

  if (userURLs[req.params.shortURL]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }

  res.status(400);
  res.send("Access denied");
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b>World</b></body></html>\n');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
