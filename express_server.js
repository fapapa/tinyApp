const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const { emailLookup, generateRandomString, urlsFor } = require('./helpers.js');
const { urlDatabase, users } = require('./database.js');
const PORT = 8080;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  secret: 'thisissupersecret'
}));
app.use(methodOverride((req, res) => {
  if (req.body && typeof req.body === 'object' && '_method' in req.body) {
    // look in urlencoded POST bodies and delete it
    const method = req.body._method;
    delete req.body._method;
    return method;
  }
}));

app.get('/', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.redirect('/login');
  }
});

app.get('/login', (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('login', {user: undefined});
  }
});

app.post('/login', (req, res) => {
  if (req.body.email && req.body.password) {
    const user = emailLookup(req.body.email, users);
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
  if (req.session.user_id) {
    res.redirect('/urls');
  } else {
    res.render('register', {user: undefined});
  }
});

app.post('/register', (req, res) => {
  if (req.body.email === "" || req.body.email === "") {
    res.status(400);
    res.send("Neither email nor password can be blank.");
  }
  if (emailLookup(req.body.email, users)) {
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
  const userURLs = urlsFor(user, urlDatabase);
  let templateVars = {
    urls: userURLs,
    user: user
  };

  res.render('urls_index', templateVars);
});

app.post('/urls', (req, res) => {
  const shortURL = generateRandomString();

  urlDatabase[shortURL] = {};
  urlDatabase[shortURL].longURL = req.body.longURL;
  urlDatabase[shortURL].userID = req.session.user_id;
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
  const userURLs = urlsFor(user, urlDatabase);
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
  const userURLs = urlsFor(user, urlDatabase);

  if (userURLs[req.params.shortURL]) {
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect(`/urls/${req.params.shortURL}`);
  }

  res.status(400);
  res.send("Access denied");
});

app.post('/urls/:shortURL/delete', (req, res) => {
  const user = users[req.session.user_id];
  const userURLs = urlsFor(user, urlDatabase);

  if (userURLs[req.params.shortURL]) {
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls');
  }

  res.status(400);
  res.send("Access denied");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
