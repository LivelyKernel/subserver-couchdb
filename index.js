var shelljs = require('shelljs/global'),
    spawn = require('child_process').spawn,
    cradle = require('cradle'),
    serverInfo = {name: 'CouchDB subserver', error: "", status: ""},
    isWorking = true;

// -=-=-=-=-=-=-
// setup couchdb
// -=-=-=-=-=-=-
function testIfCouchDBInstalled() {
    if (!which('couchdb')) {
        serverInfo.error += "CouchDB subserver not working: commandline tool couchdb required.\n";
        isWorking = false;
    }
}

function startCouchDB(thenDo) {
    var proc = spawn("couchdb");
    proc.stdout.on("data", function(data) { process.stdout.write(data.toString()); });
    proc.stderr.on("data", function(data) {
        var s = data.toString();
        process.stderr.write(s);
        serverInfo.error += s;
    });
    proc.on("exit", function(data) {
        echo("CouchDB process stopped.");
        isWorking = false;
        serverInfo.status = "inactive";
    });
}

// -=-=-=-=-=-
// http setup
// -=-=-=-=-=-
function setupExports() {
    module.exports = function(basepath, app) {
        app.get(basepath, function(req, res) {
            try {
                res.send(serverInfo);
            } catch(e) {
                res.status(500).send(String(e));
            }
        });
        app.post(basepath + 'get', function(req, res) {
            try {
                var db = req.body.db, key = req.body.key;
                get(db, key, function(err, doc) {
                    if (err) {
                        res.status(500).send(String(err));
                    } else {
                        res.send(doc);
                    }
                });
            } catch(e) {
                res.status(500).send(String(e));
            }

        });
        app.post(basepath + 'set', function(req, res) {
            try {
                var db = req.body.db, key = req.body.key, doc = req.body.value;
                set(db, key, doc, function(err, dbRes) {
                    if (err) {
                        res.status(500).send(String(err));
                    } else {
                        res.send(dbRes);
                    }
                });
            } catch(e) {
                res.status(500).send(String(e));
            }

        });
    }
}

// -=-=-=-=-=-=-=-=-
// cradle interface
// -=-=-=-=-=-=-=-=-
var dbCache = {},
    couchDBConnection = new (cradle.Connection)('http://127.0.0.1', 5984, {
        cache: true
    });

function withDB(dbName, doFunc) {
    var db = couchDBConnection.database(dbName);
    db.exists(function (err, exists) {
        if (err) {
            serverInfo.error += err;
            echo(err);
            doFunc(err);
        } else if (!exists) {
            db.create(function(err) { doFunc(err, db); });
        } else {
            doFunc(null, db);
        }
    });
}

function get(dbName, key, thenDo) {
    withDB(dbName, function(err, db) {
        if (err) { thenDo(err); return }
        db.get(key, thenDo);
    });
}

function set(dbName, key, doc, thenDo) {
    withDB(dbName, function(err, db) {
        if (err) { thenDo(err); return }
        try {
            db.save(key, doc, thenDo);
        } catch(e) {
            thenDo(e);
        }
    });
}

// -=-=-=-
// run it!
// -=-=-=-
(function main() {
    testIfCouchDBInstalled();
    if (isWorking) {
        serverInfo.status = "active";
        startCouchDB();
    } else {
        echo(serverInfo.error);
        serverInfo.status = "inactive";
    }
    setupExports();
})();
