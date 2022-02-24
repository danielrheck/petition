// ===== MODULES ===== //
const express = require("express");
const helmet = require("helmet");
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
const path = require("path");
// DB FUNCTIONS
const { checkSignature, checkProfile } = require("./database/db");
const {
    requireLoggedUser,
    requireSignedUser,
    requireLoggedOutUser,
    requireUnsignedUser,
} = require("./routes_middlewares");
const {
    postProfile,
    addSign,
    registerUser,
    login,
    editProfile,
    deleteSignatureOrAccount,
    getCity,
    getSigners,
    getEdit,
} = require("./routes_functions");
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
//
// HTTPS ON PRODUCTION
if (process.env.NODE_ENV == "production") {
    app.use((req, res, next) => {
        if (req.headers["x-forwarded-proto"].startsWith("https")) {
            return next();
        }
        res.redirect(`https://${req.hostname}${req.url}`);
    });
}
// ===== MIDDLEWARES ===== //

// ===== ROUTES ===== //
//
// GET '/'
app.get("/", requireLoggedUser, (req, res) => {
    return res.redirect("/petition");
});
//
//
// GET '/PETITION'
app.get("/petition", requireLoggedUser, requireUnsignedUser, (req, res) => {
    return res.render("main", { layout: "petition" });
});
//
//
// POST '/PETITION'
app.post("/petition", requireLoggedUser, requireUnsignedUser, (req, res) => {
    addSign(req, res);
});
//
//
// GET '/PROFILE'
app.get("/profile", requireLoggedUser, (req, res) => {
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
});
//
//
// POST '/PROFILE'
app.post("/profile", requireLoggedUser, (req, res) => {
    postProfile(req, res);
});
//
//
// GET '/THANKYOU'
app.get("/thankyou", requireLoggedUser, requireSignedUser, (req, res) => {
    checkSignature(req.session.id).then(({ rows }) => {
        let signature = rows[0].signature;
        return res.render("main", {
            layout: "thankyou",
            signature: signature,
        });
    });
});
//
//
// GET '/SIGNED'
app.get("/signed", requireLoggedUser, requireSignedUser, (req, res) => {
    getSigners(req, res);
});
//
//
// GET TO '/SIGNED/:CITY'
app.get("/signed/:city", requireLoggedUser, requireSignedUser, (req, res) => {
    getCity(req, res);
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
app.post("/register", requireLoggedOutUser, (req, res) => {
    registerUser(req, res);
});
//
//
// GET '/LOGIN'
app.get("/login", requireLoggedOutUser, (req, res) => {
    return res.render("main", { layout: "login" });
});
//
//
// POST '/LOGIN'
app.post("/login", requireLoggedOutUser, (req, res) => {
    login(req, res);
});
//
//
// GET '/LOGOUT'
// RESET COOKIES AND REDIRECT TO '/LOGIN'
app.get("/logout", (req, res) => {
    req.session = null;
    return res.redirect("/login");
});
//
//
//
app.get("/edit", requireLoggedUser, (req, res) => {
    getEdit(req, res);
});
//
// POST TO '/EDIT'
// IF NOT LOGGED IN, REDIRECT TO '/'

app.post("/edit", requireLoggedUser, (req, res) => {
    editProfile(req, res);
});
//
// POST TO '/THANKYOU'
// THIS IS THE DELETE SIGNATURE
app.post("/thankyou", requireLoggedUser, (req, res) => {
    deleteSignatureOrAccount(req, res);
});
// ===== ROUTES ===== //
//
// ======= SERVER LISTENER ======= //
app.listen(process.env.PORT || port);
// ======= SERVER LISTENER ======= //
