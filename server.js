const cluster = require("cluster");
const os = require("os");

function clusterFork() {
    let nrProc = os.cpus().length;

    cluster.setupMaster({
        exec: "app.js",
    });

    for (let i = 0; i <= nrProc; i++) {
        cluster.fork();
        console.log("Listening on 8080");
    }

    cluster.on("exit", function (worker) {
        console.log(`${worker.process.pid} is down. Starting again...`);
        cluster.fork();
    });
}

clusterFork();
