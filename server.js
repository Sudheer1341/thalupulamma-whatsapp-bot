const express = require("express");
const axios = require("axios");
const { GoogleSpreadsheet } = require("google-spreadsheet");
const PDFDocument = require("pdfkit");
const fs = require("fs");

const app = express();

app.use(express.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

const SHEET_ID = process.env.SHEET_ID;

// GOOGLE SHEET SETUP

async function getSheet() {

    const doc = new GoogleSpreadsheet(SHEET_ID);

    await doc.useServiceAccountAuth({
        client_email: process.env.GOOGLE_SERVICE_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();

    const sheet = doc.sheetsByIndex[0];

    return sheet;
}

// SEND WHATSAPP MESSAGE

async function sendMessage(to, message) {

    await axios({
        method: "POST",
        url: `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`,
        headers: {
            Authorization: `Bearer ${ACCESS_TOKEN}`,
            "Content-Type": "application/json"
        },
        data: {
            messaging_product: "whatsapp",
            to: to,
            text: {
                body: message
            }
        }
    });
}

// WEBHOOK VERIFY

app.get("/webhook", (req, res) => {

    const mode = req.query["hub.mode"];

    const token = req.query["hub.verify_token"];

    const challenge = req.query["hub.challenge"];

    if (mode && token) {

        if (mode === "subscribe" && token === VERIFY_TOKEN) {

            console.log("Webhook Verified");

            res.status(200).send(challenge);

        } else {

            res.sendStatus(403);
        }
    }
});

// RECEIVE MESSAGES

app.post("/webhook", async (req, res) => {

    try {

        const body = req.body;

        const message =
            body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

        if (message) {

            const from = message.from;

            const text = message.text.body.trim();

            const args = text.split(" ");

            const command = args[0];

            const sheet = await getSheet();

            // DONATION

            if (command === "/donate") {

                const name = args[1];

                const amount = args[2];

                await sheet.addRow({
                    Name: name,
                    Amount: amount,
                    Type: "Donation",
                    Date: new Date().toLocaleDateString(),
                    Notes: "Temple Donation"
                });

                await sendMessage(
                    from,
                    `Donation Added\n\nName: ${name}\nAmount: ₹${amount}`
                );
            }

            // EXPENSE

            else if (command === "/expense") {

                const reason = args[1];

                const amount = args[2];

                await sheet.addRow({
                    Name: reason,
                    Amount: amount,
                    Type: "Expense",
                    Date: new Date().toLocaleDateString(),
                    Notes: "Temple Expense"
                });

                await sendMessage(
                    from,
                    `Expense Added\n\nReason: ${reason}\nAmount: ₹${amount}`
                );
            }

            // BALANCE

            else if (command === "/balance") {

                const rows = await sheet.getRows();

                let totalDonation = 0;

                let totalExpense = 0;

                rows.forEach(row => {

                    if (row.Type === "Donation") {

                        totalDonation += Number(row.Amount);
                    }

                    if (row.Type === "Expense") {

                        totalExpense += Number(row.Amount);
                    }
                });

                const balance =
                    totalDonation - totalExpense;

                await sendMessage(
                    from,
`Temple Accounts

Total Donation: ₹${totalDonation}

Total Expense: ₹${totalExpense}

Balance: ₹${balance}`
                );
            }

            // MONTHLY REPORT

            else if (command === "/monthlyreport") {

                const rows = await sheet.getRows();

                const doc = new PDFDocument();

                const fileName = "monthly-report.pdf";

                doc.pipe(fs.createWriteStream(fileName));

                doc.fontSize(20).text("Temple Monthly Report");

                doc.moveDown();

                rows.forEach(row => {

                    doc.text(
`${row.Date} | ${row.Name} | ${row.Type} | ₹${row.Amount}`
                    );
                });

                doc.end();

                await sendMessage(
                    from,
                    "Monthly Report Generated Successfully"
                );
            }

            // HELP COMMAND

            else {

                await sendMessage(
                    from,
`Temple Committee Bot

Commands:

/donate name amount

/expense reason amount

/balance

/monthlyreport`
                );
            }
        }

        res.sendStatus(200);

    } catch (error) {

        console.log(error);

        res.sendStatus(500);
    }
});

app.listen(3000, () => {

    console.log("Temple Bot Running");
});
