// Global Variables
let currentMonth = 0; // January 2026
let attendanceData = {};
let pendingChanges = {};
let hasUnsavedChanges = false;

// Holidays for 2026
const HOLIDAYS_2026 = [
    '2026-01-15', // Makara Sankranti
    '2026-01-26', // Republic Day
    '2026-03-19', // Ugadi Festival
    '2026-05-01', // May Day
    '2026-05-28', // Bakrid
    '2026-09-14', // Ganesh Chaturthi
    '2026-10-02', // Gandhi Jayanti
    '2026-10-20', // Ayudha Puja / Mahanavami
    '2026-11-10', // Balipadyami / Deepavali
    '2026-12-25'  // Christmas
];

// Month abbreviations
const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Status Options
const STATUS_OPTIONS = [
    { value: 'wfo', label: 'WFO', color: '#90EE90' },
    { value: 'planned', label: 'Planned', color: '#FFFF99' },
    { value: 'offsite', label: 'Offsite/Meeting', color: '#DDA0DD' },
    { value: 'travel', label: 'Onsite/Travel', color: '#87CEEB' },
    { value: 'leave', label: 'Leave', color: '#FFB6C1' }
];

// Initialize Calendar on Load
function initializeCalendar() {
    loadAttendanceData();
    renderCalendar();
}

// Load Attendance Data from LocalStorage
function loadAttendanceData() {
    const saved = localStorage.getItem('attendanceData_2026');
    if (saved) {
        attendanceData = JSON.parse(saved);
    }
}

// Save Attendance Data to LocalStorage
function saveAttendanceData() {
    localStorage.setItem('attendanceData_2026', JSON.stringify(attendanceData));
}

// Get Days in Month
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

// Check if date is weekend
function isWeekend(year, month, day) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
}

// Check if date is holiday
function isHoliday(year, month, day) {
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return HOLIDAYS_2026.includes(dateString);
}

// Format date as "x-Mon"
function formatDate(day, month) {
    return day + '-' + MONTH_ABBR[month];
}

// Render Calendar Table
function renderCalendar() {
    const table = document.getElementById('attendanceTable');
    const year = 2026;
    const month = currentMonth;
    const daysInMonth = getDaysInMonth(year, month);
    
    // Clear table
    table.innerHTML = '';
    
    // Create header row with dates
    const headerRow = document.createElement('tr');
    const nameHeader = document.createElement('th');
    nameHeader.className = 'name-header';
    nameHeader.textContent = 'Name';
    headerRow.appendChild(nameHeader);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const th = document.createElement('th');
        const date = new Date(year, month, day);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        th.innerHTML = formatDate(day, month) + '<br><small>' + dayName + '</small>';
        
        if (isWeekend(year, month, day)) {
            th.classList.add('weekend-header');
        } else if (isHoliday(year, month, day)) {
            th.classList.add('holiday-header');
        }
        
        headerRow.appendChild(th);
    }
    
    table.appendChild(headerRow);
    
    // Create rows for each user
    Object.keys(USERS).forEach(userCode => {
        const row = document.createElement('tr');
        row.dataset.user = userCode;
        
        // Highlight current user's row
        if (currentLoggedInUser && currentLoggedInUser.code === userCode) {
            row.classList.add('current-user-row');
        }
        
        // Name cell
        const nameCell = document.createElement('td');
        nameCell.className = 'name-cell';
        nameCell.textContent = userCode;
        row.appendChild(nameCell);
        
        // Date cells
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = document.createElement('td');
            cell.className = 'date-cell';
            cell.dataset.user = userCode;
            cell.dataset.date = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
            cell.dataset.day = day;
            cell.dataset.month = month;
            
            const weekend = isWeekend(year, month, day);
            const holiday = isHoliday(year, month, day);
            
            if (weekend) {
                cell.classList.add('weekend');
                cell.textContent = formatDate(day, month);
            } else if (holiday) {
                cell.classList.add('holiday');
                cell.textContent = formatDate(day, month);
            } else {
                // Everyone can VIEW, but only own row can EDIT
                const canEdit = canEditRow(userCode);
                const dateKey = cell.dataset.date;
                const savedStatus = attendanceData[userCode] && attendanceData[userCode][dateKey];
                
                if (savedStatus) {
                    // Cell has status - apply color
                    cell.classList.add(savedStatus);
                }
                
                // Create cell content with lock icon (if needed) + date
                const cellContent = document.createDocumentFragment();
                
                if (!canEdit) {
                    cell.classList.add('locked');
                    const lockSpan = document.createElement('span');
                    lockSpan.className = 'lock-icon';
                    lockSpan.textContent = '?';
                    cellContent.appendChild(lockSpan);
                }
                
                // Add date text
                const dateText = document.createTextNode(formatDate(day, month));
                cellContent.appendChild(dateText);
                
                cell.appendChild(cellContent);
                
                // Add click event for editable cells only
                if (canEdit) {
                    cell.addEventListener('click', () => handleCellClick(cell, userCode, dateKey, day, month));
                }
            }
            
            row.appendChild(cell);
        }
        
        table.appendChild(row);
    });
    
    // Update month selector
    document.getElementById('monthSelector').value = currentMonth;
}

