// Team members in specified order
const teamMembers = [
    'AJLO', 'NRVL', 'NHSM', 'TBD', 'PCPH', 'SJAP', 'AUAJ', 'NCIK',
    'GTAI', 'HDMP', 'TKYR', 'SLJG', 'RTDY', 'KNGT', 'DKDV', 'VKBV',
    'MOZF', 'RTPH', 'KIDZ', 'NSJK', 'IPLA', 'PRET', 'TBD', 'HMDP',
    'RDVA', 'NMJP', 'GSHV', 'HKPT', 'IVRS', 'IOJN', 'QKRM', 'USRJ',
    'SYDQ', 'GVMR', 'NUMT', 'MGVM', 'JVMC', 'SIZR', 'IUHK'
];

// Admin users with special privileges
const ADMIN_USERS = ['AJLO'];

// GBS Holidays 2026
const holidays = [
    { month: 0, day: 15, name: 'Makara Sankranti' },
    { month: 0, day: 26, name: 'Republic Day' },
    { month: 2, day: 19, name: 'Ugadi Festival' },
    { month: 4, day: 1, name: 'May Day' },
    { month: 4, day: 28, name: 'Bakrid' },
    { month: 8, day: 14, name: 'Ganesh Chaturthi' },
    { month: 9, day: 2, name: 'Gandhi Jayanti' },
    { month: 9, day: 20, name: 'Ayudha Puja' },
    { month: 10, day: 10, name: 'Deepavali' },
    { month: 11, day: 25, name: 'Christmas' }
];

// Global variables
let currentUser = null;
let attendanceData = {};
let pendingChanges = {};
let savedData = {};
let dataOwnership = {};
let securityLog = [];

// Check if user is admin
function isAdmin() {
    return currentUser && ADMIN_USERS.includes(currentUser.code);
}

// Check if a date is a holiday
function isHoliday(month, day) {
    return holidays.some(h => h.month === month && h.day === day);
}

// Get holiday name
function getHolidayName(month, day) {
    const holiday = holidays.find(h => h.month === month && h.day === day);
    return holiday ? holiday.name : '';
}

// Log security violation
function logSecurityViolation(action, attemptedMember) {
    const violation = {
        timestamp: new Date().toISOString(),
        user: currentUser ? currentUser.code : 'UNKNOWN',
        action: action,
        attemptedMember: attemptedMember,
        ipAddress: 'N/A'
    };
    
    securityLog.push(violation);
    localStorage.setItem('securityLog2026', JSON.stringify(securityLog));
    
    console.error('🚨 SECURITY VIOLATION:', violation);
    
    const violationMsg = document.getElementById('securityViolation');
    violationMsg.style.display = 'block';
    setTimeout(() => {
        violationMsg.style.display = 'none';
    }, 5000);
}

// Handle login
function handleLogin(event) {
    event.preventDefault();
    const userCodeInput = document.getElementById('userCode').value.toUpperCase().trim();
    const errorMsg = document.getElementById('errorMessage');
    
    if (userCodeInput.length !== 4 || !/^[A-Z]{4}$/.test(userCodeInput)) {
        errorMsg.textContent = 'Please enter exactly 4 letters.';
        errorMsg.style.display = 'block';
        return;
    }
    
    if (!teamMembers.includes(userCodeInput)) {
        errorMsg.textContent = `User code "${userCodeInput}" is not authorized for this application.`;
        errorMsg.style.display = 'block';
        return;
    }
    
    currentUser = {
        code: userCodeInput,
        email: userCodeInput.toLowerCase() + '@novonordisk.com',
        loginTime: new Date().toISOString(),
        isAdmin: ADMIN_USERS.includes(userCodeInput)
    };
    
    const authToken = btoa(JSON.stringify(currentUser) + Date.now());
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    sessionStorage.setItem('authToken', authToken);
    
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    
    document.getElementById('displayUserCode').textContent = userCodeInput;
    if (currentUser.isAdmin) {
        document.getElementById('displayUserCode').innerHTML = userCodeInput + '<span class="admin-badge">ADMIN</span>';
    }
    document.getElementById('userEmail').textContent = currentUser.email;
    document.getElementById('securityUserCode').textContent = userCodeInput;
    
    if (currentUser.isAdmin) {
        document.getElementById('adminNotice').style.display = 'block';
        document.getElementById('reportBtn').style.display = 'inline-block';
    }
    
    initializeAttendanceData();
    loadSavedData();
    generateCalendar(0);
}

