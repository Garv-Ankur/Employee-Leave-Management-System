
document.addEventListener('DOMContentLoaded', () => {
    const leaveForm = document.getElementById('leave-form');
    const leaveList = document.getElementById('leave-list');
    const formMessage = document.getElementById('form-message');

    
    const fetchLeaveRequests = async () => {
        try {
            const response = await fetch('/api/leaves');
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const requests = await response.json();
            displayLeaveRequests(requests);
        } catch (error) {
            console.error('Error fetching leave requests:', error);
            leaveList.innerHTML = '<p class="empty-text">Could not load leave requests. Please try again later.</p>';
        }
    };

    
    const displayLeaveRequests = (requests) => {
        
        leaveList.innerHTML = '';

        if (requests.length === 0) {
            leaveList.innerHTML = '<p class="empty-text">No leave requests found.</p>';
            return;
        }

        requests.forEach(req => {
            const leaveItem = document.createElement('div');
            leaveItem.classList.add('leave-item');
            leaveItem.innerHTML = `
                <h3>${req.employeeName}</h3>
                <p><strong>Dates:</strong> ${req.startDate} to ${req.endDate}</p>
                <p><strong>Reason:</strong> ${req.reason}</p>
            `;
            leaveList.appendChild(leaveItem);
        });
    };

    
    const handleFormSubmit = async (event) => {
        event.preventDefault(); 

        
        const formData = new FormData(leaveForm);
        const leaveData = {
            employeeName: formData.get('employeeName'),
            startDate: formData.get('startDate'),
            endDate: formData.get('endDate'),
            reason: formData.get('reason'),
        };

        try {
            
            const response = await fetch('/api/leaves', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(leaveData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to submit leave request');
            }
            
            
            showFormMessage('Leave request submitted successfully!', 'success');

            
            leaveForm.reset();

            
            fetchLeaveRequests();

        } catch (error) {
            console.error('Error submitting form:', error);
            showFormMessage(error.message, 'error');
        }
    };
    
    
    const showFormMessage = (message, type) => {
        formMessage.textContent = message;
        formMessage.className = `message ${type}`; 
        
        
        setTimeout(() => {
            formMessage.textContent = '';
            formMessage.className = 'message';
        }, 5000);
    };


    
    leaveForm.addEventListener('submit', handleFormSubmit);

    
    fetchLeaveRequests();
});