const mongoose = require('mongoose');
const fs = require('fs');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('Connected to MongoDB');
        migrateData();
    })
    .catch(err => console.error('Connection error:', err));

// Define schemas (same as in app.js)
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    fullName: { type: String, required: true },
    role: { type: String, required: true, enum: ['employee', 'hr'] },
    leaveBalance: { type: Number, default: 20 }
});
const User = mongoose.model('User', userSchema);

const leaveRequestSchema = new mongoose.Schema({
    employeeName: { type: String, required: true },
    leaveType: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    duration: { type: Number, required: true },
    reason: { type: String, required: true },
    status: { type: String, required: true, default: 'Pending', enum: ['Pending', 'Approved', 'Rejected'] }
});
const LeaveRequest = mongoose.model('LeaveRequest', leaveRequestSchema);

async function migrateData() {
    try {
        // Drop existing collections to avoid duplicates
        await mongoose.connection.db.dropCollection('users').catch(() => {});
        await mongoose.connection.db.dropCollection('leaverequests').catch(() => {});

        // Read users.json
        const usersData = JSON.parse(fs.readFileSync('./data/users.json', 'utf8'));
        const employees = usersData.employees.map(emp => ({
            username: emp.username,
            password: emp.password,
            fullName: emp.fullName,
            role: 'employee',
            leaveBalance: emp.leaveBalance
        }));
        const hrs = usersData.hr.map(hr => ({
            username: hr.username,
            password: hr.password,
            fullName: hr.fullName || hr.username, // Use username if fullName missing
            role: 'hr',
            leaveBalance: 0 // HR might not have leave balance
        }));
        const allUsers = [...employees, ...hrs];

        // Insert users
        await User.insertMany(allUsers);
        console.log('Users migrated successfully');

        // Read leaveRequests.json
        const leavesData = JSON.parse(fs.readFileSync('./data/leaveRequests.json', 'utf8'));
        const leaves = leavesData.map(leave => ({
            employeeName: leave.employeeName,
            leaveType: 'Annual', // Assuming default
            startDate: new Date(leave.startDate),
            endDate: new Date(leave.endDate),
            duration: Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 3600 * 24)) + 1,
            reason: leave.reason,
            status: leave.status
        }));

        // Insert leave requests
        await LeaveRequest.insertMany(leaves);
        console.log('Leave requests migrated successfully');

    } catch (error) {
        console.error('Migration error:', error);
    } finally {
        mongoose.connection.close();
    }
}