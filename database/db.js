const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/signatures"
);
const bcrypt = require("bcryptjs");

exports.hash = (password) => {
    return bcrypt.genSalt().then((salt) => {
        return bcrypt.hash(password, salt);
    });
};

exports.compare = bcrypt.compare;

module.exports.dataValidation = function (
    firstname,
    lastname,
    email,
    password
) {
    if (!firstname || !lastname || !email || !password) {
        return false;
    } else {
        return true;
    }
};

module.exports.addUsername = function (firstname, lastname, email, password) {
    return db.query(
        `
    INSERT INTO users(firstname, lastname, email, password)
    VALUES($1, $2, $3, $4)
    RETURNING id
    `,
        [firstname, lastname, email, password]
    );
};

module.exports.addUserProfile = function (user_id, age, city, url) {
    return db.query(
        `
    INSERT INTO user_profiles(user_id, age, city, url)
    VALUES($1, $2, $3, $4)
    `,
        [user_id, age, city, url]
    );
};

module.exports.checkProfile = function (user_id) {
    return db.query(
        `
        SELECT * FROM user_profiles WHERE user_id = $1
        `,
        [user_id]
    );
};

module.exports.profileValidation = function (user_id, age, city, url) {
    if (!user_id && !age && !city && !url) {
        return false;
    } else {
        if (url.startsWith("http://") || url.startsWith("https://")) {
            return true;
        } else {
            return false;
        }
    }
};

module.exports.addSignature = function (user_id, signature) {
    return db.query(
        `
    INSERT INTO signatures(user_id, signature)
    VALUES($1, $2)
    RETURNING user_id
    `,
        [user_id, signature]
    );
};

module.exports.getSignatureById = function (user_id) {
    return db.query(`SELECT signature FROM signatures WHERE user_id = $1`, [
        user_id,
    ]);
};

module.exports.getPasswordAndIdByEmail = function (email) {
    return db.query(`SELECT password, id FROM users WHERE email = $1`, [email]);
};

module.exports.checkSignature = function (user_id) {
    return db.query(
        `
            SELECT signature FROM signatures WHERE user_id = $1
    `,
        [user_id]
    );
};

module.exports.getAllSignatures = function () {
    return db.query(
        `
    SELECT firstname, lastname, age, city, url 
FROM users
INNER JOIN signatures 
ON users.id = signatures.user_id
FULL OUTER JOIN user_profiles 
ON users.id = user_profiles.user_id
    `
    );
};

module.exports.getSignaturesByCity = function (city) {
    return db.query(
        `
            SELECT firstname, lastname, age, city, url 
FROM users
INNER JOIN signatures 
ON users.id = signatures.user_id
FULL OUTER JOIN user_profiles 
ON users.id = user_profiles.user_id
WHERE LOWER(city) = LOWER($1)


        `,
        [city]
    );
};

module.exports.getUserData = function (id) {
    return db.query(
        `SELECT users.firstname, users.lastname, users.email, user_profiles.age, user_profiles.city, user_profiles.url 
FROM users 
LEFT JOIN user_profiles 
ON users.id = user_profiles.user_id
WHERE users.id = $1`,
        [id]
    );
};

module.exports.updateUsersWithoutPassword = function (
    id,
    firstname,
    lastname,
    email
) {
    return db.query(
        `
        UPDATE users
        SET firstname = $2, lastname = $3, email = $4
        WHERE users.id = $1
    `,
        [id, firstname, lastname, email]
    );
};

module.exports.updateUserWithPassword = function (
    id,
    firstname,
    lastname,
    email,
    hashedPassword
) {
    return db.query(
        `
                    UPDATE users
        SET firstname = $2, lastname = $3, email = $4, password = $5
        WHERE users.id = $1
            `,
        [id, firstname, lastname, email, hashedPassword]
    );
};

module.exports.updateProfile = function (user_id, age, city, url) {
    return db.query(
        `
    
        INSERT INTO user_profiles (user_id, age, city, url)
        VALUES($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $2, city = $3, url = $4
    
    `,
        [user_id, age, city, url]
    );
};

// var getUserData = function (id) {
//     return db.query(
//         `SELECT users.firstname, users.lastname, users.email, user_profiles.age, user_profiles.city, user_profiles.url
// FROM users
// LEFT JOIN user_profiles
// ON users.id = user_profiles.user_id
// WHERE users.id = $1`,
//         [id]
//     );
// };

// getUserData(1).then(({ rows }) => {
//     console.log(rows[0]);
// });

// var getSignaturesByCity = function (city) {
//     city;
//     return db.query(
//         `
//             SELECT firstname, lastname, age, city, url
// FROM users
// INNER JOIN signatures
// ON users.id = signatures.user_id
// FULL OUTER JOIN user_profiles
// ON users.id = user_profiles.user_id
// WHERE LOWER(city) = LOWER($1)

//         `,
//         [city]
//     );
// };

