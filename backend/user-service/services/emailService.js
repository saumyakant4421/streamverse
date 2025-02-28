const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL, pass: process.env.EMAIL_PASSWORD },
});

exports.sendOTP = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is: ${otp}. It expires in 5 minutes.`,
  };
  return transporter.sendMail(mailOptions);
};
