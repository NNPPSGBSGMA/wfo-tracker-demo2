// User Database with Unique Passwords
const USERS = {
    'AJLO': { password: 'Ajlo$2026#Gma', isAdmin: true, name: 'AJLO' },
    'NRVL': { password: 'Nrvl@2026!Pps', isAdmin: false, name: 'NRVL' },
    'NHSM': { password: 'Nhsm#2026$Gbs', isAdmin: false, name: 'NHSM' },
    'PCPH': { password: 'Pcph!2026&Aff', isAdmin: false, name: 'PCPH' },
    'SJAP': { password: 'Sjap$2026*Blr', isAdmin: false, name: 'SJAP' },
    'AUAJ': { password: 'Auaj#2026@Ind', isAdmin: false, name: 'AUAJ' },
    'NCIK': { password: 'Ncik@2026!Att', isAdmin: false, name: 'NCIK' },
    'GTAI': { password: 'Gtai$2026#Trk', isAdmin: false, name: 'GTAI' },
    'HDMP': { password: 'Hdmp!2026$Off', isAdmin: false, name: 'HDMP' },
    'TKYR': { password: 'Tkyr@2026%Gma', isAdmin: false, name: 'TKYR' },
    'SLJG': { password: 'Sljg#2026&Pps', isAdmin: false, name: 'SLJG' },
    'RTDY': { password: 'Rtdy$2026*Gbs', isAdmin: false, name: 'RTDY' },
    'KNGT': { password: 'Kngt!2026@Med', isAdmin: false, name: 'KNGT' },
    'DKDV': { password: 'Dkdv@2026#Aff', isAdmin: false, name: 'DKDV' },
    'VKBV': { password: 'Vkbv$2026!Blr', isAdmin: false, name: 'VKBV' },
    'MOZF': { password: 'Mozf#2026$Ind', isAdmin: false, name: 'MOZF' },
    'RTPH': { password: 'Rtph!2026%Att', isAdmin: false, name: 'RTPH' },
    'KIDZ': { password: 'Kidz@2026&Trk', isAdmin: false, name: 'KIDZ' },
    'NSJK': { password: 'Nsjk$2026*Off', isAdmin: false, name: 'NSJK' },
    'IPLA': { password: 'Ipla#2026@Gma', isAdmin: false, name: 'IPLA' },
    'PRET': { password: 'Pret!2026#Pps', isAdmin: false, name: 'PRET' },
    'HMDP': { password: 'Hmdp@2026$Gbs', isAdmin: false, name: 'HMDP' },
    'RDVA': { password: 'Rdva$2026%Med', isAdmin: false, name: 'RDVA' },
    'NMJP': { password: 'Nmjp#2026&Aff', isAdmin: false, name: 'NMJP' },
    'GSHV': { password: 'Gshv!2026*Blr', isAdmin: false, name: 'GSHV' },
    'HKPT': { password: 'Hkpt@2026@Ind', isAdmin: false, name: 'HKPT' },
    'IVRS': { password: 'Ivrs$2026!Att', isAdmin: false, name: 'IVRS' },
    'IOJN': { password: 'Iojn#2026#Trk', isAdmin: false, name: 'IOJN' },
    'QKRM': { password: 'Qkrm!2026$Off', isAdmin: false, name: 'QKRM' },
    'USRJ': { password: 'Usrj@2026%Gma', isAdmin: false, name: 'USRJ' },
    'SYDQ': { password: 'Sydq$2026&Pps', isAdmin: false, name: 'SYDQ' },
    'GVMR': { password: 'Gvmr#2026*Gbs', isAdmin: false, name: 'GVMR' },
    'NUMT': { password: 'Numt!2026@Med', isAdmin: false, name: 'NUMT' },
    'MGVM': { password: 'Mgvm@2026!Aff', isAdmin: false, name: 'MGVM' },
    'JVMC': { password: 'Jvmc$2026#Blr', isAdmin: false, name: 'JVMC' },
    'SIZR': { password: 'Sizr#2026$Ind', isAdmin: false, name: 'SIZR' },
    'IUHK': { password: 'Iuhk!2026%Att', isAdmin: false, name: 'IUHK' }
};

let currentLoggedInUser = null;

// Handle Login
function handleLogin(event) {
    event.preventDefault();
    
    const code = document.getElementById('loginCode').value.toUpperCase().trim();
    const password = document.getElementById('loginPassword').value;
    const errorDiv = document.getElementById('loginError');
    
    // Validate credentials
    if (USERS[code] && USERS[code].password === password) {
        currentLoggedInUser = {
            code: code,
            isAdmin: USERS[code].isAdmin,
            name: USERS[code].name
        };
        
        // Hide login, show main app
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        
        // Update user display
        document.getElementById('displayUserCode').textContent = `User: ${code}`;
        document.getElementById('securityUserCode').textContent = code;
        
        // Show admin notice and report button if admin
        if (currentLoggedInUser.isAdmin) {
            document.getElementById('adminNotice').style.display = 'block';
            document.getElementById('reportBtn').style.display = 'inline-block';
        }
        
        // Initialize the calendar
        initializeCalendar();
        
    } else {
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }
}

// Handle Logout
function handleLogout() {
    if (confirm('Are you sure you want to logout? Any unsaved changes will be lost.')) {
        currentLoggedInUser = null;
        document.getElementById('mainApp').style.display = 'none';
        document.getElementById('loginOverlay').style.display = 'flex';
        document.getElementById('loginCode').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('adminNotice').style.display = 'none';
        document.getElementById('reportBtn').style.display = 'none';
        document.getElementById('statsContainer').style.display = 'none';
    }
}

// Check if user can edit a specific row
function canEditRow(userCode) {
    if (!currentLoggedInUser) return false;
    if (currentLoggedInUser.isAdmin) return true;
    return currentLoggedInUser.code === userCode;
}