// Handle Cell Click
function handleCellClick(cell, userCode, dateKey, day, month) {
    if (cell.classList.contains('weekend') || cell.classList.contains('holiday') || cell.classList.contains('locked')) {
        return;
    }
    
    // Create dropdown
    const existingSelect = cell.querySelector('select');
    if (existingSelect) {
        return; // Already showing dropdown
    }
    
    const select = document.createElement('select');
    select.className = 'status-select';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select --';
    select.appendChild(defaultOption);
    
    // Add status options
    STATUS_OPTIONS.forEach(status => {
        const option = document.createElement('option');
        option.value = status.value;
        option.textContent = status.label;
        select.appendChild(option);
    });
    
    // Set current value
    if (attendanceData[userCode] && attendanceData[userCode][dateKey]) {
        select.value = attendanceData[userCode][dateKey];
    }
    
    // Handle change
    select.addEventListener('change', (e) => {
        const newStatus = e.target.value;
        updateCellStatus(cell, userCode, dateKey, newStatus, day, month);
        select.remove();
        renderCellContent(cell, userCode, dateKey, day, month);
    });
    
    // Handle blur
    select.addEventListener('blur', () => {
        setTimeout(() => {
            if (document.activeElement !== select) {
                select.remove();
                renderCellContent(cell, userCode, dateKey, day, month);
            }
        }, 200);
    });
    
    // Replace cell content with dropdown
    cell.innerHTML = '';
    cell.appendChild(select);
    select.focus();
}

// Update Cell Status
function updateCellStatus(cell, userCode, dateKey, status, day, month) {
    if (!attendanceData[userCode]) {
        attendanceData[userCode] = {};
    }
    
    if (status) {
        attendanceData[userCode][dateKey] = status;
    } else {
        delete attendanceData[userCode][dateKey];
    }
    
    // Track pending changes
    if (!pendingChanges[userCode]) {
        pendingChanges[userCode] = {};
    }
    pendingChanges[userCode][dateKey] = status || 'removed';
    
    hasUnsavedChanges = true;
    document.getElementById('submitBtn').disabled = false;
    document.getElementById('pendingChanges').style.display = 'inline';
    document.getElementById('pendingUserCode').textContent = currentLoggedInUser.code;
}

// Render Cell Content
function renderCellContent(cell, userCode, dateKey, day, month) {
    const canEdit = canEditRow(userCode);
    
    // Clear cell
    cell.innerHTML = '';
    
    // Remove all status classes
    cell.classList.remove('wfo', 'planned', 'offsite', 'travel', 'leave');
    
    // Check for saved status
    const savedStatus = attendanceData[userCode] && attendanceData[userCode][dateKey];
    
    if (savedStatus) {
        // Has status - apply color
        cell.classList.add(savedStatus);
    }
    
    // Create cell content
    const cellContent = document.createDocumentFragment();
    
    // Add lock icon for non-editable cells
    if (!canEdit) {
        const lockSpan = document.createElement('span');
        lockSpan.className = 'lock-icon';
        lockSpan.textContent = '?';
        cellContent.appendChild(lockSpan);
    }
    
    // Add date text
    const dateText = document.createTextNode(formatDate(day, month));
    cellContent.appendChild(dateText);
    
    cell.appendChild(cellContent);
}

// Submit Attendance
function submitAttendance() {
    if (!hasUnsavedChanges) {
        return;
    }
    
    saveAttendanceData();
    pendingChanges = {};
    hasUnsavedChanges = false;
    
    document.getElementById('submitBtn').disabled = true;
    document.getElementById('pendingChanges').style.display = 'none';
    
    // Show success message
    const successMsg = document.getElementById('successMessage');
    successMsg.style.display = 'block';
    setTimeout(() => {
        successMsg.style.display = 'none';
    }, 3000);
    
    // Update and show statistics
    updateStats();
}

