const express = require("express");

const app = express();

app.use(express.json());

const VERIFY_TOKEN = "thalupulamma123";

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

app.post("/webhook", async (req, res) => {

    console.log(req.body);

    res.sendStatus(200);

});

app.listen(3000, () => {
    console.log("Server Running");
});
