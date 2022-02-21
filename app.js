const express = require("express");
const helmet = require("helmet");
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
const path = require("path");
// DB functions
const {
    addUsername,
    addSignature,
    dataValidation,
    getAllSignatures,
    getSignatureById,
    getPasswordAndIdByEmail,
    checkSignature,
} = require("./database/db");
// brcrypt
const { compare, hash } = require("./database/db");
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
app.use(express.urlencoded({ extended: true }));
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
    if (!req.session.id) {
        return res.redirect("/login");
    } else {
        return res.redirect("/petition");
        // check session cookie
        // signed > thank you
    }
});

app.get("/petition", (req, res) => {
    if (!req.session.id) {
        return res.redirect("/login");
    } else {
        checkSignature(req.session.id).then(({ rows }) => {
            if (rows[0]) {
                req.session.signed = true;
                return res.redirect("/thankyou");
            } else {
                return res.render("main", { layout: "petition" });
            }
        });
    }
});

// POST '/'
// receives the form data
app.post("/petition", (req, res) => {
    console.log("post to /petition");
    // checks for the data validity
    if (req.body.Signature == "") {
        // if not valid, show form again with invalid data message
        return res.render("main", { layout: "petition", invalid: true });
    } else {
        // if valid, add to the DB
        addSignature(req.session.id, req.body.Signature)
            // if succeded redirect to '/thankyou'
            .then(() => {
                return res.redirect(`/thankyou`);
            })
            // if not, show the petition form again with a message that something went wrong
            .catch((e) => {
                console.log("Error inserting in the DB:  ", e);
                return res.render("main", {
                    layout: "petition",
                    dbError: true,
                });
            });
    }
});

app.get("/thankyou", (req, res) => {
    console.log(req.session.id);
    // check for id, if not found, redirect to te petition route ('/')
    if (!req.session.id) {
        return res.redirect("/");
    }
    // if id is found;
    else {
        let id = req.session.id;
        checkSignature(id).then(({ rows }) => {
            if (rows[0]) {
                var signature = rows[0].signature;
                return res.render("main", {
                    layout: "thankyou",
                    signature: signature,
                });
            } else {
                return res.redirect("/petition");
            }
        });

        //  query DB for this id's signature
        // getSignatureById(id)
        //     // when query is done, send the signature URL to render on the thankYou layout
        //     .then(({ rows }) => {
        //         console.log(rows);
        //         var signature = rows[0].signature;
        //         return res.render("main", {
        //             layout: "thankyou",
        //             signature: signature,
        //         });
        //     });
    }
});

app.get("/signed", (req, res) => {
    // check for id, if not found, redirect to te petition route ('/')
    if (!req.session.id) {
        return res.redirect("/");
    }
    // if found, querry the DB for all signatures and send it to the signed layout
    else {
        getAllSignatures().then(({ rows }) => {
            let allSigners = rows;

            return res.render("main", {
                layout: "signed",
                allSigners: allSigners,
            });
        });
    }
});

app.get("/register", (req, res) => {
    req.session = null;
    return res.render("main", { layout: "register" });
});

app.post("/register", (req, res) => {
    console.log(req.body);
    let { firstname, lastname, email, password } = req.body;
    if (dataValidation(firstname, lastname, email, password)) {
        hash(password)
            .then((hashedPassword) => {
                addUsername(firstname, lastname, email, hashedPassword)
                    .then(({ rows }) => {
                        let user_id = rows[0].id;
                        req.session.id = user_id;
                        console.log("Register Success, user_id :  ", user_id);
                        return res.redirect("/");
                    })
                    .catch((e) => {
                        console.log("Error registering: ", e);
                    });
                // save the data in the DB,  then redirect to '/'
            })
            .catch((e) => {
                console.log("Error: ", e);
                // render the page again with an appropriate error message
            });
    }
});

app.get("/login", (req, res) => {
    if (req.session.id) {
        return res.redirect("/");
    }
    return res.render("main", { layout: "login" });
});

app.post("/login", (req, res) => {
    getPasswordAndIdByEmail(req.body.email).then(({ rows }) => {
        if (rows[0]) {
            let id = rows[0].id;
            compare(req.body.password, rows[0].password)
                .then((check) => {
                    if (check) {
                        //login
                        req.session.id = id;
                        res.redirect("/");
                    } else {
                        return res.send("wrong credentials");
                    }
                })
                .catch((e) => {
                    console.log("Error comparing hash:  ", e);
                    return res.redirect("/");
                    // render the page again with an error message
                });
        } else {
            res.redirect("/login");
        }
    });
});

app.get("/logout", (req, res) => {
    req.session = null;
    return res.redirect("/");
});

app.listen(port);
