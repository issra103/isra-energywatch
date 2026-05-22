const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Créer un transporteur (ex: Gmail)
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER, // Votre adresse Gmail
      pass: process.env.EMAIL_PASS, // Votre "Mot de passe d'application"
    },
  });

  // 2) Définir les options de l'email
  const mailOptions = {
    from: `Energy SaaS <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: options.html (optionnel)
  };

  // 3) Envoyer l'email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