// Logout
function logout() {
    // Clear any stored session data
    sessionStorage.clear();
    localStorage.clear();
    
    // Redirect to login page
    window.location.href = 'login.html';
}

// Verify user authentication
function verifyAuth() {
    const savedUser = sessionStorage.getItem('currentUser');
    const authToken = sessionStorage.getItem('authToken');
    
    if (!savedUser || !authToken) {
        return false;
    }
    
    try {
        const user = JSON.parse(savedUser);
        return teamMembers.includes(user.code);
    } catch (e) {
        return false;
    }
}

// Check if user is logged in on page load
window.onload = function() {
    if (verifyAuth()) {
        const savedUser = sessionStorage.getItem('currentUser');
        currentUser = JSON.parse(savedUser);
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        document.getElementById('displayUserCode').textContent = currentUser.code;
        if (currentUser.isAdmin) {
            document.getElementById('displayUserCode').innerHTML = currentUser.code + '<span class="admin-badge">ADMIN</span>';
            document.getElementById('adminNotice').style.display = 'block';
            document.getElementById('reportBtn').style.display = 'inline-block';
        }
        
        document.getElementById('userEmail').textContent = currentUser.email;
        document.getElementById('securityUserCode').textContent = currentUser.code;
        initializeAttendanceData();
        loadSavedData();
        generateCalendar(0);
    }
    
    const savedLog = localStorage.getItem('securityLog2026');
    if (savedLog) {
        securityLog = JSON.parse(savedLog);
    }
};

// Initialize attendance data
function initializeAttendanceData() {
    for (let month = 0; month < 12; month++) {
        const daysInMonth = new Date(2026, month + 1, 0).getDate();
        
        for (let member of teamMembers) {
            for (let day = 1; day <= daysInMonth; day++) {
                const key = `${month}-${day}-${member}`;
                const date = new Date(2026, month, day);
                const dayOfWeek = date.getDay();
                
                if (isHoliday(month, day)) {
                    attendanceData[key] = 'holiday';
                } else if (dayOfWeek === 0 || dayOfWeek === 6) {
                    attendanceData[key] = 'weekend';
                } else {
                    attendanceData[key] = attendanceData[key] || '';
                }
            }
        }
    }
}

// Load saved data from localStorage
function loadSavedData() {
    const saved = localStorage.getItem('attendanceData2026');
    const ownership = localStorage.getItem('dataOwnership2026');
    
    if (saved) {
        savedData = JSON.parse(saved);
        Object.keys(savedData).forEach(key => {
            const parts = key.split('-');
            const month = parseInt(parts[0]);
            const day = parseInt(parts[1]);
            if (!isHoliday(month, day) && savedData[key] !== 'weekend') {
                attendanceData[key] = savedData[key];
            }
        });
    }
    
    if (ownership) {
        dataOwnership = JSON.parse(ownership);
    }
}

