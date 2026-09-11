const studentBasicDetailsRepository = require("../repositories/studentBasicDetailsRepository");

/**
 * Helper to format date values to 'dd/MM/yyyy' matching legacy VB logic:
 * Format(ds.Tables("Admissions1").Rows(rowctr).Item("AdmissionDate"), "dd/MM/yyyy")
 */
function formatDate(val) {
  if (val === null || val === undefined || val === "") return "";
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    return String(val);
  }
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatSnap(val) {
  if (val === null || val === undefined) return "";
  if (Buffer.isBuffer(val)) {
    return `data:image/jpeg;base64,${val.toString("base64")}`;
  }
  if (typeof val === "object" && val.type === "Buffer" && Array.isArray(val.data)) {
    return `data:image/jpeg;base64,${Buffer.from(val.data).toString("base64")}`;
  }
  if (typeof val === "object") {
    return "";
  }
  return String(val);
}

/**
 * StudentBasicDetails Service Layer
 * Business logic for StudentBasicDetails module.
 */
class StudentBasicDetailsService {
  /**
   * Fetch Admissions basic details for logged-in user's assigned colleges with pagination
   */
  async getStudentBasicDetails(username, collegeName, page = 1, limit = 100, searchTerm = null) {
    if (!username) {
      throw new Error("Username is required.");
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 100);

    const { totalRecords, records } = await studentBasicDetailsRepository.getStudentBasicDetails(
      username,
      collegeName,
      pageNum,
      limitNum,
      searchTerm
    );

    // Format dates (AdmissionDate & DOB) and sanitize Snap buffer objects
    const formattedRecords = records.map((row) => ({
      ...row,
      AdmissionDate: formatDate(row.AdmissionDate),
      DOB: formatDate(row.DOB),
      Snap: formatSnap(row.Snap),
    }));

    const hasMore = pageNum * limitNum < totalRecords;

    return {
      totalRecords,
      page: pageNum,
      limit: limitNum,
      hasMore,
      records: formattedRecords,
    };
  }

  /**
   * Reuse existing GetCollege method from semesterRepository via studentBasicDetailsRepository
   */
  async getCollege(username) {
    if (!username) {
      throw new Error("Username is required.");
    }
    return await studentBasicDetailsRepository.getCollege(username);
  }
}

module.exports = new StudentBasicDetailsService();
