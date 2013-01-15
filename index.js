var shelljs = require('shelljs/global'),
    spawn = require('child_process').spawn,
    cradle = require('cradle'),
    serverInfo = {name: 'CouchDB subserver'},
    isWorking = true,
    errorMessage = "No error";



function testIfCouchDBInstalled() {
    if (!which('couchdb')) {
        errorMessage = "CouchDB subserver not working: commandline tool couchdb required.";
        isWorking = false;
    }
}

function startCouchDB(thenDo) {
    var proc = spawn("couchdb");
    proc.stderr.on("data", function(data) { echo(data.toString()); });
    proc.stdout.on("data", function(data) { echo(data.toString()); });
    proc.on("exit", function(data) {
        echo("CouchDB process stopped.");
        isWorking = false;
    });
}

function main() {
    testIfCouchDBInstalled();

    if (isWorking) {
        serverInfo.status = "active";
        startCouchDB();
    } else {
        echo(errorMessage);
        serverInfo.status = "inactive";
        serverInfo.error = errorMessage;
    }

    module.exports = function(basepath, app) {
        app.get(basepath, function(req, res) {
            res.send(serverInfo);
        })
    }
}

main();