// Save data to localStorage with ownership tracking
function saveDataToStorage() {
    Object.keys(pendingChanges).forEach(key => {
        if (pendingChanges[key]) {
            dataOwnership[key] = {
                owner: currentUser.code,
                timestamp: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
        }
    });
    
    localStorage.setItem('attendanceData2026', JSON.stringify(attendanceData));
    localStorage.setItem('dataOwnership2026', JSON.stringify(dataOwnership));
    savedData = {...attendanceData};
}

// Check if user can edit a specific cell
function canEdit(member, month, day) {
    if (!currentUser) {
        return false;
    }
    
    if (member !== currentUser.code) {
        return false;
    }
    
    const key = `${month}-${day}-${member}`;
    const status = attendanceData[key];
    
    if (status === 'holiday' || status === 'weekend') {
        return false;
    }
    
    return true;
}

// Extract member code from data key
function extractMemberFromKey(key) {
    const parts = key.split('-');
    return parts[2];
}

// Show warning message
function showWarning(message) {
    const warningMsg = document.getElementById('warningMessage');
    warningMsg.textContent = message;
    warningMsg.style.display = 'block';
    setTimeout(() => {
        warningMsg.style.display = 'none';
    }, 3000);
}

// Handle dropdown change
function handleDropdownChange(event, month, day, member) {
    if (!verifyAuth()) {
        showWarning('⚠️ Authentication expired. Please login again.');
        logout();
        return;
    }
    
    if (member !== currentUser.code) {
        logSecurityViolation(`Attempted to edit ${member}'s data`, member);
        showWarning(`🚨 SECURITY VIOLATION: User ${currentUser.code} cannot modify ${member}'s data!`);
        event.target.value = attendanceData[`${month}-${day}-${member}`] || '';
        return;
    }
    
    if (!canEdit(member, month, day)) {
        showWarning('⚠️ You cannot edit this cell!');
        event.target.value = attendanceData[`${month}-${day}-${member}`] || '';
        return;
    }
    
    const key = `${month}-${day}-${member}`;
    const newValue = event.target.value;
    
    attendanceData[key] = newValue;
    pendingChanges[key] = true;
    
    updatePendingChangesUI();
    
    // Update cell background color
    const cell = event.target.parentElement;
    cell.className = `editable ${newValue}`;
}

// Generate calendar table with dropdowns and COLORED EMOJI DOTS
function generateCalendar(month) {
    const daysInMonth = new Date(2026, month + 1, 0).getDate();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
    
    let html = '<thead><tr>';
    html += '<th class="member-col">Member</th>';
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(2026, month, day);
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        html += `<th><div>${day}</div><div class="day-header">${dayName}</div></th>`;
    }
    
    html += '<th>Stats</th></tr></thead><tbody>';
    
    for (let member of teamMembers) {
        const isCurrentUser = currentUser && member === currentUser.code;
        const rowClass = isCurrentUser ? 'current-user-row' : '';
        
        html += `<tr class="${rowClass}">`;
        html += `<td class="member-name">${member}${isCurrentUser ? ' (You)' : ''}</td>`;
        
        let planningCount = 0;
        let officeCount = 0;
        let leaveCount = 0;
        let travelCount = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const key = `${month}-${day}-${member}`;
            const status = attendanceData[key] || '';
            const isEditable = canEdit(member, month, day);
            
            let cellClass = status;
            
            if (isEditable) {
                cellClass += ' editable';
                
                // Create dropdown for editable cells with COLORED EMOJI DOTS
                html += `<td class="${cellClass}">`;
                html += `<select class="cell-dropdown" onchange="handleDropdownChange(event, ${month}, ${day}, '${member}')">`;
                html += `<option value="" ${status === '' ? 'selected' : ''}>-- Select --</option>`;
                html += `<option value="planning" ${status === 'planning' ? 'selected' : ''}>🟡 Plan</option>`;
                html += `<option value="office" ${status === 'office' ? 'selected' : ''}>🟢 Office</option>`;
                html += `<option value="leave" ${status === 'leave' ? 'selected' : ''}>🔴 Leave</option>`;
                html += `<option value="travel" ${status === 'travel' ? 'selected' : ''}>🔵 Travel</option>`;
                html += `</select>`;
                html += `</td>`;
            } else {
                cellClass += ' locked';
                // Always show date format (DD-MMM) for all locked cells
                let displayText = `${day}-${monthNames[month].substring(0, 3)}`;
                
                html += `<td class="${cellClass}">${displayText}</td>`;
            }
            
            // Count stats
            if (status === 'planning') planningCount++;
            if (status === 'office') officeCount++;
            if (status === 'leave') leaveCount++;
            if (status === 'travel') travelCount++;
        }
        
        html += `<td style="background:#e9ecef;font-weight:bold;font-size:9px;">P:${planningCount} O:${officeCount}<br>L:${leaveCount} T:${travelCount}</td>`;
        html += '</tr>';
    }
    
    html += '</tbody>';
    
    document.getElementById('attendanceTable').innerHTML = html;
    generateStats(month);
}

