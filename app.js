const express = require("express");
const { engine } = require("express-handlebars");

const path = require("path");
const { addSignature } = require("./database/db");

const app = express();
const port = 8080;

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

app.use(express.static(path.join(__dirname, "/public")));

app.use(express.json());
app.use(express.urlencoded());

app.get("/style.css", function (req, res) {
    res.sendFile(path.join(__dirname, "/design/form.css"));
});

app.get("/", (req, res) => {
    res.render("form", { layout: "main" });
});

app.get("/signed", (req, res) => {
    res.render("signed", { layout: "main" });
});

app.post("/", (req, res) => {
    // console.log(req.body["Signature"]);
    addSignature(
        req.body["First Name"],
        req.body["Last Name"],
        toString(req.body["Signature"])
    )
        .then(function () {
            res.send(`Success`);
        })
        .catch(function () {
            res.send(`Error:`);
        });
});

app.listen(port);
