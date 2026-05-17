const express = require("express");

const app = express();

app.use(express.json());

const VERIFY_TOKEN = "thalupulamma123"

app.get("/", (req, res) => {
    res.send("Temple Bot Running");
});

app.post("/webhook", async (req, res) => {

    const body = req.body;

    console.log(body);

    res.sendStatus(200);

});

app.listen(3000, () => {
    console.log("Server Started");
});
