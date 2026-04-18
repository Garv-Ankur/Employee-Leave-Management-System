const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

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

// API Routes 
app.post('/api/login/employee', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password, role: 'employee' });
        if (user) {
            res.json({ success: true, message: 'Login successful', fullName: user.fullName, leaveBalance: user.leaveBalance });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/login/hr', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password, role: 'hr' });
        if (user) {
            res.json({ success: true, message: 'Login successful' });
        } else {
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/users/employees', async (req, res) => { try { const employees = await User.find({ role: 'employee' }); res.json(employees); } catch (error) { res.status(500).json({ error: 'Server error' }); } });
app.delete('/api/users/employee/:id', async (req, res) => { try { await User.findByIdAndDelete(req.params.id); res.json({ success: true, message: 'Employee deleted.' }); } catch (error) { res.status(500).json({ error: 'Server error' }); } });
app.put('/api/users/employee/:id', async (req, res) => { try { const { leaveBalance } = req.body; const updatedUser = await User.findByIdAndUpdate(req.params.id, { leaveBalance }, { new: true }); res.json(updatedUser); } catch (error) { res.status(500).json({ error: 'Server error' }); } });
app.get('/api/users/:employeeName', async (req, res) => { try { const user = await User.findOne({ fullName: decodeURIComponent(req.params.employeeName) }); if (user) { res.json({ leaveBalance: user.leaveBalance }); } else { res.status(404).json({ error: "User not found" }); } } catch (error) { res.status(500).json({ error: 'Server error' }); } });

app.get('/api/leaves', async (req, res) => { try { const requests = await LeaveRequest.find(); res.json(requests); } catch (error) { res.status(500).json({ error: 'Server error' }); } });
app.get('/api/leaves/:employeeName', async (req, res) => { try { const requests = await LeaveRequest.find({ employeeName: decodeURIComponent(req.params.employeeName) }); res.json(requests); } catch (error) { res.status(500).json({ error: 'Server error' }); } });

app.post('/api/leaves', async (req, res) => {
    try {
        const { employeeName, startDate, endDate, reason, leaveType } = req.body;
        const user = await User.findOne({ fullName: employeeName });
        if (!user) return res.status(404).json({ error: 'Submitting employee not found.' });
        
        const start = new Date(startDate + 'T00:00:00Z');
        const end = new Date(endDate + 'T00:00:00Z');
        
        const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
        if (duration <= 0) return res.status(400).json({ error: 'End date must be after start date.' });
        if (user.leaveBalance < duration) return res.status(400).json({ error: `Insufficient balance.` });

        const newLeaveRequest = new LeaveRequest({ employeeName, startDate: start, endDate: end, reason, leaveType, duration });
        await newLeaveRequest.save();
        res.status(201).json(newLeaveRequest);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/leaves/:id', async (req, res) => { try { const { status } = req.body; const request = await LeaveRequest.findById(req.params.id); if (!request) return res.status(404).json({ error: 'Request not found.' }); if (request.status === 'Pending' && status === 'Approved') { const user = await User.findOne({ fullName: request.employeeName }); if (user.leaveBalance < request.duration) return res.status(400).json({ error: 'Employee has insufficient balance.' }); user.leaveBalance -= request.duration; await user.save(); } request.status = status; await request.save(); res.json(request); } catch (error) { res.status(500).json({ error: 'Server error' }); } });
app.delete('/api/leaves/:id', async (req, res) => { try { await LeaveRequest.findByIdAndDelete(req.params.id); res.json({ success: true, message: 'Request cancelled.' }); } catch (error) { res.status(500).json({ error: 'Server error' }); } });

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});