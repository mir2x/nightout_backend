const express=require("express");
const cors=require("cors");
const app = express();
const userRoute = require("./routes/user.route");
const productRoute = require("./routes/product.route");
const categoryRoute = require("./routes/category.route");
const globalErrorHandler = require("./middlewares/globalErrorHandler");
const path = require('path');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize controllers


app.use("/api/auth", userRoute);
app.use("/api", productRoute);
app.use("/api", categoryRoute);


app.use('/public', express.static(path.join(__dirname, 'public')));

app.get("/", (req, res) => {
    res.send("Server running successfully!");
  });

app.use(globalErrorHandler);
module.exports = app;