// Update pending changes UI
function updatePendingChangesUI() {
    const hasPendingChanges = Object.keys(pendingChanges).length > 0;
    document.getElementById('pendingChanges').style.display = hasPendingChanges ? 'block' : 'none';
    document.getElementById('pendingUserCode').textContent = currentUser ? currentUser.code : '';
    document.getElementById('submitBtn').disabled = !hasPendingChanges;
}

// Submit attendance
function submitAttendance() {
    if (Object.keys(pendingChanges).length === 0) {
        return;
    }
    
    if (!verifyAuth()) {
        showWarning('⚠️ Authentication expired. Please login again.');
        logout();
        return;
    }
    
    let violationDetected = false;
    for (let key in pendingChanges) {
        const member = extractMemberFromKey(key);
        if (member !== currentUser.code) {
            logSecurityViolation(`Attempted to submit data for ${member}`, member);
            showWarning(`🚨 SECURITY ERROR: You cannot submit data for ${member}!`);
            violationDetected = true;
            delete pendingChanges[key];
        }
    }
    
    if (violationDetected) {
        return;
    }
    
    saveDataToStorage();
    
    pendingChanges = {};
    updatePendingChangesUI();
    
    const successMsg = document.getElementById('successMessage');
    successMsg.style.display = 'block';
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 3000);
}

// Generate comprehensive report (Admin only)
function generateReport() {
    if (!isAdmin()) {
        showWarning('⚠️ You do not have permission to generate reports!');
        return;
    }
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
    
    let reportHTML = '';
    
    reportHTML += '<div class="report-section">';
    reportHTML += '<h3>Annual Summary</h3>';
    reportHTML += '<table class="report-table">';
    reportHTML += '<tr><th>Member</th><th>Planning</th><th>Office</th><th>Leave</th><th>Travel</th><th>Total Working Days</th></tr>';
    
    for (let member of teamMembers) {
        let yearlyPlanning = 0;
        let yearlyOffice = 0;
        let yearlyLeave = 0;
        let yearlyTravel = 0;
        let totalWorkingDays = 0;
        
        for (let month = 0; month < 12; month++) {
            const daysInMonth = new Date(2026, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const key = `${month}-${day}-${member}`;
                const status = attendanceData[key];
                
                if (status !== 'weekend' && status !== 'holiday') {
                    totalWorkingDays++;
                }
                
                if (status === 'planning') yearlyPlanning++;
                if (status === 'office') yearlyOffice++;
                if (status === 'leave') yearlyLeave++;
                if (status === 'travel') yearlyTravel++;
            }
        }
        
        reportHTML += `<tr>
            <td><strong>${member}</strong></td>
            <td>${yearlyPlanning}</td>
            <td>${yearlyOffice}</td>
            <td>${yearlyLeave}</td>
            <td>${yearlyTravel}</td>
            <td>${totalWorkingDays}</td>
        </tr>`;
    }
    
    reportHTML += '</table></div>';
    
    for (let month = 0; month < 12; month++) {
        reportHTML += '<div class="report-section">';
        reportHTML += `<h3>${monthNames[month]} 2026</h3>`;
        reportHTML += '<table class="report-table">';
        reportHTML += '<tr><th>Member</th><th>Planning</th><th>Office</th><th>Leave</th><th>Travel</th></tr>';
        
        for (let member of teamMembers) {
            let monthlyPlanning = 0;
            let monthlyOffice = 0;
            let monthlyLeave = 0;
            let monthlyTravel = 0;
            
            const daysInMonth = new Date(2026, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const key = `${month}-${day}-${member}`;
                const status = attendanceData[key];
                
                if (status === 'planning') monthlyPlanning++;
                if (status === 'office') monthlyOffice++;
                if (status === 'leave') monthlyLeave++;
                if (status === 'travel') monthlyTravel++;
            }
            
            reportHTML += `<tr>
                <td>${member}</td>
                <td>${monthlyPlanning}</td>
                <td>${monthlyOffice}</td>
                <td>${monthlyLeave}</td>
                <td>${monthlyTravel}</td>
            </tr>`;
        }
        
        reportHTML += '</table></div>';
    }
    
    document.getElementById('reportContent').innerHTML = reportHTML;
    document.getElementById('reportModal').style.display = 'block';
}

// Close report modal
function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

