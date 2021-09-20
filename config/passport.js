const mongoose = require('mongoose');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const User = mongoose.model('User');

function initialize(passport) {
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email'
      },
      async (email, password, done) => {
        try {
          const user = await User.findOne({ email });

          if (!user) {
            return done(null, false, {message: 'Invalid credentials'});
          }

          if (await bcrypt.compare(password, user.password)) {
            return done(null, user);
          } else {
            return done(null, false, {message: 'Invalid credentials'});
          }
        } catch (err) {
          //handle error
          console.log(err);
        }
      }
    )
  );
  
  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => {
      done(err, user);
    });
  });
};

module.exports = initialize;
