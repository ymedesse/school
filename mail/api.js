let nodemailer = require("nodemailer");

// const email = "yvon.hounsa@groupgmd.com";
// const password = "GodBless$oso@8747";
const useGmail = true;
const email = "yvon.medesse@gmail.com";
const password = "GodBless$oso@1992";

exports.mailerApi = async ({
  to,
  replyTo = email,
  subject,
  html,
  text,
  from = email,
}) => {
  const smtpConnectionString = useGmail
    ? `smtps://${encodeURIComponent(email)}:${encodeURIComponent(
        password
      )}@smtp.gmail.com`
    : {
        host: "smtp.office365.com",
        port: "587",
        auth: { user: email, pass: password },
        secureConnection: false,
        tls: { ciphers: "SSLv3" },
      };

  const mailTransport = nodemailer.createTransport(smtpConnectionString);

  return await mailTransport.sendMail({
    from,
    to,
    replyTo,
    subject,
    html,
    text,
  });
};
