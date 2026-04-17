const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  
  const latest = await User.find().sort({ _id: -1 }).limit(1);
  if (latest.length > 0) {
      console.log("Most recent user created at:", latest[0]._id.getTimestamp());
      console.log("Data:", latest[0]);
  } else {
      console.log("No users found.");
  }
  
  process.exit(0);
}).catch(err => {
  console.error("DB error:", err);
  process.exit(1);
});
