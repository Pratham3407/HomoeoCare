const mongoose = require("mongoose");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("Connected Database Name:", mongoose.connection.db.databaseName);
  var collections = mongoose.connection.db.listCollections().toArray().then(cols => {
      console.log("Collections:", cols.map(c => c.name));
      process.exit(0);
  });
}).catch(err => {
  console.log(err);
});
