# Authentication Guide

## Packages we will need

`npm install bcrypt-nodejs passport passport-local cookie-parser express-session`

## User model

First we have to create a User model in `models/User.js`.

```js
const bcrypt = require('bcrypt-nodejs');

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('user', {
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        isAlphanumeric: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        isEmail: true,
      },
    },
    password_hash: {
      type: DataTypes.STRING,
    },
  });

  return User;
}
```

Next, before the `return User;` add the following sequelize hook code. Learn more about hooks here: http://docs.sequelizejs.com/manual/tutorial/hooks.html

```js
User.beforeCreate((user) =>
    new sequelize.Promise((resolve) => {
      bcrypt.hash(user.password_hash, null, null, (err, hashedPassword) => {
        resolve(hashedPassword);
      });
    }).then((hashedPw) => {
      user.password_hash = hashedPw;
    })
  );
```

At this point we have a User model that stores information about our user along with email and password. By adding the `beforeCreate` hook we have also insured that we do not save the password as plaintext in our database. Instead the hook will salt and hash the password for us.

## Passport Middleware

The next thing we will do is setup Passport.js to allow our users to login using email and password. Passport will also manage the session cookies for us so that the user remains logged in until the user chooses to logout.

Create a new folder `middlewares` (if it doesn't already exists), and then create the file `middlewares/auth.js` with the following content.

```js
const bcrypt = require('bcrypt-nodejs');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const User = require('../models').User;

function passwordsMatch(passwordSubmitted, storedPassword) {
  return bcrypt.compareSync(passwordSubmitted, storedPassword);
}

passport.use(new LocalStrategy({
    usernameField: 'email',
  },
  (email, password, done) => {
    User.findOne({
      where: { email },
    }).then((user) => {
      if(!user) {
        return done(null, false, { message: 'Incorrect email.' });
      }

      if (passwordsMatch(password, user.password_hash) === false) {
        return done(null, false, { message: 'Incorrect password.' });
      }

      return done(null, user, { message: 'Successfully Logged In!' });
    });
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id).then((user) => {
    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  });
});

passport.redirectIfLoggedIn = (route) =>
  (req, res, next) => (req.user ? res.redirect(route) : next());

passport.redirectIfNotLoggedIn = (route) =>
  (req, res, next) => (req.user ? next() : res.redirect(route));

module.exports = passport;
```

## Load the Passport.js Middleware in app.js

We can now load up the passport.js middleware in app.js. We will also need to setup `cookie-parser` and `express-session` before we can setup passport.

At the _top_ of your `app.js`, add the following require statements:

```js
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const passport = require('./middlewares/auth');
```

Add this setup _before you load up controllers_ in `app.js`:

```js
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser());

app.use(expressSession(({
  secret: 'keyboard cat - REPLACE ME WITH A BETTER SECRET',
  resave: false,
  saveUninitialized: true,
})));

app.use(passport.initialize());
app.use(passport.session());

// load up controllers and route handlers now...
```

The lines above ensure that passport is running as a middleware in your routes. It is important that you setup the `cookie-parser` and `express-session` **before** `passport`.

## Authentication routes

Now we can create the user signup, login, and logout routes in a controller. Additionally we want to protect certain routes so that they can only be accessed by a user that is logged in, that is demonstrated in the `/profile` route below.

Add the following code in the controller of your choosing, for example it coule be: `/controllers/auth.js`

```js
const express = require('express');
const models = require('../models');
const passport = require('../middlewares/auth');

const router = express.Router();
const User = models.User;

router.get('/error', (req, res) => {
  res.sendStatus(401);
})


router.post('/signup', (req,res) => {
  User.create({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    username: req.body.username,
    email: req.body.email,
    password_hash: req.body.password,
  }).then((user) => {
    res.json({ msg: "user created" });
  }).catch(() => {
    res.status(400).json({ msg: "error creating user" });
  });
});


router.post('/login',
  passport.authenticate('local', { failureRedirect: '/auth/error' }),
  (req, res) => {
    res.json({
      id: req.user.id,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      email: req.user.email,
    });
  });


router.get('/logout', (req, res) => {
  req.logout();
  res.sendStatus(200);
});


router.get('/profile',
  passport.redirectIfNotLoggedIn('/auth/error'),
  (req, res) => {
    res.json({ msg: "This is the profile page for: "+req.user.email });
});


module.exports = router;
```
