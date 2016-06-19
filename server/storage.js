'use strict';

var MongoClient = require('mongodb').MongoClient;

var dburl = process.env.MONGODB_URI || 'mongodb://slink:slink@localhost:27017/slink';

function get (id, cb) {
  MongoClient.connect(dburl, function (err, db) {
    if (err) {
      return cb(err);
    }

    var collection = db.collection('slink');
    collection.findOne({ id: parseInt(id) }, function (err, result) {
      if (err) {
        return cb(err);
      }

      db.close();

      if (!result || !result.text) {
        cb(null, '');
      } else {
        cb(null, result.text);
      }
    });

  });
}

function add (text, metadata, cb) {
  MongoClient.connect(dburl, function (err, db) {
    if (err) {
      return cb(err);
    }

    var counterCallback = function (err, result) {
      if (err) {
        return cb(err);
      }

      var nextId = result.value.seq;

      var collection = db.collection('slink');
      collection.insertOne({ id: nextId, text: text, metadata: metadata },
                           function (err, result) {
                             if (err) {
                               return cb(err);
                             }
                             db.close();
                             cb(null, nextId);
                           });
    };

    var counters = db.collection('counters');
    var ret = counters.findAndModify({ _id: 'slink_id' }, [ ],
                                     { $inc: { seq: 1 } },
                                     { new: true },
                                     counterCallback);
  });
}

exports = module.exports = { get: get, add: add };
