const nodemailer = require('nodemailer');
const htmlToText = require('html-to-text');
const pug = require('pug');

module.exports = class Email {
    constructor(user, url, urlFront) {
        this.to = user.email;
        this.firstName = user.firstName;
        this.url = url;
        this.urlFront = urlFront;
        this.from = `Srebrenica Memorial<${process.env.EMAIL_FROM}>`;
    }

    newTransport() {
        if (process.env.NODE_ENV === 'production') {
            // Sendgrid
            return nodemailer.createTransport({
                service: 'SendGrid',
                auth: {
                    user: process.env.SENDGRID_USERNAME,
                    pass: process.env.SENDGRID_PASSWORD,
                },
            });
        }

        return nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
    }

    // Send the actual email
    async send(template, subject) {
        // 1) Render HTML based on a pug template
        const html = pug.renderFile(`${__dirname}/../views/${template}.pug`, {
            firstName: this.firstName,
            url: this.url,
            urlFront: this.urlFront,
            subject,
        });
        // 2) Define email options
        const mailOptions = {
            from: this.from,
            to: this.to,
            subject,
            html,
            text: htmlToText.fromString(html),
        };

        // 3) Create a transport and send email
        await this.newTransport().sendMail(mailOptions);
    }

    // async sendWelcome() {
    //     await this.send('welcome', 'Welcome to the Natours Family!');
    // }

    async sendPasswordReset() {
        await this.send(
            'passwordReset',
            'Reset token vaše šifre (validan samo 10 minuta)'
        );
    }

    async sendValidateProfile() {
        await this.send(
            'validateProfile',
            'Verifikacioni token (validan samo 10 minuta)'
        );
    }
};