// Export report to CSV
function exportReportToCSV() {
    if (!isAdmin()) {
        showWarning('⚠️ You do not have permission to export reports!');
        return;
    }
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
    
    let csv = 'Comprehensive Attendance Report 2026\n\n';
    csv += 'Member,Month,Planning,Office,Leave,Travel\n';
    
    for (let month = 0; month < 12; month++) {
        for (let member of teamMembers) {
            let monthlyPlanning = 0;
            let monthlyOffice = 0;
            let monthlyLeave = 0;
            let monthlyTravel = 0;
            
            const daysInMonth = new Date(2026, month + 1, 0).getDate();
            for (let day = 1; day <= daysInMonth; day++) {
                const key = `${month}-${day}-${member}`;
                const status = attendanceData[key];
                
                if (status === 'planning') monthlyPlanning++;
                if (status === 'office') monthlyOffice++;
                if (status === 'leave') monthlyLeave++;
                if (status === 'travel') monthlyTravel++;
            }
            
            csv += `${member},${monthNames[month]},${monthlyPlanning},${monthlyOffice},${monthlyLeave},${monthlyTravel}\n`;
        }
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'Comprehensive_Attendance_Report_2026.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Generate statistics
function generateStats(month) {
    const daysInMonth = new Date(2026, month + 1, 0).getDate();
    
    let totalPlanning = 0;
    let totalOffice = 0;
    let totalLeave = 0;
    let totalTravel = 0;
    
    for (let member of teamMembers) {
        for (let day = 1; day <= daysInMonth; day++) {
            const key = `${month}-${day}-${member}`;
            const status = attendanceData[key];
            
            if (status === 'planning') totalPlanning++;
            else if (status === 'office') totalOffice++;
            else if (status === 'leave') totalLeave++;
            else if (status === 'travel') totalTravel++;
        }
    }
    
    const html = `
        <div class="stat-card">
            <h3>Planning to be in Office</h3>
            <p style="color: #CCC000;">${totalPlanning}</p>
        </div>
        <div class="stat-card">
            <h3>Office Presence</h3>
            <p style="color: #00AA00;">${totalOffice}</p>
        </div>
        <div class="stat-card">
            <h3>Leave Days</h3>
            <p style="color: #FF69B4;">${totalLeave}</p>
        </div>
        <div class="stat-card">
            <h3>Travel Days</h3>
            <p style="color: #4169E1;">${totalTravel}</p>
        </div>
    `;
    
    document.getElementById('statsContainer').innerHTML = html;
}

// Change month
function changeMonth() {
    const monthSelector = document.getElementById('monthSelector');
    const selectedMonth = parseInt(monthSelector.value);
    generateCalendar(selectedMonth);
}

// Export to CSV
function exportToCSV() {
    const monthSelector = document.getElementById('monthSelector');
    const selectedMonth = parseInt(monthSelector.value);
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
    const daysInMonth = new Date(2026, selectedMonth + 1, 0).getDate();
    
    let csv = 'Member,';
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(2026, selectedMonth, day);
        const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
        csv += `"${day}-${monthNames[selectedMonth].substring(0, 3)} (${dayName})",`;
    }
    csv += 'Planning,Office,Leave,Travel\n';
    
    for (let member of teamMembers) {
        csv += `${member},`;
        
        let planningCount = 0;
        let officeCount = 0;
        let leaveCount = 0;
        let travelCount = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const key = `${selectedMonth}-${day}-${member}`;
            const status = attendanceData[key] || '';
            
            let cellValue = '';
            if (status === 'planning') {
                cellValue = 'Planning';
                planningCount++;
            } else if (status === 'office') {
                cellValue = 'Office';
                officeCount++;
            } else if (status === 'leave') {
                cellValue = 'Leave';
                leaveCount++;
            } else if (status === 'travel') {
                cellValue = 'Travel';
                travelCount++;
            } else if (status === 'weekend') {
                cellValue = 'Weekend';
            } else if (status === 'holiday') {
                cellValue = 'Holiday';
            }
            
            csv += `"${cellValue}",`;
        }
        
        csv += `${planningCount},${officeCount},${leaveCount},${travelCount}\n`;
    }
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_${monthNames[selectedMonth]}_2026.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('reportModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}