const { mailerApi } = require("./api");
const { newOrderMail } = require("./config");
exports.sendTestEmail = async (req, res) => {
  try {
    const info = await mailerApi({
      to: "yvnhouns@gmail.com",
      subject: "subject",
      html: newOrderMail(),
      text: "hello world",
    });

    res.json("Email sent: " + info.response);
  } catch (error) {
    console.log(error);
    res.status(400).json({ error });
  }
};

exports.sendNewOrderEmail = async (order) => {
  const { user } = order;
  try {
    await mailerApi({
      to: user.email,
      subject: "Votre commande",
      html: newOrderMail(order),
      text: "Votre commande sur le site lbu school à été reçue",
      from: "\"Librairie LBU - Zéro Stress\" <yvon.medesse@gmail.com>",
    });
  } catch (error) {
    console.log("send new order mail ", { error });
  }
};

exports.sendNewOrderPaymentEmail = async (order) => {
  const { user } = order;
  const data = {
    to: user.email,
    subject: "Votre commande",
    html: newOrderMail(order),
    text: "Votre commande sur le site lbu school à été reçue",
    from: "\"Librairie LBU - Zéro Stress\" <yvon.medesse@gmail.com>",
  };
  console.log({ data });
  try {
    await mailerApi(data);
  } catch (error) {
    console.log("send new order mail ", { error });
  }
};

exports.sendOrderCanceledEmail = async (order) => {
  const { user } = order;
  const data = {
    to: user.email,
    subject: "Votre commande",
    html: newOrderMail(order),
    text: "Votre commande sur le site lbu school à été reçue",
    from: "\"Librairie LBU - Zéro Stress\" <yvon.medesse@gmail.com>",
  };
  try {
    await mailerApi(data);
  } catch (error) {
    console.log("send new order mail ", { error });
  }
};
