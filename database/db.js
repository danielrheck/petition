const spicedPg = require("spiced-pg");

const db = spicedPg("postgres:postgres:postgres@localhost:5432/signatures");

module.exports.getAllSignatures = function () {
    return db.query(`SELECT * FROM signatures`);
};

module.exports.addSignature = function (firstname, lastname, signature) {
    return db.query(
        `
    INSERT INTO signatures(firstname, lastname, signature)
    VALUES($1, $2, $3)
    `,
        [firstname, lastname, signature]
    );
};

function dataValidation(firstname, lastname, signature) {
    if (!firstname || !lastname || signature) {
        return false;
    }
}

// var addSignature = function (firstname, lastname, signature) {
//     return db.query(
//         `
//     INSERT INTO signatures(firstname, lastname, signature)
//     VALUES($1, $2, $3)
//     `,
//         [firstname, lastname, signature]
//     );
// // };

// var getAllSignatures = function () {
//     return db.query(`SELECT * FROM signatures WHERE id = 17`);
// };

// console.log(getAllSignatures().then((result) => console.log(result.rows)));
