import express from "express";
import multer from "multer";
import { exec } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import { pricing, filamentDensityGPerCm3, orcaSlicerPath, profile } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3001;

const uploadsDir = path.join(os.tmpdir(), "slicer-api-uploads");

const storage = multer.diskStorage({
	destination: uploadsDir,
	filename: (req, file, cb) => {
		cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}.stl`);
	},
});

const upload = multer({
	storage,
	limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
	fileFilter: (req, file, cb) => {
		if (!file.originalname.toLowerCase().endsWith(".stl")) {
			cb(new Error("Akceptowane są tylko pliki .stl"));
			return;
		}
		cb(null, true);
	},
});

function runOrcaSlicer(stlPath, outDir) {
	const cmd =
		`"${orcaSlicerPath}" --slice 1 ` +
		`--load-settings "${profile.machine};${profile.process}" ` +
		`--load-filaments "${profile.filament}" ` +
		`--outputdir "${outDir}" "${stlPath}"`;

	return new Promise((resolve, reject) => {
		exec(cmd, { timeout: 120_000 }, (error, stdout, stderr) => {
			if (error) {
				reject(new Error(`Slicing nie powiodło się: ${stderr || stdout || error.message}`));
				return;
			}
			resolve();
		});
	});
}

function parseGcodeSummary(gcodeText) {
	const timeMatch = gcodeText.match(/total estimated time:\s*([^\n;]+)/i);
	const volumeMatch = gcodeText.match(/filament used \[cm3\]\s*=\s*([\d.]+)/i);

	if (!timeMatch || !volumeMatch) {
		throw new Error("Nie udało się odczytać podsumowania z G-code (czas/zużycie filamentu).");
	}

	const timeText = timeMatch[1].trim();
	const hMatch = timeText.match(/(\d+)h/);
	const mMatch = timeText.match(/(\d+)m/);
	const sMatch = timeText.match(/(\d+)s/);
	const totalHours =
		(hMatch ? Number(hMatch[1]) : 0) +
		(mMatch ? Number(mMatch[1]) : 0) / 60 +
		(sMatch ? Number(sMatch[1]) : 0) / 3600;

	const volumeCm3 = Number(volumeMatch[1]);
	const grams = volumeCm3 * filamentDensityGPerCm3;

	return { timeText, totalHours, grams };
}

function computePrice({ totalHours, grams }) {
	const materialCost = grams * pricing.pricePerGramPLN;
	const timeCost = totalHours * pricing.pricePerHourPLN;
	const calculated = materialCost + timeCost;
	const price = Math.max(pricing.minPricePLN, calculated);

	return {
		price: Math.round(price * 100) / 100,
		materialCost: Math.round(materialCost * 100) / 100,
		timeCost: Math.round(timeCost * 100) / 100,
		usedMinimum: calculated < pricing.minPricePLN,
	};
}

await fs.mkdir(uploadsDir, { recursive: true });

const app = express();

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "test.html"));
});

app.post("/api/wycena", upload.single("model"), async (req, res) => {
	if (!req.file) {
		res.status(400).json({ error: "Brak pliku STL w żądaniu (pole 'model')." });
		return;
	}

	const stlPath = req.file.path;
	const outDir = path.join(os.tmpdir(), `slicer-api-out-${Date.now()}`);

	try {
		await fs.mkdir(outDir, { recursive: true });
		await runOrcaSlicer(stlPath, outDir);

		const gcodePath = path.join(outDir, "plate_1.gcode");
		const gcodeText = await fs.readFile(gcodePath, "utf8");

		const summary = parseGcodeSummary(gcodeText);
		const priceBreakdown = computePrice(summary);

		res.json({
			plik: req.file.originalname,
			czasDruku: summary.timeText,
			zuzycieFilamentuG: Math.round(summary.grams * 10) / 10,
			...priceBreakdown,
		});
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: err.message });
	} finally {
		await fs.rm(stlPath, { force: true });
		await fs.rm(outDir, { recursive: true, force: true });
	}
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
	res.status(400).json({ error: err.message || "Nieznany błąd." });
});

app.listen(PORT, () => {
	console.log(`Slicer API działa lokalnie: http://localhost:${PORT}`);
});
