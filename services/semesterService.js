const semesterRepository = require("../repositories/semesterRepository");

/**
 * Semester Service Layer
 * Contains business logic and orchestrates Repository operations.
 */
class SemesterService {
  /**
   * Fetch current semester records based on logged-in user's colleges and optional filters.
   */
  async displayAll(username, filters = {}) {
    if (!username) {
      throw new Error("Username is required.");
    }
    const records = await semesterRepository.displayAll(username, filters);
    return {
      totalRecords: records.length,
      records,
    };
  }

  /**
   * Fetch assigned distinct colleges in MasterCourse for logged-in user.
   */
  async getCollege(username) {
    if (!username) {
      throw new Error("Username is required.");
    }
    const colleges = await semesterRepository.getCollege(username);
    return colleges.map((item) => item.CollegeName);
  }

  /**
   * Fetch assigned college names from UserMaster.
   */
  async getAssignedCollegeName(username) {
    if (!username) {
      throw new Error("Username is required.");
    }
    const colleges = await semesterRepository.getAssignedCollegeName(username);
    return colleges.map((item) => item.CollegeName);
  }

  /**
   * Verify if a given college belongs to logged-in user.
   */
  async entryAlreadyExist(username, collegeName) {
    if (!username || !collegeName) {
      throw new Error("Username and CollegeName are required.");
    }
    const exists = await semesterRepository.entryAlreadyExist(username, collegeName);
    return { collegeName, exists };
  }

  /**
   * Fetch distinct courses for assigned user colleges.
   */
  async getCourse(username, collegeName) {
    if (!username) {
      throw new Error("Username is required.");
    }
    const courses = await semesterRepository.getCourse(username, collegeName);
    return courses.map((item) => item.Course);
  }

  /**
   * Fetch distinct batches for assigned user colleges.
   */
  async getBatch(username, collegeName, course) {
    if (!username) {
      throw new Error("Username is required.");
    }
    const batches = await semesterRepository.getBatch(username, collegeName, course);
    return batches.map((item) => item.Batch);
  }

  /**
   * Fetch distinct semesters ordered by SemesterID for assigned user colleges.
   */
  async getSemester(username, collegeName, course, batch) {
    if (!username) {
      throw new Error("Username is required.");
    }
    const semesters = await semesterRepository.getSemester(username, collegeName, course, batch);
    return semesters.map((item) => ({
      semester: item.Semester,
      semesterId: item.SemesterID,
    }));
  }

  /**
   * Insert new record into MasterCurrentSemester table.
   */
  async createSemester(username, { collegeName, course, batch, semester }) {
    if (!username) {
      throw new Error("Username is required.");
    }
    if (!collegeName || !course || !batch || !semester) {
      throw new Error("College Name, Course, Batch, and Semester are all required.");
    }

    // Verify assigned college
    const isAssigned = await semesterRepository.entryAlreadyExist(username, collegeName);
    if (!isAssigned) {
      throw new Error("Unauthorized: Selected College is not assigned to your account.");
    }

    return await semesterRepository.createSemester(collegeName, course, batch, semester);
  }
}

module.exports = new SemesterService();
