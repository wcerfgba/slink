'use strict';

var MongoClient = require('mongodb').MongoClient;

var dburl = process.env.MONGODB_URI || 'mongodb://slink:slink@localhost:27017/slink';

function initialize () {
  MongoClient.connect(dburl, function (err, db) {
    if (err) {
      return console.error(err);
    }

    db.collection('counters', { strict: true }, function (err, result) {
      if (err) {
        db.createCollection('counters', function (err, result) {
          result.insertOne({ _id: 'slink_id', seq: 0 }, function (err, result) {
            db.close();
            if (err) {
              return console.error(err);
            }
          });
        });
      }
    });
  });
}

function getSlink (id, cb) {
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

      if (!result) {
        cb(null, '');
      } else {
        cb(null, result);
      }
    });

  });
}

function getVerification (id, cb) {
  MongoClient.connect(dburl, function (err, db) {
    if (err) {
      return cb(err);
    }

    var collection = db.collection('verify');
    collection.findOne({ id: parseInt(id) }, function (err, result) {
      if (err) {
        return cb(err);
      }

      db.close();

      if (!result) {
        cb(null, '');
      } else {
        cb(null, result);
      }
    });

  });
}

function addSlink (slinkText, metadata, cb) {
  MongoClient.connect(dburl, function (err, db) {
    if (err) {
      return cb(err);
    }

    var collection = db.collection('slink');
    collection.insertOne({ id: metadata.id,
                           slinkText: slinkText,
                           metadata: metadata },
                         function (err, result) {
                           db.close();
                           if (err) {
                             return cb(err);
                           }
                           cb(null, metadata.id);
                         });
  });
}

function updateSlinkAndAddVerification (slinkText, metadata, verifyText, cb) {
  MongoClient.connect(dburl, function (err, db) {
    if (err) {
      return cb(err);
    }

    var collection = db.collection('slink');
    collection.findOneAndUpdate({ id: metadata.id },
                                { $set: { slinkText: slinkText,
                                          metadata: metadata } },
      function (err, result) {
        if (err) {
          db.close();
          return cb(err);
        }

        var collection = db.collection('verify');
        collection.insertOne({ id: metadata.id, verifyText: verifyText },
                             function (err, result) {
                               db.close();
                               if (err) {
                                 return cb(err);
                               }
                               return cb(null, metadata.id);
                             });
      });
  });
}

function nextID (cb) {
  MongoClient.connect(dburl, function (err, db) {
    if (err) {
      return cb(err);
    }

    var counterCallback = function (err, result) {
      db.close();

      if (err) {
        return cb(err);
      }

      cb(null, result.value.seq);
    };

    var counters = db.collection('counters');
    var ret = counters.findAndModify({ _id: 'slink_id' }, [ ],
                                     { $inc: { seq: 1 } },
                                     { new: true },
                                     counterCallback);
  });
}


exports = module.exports = {
  initialize: initialize, getSlink: getSlink, getVerification: getVerification,
  addSlink: addSlink,
  updateSlinkAndAddVerification: updateSlinkAndAddVerification, nextID: nextID
};
