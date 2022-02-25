const {
    requireLoggedUser,
    requireSignedUser,
} = require("./../routes_middlewares");
const { getAllSignatures } = require("./../database/db");

const express = require("express");
const router = express.Router();

router.get("/signed", requireLoggedUser, requireSignedUser, (req, res) => {
    getAllSignatures().then(({ rows }) => {
        let allSigners = rows;
        return res.render("main", {
            layout: "signed",
            allSigners: allSigners,
        });
    });
});

module.exports = router;
