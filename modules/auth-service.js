const mongoose = require('mongoose');
let Schema = mongoose.Schema;
const env = require('dotenv')
env.config();
const bcrypt = require('bcryptjs');

let userSchema = new Schema({
    userName : {
        type : String,
        unique : true,
        required: true
    },
    password : String,
    email : String,
    loginHistory : [{
        dateTime : Date,
        userAgent : String
    }]
});

let User;

function initialize() {
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(process.env.MONGODB);
        db.on('error', (err) => {
            reject(err); 
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve(); 
        });
    });
}

function registerUser(userData) {
    return new Promise(async (resolve, reject) => {
        if (userData.password !== userData.password2) {
            return reject(new Error("Passwords do not match"));
        }

        try {
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            let newUser = new User({
                userName: userData.userName,
                password: hashedPassword,
                email: userData.email,
                loginHistory: []
            });

            await newUser.save();
            resolve();
        } catch (err) {
            if (err.code === 11000) {
                reject(new Error("User Name already taken"));
            } else {
                console.error("Error creating user:", err); // Log detailed error
                reject(new Error(`There was an error creating the user: ${err.message}`));
            }
        }
    });
}

function checkUser(userData) {
    return new Promise((resolve, reject) => {
        User.findOne({ userName: userData.userName })
            .then(async (user) => {
                if (!user) {

                    return reject(`Unable to find user: ${userData.userName}`);
                }

                const isMatch = await bcrypt.compare(userData.password, user.password);

                if (!isMatch) {
                    return reject(`Incorrect Password for user: ${userData.userName}`);
                }

                if (user.loginHistory.length === 8) {
                    user.loginHistory.pop();
                }
                user.loginHistory.unshift({
                    dateTime: new Date(),
                    userAgent: userData.userAgent,
                });

                User.updateOne(
                    { userName: user.userName },
                    { $set: { loginHistory: user.loginHistory } }
                )
                .then(() => resolve(user))
                .catch(err => reject(`Error updating user: ${err}`));
            })
            .catch(err => reject(`Error finding user: ${err}`));
    });
}

module.exports = {initialize,registerUser,checkUser};
