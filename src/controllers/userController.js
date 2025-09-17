const userService = require("../services/userService");

async function createUserAPI(req, res) {
  const { status, ...data } = await userService.createTutor(req);
  return res.status(status).send(data);
}

async function createStudentAPI(req, res) {
  const { status, ...data } = await userService.createStudent(req);
  return res.status(status).send(data);
}

async function updateProfileAPI(req, res) {
  const { status, ...data } = await userService.updateProfile(req);
  return res.status(status).send(data);
}

async function removeUserAPI(req, res) {
  const { status, ...data } = await userService.removeUser(req);
  return res.status(status).send(data);
}
async function getUserDataAPI(req, res) {
  const { status, ...data } = await userService.getUserData(req);
  return res.status(status).send(data);
}

async function getAllStudentsAPI(req, res) {
  const { status, ...data } = await userService.getAllStudents(req);
  return res.status(status).send(data);
}

module.exports = {
  createUserAPI,
  updateProfileAPI,
  getUserDataAPI,
  removeUserAPI,
  createStudentAPI,
  getAllStudentsAPI,
};
