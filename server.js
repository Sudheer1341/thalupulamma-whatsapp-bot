const express = require("express");
const { MessagingResponse } = require("twilio").twiml;
const { GoogleSpreadsheet } = require("google-spreadsheet");

const app = express();

app.use(express.urlencoded({ extended: false }));

const SHEET_ID = process.env.SHEET_ID;

app.post("/webhook", async (req, res) => {

    const incomingMsg = req.body.Body.trim();

    const msg = incomingMsg.split(" ");

    const twiml = new MessagingResponse();

    // DONATION
    if (msg[0] === "/donate") {

        const name = msg[1];
        const amount = msg[2];

        // Add to Google Sheet here

        twiml.message(`Donation Added ₹${amount}`);
    }

    // EXPENSE
    else if (msg[0] === "/expense") {

        const reason = msg[1];
        const amount = msg[2];

        // Add expense to sheet

        twiml.message(`Expense Added ₹${amount}`);
    }

    // BALANCE
    else if (msg[0] === "/balance") {

        // Read all rows from sheet
        // Calculate totals

        twiml.message("Balance feature working");
    }

    // REPORT
    else if (msg[0] === "/monthlyreport") {

        // Read sheet
        // Convert to PDF
        // Send PDF

        twiml.message("Monthly Report Generated");
    }

    else {

        twiml.message(
`Commands:
/donate name amount
/expense reason amount
/balance
/monthlyreport`
        );
    }

    res.writeHead(200, { "Content-Type": "text/xml" });

    res.end(twiml.toString());

});

app.listen(3000, () => {
    console.log("Bot Running");
});
