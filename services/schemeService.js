const schemeRepository = require("../repositories/schemeRepository");
const semesterRepository = require("../repositories/semesterRepository");

/**
 * Scheme Service Layer
 * Business logic for MasterScheme records.
 */
class SchemeService {
  /**
   * Fetch MasterScheme records for logged-in user's assigned colleges
   */
  async getSchemes(username, collegeName) {
    if (!username) {
      throw new Error("Username is required.");
    }
    const records = await schemeRepository.getSchemes(username, collegeName);
    return {
      totalRecords: records.length,
      records,
    };
  }

  /**
   * Insert new Scheme record into MasterScheme
   */
  async createScheme(username, { collegeName, scheme }) {
    if (!username) {
      throw new Error("Username is required.");
    }
    if (!collegeName || !scheme) {
      throw new Error("College Name and Scheme are required.");
    }

    // Verify user is assigned to the selected college
    const isAssigned = await semesterRepository.entryAlreadyExist(username, collegeName);
    if (!isAssigned) {
      throw new Error("Unauthorized: Selected College is not assigned to your account.");
    }

    return await schemeRepository.createScheme(collegeName, scheme);
  }
}

module.exports = new SchemeService();
