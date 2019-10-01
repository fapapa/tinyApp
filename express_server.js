const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  secret: 'thisissupersecret'
}));

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
    if (bcrypt.compareSync(req.body.password, user.hashedPassword)) {
      req.session.user_id = user.id;
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
  req.session.user_id = undefined;
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
  user.hashedPassword = bcrypt.hashSync(req.body.password, 10);

  req.session.user_id = uID;
  res.redirect('/urls');
});

app.get('/u/:shortURL', (req, res) => {
  const urlRecord = urlDatabase[req.params.shortURL];

  if (!req.session.user_id && !req.session[req.params.shortURL]) {
    req.session[req.params.shortURL] = true;
    urlRecord.hits++;
    urlRecord.uniqueHits++;
  } else if (!req.session.user_id) {
    urlRecord.hits++;
  }

  res.redirect(urlRecord.longURL);
});

app.get('/urls', (req, res) => {
  const user = users[req.session.user_id];
  const userURLs = urlsFor(user);
  let templateVars = {
    urls: userURLs,
    user: user
  };

  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();

  urlDatabase[shortURL].longURL = req.body.longURL;
  urlDatabase[shortURL].hits = 0;
  urlDatabase[shortURL].uniqueHits = 0;
  urlDatabase[shortURL].createDate = new Date();

  res.redirect(`/urls/${shortURL}`);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/urls/new', (req, res) => {
  if (req.session.user_id && users[req.session.user_id]) {
    let templateVars = { user: users[req.session.user_id] };
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login');
  }
});

app.get('/urls/:shortURL', (req, res) => {
  const user = users[req.session.user_id];
  const userURLs = urlsFor(user);
  let templateVars = { user };
  if (userURLs[req.params.shortURL]) {
    templateVars.shortURL = req.params.shortURL;
    templateVars.longURL = userURLs[req.params.shortURL].longURL;
    templateVars.hits = userURLs[req.params.shortURL].hits;
    templateVars.uniqueHits = userURLs[req.params.shortURL].uniqueHits;
    templateVars.createDate = userURLs[req.params.shortURL].createDate;
  } else {
    templateVars.longURL = null;
  }

  res.render('urls_show', templateVars);
});

app.post('/urls/:shortURL', (req, res) => {
  const user = users[req.session.user_id];
  const userURLs = urlsFor(user);

  if (userURLs[req.params.shortURL]) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect(`/urls/${req.params.shortURL}`);
  }

  res.status(400);
  res.send("Access denied");
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const user = users[req.session.user_id];
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
