'use strict';

var pg = require('pg');

pg.defaults.ssl = true;

var dburl = process.env.DATABASE_URL || 'postgres://slink@localhost:6212/slink';

function get (id, cb) {
  pg.connect(dburl, function (err, client, done) {
    if (err) {
      return cb(err);
    }

    client.query({ name: 'get', text: 'SELECT data FROM slink WHERE id=$1' },
                 [ id ],
                 function (err, result) {
                   if (err) {
                     return cb(err);
                   }
                   if (result.rowCount === 0) {
                     cb(null, '');
                   } else {
                     cb(null, result.rows[0].data);
                   }
                 });
    done();
  });
}

function add (data, cb) {
  pg.connect(dburl, function (err, client, done) {
    if (err) {
      return cb(err);
    }

    client.query({ name: 'add', text: 'INSERT INTO slink (id, data, added) ' + 
                                      'VALUES (DEFAULT, $1, $2 RETURNING id' },
                 [ data, new Date() ],
                 function (err, result) {
                   if (err) {
                     return cb(err);
                   }
                   cb(null, result.rows[0].id);
                 });
    done();
  });
}

exports = module.exports = { get: get, add: add };
