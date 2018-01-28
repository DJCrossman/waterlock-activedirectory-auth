'use strict';
var ActiveDirectory = require('activedirectory');
var moment = require('moment');

/**
 * Login action
 */
module.exports = function(req, res){
  var scope = require('../../scope')(waterlock.Auth, waterlock.engine);
  var params = req.params.all();
  var config = sails.config.waterlock.ldap;
  var ad = new ActiveDirectory(config);
  var username = (req.body.username || req.params.username || '').toLowerCase();

  if(typeof params[scope.type] === 'undefined' || typeof params.password !== 'string'){
    waterlock.cycle.loginFailure(req, res, null, {message: `Invalid ${scope.type} or password`});
  } else{
    ad.authenticate((config.userDN || '') + username, req.body.password, function(err, auth) {
      if (err) {
        if (err.code === 49) {
          return res.status(401).json(err);
        } else {
          return res.serverError(err);
        }
      }
      if (auth) {
        ad.findUser(username, function(err, user) {
          if (err) {
            waterlock.cycle.loginFailure(req, res, {}, {message: `Invalid ${scope.type} or password`, error: err});
          }
          if (!user) {
            waterlock.cycle.loginFailure(req, res, {}, {message: `User with username '${username}' cannot be found`});
          } else {
            waterlock.engine.findOrCreateAuth({username: username}, Object.assign(user, {username: username}), function(err, user) {
              if (err) {
                waterlock.cycle.loginFailure(req, res, null, {message: `User with username '${username}' cannot be found`, error: err});
              } else {
                waterlock.cycle.loginSuccess(req, res, user);
              }
            });
          }
        });
      } else {
        waterlock.cycle.loginFailure(req, res, {}, {message: `Invalid ${scope.type} or password`});
      }
    });
  }
};
