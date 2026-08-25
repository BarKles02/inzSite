import express from "express";
import multer from "multer";
import { exec } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

import {
	pricing,
	profile,
	materials,
	colors,
	infillRange,
	quantityRange,
	orcaSlicerPath,
} from "./config.js";

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

function clamp(value, min, max, fallback) {
	const n = Number(value);
	if (!Number.isFinite(n)) return fallback;
	return Math.min(max, Math.max(min, n));
}

// MVP: tniemy zawsze dokładnie 1 sztukę, prostym `--slice` (bez
// `--load-assemble-list`). Ten mechanizm jest sprawdzony jako niezawodny
// (działa na realnych, złożonych plikach STL, ~7s na modelu z 68 tys.
// trójkątów). Wcześniejsza wersja próbowała realnie rozmieszczać N sztuk na
// płycie przez `--load-assemble-list`, ale ta funkcja OrcaSlicera potrafi się
// wywalić z access violation (0xC0000005) na złożonych, prawdziwych plikach
// — niezależnie od auto-arrange. Do rozważenia później: policzyć pojemność
// płyty samemu (z bounding boxa modelu), zamiast polegać na tej funkcji.
function runSingleSlice(stlPath, outDir, filamentPath, infillPercent) {
	const cmd =
		`"${orcaSlicerPath}" --slice 1 ` +
		`--load-settings "${profile.machine};${profile.process}" ` +
		`--load-filaments "${filamentPath}" ` +
		`--sparse-infill-density ${infillPercent} ` +
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
	const dMatch = timeText.match(/(\d+)d/);
	const hMatch = timeText.match(/(\d+)h/);
	const mMatch = timeText.match(/(\d+)m/);
	const sMatch = timeText.match(/(\d+)s/);
	const totalHours =
		(dMatch ? Number(dMatch[1]) : 0) * 24 +
		(hMatch ? Number(hMatch[1]) : 0) +
		(mMatch ? Number(mMatch[1]) : 0) / 60 +
		(sMatch ? Number(sMatch[1]) : 0) / 3600;

	const volumeCm3 = Number(volumeMatch[1]);

	return { timeText, totalHours, volumeCm3 };
}

// single = wynik dla JEDNEJ sztuki. Mnoży naiwnie razy ilość (przy quantity>1
// to orientacyjne — nie uwzględnia że drukowanie kilku sztuk razem bywa
// szybsze niż suma pojedynczych wydruków, patrz komentarz nad runSingleSlice).
function computePrice(single, material, quantity) {
	const gramsPerUnit = single.volumeCm3 * material.densityGPerCm3;
	const materialCostPerUnit = gramsPerUnit * material.pricePerGramPLN;
	const timeCostPerUnit = single.totalHours * pricing.pricePerHourPLN;
	const calculatedPerUnit = materialCostPerUnit + timeCostPerUnit;
	const pricePerUnit = Math.max(pricing.minPricePLN, calculatedPerUnit);

	return {
		zuzycieFilamentuG: Math.round(gramsPerUnit * quantity * 10) / 10,
		materialCost: Math.round(materialCostPerUnit * quantity * 100) / 100,
		timeCost: Math.round(timeCostPerUnit * quantity * 100) / 100,
		usedMinimum: calculatedPerUnit < pricing.minPricePLN,
		cenaZaSztuke: Math.round(pricePerUnit * 100) / 100,
		cenaLaczna: Math.round(pricePerUnit * quantity * 100) / 100,
	};
}

const app = express();

await fs.mkdir(uploadsDir, { recursive: true });

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "test.html"));
});

app.get("/api/opcje", (req, res) => {
	res.json({
		materialy: Object.fromEntries(
			Object.entries(materials).map(([key, m]) => [key, m.label])
		),
		kolory: colors,
		wypelnienie: infillRange,
		ilosc: quantityRange,
	});
});

app.post("/api/wycena", upload.single("model"), async (req, res) => {
	if (!req.file) {
		res.status(400).json({ error: "Brak pliku STL w żądaniu (pole 'model')." });
		return;
	}

	const materialKey = req.body.material && materials[req.body.material] ? req.body.material : "PLA";
	const material = materials[materialKey];
	const color = typeof req.body.color === "string" && req.body.color.trim() ? req.body.color.trim() : colors[0];
	const infill = clamp(req.body.infill, infillRange.min, infillRange.max, infillRange.default);
	const quantity = Math.round(
		clamp(req.body.quantity, quantityRange.min, quantityRange.max, quantityRange.default)
	);

	const stlPath = req.file.path;
	const outDir = path.join(os.tmpdir(), `slicer-api-out-${Date.now()}`);

	try {
		await fs.mkdir(outDir, { recursive: true });
		await runSingleSlice(stlPath, outDir, material.filament, infill);

		const gcodeText = await fs.readFile(path.join(outDir, "plate_1.gcode"), "utf8");
		const single = parseGcodeSummary(gcodeText);
		const priceBreakdown = computePrice(single, material, quantity);

		res.json({
			plik: req.file.originalname,
			material: material.label,
			kolor: color,
			wypelnienieProc: infill,
			ilosc: quantity,
			czasDrukuZaSztuke: single.timeText,
			orientacyjne: quantity > 1,
			uwaga:
				quantity > 1
					? "Cena za więcej niż 1 sztukę jest orientacyjna (pomnożona wycena jednej sztuki) — nie uwzględnia realnego rozmieszczenia kilku sztuk razem na płycie."
					: null,
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
