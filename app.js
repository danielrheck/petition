// ===== MODULES ===== //
const express = require("express");
const helmet = require("helmet");
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
const path = require("path");
// DB FUNCTIONS
const {
    addUsername,
    addSignature,
    dataValidation,
    getAllSignatures,
    getPasswordAndIdByEmail,
    checkSignature,
    checkProfile,
    addUserProfile,
    getSignaturesByCity,
} = require("./database/db");
// BCRYPT
const { compare, hash } = require("./database/db");
// ===== MODULES ===== //

// ===== SERVER ===== //
const app = express();
const port = 8080;
app.engine("handlebars", engine());
app.set("view engine", "handlebars");
// ===== SERVER ===== //

// ===== MIDDLEWARES ===== //
// HELMET - VULNERABILITIES
app.use(helmet());
// SERVING PUBLIC
app.use(express.static(path.join(__dirname, "/public")));
// URL BODYPARSERS
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
// ===== MIDDLEWARES ===== //

// ===== ROUTES ===== //
//
// GET '/'
app.get("/", (req, res) => {
    // IF NOT LOGGED IN, REDIRECT TO '/LOGIN'
    if (!req.session.id) {
        return res.redirect("/login");
    }
    // IF LOGGED, REDIRECT TO '/PETITION'
    else {
        return res.redirect("/petition");
    }
});
//
//
// GET '/PETITION'
app.get("/petition", (req, res) => {
    // IF NOT LOGGED IN, REDIRECT TO '/'
    if (!req.session.id) {
        return res.redirect("/");
    }
    // IF LOGGED, CHECK IS USER SIGNED ALREADY
    else {
        // IF USER HAS SIGNED, REDIRECT TO '/THANKYOU
        if (req.session.signed) {
            return res.redirect("/thankyou");
        }
        // IF USER HAS NOT SIGNED, PRESENT THE PETITION FOR THE USER TO SIGN
        else {
            return res.render("main", { layout: "petition" });
        }
    }
});
//
//
// POST '/PETITION'
app.post("/petition", (req, res) => {
    // RECEIVES THE FORM DATA AND CHECK IF USER SIGNED
    if (req.body.Signature == "") {
        // IF SIGNATURE IS EMPTY, SEND THE FORM BACK WITH MESSAGE ERROR
        return res.render("main", { layout: "petition", invalid: true });
    } else {
        // IF THE USER SIGNED, ADD THE SIGNATURE TO THE SINATURES TABLE
        addSignature(req.session.id, req.body.Signature)
            // IF ADDED SUCCESSFULLY, SET SIGNED COOKIE TO TRUE REDIRECT TO 'THANKYOU'
            .then(() => {
                req.session.signed = true;
                return res.redirect(`/thankyou`);
            })
            // IF NOT, SEND THE PETITION AGAIN WITH AN ERROR MESSAGE
            .catch((e) => {
                console.log("Error inserting in the DB:  ", e);
                return res.render("main", {
                    layout: "petition",
                    dbError: true,
                });
            });
    }
});
//
//
// GET '/PROFILE'
app.get("/profile", (req, res) => {
    // IF NOT LOGGED IN, REDIRECT TO '/'
    if (!req.session.id) {
        return res.redirect("/");
    }
    // IF LOGGED IN, CHECK IF PROFILE WAS SENT ALREADY
    else {
        checkProfile(req.session.id).then(({ rows }) => {
            // IF WAS SENT, REDIRECT TO '/'
            if (rows[0]) {
                return res.redirect("/");
            }
            // IF USER DIDN'T SEND IT, PRESENT THE PROFILE FORM
            else {
                return res.render("main", { layout: "profile" });
            }
        });
    }
});
//
//
// POST '/PROFILE'
app.post("/profile", (req, res) => {
    let user_id = req.session.id;
    let { age, city, url } = req.body;
    // IF ALL FIELDS ARE LEFT BLANK, REDIRECT TO '/PETITION'
    if (!user_id && !age && !city && !url) {
        res.redirect("/petition");
    }
    // IF THERE IS SOMETHING IN THE FORM RESPONSE
    else {
        // CHECK IF URL STARTS WITH 'HTTPS' OR 'HTTP'
        if (url.startsWith("http://") || url.startsWith("https://")) {
            // IF STARTS, ADD IT TO THE DB
            addUserProfile(user_id, age, city, url)
                // IF ADDED SUCCESSFULLY, REDIRECT TO '/THANKYOU'
                .then(() => {
                    return res.redirect("/thankyou");
                })
                // IF ERROR, RE-RENDER THE FORM WITH A MESSAGE OF ERROR (+++MESSAGE STILL TO IMPLEMENT+++)
                .catch(() => {
                    return res.render("main", {
                        layout: "profile",
                        oops: true,
                    });
                });
        } else {
            // IF URL DOESNT START WITH 'HTTPS' OR 'HTTP', ADD TO THE DATABASE WITH AN EMPTY URL REPLACING IT
            addUserProfile(user_id, age, city, "").then(() => {
                return res.redirect("/thankyou");
            });
        }
    }
});
//
//
// GET '/THANKYOU'
app.get("/thankyou", (req, res) => {
    // IF NOT LOGGED IN, REDIRECT TO '/'
    if (!req.session.id) {
        return res.redirect("/");
    }
    // IF LOGGED IN
    else {
        let id = req.session.id;
        // CHECK IF USER SIGNED ALREADY
        checkSignature(id).then(({ rows }) => {
            // IF SIGNED, RENDER THE THANKYOU PAGE PASSING THE SIGNATURE
            if (req.session.signed) {
                var signature = rows[0].signature;
                return res.render("main", {
                    layout: "thankyou",
                    signature: signature,
                });
            }
            // IF DIDN'T SIGN, REDIRECT TO '/PETITION'
            else {
                return res.redirect("/petition");
            }
        });
    }
});
//
//
// GET '/SIGNED'
app.get("/signed", (req, res) => {
    // IF NOT LOGGED IN, REDIRECT TO '/'
    if (!req.session.id) {
        return res.redirect("/");
    }
    // IF LOGGED IN, CHECK SIGNATURE
    else {
        // IF SIGNED, RENDER THE SIGNED PAGE PASSING ALL SIGNERS
        if (req.session.signed) {
            getAllSignatures().then(({ rows }) => {
                let allSigners = rows;
                return res.render("main", {
                    layout: "signed",
                    allSigners: allSigners,
                });
            });
        }
        // IF DIDN'T SIGN, REDIRECT TO '/PETITION'
        else {
            return res.redirect("/petition");
        }
    }
});
//
//
// GET TO '/SIGNED/:CITY'
app.get("/signed/:city", (req, res) => {
    // IF NOT LOGGED IN, REDIRECT TO '/'
    if (!req.session.id) {
        return res.redirect("/");
    }
    // IF LOGGED IN, CHECK SIGNATURE
    else {
        // IF SIGNED, RENDER THE THANKYOU PAGE PASSING THE SIGNERS LIST FOR THE CITY
        if (req.session.signed) {
            getSignaturesByCity(req.params.city).then(({ rows }) => {
                let allSigners = rows;
                return res.render("main", {
                    layout: "city",
                    allSigners: allSigners,
                    city: req.params.city,
                });
            });
        }
        // IF DIDN'T SIGN, REDIRECT TO '/PETITION'
        else {
            return res.redirect("/petition");
        }
    }
});
//
//
// GET TO '/REGISTER'
app.get("/register", (req, res) => {
    // CLEAN COOKIES
    req.session = null;
    // RENDER REGISTER PAGE
    return res.render("main", { layout: "register" });
});
//
//
// POST TO '/REGISTER'
app.post("/register", (req, res) => {
    let { firstname, lastname, email, password } = req.body;
    // CHECK IF ALL FIELDS WERE SENT
    if (dataValidation(firstname, lastname, email, password)) {
        // IF SO, HASH THE PASSWORD
        hash(password)
            .then((hashedPassword) => {
                // THEN ADD USER TO USERS DB
                addUsername(firstname, lastname, email, hashedPassword)
                    // THE REDIRECT TO PROFILE PAGE
                    .then(({ rows }) => {
                        let user_id = rows[0].id;
                        req.session.id = user_id;
                        return res.redirect("/profile");
                    })
                    // IF ERROR ADDING TO DB, RE-RENDER THE REGISTER FORM WITH A FAULTY DATA MESSAGE
                    .catch(() => {
                        return res.render("main", {
                            layout: "register",
                            checkData: true,
                        });
                    });
            })
            // IF ERROR HASHING, RE-RENDER THE REGISTER FORM WITH A FAULTY DATA MESSAGE
            .catch(() => {
                return res.render("main", {
                    layout: "register",
                    checkData: true,
                });
            });
    } else {
        // IF DATA INVALID, RE-RENDER THE REGISTER FORM WITH A FAULTY DATA MESSAGE
        res.render("main", {
            layout: "register",
            checkData: true,
        });
    }
});
//
//
// GET '/LOGIN'
app.get("/login", (req, res) => {
    // IF USER IS LOGGED IN, REDIRECT TO '/'
    if (req.session.id) {
        return res.redirect("/");
    }
    // IF IS NOT LOGGED IN, RENDER LOGIN PAGE
    else {
        return res.render("main", { layout: "login" });
    }
});
//
//
// POST '/LOGIN'
app.post("/login", (req, res) => {
    // GET THE HASHED PASSWORD AND ID BY EMAIL
    getPasswordAndIdByEmail(req.body.email)
        .then(({ rows }) => {
            // IF EMAIL REGISTERED, SET ID TO THE ONE RETURNED FROM THE QUERY
            if (rows[0]) {
                let id = rows[0].id;
                // COMPARE HASH WITH PROVIDED PASSWORD
                compare(req.body.password, rows[0].password)
                    .then((check) => {
                        // IF PASSWORD IS CORRECT, SET COOKIE WITH THE ID
                        if (check) {
                            req.session.id = id;
                            // CHECK USER SIGNED
                            checkSignature(id).then(({ rows }) => {
                                // IF SO, SET SIGNED COOKIE TO TRUE
                                if (rows[0]) {
                                    req.session.signed = true;
                                }
                            });
                            // REDIRECT TO '/'
                            res.redirect("/");
                        }
                        // IF PASSWORD IS INCORRECT, RENDER THE LOGIN PAGE AGAIN WITH A MESSAGE TO CHECK THE DATA
                        else {
                            return res.render("main", {
                                layout: "login",
                                checkData: true,
                            });
                        }
                    })
                    // IF ERROR COMPARING HASH, RENDER THE LOGIN PAGE AGAIN WITH A MESSAGE TO CHECK THE DATA
                    .catch(() => {
                        return res.render("main", {
                            layout: "login",
                            checkData: true,
                        });
                    });
            }
            // IF E-MAIL NOT FOUND, RENDER THE LOGIN PAGE AGAIN WITH A MESSAGE TO CHECK THE DATA
            else {
                return res.render("main", {
                    layout: "login",
                    checkData: true,
                });
            }
        })
        // IF ERROR QUERYING FROM DB, RENDER THE LOGIN PAGE AGAIN WITH A MESSAGE TO CHECK THE DATA (?)
        .catch(() => {
            return res.render("main", {
                layout: "login",
                checkData: true,
            });
        });
});
//
//
// GET '/LOGOUT'
// RESET COOKIES AND REDIRECT TO '/LOGIN'
app.get("/logout", (req, res) => {
    req.session = null;
    return res.redirect("/login");
});
// ===== ROUTES ===== //
//
//
// ======= SERVER LISTENER ======= //
app.listen(port);
// ======= SERVER LISTENER ======= //
