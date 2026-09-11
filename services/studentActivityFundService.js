const studentActivityFundRepository = require("../repositories/studentActivityFundRepository");
const semesterRepository = require("../repositories/semesterRepository");

/**
 * Student Activity Fund Service Layer
 * Business logic for MasterStudentActivityFund records.
 */
class StudentActivityFundService {
  /**
   * Fetch MasterStudentActivityFund records with Total calculated exactly as in VB.NET Display()
   */
  async getStudentActivityFunds(username, filters) {
    if (!username) {
      throw new Error("Username is required.");
    }
    const records = await studentActivityFundRepository.getStudentActivityFunds(username, filters);

    // Calculate Total column exactly as in legacy VB.NET Display() method
    const calculatedRecords = records.map((row) => {
      const studentFund = Number(row.StudentFund) || 0;
      const annualCultureFund = Number(row.AnnualCultureFund) || 0;
      const audioVisual = Number(row.AudioVisual) || 0;
      const commonRoom = Number(row.CommonRoom) || 0;
      const libraryFund = Number(row.LibraryFund) || 0;
      const magazineCharge = Number(row.MagazineCharge) || 0;
      const nccnss = Number(row.NCCNSS) || 0;
      const cycleScooterCharge = Number(row.CycleScooterCharge) || 0;
      const medicalFund = Number(row.MedicalFund) || 0;
      const drawingBoard = Number(row.DrawingBoard) || 0;
      const generalMaintenance = Number(row.GeneralMaintenance) || 0;
      const recreation = Number(row.Recreation) || 0;
      const studentChapter = Number(row.StudentChapter) || 0;
      const stationeryCharge = Number(row.StationeryCharge) || 0;
      const valedictoryFund = Number(row.ValedictoryFund) || 0;
      const identityCard = Number(row.IdentityCard) || 0;
      const refundableSecurity = Number(row.RefundableSecurity) || 0;

      const total =
        studentFund +
        annualCultureFund +
        audioVisual +
        commonRoom +
        libraryFund +
        magazineCharge +
        nccnss +
        cycleScooterCharge +
        medicalFund +
        drawingBoard +
        generalMaintenance +
        recreation +
        studentChapter +
        stationeryCharge +
        valedictoryFund +
        identityCard +
        refundableSecurity;

      return {
        ...row,
        Total: total,
      };
    });

    return {
      totalRecords: calculatedRecords.length,
      records: calculatedRecords,
    };
  }

  /**
   * Insert new MasterStudentActivityFund record matching legacy btnSave_Click validations
   */
  async createStudentActivityFund(username, data) {
    if (!username) {
      throw new Error("Username is required.");
    }
    if (!data.session || data.session.trim() === "") {
      throw new Error("Please enter Session");
    }
    if (!data.collegeName || data.collegeName.trim() === "") {
      throw new Error("Please Enter College Name");
    }
    if (!data.course || data.course.trim() === "") {
      throw new Error("Please Enter Course");
    }
    if (!data.batch || data.batch.toString().trim() === "") {
      throw new Error("Please Enter Batch");
    }
    if (!data.semester || data.semester.trim() === "") {
      throw new Error("Please Enter Semester");
    }
    if (!data.scheme || data.scheme.trim() === "") {
      throw new Error("Please Enter Scheme");
    }
    if (!data.category || data.category.trim() === "") {
      throw new Error("Please Enter Category");
    }

    // Verify user is assigned to the selected college
    const isAssigned = await semesterRepository.entryAlreadyExist(username, data.collegeName);
    if (!isAssigned) {
      throw new Error("Unauthorized: Selected College is not assigned to your account.");
    }

    return await studentActivityFundRepository.createStudentActivityFund(data);
  }

  /**
   * Get distinct Schemes
   */
  async getSchemes(username) {
    return await studentActivityFundRepository.getSchemes(username);
  }

  /**
   * Get distinct Categories
   */
  async getCategories(username) {
    return await studentActivityFundRepository.getCategories(username);
  }
}

module.exports = new StudentActivityFundService();
