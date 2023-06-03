const nodemailer = require('nodemailer');

function sendEmail(to, subject, body) {
  // Konfigurasi transporter Nodemailer
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: 'razha9046123@gmail.com', // Masukkan email Anda di sini
      pass: 'jmshtsyogokmkerh' // Masukkan password email Anda di sini
    }
  });

  // Pengaturan email
  const mailOptions = {
    from: 'razha9046123@gmail.com',
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