// Change Month
function changeMonth() {
    const newMonth = parseInt(document.getElementById('monthSelector').value);
    
    if (hasUnsavedChanges) {
        if (!confirm('You have unsaved changes. Do you want to discard them?')) {
            document.getElementById('monthSelector').value = currentMonth;
            return;
        }
        pendingChanges = {};
        hasUnsavedChanges = false;
        document.getElementById('submitBtn').disabled = true;
        document.getElementById('pendingChanges').style.display = 'none';
    }
    
    currentMonth = newMonth;
    renderCalendar();
    
    // Check if stats should be displayed for this month
    checkAndDisplayStats();
}

// Check and display stats if data exists for current user and month
function checkAndDisplayStats() {
    if (!currentLoggedInUser) return;
    
    const userCode = currentLoggedInUser.code;
    const year = 2026;
    const month = currentMonth;
    const daysInMonth = getDaysInMonth(year, month);
    
    // Check if user has any submitted data for this month
    let hasData = false;
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        if (attendanceData[userCode] && attendanceData[userCode][dateKey]) {
            hasData = true;
            break;
        }
    }
    
    if (hasData) {
        updateStats();
    } else {
        document.getElementById('statsContainer').style.display = 'none';
    }
}

// Update Statistics
function updateStats() {
    if (!currentLoggedInUser) return;
    
    const statsContainer = document.getElementById('statsContainer');
    const userCode = currentLoggedInUser.code;
    const year = 2026;
    const month = currentMonth;
    const daysInMonth = getDaysInMonth(year, month);
    
    let stats = {
        wfo: 0,
        planned: 0,
        offsite: 0,
        travel: 0,
        leave: 0,
        total: 0
    };
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        
        if (!isWeekend(year, month, day) && !isHoliday(year, month, day)) {
            stats.total++;
            
            if (attendanceData[userCode] && attendanceData[userCode][dateKey]) {
                const status = attendanceData[userCode][dateKey];
                if (stats.hasOwnProperty(status)) {
                    stats[status]++;
                }
            }
        }
    }
    
    const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });
    
    statsContainer.innerHTML = '<h3>Your Statistics for ' + monthName + ' 2026</h3>' +
        '<div class="stats-grid">' +
            '<div class="stat-item wfo-stat">' +
                '<div class="stat-color wfo-color"></div>' +
                '<div>' +
                    '<div class="stat-label">WFO</div>' +
                    '<div class="stat-value">' + stats.wfo + ' days</div>' +
                '</div>' +
            '</div>' +
            '<div class="stat-item planned-stat">' +
                '<div class="stat-color planned-color"></div>' +
                '<div>' +
                    '<div class="stat-label">Planned</div>' +
                    '<div class="stat-value">' + stats.planned + ' days</div>' +
                '</div>' +
            '</div>' +
            '<div class="stat-item offsite-stat">' +
                '<div class="stat-color offsite-color"></div>' +
                '<div>' +
                    '<div class="stat-label">Offsite/Meeting</div>' +
                    '<div class="stat-value">' + stats.offsite + ' days</div>' +
                '</div>' +
            '</div>' +
            '<div class="stat-item travel-stat">' +
                '<div class="stat-color travel-color"></div>' +
                '<div>' +
                    '<div class="stat-label">Onsite/Travel</div>' +
                    '<div class="stat-value">' + stats.travel + ' days</div>' +
                '</div>' +
            '</div>' +
            '<div class="stat-item leave-stat">' +
                '<div class="stat-color leave-color"></div>' +
                '<div>' +
                    '<div class="stat-label">Leave</div>' +
                    '<div class="stat-value">' + stats.leave + ' days</div>' +
                '</div>' +
            '</div>' +
            '<div class="stat-item total-stat">' +
                '<div class="stat-color total-color"></div>' +
                '<div>' +
                    '<div class="stat-label">Working Days</div>' +
                    '<div class="stat-value">' + stats.total + ' days</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    statsContainer.style.display = 'block';
}

