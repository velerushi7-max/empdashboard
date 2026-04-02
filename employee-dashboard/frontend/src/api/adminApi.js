import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';
const ADMIN_API = `${BASE_URL}/admin`;

const getAuthHeader = () => ({
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});

export const getSummary = () => axios.get(`${ADMIN_API}/summary`, getAuthHeader());
export const getUsers = () => axios.get(`${ADMIN_API}/users`, getAuthHeader());
export const createUser = (data) => axios.post(`${ADMIN_API}/users`, data, getAuthHeader());
export const updateUser = (data) => axios.put(`${ADMIN_API}/users/${data.id}`, data, getAuthHeader());
export const deleteUser = (id) => axios.delete(`${ADMIN_API}/users/${id}`, getAuthHeader());
export const getSalaries = () => axios.get(`${ADMIN_API}/salaries`, getAuthHeader());
export const getAllLeaves = () => axios.get(`${ADMIN_API}/leaves`, getAuthHeader());
export const getAllAttendance = () => axios.get(`${ADMIN_API}/attendance`, getAuthHeader());
export const getAdminProjects = () => axios.get(`${ADMIN_API}/projects`, getAuthHeader());
export const updateLeaveStatus = (id, status) => axios.put(`${ADMIN_API}/leaves/${id}/status`, { status }, getAuthHeader());

// 💰 Payroll
export const createPayroll = (data) => axios.post(`${ADMIN_API}/payroll`, data, getAuthHeader());
export const getAllPayroll = (search = '', status = '') => axios.get(`${ADMIN_API}/payroll?search=${search}&status=${status}`, getAuthHeader());
export const updatePayroll = (id, data) => axios.put(`${ADMIN_API}/payroll/${id}`, data, getAuthHeader());
export const deletePayroll = (id) => axios.delete(`${ADMIN_API}/payroll/${id}`, getAuthHeader());
export const updatePayrollStatus = (id, status) => axios.put(`${ADMIN_API}/payroll/${id}/status`, { status }, getAuthHeader());
export const getEmployeePayslips = (id) => axios.get(`${BASE_URL}/employee/${id}/payslips`, getAuthHeader());
export const getManagerPayroll = () => axios.get(`${BASE_URL}/manager/payroll`, getAuthHeader());
export const getManagers = () => axios.get(`${ADMIN_API}/managers`, getAuthHeader());

// 👤 User Aliases
export const addEmployee = (data) => axios.post(`${ADMIN_API}/employees`, { ...data, role: 'Employee' }, getAuthHeader());
export const addManager = (data) => axios.post(`${ADMIN_API}/managers`, { ...data, role: 'Manager' }, getAuthHeader());
