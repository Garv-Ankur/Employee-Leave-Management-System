document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    const leaveList = document.getElementById('leave-list');
    const leaveListEmpty = document.getElementById('leave-list-empty');
    const statusFilterButtons = document.querySelectorAll('.status-filters .btn');
    const typeFilterButtons = document.querySelectorAll('.type-filters .btn');
    const logoutBtn = document.getElementById('logout-btn');
    const toast = document.getElementById('toast-notification');
    const addEmployeeForm = document.getElementById('add-employee-form');
    const employeeList = document.getElementById('employee-list');
    const employeeListEmpty = document.getElementById('employee-list-empty');
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page-content');
    const calendarEl = document.getElementById('calendar');
    const editBalanceModalEl = document.getElementById('editBalanceModal');
    const editBalanceModal = new bootstrap.Modal(editBalanceModalEl);
    const saveBalanceBtn = document.getElementById('save-balance-btn');
    const employeeSearchInput = document.getElementById('employee-search-input');
    const logoutConfirmModalEl = document.getElementById('logoutConfirmModal');
    const logoutConfirmModal = new bootstrap.Modal(logoutConfirmModalEl);
    const confirmLogoutBtn = document.getElementById('confirm-logout-btn');

    let allRequests = [];
    let allEmployees = [];
    let calendar;
    let currentStatusFilter = 'All';
    let currentTypeFilter = 'All';

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const hidePreloader = () => {
        if (preloader) preloader.classList.add('fade-out');
    };
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const clickedLink = e.target.closest('.nav-link');
            const pageId = clickedLink.dataset.page;
            pages.forEach(page => page.classList.remove('active'));
            navLinks.forEach(navLink => navLink.classList.remove('active'));
            document.getElementById(`${pageId}-page`).classList.add('active');
            clickedLink.classList.add('active');
            if (pageId === 'leave-calendar' && calendar) {
                setTimeout(() => calendar.render(), 1);
            }
            const offcanvas = bootstrap.Offcanvas.getInstance(document.getElementById('sidebar'));
            if (offcanvas) offcanvas.hide();
        });
    });

    const showToast = (message, type) => {
        toast.textContent = message;
        toast.className = `toast show bg-${type === 'success' ? 'success' : 'danger'} text-white`;
        setTimeout(() => {
            toast.className = toast.className.replace('show', '');
        }, 3000);
    };

    const initializeCalendar = () => {
        const approvedLeaves = allRequests.filter(req => req.status === 'Approved').map(req => {
            const endDate = new Date(req.endDate);
            endDate.setUTCDate(endDate.getUTCDate() + 1);
            return { title: req.employeeName, start: formatDate(req.startDate), end: formatDate(endDate), allDay: true };
        });
        if (calendar) calendar.destroy();
        calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' },
            events: approvedLeaves,
            eventColor: '#198754'
        });
    };

    const fetchLeaveRequests = async () => {
        try {
            const response = await fetch('/api/leaves');
            if (!response.ok) throw new Error('Network response was not ok');
            allRequests = await response.json();
            applyFilters();
            initializeCalendar();
        } catch (error) {
            console.error('Error fetching requests:', error);
            leaveList.style.display = 'none';
            leaveListEmpty.style.display = 'block';
        }
    };
    
    const displayLeaveRequests = (requests) => {
        if (requests.length === 0) {
            leaveList.style.display = 'none';
            leaveListEmpty.style.display = 'block';
            return;
        }
        leaveList.style.display = 'block';
        leaveListEmpty.style.display = 'none';

        leaveList.innerHTML = '';
        requests.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        requests.forEach(req => {
            const item = document.createElement('div');
            item.className = `leave-item status-${req.status}`;
            const actions = req.status === 'Pending' ? `<div class="leave-actions"><button class="btn btn-sm btn-success" onclick="updateLeaveStatus('${req._id}','Approved')">Approve</button><button class="btn btn-sm btn-danger ms-2" onclick="updateLeaveStatus('${req._id}','Rejected')">Reject</button></div>` : '';
            item.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <h3>${req.employeeName}</h3>
                    <div class="tag-container">
                        <span class="status-tag status-${req.status}">${req.status}</span>
                        <span class="type-tag type-${req.leaveType}">${req.leaveType}</span>
                    </div>
                </div>
                <p><strong>Dates:</strong> ${formatDate(req.startDate)} to ${formatDate(req.endDate)}</p>
                <p><strong>Duration:</strong> ${req.duration} day(s)</p>
                <p><strong>Reason:</strong> ${req.reason}</p>
                ${actions}`;
            leaveList.appendChild(item);
        });
    };
    
    const applyFilters = () => {
        let filteredRequests = allRequests;
        if (currentStatusFilter !== 'All') {
            filteredRequests = filteredRequests.filter(req => req.status === currentStatusFilter);
        }
        if (currentTypeFilter !== 'All') {
            filteredRequests = filteredRequests.filter(req => req.leaveType === currentTypeFilter);
        }
        displayLeaveRequests(filteredRequests);
    };

    statusFilterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            currentStatusFilter = e.target.dataset.filterValue;
            statusFilterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            applyFilters();
        });
    });

    typeFilterButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            currentTypeFilter = e.target.dataset.filterValue;
            typeFilterButtons.forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
            applyFilters();
        });
    });

    window.updateLeaveStatus = async (id, status) => {
        try {
            const res = await fetch(`/api/leaves/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to update.');
            showToast(`Request ${status.toLowerCase()}.`, 'success');
            fetchLeaveRequests();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await fetch('/api/users/employees');
            if (!res.ok) throw new Error('Could not fetch employees.');
            allEmployees = await res.json();
            displayEmployees(allEmployees);
        } catch (error) {
            employeeList.style.display = 'none';
            employeeListEmpty.style.display = 'block';
        }
    };

    const displayEmployees = (employees) => {
        if (employees.length === 0) {
            employeeList.style.display = 'none';
            employeeListEmpty.style.display = 'block';
            return;
        }
        employeeList.style.display = 'block';
        employeeListEmpty.style.display = 'none';
        
        employeeList.innerHTML = '';
        employees.forEach(emp => {
            const item = document.createElement('div');
            item.className = 'employee-item';
            item.innerHTML = `<div class="employee-details"><p class="employee-name">${emp.fullName}</p><p class="employee-info">Username: ${emp.username} | Balance: ${emp.leaveBalance} days</p></div><div class="employee-actions"><button class="btn btn-sm btn-outline-primary" onclick="openEditBalanceModal('${emp._id}')"><i class="bi bi-pencil-fill"></i> Edit</button><button class="btn btn-sm btn-danger ms-2" onclick="deleteEmployee('${emp._id}')"><i class="bi bi-trash-fill"></i> Delete</button></div>`;
            employeeList.appendChild(item);
        });
    };
    
    addEmployeeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = { fullName: e.target.fullName.value, username: e.target.username.value, password: e.target.password.value, leaveBalance: e.target.leaveBalance.value };
        try {
            const res = await fetch('/api/users/employee', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to add.');
            showToast('Employee added!', 'success');
            addEmployeeForm.reset();
            fetchEmployees();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
    
    window.deleteEmployee = async (id) => {
        if (!confirm('Delete this employee?')) return;
        try {
            const res = await fetch(`/api/users/employee/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete.');
            showToast('Employee deleted!', 'success');
            fetchEmployees();
        } catch (error) {
            showToast(error.message, 'error');
        }
    };

    window.openEditBalanceModal = (id) => {
        const emp = allEmployees.find(e => e._id === id);
        if (!emp) return;
        document.getElementById('edit-employee-id').value = emp._id;
        document.getElementById('edit-employee-name').textContent = emp.fullName;
        document.getElementById('edit-leaveBalance').value = emp.leaveBalance;
        editBalanceModal.show();
    };

    saveBalanceBtn.addEventListener('click', async () => {
        const id = document.getElementById('edit-employee-id').value;
        const newBalance = document.getElementById('edit-leaveBalance').value;
        try {
            const res = await fetch(`/api/users/employee/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ leaveBalance: newBalance }) });
            if (!res.ok) throw new Error((await res.json()).error || 'Failed to update.');
            showToast('Balance updated!', 'success');
            editBalanceModal.hide();
            fetchEmployees();
        } catch (error) {
            showToast(error.message, 'error');
        }
    });

    logoutBtn.addEventListener('click', () => {
        logoutConfirmModal.show();
    });

    confirmLogoutBtn.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = '/';
    });

    employeeSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const filteredEmployees = allEmployees.filter(employee => 
            employee.fullName.toLowerCase().includes(searchTerm)
        );
        displayEmployees(filteredEmployees);
    });

    Promise.all([
        fetchLeaveRequests(),
        fetchEmployees()
    ]).then(() => {
        hidePreloader();
    });
});