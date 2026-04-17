const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/homeocare").then(async () => {
  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  
  const latest = await User.find().sort({ _id: -1 }).limit(1);
  if (latest.length > 0) {
      console.log("Most recent local user in 'homeocare' DB created at:", latest[0]._id.getTimestamp());
      console.log("Email:", latest[0].email);
  } else {
      console.log("No users found in local 'homeocare' DB.");
  }
  
  process.exit(0);
}).catch(err => {
  console.error("Local DB error:", err.message);
  process.exit(1);
});