// getSignaturesByCity("Sao Paulo").then(({ rows }) => {
//     console.log(rows);
// });
// var getAllSignatures = function () {
//     return db.query(
//         `
//     SELECT firstname, lastname, age, city, url
// FROM users
// INNER JOIN signatures
// ON users.id = signatures.user_id
// FULL OUTER JOIN user_profiles
// ON users.id = user_profiles.user_id
//     `
//     );
// };

// getAllSignatures().then(({ rows }) => {
//     console.log(rows);
// });

// var checkSignature = function (id) {
//     return db.query(
//         `
//             SELECT signature FROM signatures WHERE id = $1
//     `,
//         [id]
//     );
// };

// checkSignature(1).then(({ rows }) => {
//     console.log(rows[0]);
// });

// var getAllSignatures = function () {
//     return db.query(
//         `SELECT firstname, lastname, signature, id FROM signatures`
//     );
// };

// getAllSignatures()
//     .then(({ rows }) => {
//         return rows;
//     })
//     .catch((err) => {
//         console.log(err);
//     });

// var getSignatureById = function (id) {
//     return db
//         .query(`SELECT signature FROM signatures WHERE id = $1`, [id])
//         .then(({ rows }) => {
//             return console.log(rows);
//         })
//         .catch((e) => {
//             return console.log("error getting signature from DB: ", e);
//         });
// };

// var addSignature = function (firstname, lastname, signature) {
//     return db.query(
//         `
//     INSERT INTO signatures(firstname, lastname, signature)
//     VALUES($1, $2, $3)
//     RETURNING id
//     `,
//         [firstname, lastname, signature]
//     );
// };

// addSignature("daniel", "heck", "hakdjdhajdh111111").then(({ rows }) => {
//     console.log(rows[0].signature);
// });

// var getSignatureById = function (id) {
//     db.query(`SELECT signature FROM signatures WHERE id = $1`, [id])
//         .then(({ rows }) => {
//             console.log(rows[0].signature);
//             var sig = rows[0].signature;
//         })
//         .catch((e) => {
//             console.log("Error:  ", e);
//         });
// };

// getSignatureById(57);
// function() {
//     console.log()
// }

// var hash = (password) => {
//     return bcrypt.genSalt().then((salt) => {
//         return bcrypt.hash(password, salt);
//     });
// };

// var hash = (password) => {
//     return bcrypt
//         .genSalt()
//         .then((salt) => {
//             return bcrypt.hash(password, salt);
//         })
//         .then((hashed) => {
//             return hashed;
//         });
// };

// hash("123456");

// bcrypt
//     .compare(
//         "123456",
//         "$2a$10$vvYP655qVPMiFVoUfnjczuBuyrlFtJuOUHj5ckTC/xumyyayOo9Lu"
//     )
//     .then((check) => {
//         console.log(check);
//     });

// var getSignatureById = function (user_id) {
//     return db.query(`SELECT signature FROM signatures WHERE user_id = $1`, [
//         user_id,
//     ]);
// };

// getSignatureById(15).then(({ rows }) => {
//     console.log(rows[0].signature);
// });

// var getPasswordByEmail = function (email) {
//     return db.query(`SELECT password FROM users WHERE email = $1`, [email]);
// };

// getPasswordByEmail("danielrheck@gmail.com").then(({ rows }) => {
//     return console.log(rows[0].password);
// });

// let getPasswordAnIdByEmail = function (email) {
//     return db.query(`SELECT password, id FROM users WHERE email = $1`, [email]);
// };

// getPasswordAnIdByEmail("danielrheck@gmail.com").then(({ rows }) => {
//     console.log(rows[0]);
// });

// var checkReturnSignature = function (id) {
//     return db.query(
//         `
//             SELECT signature FROM signatures WHERE id = $1
//     `,
//         [id]
//     );
// };

// var returnAs = function () {
//     checkReturnSignature(1)
//         .then(({ rows }) => {
//             if (rows[0].signature) {
//                 console.log(rows[0].signature);
//                 return rows[0].signature;
//             } else {
//                 return false;
//             }
//         })
//         .catch(() => {
//             return false;
//         });
// };

// let returned = returnAs(1);

// console.log(returned);

var updateUsersWithoutPassword = function (id, firstname, lastname, email) {
    return db.query(
        `
        UPDATE users
        SET firstname = $2, lastname = $3, email = $4
        WHERE users.id = $1
    `,
        [id, firstname, lastname, email]
    );
};

var updateUserWithPassword = function (
    id,
    firstname,
    lastname,
    email,
    hashedPassword
) {
    return db.query(
        `
                    UPDATE users
        SET firstname = $2, lastname = $3, email = $4, password = $5
        WHERE users.id = $1
            `,
        [id, firstname, lastname, email, hashedPassword]
    );
};

var updateProfile = function (user_id, age, city, url) {
    return db.query(
        `
    
        INSERT INTO user_profiles (user_id, age, city, url)
        VALUES($1, $2, $3, $4)
        ON CONFLICT (user_id)
        DO UPDATE SET age = $2, city = $3, url = $4
    
    `,
        [user_id, age, city, url]
    );
};
