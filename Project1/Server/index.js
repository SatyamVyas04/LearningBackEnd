import express from "express";
import "dotenv/config";
const app = express();

// Load JSON data
import fs from "fs";
const jokesPath = "./assets/jokes.json";
const jokesData = JSON.parse(fs.readFileSync(jokesPath, "utf8"));

app.get("/", (req, res) => {
	res.send("Server is Ready!");
});

app.get("/api/jokes", (req, res) => {
	res.send(jokesData);
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
	console.log(`Serving at https://localhost:${port}`);
});
