document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    const leaveForm = document.getElementById('leave-form');
    const employeeNameInput = document.getElementById('employeeName');
    const leaveHistoryList = document.getElementById('leave-history-list');
    const leaveHistoryEmpty = document.getElementById('leave-history-empty');
    const leaveBalanceDisplay = document.getElementById('sidebar-leave-balance'); 
    const employeeNameDisplay = document.getElementById('employee-name-display');
    const logoutBtn = document.getElementById('logout-btn');
    const toast = document.getElementById('toast-notification');
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page-content');
    const editModalEl = document.getElementById('editLeaveModal');
    const editModal = new bootstrap.Modal(editModalEl);
    const saveEditBtn = document.getElementById('save-edit-btn');
    const logoutConfirmModalEl = document.getElementById('logoutConfirmModal');
    const logoutConfirmModal = new bootstrap.Modal(logoutConfirmModalEl);
    const confirmLogoutBtn = document.getElementById('confirm-logout-btn');

    let allMyRequests = [];

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

    const loggedInEmployeeName = sessionStorage.getItem('loggedInEmployeeName');
    if (!loggedInEmployeeName) {
        window.location.href = '/employee-login.html';
        return; 
    }

    employeeNameInput.value = loggedInEmployeeName;
    employeeNameDisplay.textContent = loggedInEmployeeName;

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const clickedLink = e.target.closest('.nav-link');
            const pageId = clickedLink.dataset.page;
            
            pages.forEach(page => page.classList.remove('active'));
            navLinks.forEach(navLink => navLink.classList.remove('active'));

            document.getElementById(`${pageId}-page`).classList.add('active');
            clickedLink.classList.add('active');
            
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

    const updateBalanceDisplay = async () => {
        try {
            const encodedName = encodeURIComponent(loggedInEmployeeName);
            const response = await fetch(`/api/users/${encodedName}`);
            if (!response.ok) throw new Error('Could not fetch balance');
            const userData = await response.json();
            leaveBalanceDisplay.textContent = `${userData.leaveBalance} Days`; 
            sessionStorage.setItem('leaveBalance', userData.leaveBalance);
        } catch (error) {
            console.error(error);
            leaveBalanceDisplay.textContent = 'Error';
        }
    };
    
    const fetchLeaveHistory = async () => {
        try {
            const encodedName = encodeURIComponent(loggedInEmployeeName);
            const response = await fetch(`/api/leaves/${encodedName}`);
            if (!response.ok) throw new Error('Network response was not ok');
            allMyRequests = await response.json();
            displayLeaveHistory(allMyRequests);
        } catch (error) {
            console.error('Error fetching leave history:', error);
            leaveHistoryList.style.display = 'none';
            leaveHistoryEmpty.style.display = 'block';
        }
    };
    
    const displayLeaveHistory = (requests) => {
        if (requests.length === 0) {
            leaveHistoryList.style.display = 'none';
            leaveHistoryEmpty.style.display = 'block';
            return;
        }
        leaveHistoryList.style.display = 'block';
        leaveHistoryEmpty.style.display = 'none';
        
        leaveHistoryList.innerHTML = '';
        requests.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
        requests.forEach(req => {
            const leaveItem = document.createElement('div');
            leaveItem.className = `leave-item status-${req.status}`;
            const actionsHtml = req.status === 'Pending' ? `<div class="leave-actions"><button class="btn btn-sm btn-outline-primary" onclick="openEditModal('${req._id}')"><i class="bi bi-pencil-fill"></i> Edit</button><button class="btn btn-sm btn-outline-danger ms-2" onclick="cancelRequest('${req._id}')"><i class="bi bi-trash-fill"></i> Cancel</button></div>` : '';
            leaveItem.innerHTML = `<div class="d-flex justify-content-between align-items-start"><div><div class="tag-container"><span class="status-tag status-${req.status}">${req.status}</span><span class="type-tag type-${req.leaveType}">${req.leaveType}</span></div><p><strong>Dates:</strong> ${formatDate(req.startDate)} to ${formatDate(req.endDate)} (${req.duration} days)</p><p><strong>Reason:</strong> ${req.reason}</p></div>${actionsHtml}</div>`;
            leaveHistoryList.appendChild(leaveItem);
        });
    };
    
    window.openEditModal = (id) => {
        const request = allMyRequests.find(r => r._id === id);
        if (!request) return;
        document.getElementById('edit-request-id').value = request._id;
        document.getElementById('edit-startDate').value = formatDate(request.startDate);
        document.getElementById('edit-endDate').value = formatDate(request.endDate);
        document.getElementById('edit-reason').value = request.reason;
        editModal.show();
    };

    saveEditBtn.addEventListener('click', async () => {
        const id = document.getElementById('edit-request-id').value;
        const updatedRequest = { startDate: document.getElementById('edit-startDate').value, endDate: document.getElementById('edit-endDate').value, reason: document.getElementById('edit-reason').value };
        try {
            const response = await fetch(`/api/leaves/edit/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updatedRequest) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to save.');
            showToast('Request updated!', 'success');
            editModal.hide();
            fetchLeaveHistory();
            updateBalanceDisplay();
        } catch (error) {
            console.error('Error updating request:', error);
            showToast(error.message, 'error');
        }
    });

    window.cancelRequest = async (id) => {
        if (!confirm('Cancel this leave request?')) return;
        try {
            const response = await fetch(`/api/leaves/${id}`, { method: 'DELETE' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to cancel.');
            showToast('Request cancelled!', 'success');
            fetchLeaveHistory();
        } catch (error) {
            console.error('Error cancelling request:', error);
            showToast(error.message, 'error');
        }
    };
    
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        const leaveData = { employeeName: event.target.employeeName.value, startDate: event.target.startDate.value, endDate: event.target.endDate.value, reason: event.target.reason.value, leaveType: event.target.leaveType.value };
        try {
            const response = await fetch('/api/leaves', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(leaveData) });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error || 'Failed to submit.');
            showToast('Request submitted!', 'success');
            leaveForm.reset();
            employeeNameInput.value = loggedInEmployeeName;
            fetchLeaveHistory();
            updateBalanceDisplay();
        } catch (error) {
            console.error('Error submitting form:', error);
            showToast(error.message, 'error');
        }
    };
    
    logoutBtn.addEventListener('click', () => {
        logoutConfirmModal.show();
    });

    confirmLogoutBtn.addEventListener('click', () => {
        sessionStorage.clear();
        window.location.href = '/';
    });
    leaveForm.addEventListener('submit', handleFormSubmit);

    Promise.all([
        updateBalanceDisplay(),
        fetchLeaveHistory()
    ]).then(() => {
        hidePreloader();
    });
});