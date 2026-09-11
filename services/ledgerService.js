const ledgerRepository = require("../repositories/ledgerRepository");
const semesterRepository = require("../repositories/semesterRepository");

/**
 * Ledger Service Layer
 * Business logic for MasterLedgers records.
 */
class LedgerService {
  /**
   * Fetch MasterLedgers records for logged-in user's assigned colleges
   */
  async getLedgers(username, collegeName) {
    if (!username) {
      throw new Error("Username is required.");
    }
    const records = await ledgerRepository.getLedgers(username, collegeName);
    return {
      totalRecords: records.length,
      records,
    };
  }

  /**
   * Insert new Ledger record into MasterLedgers
   */
  async createLedger(username, { collegeName, ledgerName }) {
    if (!username) {
      throw new Error("Username is required.");
    }
    if (!collegeName || collegeName.trim() === "") {
      throw new Error("Please Enter College Name");
    }
    if (!ledgerName || ledgerName.trim() === "") {
      throw new Error("Please Enter Ledger Name");
    }

    // Verify user is assigned to the selected college
    const isAssigned = await semesterRepository.entryAlreadyExist(username, collegeName);
    if (!isAssigned) {
      throw new Error("Unauthorized: Selected College is not assigned to your account.");
    }

    return await ledgerRepository.createLedger(collegeName.trim(), ledgerName.trim());
  }
}

module.exports = new LedgerService();
