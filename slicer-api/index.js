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

// Próbuje rozmieścić `quantity` sztuk modelu NAPRAWDĘ na jednej płycie (auto-arrange)
// i policzyć realny czas/materiał dla całej partii naraz. Zwraca { ok: false }
// jeśli fizycznie się nie mieszczą (OrcaSlicer kończy się błędem, nic nie nadpisuje).
async function runBatchArrange(stlPath, outDir, filamentPath, infillPercent, quantity) {
	const assembleListPath = path.join(outDir, "assemble.json");
	const assembleList = {
		plates: [
			{
				plate_index: 1,
				plate_name: "plate_1",
				need_arrange: true,
				objects: [
					{
						path: stlPath.replace(/\\/g, "/"),
						count: quantity,
						filaments: [1],
					},
				],
			},
		],
	};
	await fs.writeFile(assembleListPath, JSON.stringify(assembleList));

	const cmd =
		`"${orcaSlicerPath}" --slice 1 ` +
		`--load-settings "${profile.machine};${profile.process}" ` +
		`--load-filaments "${filamentPath}" ` +
		`--sparse-infill-density ${infillPercent} ` +
		`--load-assemble-list "${assembleListPath}" ` +
		`--outputdir "${outDir}"`;

	return new Promise((resolve) => {
		exec(cmd, { timeout: 180_000 }, (error) => {
			resolve({ ok: !error });
		});
	});
}

// Wyszukiwanie binarne: znajduje maksymalną liczbę sztuk, jaka realnie
// mieści się razem na jednej płycie (auto-arrange), i zwraca czas/materiał
// dla tej pełnej płyty. Szuka w zakresie [1, upperBound].
async function findPlateCapacity(stlPath, baseOutDir, filamentPath, infillPercent, upperBound) {
	let low = 1;
	let high = upperBound;
	let bestCount = 0;
	let bestSummary = null;

	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		const probeDir = path.join(baseOutDir, `probe-${mid}`);
		await fs.mkdir(probeDir, { recursive: true });

		const result = await runBatchArrange(stlPath, probeDir, filamentPath, infillPercent, mid);

		if (result.ok) {
			const gcodeText = await fs.readFile(path.join(probeDir, "plate_1.gcode"), "utf8");
			bestCount = mid;
			bestSummary = parseGcodeSummary(gcodeText);
			low = mid + 1;
		} else {
			high = mid - 1;
		}

		await fs.rm(probeDir, { recursive: true, force: true });
	}

	return { maxPerPlate: bestCount, plateSummary: bestSummary };
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

// summary = łączne totalHours/volumeCm3 dla CAŁEGO zlecenia (nie za sztukę) —
// albo z realnego rozmieszczenia na płycie, albo z naiwnego pomnożenia (fallback).
function computePrice(summary, material, quantity) {
	const grams = summary.volumeCm3 * material.densityGPerCm3;
	const materialCost = grams * material.pricePerGramPLN;
	const timeCost = summary.totalHours * pricing.pricePerHourPLN;
	const calculated = materialCost + timeCost;
	const totalPrice = Math.max(pricing.minPricePLN, calculated);

	return {
		zuzycieFilamentuG: Math.round(grams * 10) / 10,
		materialCost: Math.round(materialCost * 100) / 100,
		timeCost: Math.round(timeCost * 100) / 100,
		usedMinimum: calculated < pricing.minPricePLN,
		cenaLaczna: Math.round(totalPrice * 100) / 100,
		cenaZaSztuke: Math.round((totalPrice / quantity) * 100) / 100,
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

		let summary;
		let mieszczySieNaJednejPlycie;
		let liczbaWydrukow = 1;

		// TYMCZASOWO (do testów): zawsze szukamy realnej pojemności płyty,
		// nawet gdy zamówienie i tak się mieści — żeby było widać w odpowiedzi
		// ile faktycznie wchodzi. To dodatkowo spowalnia każdą wycenę (kilka
		// próbnych cięć); do wersji produkcyjnej warto to robić tylko wtedy,
		// gdy zamówienie się nie mieści.
		const { maxPerPlate, plateSummary } = await findPlateCapacity(
			stlPath,
			outDir,
			material.filament,
			infill,
			quantityRange.max
		);

		if (maxPerPlate === 0) {
			throw new Error("Ten model jest za duży, żeby zmieścić się na płycie drukarki nawet pojedynczo.");
		}

		const sztukNaPlyte = maxPerPlate;

		if (quantity <= maxPerPlate) {
			mieszczySieNaJednejPlycie = true;

			if (quantity === maxPerPlate) {
				// Już wiemy — to dokładnie ten wynik, który znalazło wyszukiwanie.
				summary = plateSummary;
			} else {
				// Wynik wyszukiwania nie dotyczy dokładnie `quantity`, więc tniemy precyzyjnie.
				const preciseDir = path.join(outDir, "precise");
				await fs.mkdir(preciseDir, { recursive: true });
				await runBatchArrange(stlPath, preciseDir, material.filament, infill, quantity);
				const preciseGcode = await fs.readFile(path.join(preciseDir, "plate_1.gcode"), "utf8");
				summary = parseGcodeSummary(preciseGcode);
			}
		} else {
			// Nie mieści się na jednej płycie — liczymy, ile osobnych wydruków to wymaga.
			mieszczySieNaJednejPlycie = false;

			const fullPlates = Math.floor(quantity / maxPerPlate);
			const remainder = quantity % maxPerPlate;

			let totalHours = fullPlates * plateSummary.totalHours;
			let totalVolumeCm3 = fullPlates * plateSummary.volumeCm3;
			liczbaWydrukow = fullPlates;

			if (remainder > 0) {
				const remainderDir = path.join(outDir, "remainder");
				await fs.mkdir(remainderDir, { recursive: true });
				await runBatchArrange(stlPath, remainderDir, material.filament, infill, remainder);
				const gcodeText = await fs.readFile(path.join(remainderDir, "plate_1.gcode"), "utf8");
				const remainderSummary = parseGcodeSummary(gcodeText);
				totalHours += remainderSummary.totalHours;
				totalVolumeCm3 += remainderSummary.volumeCm3;
				liczbaWydrukow += 1;
			}

			summary = {
				timeText: `${liczbaWydrukow} wydruki (${fullPlates} × ${maxPerPlate} szt.${remainder > 0 ? ` + 1 × ${remainder} szt.` : ""})`,
				totalHours,
				volumeCm3: totalVolumeCm3,
			};
		}

		const priceBreakdown = computePrice(summary, material, quantity);

		res.json({
			plik: req.file.originalname,
			material: material.label,
			kolor: color,
			wypelnienieProc: infill,
			ilosc: quantity,
			mieszczySieNaJednejPlycie,
			sztukNaPlyte,
			liczbaWydrukow,
			uwaga: mieszczySieNaJednejPlycie
				? null
				: `Ta ilość nie mieści się na jednej płycie — na płytę wchodzi maksymalnie ${sztukNaPlyte} szt., więc zamówienie wymaga ${liczbaWydrukow} osobnych wydruków. Wycena uwzględnia to realnie (nie jest to naiwne pomnożenie).`,
			czasDruku: summary.timeText,
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
