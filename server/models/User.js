const mongoose = require("mongoose");

//Defining how data will be stored in MongoDB
/*
    {
    "name": "Rahul",
    "email": "rahul@gmail.com",
    "password": "encrypted_password",
    "role": "patient"
    }

*/
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["patient", "doctor"],
      default: "patient",
    },
    profilePhoto: {
      type: String,
      default: "",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", userSchema);