// Generate Report (Admin Only)
function generateReport() {
    if (!currentLoggedInUser || !currentLoggedInUser.isAdmin) {
        alert('Only administrators can generate reports.');
        return;
    }
    
    const modal = document.getElementById('reportModal');
    const reportContent = document.getElementById('reportContent');
    
    const year = 2026;
    const month = currentMonth;
    const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });
    const daysInMonth = getDaysInMonth(year, month);
    
    let reportHTML = '<h3>Attendance Report - ' + monthName + ' 2026</h3>';
    reportHTML += '<div class="report-table-wrapper">';
    reportHTML += '<table class="report-table">';
    reportHTML += '<thead><tr>';
    reportHTML += '<th>User</th>';
    reportHTML += '<th>WFO</th>';
    reportHTML += '<th>Planned</th>';
    reportHTML += '<th>Offsite</th>';
    reportHTML += '<th>Travel</th>';
    reportHTML += '<th>Leave</th>';
    reportHTML += '<th>Total Days</th>';
    reportHTML += '</tr></thead><tbody>';
    
    Object.keys(USERS).forEach(userCode => {
        let stats = {
            wfo: 0,
            planned: 0,
            offsite: 0,
            travel: 0,
            leave: 0,
            total: 0
        };
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
            
            if (!isWeekend(year, month, day) && !isHoliday(year, month, day)) {
                stats.total++;
                
                if (attendanceData[userCode] && attendanceData[userCode][dateKey]) {
                    const status = attendanceData[userCode][dateKey];
                    if (stats.hasOwnProperty(status)) {
                        stats[status]++;
                    }
                }
            }
        }
        
        reportHTML += '<tr>';
        reportHTML += '<td><strong>' + userCode + '</strong></td>';
        reportHTML += '<td>' + stats.wfo + '</td>';
        reportHTML += '<td>' + stats.planned + '</td>';
        reportHTML += '<td>' + stats.offsite + '</td>';
        reportHTML += '<td>' + stats.travel + '</td>';
        reportHTML += '<td>' + stats.leave + '</td>';
        reportHTML += '<td><strong>' + stats.total + '</strong></td>';
        reportHTML += '</tr>';
    });
    
    reportHTML += '</tbody></table></div>';
    
    reportContent.innerHTML = reportHTML;
    modal.style.display = 'block';
}

// Close Report Modal
function closeReportModal() {
    document.getElementById('reportModal').style.display = 'none';
}

// Export to CSV
function exportToCSV() {
    const year = 2026;
    const month = currentMonth;
    const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });
    const daysInMonth = getDaysInMonth(year, month);
    
    let csv = 'Attendance Report - ' + monthName + ' 2026\n\n';
    csv += 'User,';
    
    // Header with dates
    for (let day = 1; day <= daysInMonth; day++) {
        csv += formatDate(day, month) + ',';
    }
    csv += '\n';
    
    // Data rows
    Object.keys(USERS).forEach(userCode => {
        csv += userCode + ',';
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
            
            if (isWeekend(year, month, day)) {
                csv += 'Weekend,';
            } else if (isHoliday(year, month, day)) {
                csv += 'Holiday,';
            } else if (attendanceData[userCode] && attendanceData[userCode][dateKey]) {
                csv += attendanceData[userCode][dateKey].toUpperCase() + ',';
            } else {
                csv += '-,';
            }
        }
        
        csv += '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Attendance_' + monthName + '_2026.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Export Report to CSV
function exportReportToCSV() {
    const year = 2026;
    const month = currentMonth;
    const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long' });
    const daysInMonth = getDaysInMonth(year, month);
    
    let csv = 'Comprehensive Attendance Report - ' + monthName + ' 2026\n\n';
    csv += 'User,WFO,Planned,Offsite,Travel,Leave,Total Working Days\n';
    
    Object.keys(USERS).forEach(userCode => {
        let stats = {
            wfo: 0,
            planned: 0,
            offsite: 0,
            travel: 0,
            leave: 0,
            total: 0
        };
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
            
            if (!isWeekend(year, month, day) && !isHoliday(year, month, day)) {
                stats.total++;
                
                if (attendanceData[userCode] && attendanceData[userCode][dateKey]) {
                    const status = attendanceData[userCode][dateKey];
                    if (stats.hasOwnProperty(status)) {
                        stats[status]++;
                    }
                }
            }
        }
        
        csv += userCode + ',' + stats.wfo + ',' + stats.planned + ',' + stats.offsite + ',' + stats.travel + ',' + stats.leave + ',' + stats.total + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Report_' + monthName + '_2026.csv';
    a.click();
    window.URL.revokeObjectURL(url);
}

// Close modal on outside click
window.onclick = function(event) {
    const modal = document.getElementById('reportModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}