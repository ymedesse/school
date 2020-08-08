const mongoose = require("mongoose");

const autoIncrement = require("mongoose-auto-increment");
let connexion;

try {
  connexion = mongoose.createConnection(process.env.DATABASE, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    autoIndex: true,
  });
  autoIncrement.initialize(connexion);
  console.log("DB Connecteds");
} catch (error) {}

exports.connexion = connexion;
exports.autoIncrement = autoIncrement;
