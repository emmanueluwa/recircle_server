import nodemailer from "nodemailer";

const transport = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: process.env.MAIL_TRAP_USER,
    pass: process.env.MAIL_TRAP_PASSWORD,
  },
});

const sendVerification = async (email: string, link: string) => {
  await transport.sendMail({
    to: email,
    from: "verification@recircle.com",
    html: `<h1>Click the link to verify your account: <a href="${link}">link</a></h1>`,
  });
};

const sendPasswordResetLink = async (email: string, link: string) => {
  await transport.sendMail({
    to: email,
    from: "pass-help@recircle.com",
    html: `<h1>Click the link to update your account password: <a href="${link}">link</a></h1>`,
  });
};

const sendPasswordUpdateMessage = async (email: string) => {
  await transport.sendMail({
    to: email,
    from: "pass-help@recircle.com",
    html: `<h1>Your password is updated! You can now login with your new password.</h1>`,
  });
};

const mail = {
  sendVerification,
  sendPasswordResetLink,
  sendPasswordUpdateMessage,
};

export default mail;
