import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "66dacff4db2f1d",
    pass: "7f38f75febf599",
  },
});
const sendVerification = async (email: string, link: string) => {
  await transport.sendMail({
    to: email,
    from: "verification@recircle.com",
    html: `<h1>Click the link to verify your account: <a href="${link}">link</a></h1>`,
  });
};

const mail = {
  sendVerification,
};

export default mail;
