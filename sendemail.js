const nodemailer = require('nodemailer');

function sendEmail(to, subject, body) {
  // Konfigurasi transporter Nodemailer
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'example123@gmail.com', // Masukkan email Anda di sini
      pass: 'password' // Masukkan password email Anda di sini
    }
  });

  // Pengaturan email
  const mailOptions = {
    from: 'no-reply@gmail.com',
    to: to,
    subject: subject,
    text: body
  };

  // Mengirim email
  transporter.sendMail(mailOptions, function(error, info) {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
}

module.exports = { sendEmail };