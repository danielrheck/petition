const express = require("express");
const helmet = require("helmet");
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
const path = require("path");
// DB functions
const {
    addSignature,
    dataValidation,
    getAllSignatures,
    getSignatureById,
} = require("./database/db");

const app = express();
const port = 8080;

app.engine("handlebars", engine());
app.set("view engine", "handlebars");

// MIDDLEWARES
// HELMET - VULNERABILITIES
app.use(helmet());
// Serving public folder
app.use(express.static(path.join(__dirname, "/public")));
// URL body decoder
app.use(express.json());
app.use(express.urlencoded());
// COOKIE SESSION
app.use(
    cookieSession({
        name: "session",
        secret: "Vai Corinthians!",
        maxAge: 14 * 24 * 60 * 60 * 1000,
    })
);

// ROUTES

// GET '/'
app.get("/", (req, res) => {
    // check session cookie
    // signed > thank you
    if (req.session.id) {
        return res.redirect("/thankYou");
        // if not, show petition page
    } else {
        return res.render("main", { layout: "petition" });
    }
});

// POST '/'
// receives the form data
app.post("/", (req, res) => {
    // checks for the data validity
    if (
        !dataValidation(
            req.body["First Name"],
            req.body["Last Name"],
            req.body["Signature"]
        )
    ) {
        // if not valid, show form again with invalid data message
        res.render("main", { layout: "petition", invalid: true });
    } else {
        // if valid, add to the DB
        let id = addSignature(
            req.body["First Name"],
            req.body["Last Name"],
            req.body["Signature"]
        )
            // if succeded redirect to '/thankyou'
            .then(({ rows }) => {
                id = rows[0].id;
                req.session.id = id;
                res.redirect(`/thankyou`);
            })
            // if not, show the petition form again with a message that something went wrong
            .catch((e) => {
                console.log("Error inserting in the DB:  ", e);
                res.render("main", { layout: "petition", dbError: true });
            });
    }
});

app.get("/thankyou", (req, res) => {
    // check for id, if not found, redirect to te petition route ('/')
    if (!req.session.id) {
        res.redirect("/");
    }
    // if id is found;
    else {
        let id = req.session.id;
        //  query DB for this id's signature
        getSignatureById(id)
            // when query is done, send the signature URL to render on the thankYou layout
            .then(({ rows }) => {
                var signature = rows[0].signature;
                res.render("main", {
                    layout: "thankYou",
                    signature: signature,
                });
            });
    }
});

app.get("/signed", (req, res) => {
    // check for id, if not found, redirect to te petition route ('/')
    if (!req.session.id) {
        res.redirect("/");
    }
    // if found, querry the DB for all signatures and send it to the signed layout
    else {
        getAllSignatures().then(({ rows }) => {
            let allSigners = rows;

            res.render("main", {
                layout: "signed",
                allSigners: allSigners,
            });
        });
    }
});

app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/");
});

app.listen(port);
