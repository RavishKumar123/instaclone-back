const nodemailer = require("nodemailer");

var smtpConfiq = {
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: "roundcircle7@gmail.com",
        pass: "instaclone"
    }
};

module.exports = {
    sendEmail: async (email, code) => {
        var transporter = nodemailer.createTransport(smtpConfiq);
        var mailOptions = {
            from: "roundcircle7@gmail.com",
            to: email,
            subject: "Password Reset Link",
            text: '',
            html: `<p>You are receiving this because you (or someone else) have requested the reset of the password for your account.
            \n\n Your verification code is ${code}:\n\n
            \n\n If you did not request this, please ignore this email and your password will remain unchanged.           
            </p>`
        }
        let resp = await transporter.sendMail(mailOptions);
        return true
    },

    contactEmail: async (email) => {
        try {
            var transporter = nodemailer.createTransport(smtpConfiq);
            var mailOptions = {
                from: "richardsteve979@gmail.com",
                to: email,
                subject: "Thank you for contacting !",
                text: '',
                html: `<p>Thank you for contacting !</p>`
            }
            let resp = await transporter.sendMail(mailOptions);
            return true

        } catch (error) {
            console.log("Error: ", error.message);

        }

    }
}