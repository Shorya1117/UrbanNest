const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

const sendOTPEmail = async (email, otp) => {
  await sendEmail({
    to: email,
    subject: "Your UrbanNest Login OTP",
    html: `
      <div style="font-family:Nunito,sans-serif;max-width:480px;margin:auto;padding:32px;background:#F8FAFC;border-radius:12px;">
        <h2 style="color:#10B981;margin-bottom:8px;">UrbanNest</h2>
        <p style="color:#374151;font-size:16px;">Your one-time password (OTP) is:</p>
        <div style="font-size:36px;font-weight:800;letter-spacing:8px;color:#1F2937;padding:24px 0;">${otp}</div>
        <p style="color:#6B7280;font-size:14px;">This OTP expires in <strong>${process.env.OTP_EXPIRES_MINUTES || 10} minutes</strong>.</p>
        <p style="color:#6B7280;font-size:14px;">If you did not request this, please ignore this email.</p>
      </div>
    `,
  });
};

module.exports = { sendEmail, sendOTPEmail };
