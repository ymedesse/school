/* eslint-disable no-console */
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const http = require("http");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mysql = require("mysql");

require("dotenv").config();

// import route
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const accessRoute = require("./UserManager/routes/access");
const roleRoute = require("./UserManager/routes/role");
const managerRoute = require("./UserManager/routes/manager");
const settingProductRoute = require("./routes/setting");
const schoolRoute = require("./routes/school");
const classeRoute = require("./routes/classe");
const productRoute = require("./routes/product");
const listRoute = require("./routes/list");
const cartRoute = require("./routes/cart");
const fileRoute = require("./routes/file");
const commandeRoute = require("./routes/commande");
const addressRoute = require("./routes/address");
const webhookRoute = require("./routes/webhook");
const wooOrderRoute = require("./routes/wooOrder");
const wooCustomerRoute = require("./routes/wooCustomer");
const cityRoute = require("./routes/city");
const orderRoute = require("./routes/order");
const qosRoute = require("./qospayment/route");
const mailRoute = require("./mail/routes");
const qrCodeRoute = require("./routes/qrCode");
const paymentRoute = require("./routes/payment");
const wishedRoute = require("./routes/wished");

const port = process.env.PORT || 8000;

// db
mongoose
  .connect(process.env.DATABASE, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    autoIndex: true,
  })
  .then(() => console.log("DB Connecteds"));

mongoose.set("useFindAndModify", false);
const app = express();
const server = http.createServer(app);

// middlewares
app.use(morgan("dev"));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(cookieParser());

Array.prototype.uniqueFields = function() {
  let self = [];
  for (let i = 0; i < this.length; i++) {
    if (!self.includes(this[i])) self = [...self, this[i]];
  }
  return self;
};

app.use(cors());

//routes mildware
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", accessRoute);
app.use("/api", roleRoute);
app.use("/api", managerRoute);
app.use("/api", settingProductRoute);
app.use("/api", schoolRoute);
app.use("/api", classeRoute);
app.use("/api", productRoute);
app.use("/api", listRoute);
app.use("/api", commandeRoute);
app.use("/api", cartRoute);
app.use("/api", addressRoute);
app.use("/api", webhookRoute);
app.use("/api", wooOrderRoute);
app.use("/api", wooCustomerRoute);
app.use("/api", cityRoute);
app.use("/api", orderRoute);
app.use("/api", qosRoute);
app.use("/api", mailRoute);
app.use("/api", fileRoute);
app.use("/api", qrCodeRoute);
app.use("/api", paymentRoute);
app.use("/api", wishedRoute);

server.listen(port, () => {
  console.log(`Server is runing on port ${port};`);
});

app.use(function(err, req, res, next) {
  if (err) {
    console.log({ err });
    res.status(500).send({ error: err.message });
  }
});
