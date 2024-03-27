const express=require("express");
const cors=require("cors");
const app=express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get("/", (req, res) => {
    res.send("Server running successfully!");
  });

  module.exports = app;