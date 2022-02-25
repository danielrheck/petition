// ===== MODULES ===== //
const express = require("express");
const helmet = require("helmet");
const { engine } = require("express-handlebars");
const cookieSession = require("cookie-session");
const path = require("path");
const { requireLoggedUser } = require("./routes_middlewares");
//
//
// EXPRESS ROUTES
const cityRoute = require("./routes/city");
const editRoute = require("./routes/edit");
const loginRoute = require("./routes/login");
const logoutRoute = require("./routes/logout");
const petitionRoute = require("./routes/petition");
const profileRoute = require("./routes/profile");
const registerRoute = require("./routes/register");
const signedRoute = require("./routes/signed");
const thankyouRoute = require("./routes/thankyou");
// ===== MODULES ===== //
//
//
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
        sameSite: true,
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
// ROUTES MIDDLEWARE
app.use(cityRoute);
app.use(editRoute);
app.use(loginRoute);
app.use(logoutRoute);
app.use(petitionRoute);
app.use(profileRoute);
app.use(registerRoute);
app.use(signedRoute);
app.use(thankyouRoute);

// ===== ROUTES ===== //
//
// ======= SERVER LISTENER ======= //
app.listen(process.env.PORT || port);
// ======= SERVER LISTENER ======= //
