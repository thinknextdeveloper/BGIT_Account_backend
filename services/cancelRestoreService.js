const cancelRestoreRepository = require("../repositories/cancelRestoreRepository");
const semesterRepository = require("../repositories/semesterRepository");

class CancelRestoreService {
  /**
   * Display student details matching displayStudentDetail() VB logic
   */
  async displayStudentDetail(idNo, username) {
    if (!idNo || String(idNo).trim() === "") {
      throw new Error("Please specify IDNo");
    }

    const rows = await cancelRestoreRepository.getStudentByCancelRestoreID(idNo);

    if (!rows || rows.length === 0) {
      throw new Error("No Record Found");
    }

    // Rights Check matching Module1.EntryAlreadyExist(varcollege)
    const firstRow = rows[0];
    const collegeName = firstRow.CollegeName || "";
    const hasRights = await semesterRepository.entryAlreadyExist(username, collegeName);

    if (!hasRights) {
      throw new Error("This ID No does not belong to your rights.");
    }

    return {
      collegeName,
      records: rows,
    };
  }

  /**
   * Display all cancelled admissions matching DisplayAllCancellation() VB logic
   */
  async displayAllCancellation(username) {
    const rows = await cancelRestoreRepository.displayAllCancellation(username);
    return {
      records: rows || [],
    };
  }

  /**
   * showCourse() logic
   */
  async getCoursesByCollege(collegeName) {
    if (!collegeName) return [];
    return await cancelRestoreRepository.getCoursesByCollege(collegeName);
  }

  /**
   * btnAddCancAdm_Click() logic
   */
  async addCancelledAdmission(payload, username) {
    const { idNo, cancelStatus, reason, shiftedFrom, shiftedTo, action, mode } = payload || {};

    if (action === "restore" || mode === "restore" || payload?.isRestore) {
      return await this.restoreAdmission(idNo, username);
    }

    if (!idNo || String(idNo).trim() === "") {
      throw new Error("Please specify ID No");
    }

    if (!cancelStatus || String(cancelStatus).trim() === "") {
      throw new Error("Please Give any reason to cancel admission");
    }

    const statusTrim = String(cancelStatus).trim();
    if (statusTrim === "Left" || statusTrim === "Other") {
      if (!reason || String(reason).trim() === "") {
        throw new Error("Please Specify Reason");
      }
    }

    if (statusTrim === "Shifted") {
      if (!shiftedFrom || String(shiftedFrom).trim() === "") {
        throw new Error("Please Specify Course value");
      }
      if (!shiftedTo || String(shiftedTo).trim() === "") {
        throw new Error("Please Specify Course value");
      }
    }

    const rows = await cancelRestoreRepository.getStudentByCancelRestoreID(idNo);
    if (!rows || rows.length === 0) {
      throw new Error("No record found to be cancelled");
    }

    const studentRow = rows[0];
    const collegeName = studentRow.CollegeName || "";

    // Rights Check matching Module1.EntryAlreadyExist(ds.Tables("Admissions1").Rows(0).Item("CollegeName"))
    const hasRights = await semesterRepository.entryAlreadyExist(username, collegeName);
    if (!hasRights) {
      throw new Error("This ID No does not belong to your rights.");
    }

    const success = await cancelRestoreRepository.addCancelledAdmission(
      studentRow,
      statusTrim,
      reason ? String(reason).trim() : "",
      shiftedFrom ? String(shiftedFrom).trim() : "",
      shiftedTo ? String(shiftedTo).trim() : "",
      username
    );

    return { success };
  }

  /**
   * btnAddRegistration_Click() logic (Restore Admission)
   */
  async restoreAdmission(idNo, username) {
    if (!idNo || String(idNo).trim() === "") {
      throw new Error("Please select a student from Cancelled Admission grid");
    }

    const success = await cancelRestoreRepository.restoreAdmission(idNo, username);
    return { success, message: "Record has been successfully added in to Admissionss" };
  }
}

module.exports = new CancelRestoreService();

