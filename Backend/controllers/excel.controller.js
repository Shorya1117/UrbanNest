const XLSX = require("xlsx");
const { User, Flat, Society } = require("../models");
const { successResponse, errorResponse } = require("../utils/response");

/**
 * Expected Excel columns (case-insensitive):
 *   Block Number | Flat Number | Ownership Type | Head Name | Head Email | Head Phone |
 *   Member 1 Name | Member 1 Email | Member 1 Phone |
 *   Member 2 Name | Member 2 Email | Member 2 Phone |
 *   ... (up to Member 5)
 */

const normalizeHeader = (h) =>
  h?.toString().trim().toLowerCase().replace(/\s+/g, " ");

const parseExcel = (buffer) => {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  if (!raw.length) throw new Error("Excel file is empty.");

  // Normalize header keys
  return raw.map((row) => {
    const normalized = {};
    Object.keys(row).forEach((k) => {
      normalized[normalizeHeader(k)] = row[k];
    });
    return normalized;
  });
};

// ─── Preview: Parse Excel without saving ─────────────────────────────────────
const previewExcel = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 400, "Please upload an Excel file.");

    const rows = parseExcel(req.file.buffer);
    const preview = rows.slice(0, 10).map((row, i) => ({
      row: i + 2,
      block: row["block number"] || row["block"],
      flat: row["flat number"] || row["flat"],
      ownershipType: row["ownership type"] || "OWNER",
      head: {
        name: row["head name"],
        email: row["head email"],
        phone: row["head phone"],
      },
      members: [1, 2, 3, 4, 5]
        .map((n) => ({
          name: row[`member ${n} name`],
          email: row[`member ${n} email`],
          phone: row[`member ${n} phone`],
        }))
        .filter((m) => m.name || m.email),
    }));

    return successResponse(res, 200, `Preview: ${rows.length} rows found.`, {
      totalRows: rows.length,
      preview,
    });
  } catch (error) {
    next(error);
  }
};

// ─── Import: Parse and save to DB ────────────────────────────────────────────
const importExcel = async (req, res, next) => {
  try {
    if (!req.file) return errorResponse(res, 400, "Please upload an Excel file.");

    const societyId = req.societyId;
    const rows = parseExcel(req.file.buffer);

    const results = {
      created: 0,
      skipped: 0,
      errors: [],
      flats: 0,
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row (1=header)

      const blockNumber = (row["block number"] || row["block"] || "").toString().trim().toUpperCase();
      const flatNumber  = (row["flat number"]  || row["flat"]  || "").toString().trim().toUpperCase();
      const headName    = (row["head name"]  || "").toString().trim();
      const headEmail   = (row["head email"] || "").toString().trim().toLowerCase();
      const headPhone   = (row["head phone"] || "").toString().trim();
      const ownershipRaw = (row["ownership type"] || "OWNER").toString().trim().toUpperCase();
      const ownershipType = ownershipRaw === "TENANT" ? "TENANT" : "OWNER";

      if (!blockNumber || !flatNumber) {
        results.errors.push({ row: rowNum, reason: "Missing block or flat number" });
        results.skipped++;
        continue;
      }
      if (!headEmail || !headName) {
        results.errors.push({ row: rowNum, reason: "Missing HEAD name or email" });
        results.skipped++;
        continue;
      }

      // ── Create or find Flat ─────────────────────────────────────────────
      let flat = await Flat.findOne({ flatNumber, blockNumber, societyId });
      if (!flat) {
        flat = await Flat.create({ flatNumber, blockNumber, ownershipType, societyId });
        results.flats++;
      }

      // ── Create HEAD user ────────────────────────────────────────────────
      let head = await User.findOne({ email: headEmail, societyId });
      if (!head) {
        head = await User.create({
          name: headName,
          email: headEmail,
          phone: headPhone || "0000000000",
          role: "HEAD",
          societyId,
          flatId: flat._id,
          isApproved: true,
        });
        await Flat.findByIdAndUpdate(flat._id, {
          $addToSet: { members: head._id },
          isOccupied: true,
        });
        results.created++;
      } else {
        // Update flatId if not set
        if (!head.flatId) {
          head.flatId = flat._id;
          await head.save();
          await Flat.findByIdAndUpdate(flat._id, { $addToSet: { members: head._id }, isOccupied: true });
        }
        results.skipped++;
      }

      // ── Create MEMBER users ─────────────────────────────────────────────
      for (let n = 1; n <= 5; n++) {
        const mName  = (row[`member ${n} name`]  || "").toString().trim();
        const mEmail = (row[`member ${n} email`] || "").toString().trim().toLowerCase();
        const mPhone = (row[`member ${n} phone`] || "").toString().trim();

        if (!mName || !mEmail) continue;

        const existingMember = await User.findOne({ email: mEmail, societyId });
        if (existingMember) {
          results.skipped++;
          continue;
        }

        const member = await User.create({
          name: mName,
          email: mEmail,
          phone: mPhone || "0000000000",
          role: "MEMBER",
          societyId,
          flatId: flat._id,
          parentId: head._id,
          isApproved: true,
        });
        await Flat.findByIdAndUpdate(flat._id, { $addToSet: { members: member._id } });
        results.created++;
      }
    }

    return successResponse(res, 200, "Excel imported successfully.", { results });
  } catch (error) {
    next(error);
  }
};

// ─── Download Template ────────────────────────────────────────────────────────
const downloadTemplate = async (req, res, next) => {
  try {
    const templateData = [
      {
        "Block Number": "A",
        "Flat Number": "101",
        "Ownership Type": "OWNER",
        "Head Name": "Amit Patel",
        "Head Email": "amit.patel@example.com",
        "Head Phone": "9876543210",
        "Member 1 Name": "Priya Patel",
        "Member 1 Email": "priya.patel@example.com",
        "Member 1 Phone": "9876543211",
        "Member 2 Name": "",
        "Member 2 Email": "",
        "Member 2 Phone": "",
        "Member 3 Name": "",
        "Member 3 Email": "",
        "Member 3 Phone": "",
      },
      {
        "Block Number": "B",
        "Flat Number": "202",
        "Ownership Type": "TENANT",
        "Head Name": "Suresh Kumar",
        "Head Email": "suresh.kumar@example.com",
        "Head Phone": "9876543212",
        "Member 1 Name": "",
        "Member 1 Email": "",
        "Member 1 Phone": "",
        "Member 2 Name": "",
        "Member 2 Email": "",
        "Member 2 Phone": "",
        "Member 3 Name": "",
        "Member 3 Email": "",
        "Member 3 Phone": "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);

    // Column widths
    ws["!cols"] = [
      { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 20 }, { wch: 28 }, { wch: 14 },
      { wch: 18 }, { wch: 26 }, { wch: 14 },
      { wch: 18 }, { wch: 26 }, { wch: 14 },
      { wch: 18 }, { wch: 26 }, { wch: 14 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Residents");

    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", 'attachment; filename="urbannest_residents_template.xlsx"');
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

module.exports = { previewExcel, importExcel, downloadTemplate };