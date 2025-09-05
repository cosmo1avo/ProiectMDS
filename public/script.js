
let currentUser = null;
let authToken = localStorage.getItem('authToken');

document.addEventListener('DOMContentLoaded', function() {

    if (window.location.pathname.includes('dashboard.html') || document.body.classList.contains('dashboard-body')) {
        initDashboard();
    } else {
        initHomePage();
    }
    
    if (authToken) {
        verifyToken();
    }
});

function initHomePage() {
    const modal = document.getElementById('authModal');
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const getStartedBtn = document.getElementById('getStartedBtn');
    const closeBtn = document.querySelector('.close');
    
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const switchToRegister = document.getElementById('switchToRegister');
    const switchToLogin = document.getElementById('switchToLogin');
    
    const loginFormElement = document.getElementById('loginFormElement');
    const registerFormElement = document.getElementById('registerFormElement');

    if (loginBtn) loginBtn.addEventListener('click', () => openModal('login'));
    if (registerBtn) registerBtn.addEventListener('click', () => openModal('register'));
    if (getStartedBtn) getStartedBtn.addEventListener('click', () => openModal('register'));
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    
    if (switchToRegister) switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm('register');
    });
    
    if (switchToLogin) switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        switchForm('login');
    });

    if (loginFormElement) {
        loginFormElement.addEventListener('submit', handleLogin);
    }
    
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', handleRegister);
    }

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function initDashboard() {

    if (!authToken) {
        window.location.href = '/';
        return;
    }

    initSidebar();
    initSampleModal();
    loadsamples1();
    if (document.getElementById('researchersSection')) {
    loadResearchers();
    initResearcherFilters();
}

    updateStats();
    
    const userNameElement = document.getElementById('userName');
    if (currentUser && userNameElement) {
        userNameElement.textContent = currentUser.username;
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
}

function initSidebar() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    const sectionTitle = document.getElementById('sectionTitle');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = item.dataset.section;
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            sections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetSection + 'Section').classList.add('active');
            
            
            const titles = {
                overview: 'Prezentare Generală',
                samples1: 'Probe Biomasă',
                experiments: 'Experimente',
                energy: 'Calculuri Energie',
                reports: 'Rapoarte',
                researchers: 'Cercetătorii Noștri' 
            };
            sectionTitle.textContent = titles[targetSection];
        });
    });
}

function initSampleModal() {
    const addSampleBtn = document.getElementById('addSampleBtn');
    const addSampleModal = document.getElementById('addSampleModal');
    const closeSampleModal = document.getElementById('closeSampleModal');
    const cancelSample = document.getElementById('cancelSample');
    const addSampleForm = document.getElementById('addSampleForm');

    if (addSampleBtn) {
        addSampleBtn.addEventListener('click', () => {
            addSampleModal.style.display = 'block';
        });
    }

    if (closeSampleModal) {
        closeSampleModal.addEventListener('click', () => {
            addSampleModal.style.display = 'none';
        });
    }

    if (cancelSample) {
        cancelSample.addEventListener('click', () => {
            addSampleModal.style.display = 'none';
        });
    }

    if (addSampleForm) {
        addSampleForm.addEventListener('submit', handleAddSample);
    }

    window.addEventListener('click', (e) => {
        if (e.target === addSampleModal) {
            addSampleModal.style.display = 'none';
        }
    });
}

function openModal(type) {
    const modal = document.getElementById('authModal');
    modal.style.display = 'block';
    switchForm(type);
}

function closeModal() {
    const modal = document.getElementById('authModal');
    modal.style.display = 'none';
}

function switchForm(type) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (type === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const loginData = Object.fromEntries(formData);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(loginData),
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('authToken', result.token);
            currentUser = result.user;
            showAlert('Autentificare reușită!', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
        } else {
            showAlert(result.error, 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showAlert('Eroare de conexiune', 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const registerData = Object.fromEntries(formData);

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registerData),
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem('authToken', result.token);
            currentUser = result.user;
            showAlert('Cont creat cu succes!', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1000);
        } else {
            showAlert(result.error, 'error');
        }
    } catch (error) {
        console.error('Register error:', error);
        showAlert('Eroare de conexiune', 'error');
    }
}

