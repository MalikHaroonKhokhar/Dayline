const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');




require('dotenv').config();
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

const { TextServiceClient } = require("@google-ai/generativelanguage");
const { GoogleAuth } = require("google-auth-library");

const MODEL_NAME = "models/text-bison-001";
const API_KEY = process.env.MODEL_API;

app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.get('/', (request, response) => {
    response.sendFile(__dirname + "/index.html");
});

app.post('/generate', async (req, res) => {
    const client = new TextServiceClient({
        authClient: new GoogleAuth().fromAPIKey(API_KEY),
    });

    const diaryEntry = req.body.diaryEntry;
    const promptString = `Explain this day in one line ${diaryEntry}`;
    const stopSequences = [];

    try {
        const result = await client.generateText({
            model: MODEL_NAME,
            temperature: 0.7,
            candidateCount: 1,
            top_k: 40,
            top_p: 0.95,
            max_output_tokens: 1024,
            stop_sequences: stopSequences,
            safety_settings: [{"category":"HARM_CATEGORY_DEROGATORY","threshold":1},{"category":"HARM_CATEGORY_TOXICITY","threshold":1},{"category":"HARM_CATEGORY_VIOLENCE","threshold":2},{"category":"HARM_CATEGORY_SEXUAL","threshold":2},{"category":"HARM_CATEGORY_MEDICAL","threshold":2},{"category":"HARM_CATEGORY_DANGEROUS","threshold":2}],
            prompt: {
                text: promptString,
            },
        });

        let output;
        if (result && Array.isArray(result) && result[0] && result[0].candidates && result[0].candidates[0]) {
            output = result[0].candidates[0].output;
        }

        if (output) {
            res.render('output', { summary: output });
        } else {
            console.error("Unexpected result format:", result);
            res.status(500).send("Failed to generate a summary.");
        }
    } catch (error) {
        console.error("Error generating text:", error);
        res.status(500).send("Internal Server Error");
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`server is running on port ${port}`);
});
