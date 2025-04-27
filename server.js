import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public"))); 

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "frontpage", "index.html"));
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));