async function verifyToken() {
    try {
        const response = await fetch('/api/verify-token', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        const result = await response.json();

        if (result.success) {
            currentUser = result.user;

            updateAuthUI(true);
        } else {
            localStorage.removeItem('authToken');
            authToken = null;
        }
    } catch (error) {
        console.error('Token verification error:', error);
        localStorage.removeItem('authToken');
        authToken = null;
    }
}

function handleLogout() {
    localStorage.removeItem('authToken');
    currentUser = null;
    authToken = null;
    window.location.href = '/';
}

function updateAuthUI(isLoggedIn) {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (isLoggedIn && currentUser) {
        if (loginBtn) loginBtn.style.display = 'none';
        if (registerBtn) {
            registerBtn.textContent = `👋 ${currentUser.username}`;
            registerBtn.onclick = () => window.location.href = '/dashboard.html';
        }
    }
}

async function handleAddSample(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const sampleData = Object.fromEntries(formData);

    const numericFields = ['moisture_content', 'ash_content', 'carbon_content', 
                          'hydrogen_content', 'nitrogen_content', 'oxygen_content'];
    
    numericFields.forEach(field => {
        if (sampleData[field] === '') {
            sampleData[field] = null;
        }
    });

    try {
        const response = await fetch('/api/samples1', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(sampleData),
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Proba a fost adăugată cu succes!', 'success');
            document.getElementById('addSampleModal').style.display = 'none';
            document.getElementById('addSampleForm').reset();
            loadsamples1(); 
            updateStats(); 
        } else {
            showAlert(result.error, 'error');
        }
    } catch (error) {
        console.error('Add sample error:', error);
        showAlert('Eroare la adăugarea probei', 'error');
    }
}

async function loadsamples1() {
    if (!authToken) return;

    try {
        const response = await fetch('/api/samples1', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        const result = await response.json();

        if (result.success) {
            displaysamples1(result.samples1);
        }
    } catch (error) {
        console.error('Load samples1 error:', error);
    }
}

function displaysamples1(samples1) {
    const samples1Grid = document.getElementById('samples1Grid');
    if (!samples1Grid) return;

    console.log('samples1 received:', samples1);

    if (samples1.length === 0) {
        samples1Grid.innerHTML = `
            <div class="no-samples1">
                <p>Nu ai încă probe înregistrate.</p>
                <button class="btn btn-primary" onclick="document.getElementById('addSampleBtn').click()">
                    Adaugă Prima Probă
                </button>
            </div>
        `;
        return;
    }

    samples1Grid.innerHTML = samples1.map(sample => `
        <div class="sample-card">
            <div class="sample-header">
                <div>
                    <div class="sample-type">${sample.sample_type || 'Tip necunoscut'}</div>
                    <div class="sample-date">${formatDate(sample.created_at)}</div>
                </div>
                <div class="sample-actions">
                    <button class="btn btn-danger" onclick="deleteSample(${sample.id})">🗑</button>
                </div>
            </div>
            
            <div class="sample-location">📍 ${sample.sample_name}</div>
            
            ${sample.quantity ? `
                <div class="sample-quantity">
                    <span class="composition-label">Cantitate:</span>
                    <span class="composition-value">${sample.quantity}g</span>
                </div>
            ` : ''}
            
            ${sample.description ? `
                <p class="sample-description">${sample.description}</p>
            ` : ''}
            
            <div class="sample-metadata">
                <small>ID: ${sample.id} | User: ${sample.user_id}</small>
            </div>
        </div>
    `).join('');
}

async function deleteSample(sampleId) {
    if (!confirm('Ești sigur că vrei să ștergi această probă?')) {
        return;
    }

    try {
        const response = await fetch(`/api/samples1/${sampleId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        const result = await response.json();

        if (result.success) {
            showAlert('Proba a fost ștearsă cu succes!', 'success');
            loadsamples1();
            updateStats();
        } else {
            showAlert(result.error, 'error');
        }
    } catch (error) {
        console.error('Delete sample error:', error);
        showAlert('Eroare la ștergerea probei', 'error');
    }
}

async function updateStats() {
    if (!authToken) return;

    try {
        const response = await fetch('/api/samples1', {
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
        });

        const result = await response.json();

        if (result.success) {
            const totalsamples1Element = document.getElementById('totalsamples1');
            if (totalsamples1Element) {
                totalsamples1Element.textContent = result.samples1.length;
            }
        }
    } catch (error) {
        console.error('Update stats error:', error);
    }
}

function formatDate(dateString) {
    if (!dateString) return 'Nu este specificată';
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO');
}

function showAlert(message, type) {
 
    const existingAlert = document.querySelector('.alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    const modal = document.querySelector('.modal-content');
    const target = modal || document.body;
    
    if (modal) {
        modal.insertBefore(alert, modal.firstChild);
    } else {
        document.body.insertBefore(alert, document.body.firstChild);
    }

    setTimeout(() => {
        if (alert && alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchsamples1');
    const filterSelect = document.getElementById('filterType');

    if (searchInput) {
        searchInput.addEventListener('input', filtersamples1);
    }

    if (filterSelect) {
        filterSelect.addEventListener('change', filtersamples1);
    }
});

function filtersamples1() {
    const searchTerm = document.getElementById('searchsamples1')?.value.toLowerCase() || '';
    const filterType = document.getElementById('filterType')?.value.toLowerCase() || '';
    const sampleCards = document.querySelectorAll('.sample-card');

    sampleCards.forEach(card => {
        const sampleType = card.querySelector('.sample-type')?.textContent.toLowerCase() || '';
        const sampleLocation = card.querySelector('.sample-location')?.textContent.toLowerCase() || '';
        const tags = Array.from(card.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase()).join(' ');

        const matchesSearch = !searchTerm || 
            sampleType.includes(searchTerm) || 
            sampleLocation.includes(searchTerm) || 
            tags.includes(searchTerm);

        const matchesFilter = !filterType || sampleType.includes(filterType);

        if (matchesSearch && matchesFilter) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function validateSampleForm(formData) {
    const errors = [];

    if (!formData.biomass_type) {
        errors.push('Tipul de biomasă este obligatoriu');
    }

    if (!formData.location) {
        errors.push('Locația colectării este obligatorie');
    }

    const percentageFields = ['moisture_content', 'ash_content', 'carbon_content', 
                             'hydrogen_content', 'nitrogen_content', 'oxygen_content'];
    
    percentageFields.forEach(field => {
        const value = parseFloat(formData[field]);
        if (formData[field] && (isNaN(value) || value < 0 || value > 100)) {
            errors.push(`${field.replace('_', ' ')} trebuie să fie între 0 și 100%`);
        }
    });

    return errors;
}

async function makeAuthenticatedRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            ...options.headers
        }
    };

    try {
        const response = await fetch(url, { ...options, headers: defaultOptions.headers });
        
        if (response.status === 401) {

            localStorage.removeItem('authToken');
            window.location.href = '/';
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Network request failed:', error);
        throw error;
    }
}

let autoSaveTimeout;

function setupAutoSave(formId, storageKey) {
    const form = document.getElementById(formId);
    if (!form) return;

    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                const input = form.querySelector(`[name="${key}"]`);
                if (input) input.value = data[key];
            });
        } catch (e) {
            console.error('Error loading draft:', e);
        }
    }

    form.addEventListener('input', () => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            localStorage.setItem(storageKey, JSON.stringify(data));
        }, 1000);
    });

    form.addEventListener('submit', () => {
        localStorage.removeItem(storageKey);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('addSampleForm')) {
        setupAutoSave('addSampleForm', 'sampleFormDraft');
    }
});

document.addEventListener('keydown', function(e) {

    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchsamples1');
        if (searchInput) {
            searchInput.focus();
        }
    }

    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                modal.style.display = 'none';
            }
        });
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && document.body.classList.contains('dashboard-body')) {
        e.preventDefault();
        const addSampleBtn = document.getElementById('addSampleBtn');
        if (addSampleBtn) {
            addSampleBtn.click();
        }
    }
});

function exportsamples1ToCSV() {
    if (!currentUser) return;

    fetch('/api/samples1', {
        headers: {
            'Authorization': `Bearer ${authToken}`,
        },
    })
    .then(response => response.json())
    .then(result => {
        if (result.success && result.samples1.length > 0) {
            const csv = samples1ToCSV(result.samples1);
            downloadCSV(csv, 'probe-biomasa.csv');
        }
    })
    .catch(error => {
        console.error('Export error:', error);
        showAlert('Eroare la export', 'error');
    });
}

function samples1ToCSV(samples1) {
    const headers = [
        'Tip Biomasă', 'Locație', 'Data Colectării', 'Caracteristici Fizice',
        'Tag-uri', 'Umiditate (%)', 'Cenușă (%)', 'Carbon (%)',
        'Hidrogen (%)', 'Azot (%)', 'Oxigen (%)', 'Descriere'
    ];

    const rows = samples1.map(sample => [
        sample.biomass_type || '',
        sample.location || '',
        sample.collection_date || '',
        sample.physical_characteristics || '',
        sample.tags || '',
        sample.moisture_content || '',
        sample.ash_content || '',
        sample.carbon_content || '',
        sample.hydrogen_content || '',
        sample.nitrogen_content || '',
        sample.oxygen_content || '',
        sample.description || ''
    ]);

    const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        .join('\n');

    return csvContent;
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchsamples1');
    if (searchInput) {
        const debouncedFilter = debounce(filtersamples1, 300);
        searchInput.addEventListener('input', debouncedFilter);
    }
});