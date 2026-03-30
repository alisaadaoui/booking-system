// ==========================================
// STATE
// ==========================================
let appointments = [];
let services = [];
let clients = [];
let currentWeekStart = getWeekStart(new Date());
let editingServiceId = null;
let editingClientId = null;
let selectedServiceColor = 'blue';
let confirmCallback = null;

// ==========================================
// INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    setupEventListeners();
    updateCurrentDate();
    generateTimeOptions();
});

async function loadAllData() {
    await Promise.all([
        loadAppointments(),
        loadServices(),
        loadClients()
    ]);
    updateStats();
}

function updateCurrentDate() {
    const el = document.getElementById('current-date');
    if (el) {
        el.textContent = new Date().toLocaleDateString('en-GB', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }
}

// ==========================================
// DATA LOADING
// ==========================================
async function loadAppointments() {
    try {
        const res = await fetch('/api/appointments');
        appointments = await res.json();
        renderWeekCalendar();
        renderTodaySchedule();
        renderAppointmentsList();
    } catch (err) {
        console.error('Error loading appointments:', err);
    }
}

async function loadServices() {
    try {
        const res = await fetch('/api/services');
        services = await res.json();
        renderServicesList();
        populateServiceDropdown();
    } catch (err) {
        console.error('Error loading services:', err);
    }
}

async function loadClients() {
    try {
        const res = await fetch('/api/clients');
        clients = await res.json();
        renderClientsList();
        populateClientDropdown();
    } catch (err) {
        console.error('Error loading clients:', err);
    }
}

// ==========================================
// NAVIGATION
// ==========================================
window.showSection = function(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const section = document.getElementById('section-' + name);
    const nav = document.getElementById('nav-' + name);
    if (section) section.classList.remove('hidden');
    if (nav) nav.classList.add('active');
    
    closeSidebar();
};

window.toggleSidebar = function() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('active');
};

function closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('active');
}

// ==========================================
// STATS
// ==========================================
function updateStats() {
    const now = new Date();
    const today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    const weekStart = getWeekStart(new Date());
    const weekEnd = getWeekEnd(new Date());
    const active = appointments.filter(a => a.status !== 'cancelled');
    
    const todayCount = active.filter(a => a.appointment_date.split('T')[0] === today).length;
    const weekCount = active.filter(a => {
        const d = new Date(a.appointment_date.split('T')[0]);
        return d >= weekStart && d <= weekEnd;
    }).length;
    const revenue = active.reduce((sum, a) => sum + parseFloat(a.price || 0), 0);

    setText('stat-today', todayCount);
    setText('stat-week', weekCount);
    setText('stat-revenue', '£' + revenue.toFixed(2));
    setText('stat-clients', clients.length);
    setText('total-appointments', active.length);
    setText('total-clients', clients.length);
}

function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

// ==========================================
// WEEK CALENDAR
// ==========================================
function renderWeekCalendar() {
    const container = document.getElementById('week-calendar');
    if (!container) return;
    
    const now = new Date();
    const today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    let html = '';
    
    for (let i = 0; i < 7; i++) {
        const date = new Date(currentWeekStart);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const count = appointments.filter(a => a.appointment_date.split('T')[0] === dateStr && a.status !== 'cancelled').length;
        const isToday = dateStr === today;
        
        html += `<div class="week-day ${isToday ? 'today' : ''}" onclick="filterByDate('${dateStr}')" style="cursor:pointer;">
            <div class="week-day-name">${date.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase()}</div>
            <div class="week-day-date">${date.getDate()}</div>
            <div class="week-day-count">${count} appt${count !== 1 ? 's' : ''}</div>
        </div>`;
    }
    
    container.innerHTML = html;
    
    // Update range label
    const end = new Date(currentWeekStart);
    end.setDate(end.getDate() + 6);
    setText('week-range', formatShortDate(currentWeekStart) + ' - ' + formatShortDate(end));
}

window.prevWeek = function() { currentWeekStart.setDate(currentWeekStart.getDate() - 7); renderWeekCalendar(); };
window.nextWeek = function() { currentWeekStart.setDate(currentWeekStart.getDate() + 7); renderWeekCalendar(); };

window.filterByDate = function(dateStr) {
    const searchInput = document.getElementById('search-appointments');
    const parts = dateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    const formatted = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    if (searchInput) {
        searchInput.value = formatted;
        renderAppointmentsList();
    }
    showSection('appointments');
};

// ==========================================
// TODAY'S SCHEDULE
// ==========================================
function renderTodaySchedule() {
    const container = document.getElementById('today-schedule');
    if (!container) return;
    
    const now = new Date();
    const today = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());
    const todayAppts = appointments
        .filter(a => a.appointment_date.split('T')[0] === today && a.status !== 'cancelled')
        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
    
    if (todayAppts.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p class="empty-state-title">No appointments scheduled for today</p>
                <p class="empty-state-text">Click "New Booking" to schedule one</p>
            </div>`;
        return;
    }
    
    container.innerHTML = todayAppts.map(a => `
        <div class="schedule-item">
            <div class="schedule-time">${formatTime(a.appointment_time)}</div>
            <div class="schedule-info">
                <p class="schedule-client">${a.customer_name}</p>
                <p class="schedule-service">
                    <span class="service-dot dot-${a.color || 'blue'}"></span>
                    ${a.service_name}
                </p>
            </div>
            <span class="status-badge status-${a.status}">${cap(a.status)}</span>
        </div>
    `).join('');
}

// ==========================================
// APPOINTMENTS LIST
// ==========================================
function renderAppointmentsList() {
    const container = document.getElementById('appointments-list');
    if (!container) return;
    
    const search = (document.getElementById('search-appointments')?.value || '').toLowerCase();
    const status = document.getElementById('filter-status')?.value || 'all';
    
    let filtered = appointments.filter(a => {
        const dateFormatted = formatDate(a.appointment_date).toLowerCase();
        const matchSearch = !search ||
                           a.customer_name.toLowerCase().includes(search) ||
                           a.customer_phone.includes(search) ||
                           a.service_name.toLowerCase().includes(search) ||
                           dateFormatted.includes(search);
        const matchStatus = status === 'all' || a.status === status;
        return matchSearch && matchStatus;
    });
    
    filtered.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p class="empty-state-title">No appointments found</p>
                <p class="empty-state-text">Create a new booking to get started</p>
            </div>`;
        return;
    }
    
    container.innerHTML = filtered.map(a => `
        <div class="appointment-card">
            <div class="card-top">
                <div>
                    <p class="card-name">${a.customer_name}</p>
                    <p class="card-phone">${a.customer_phone}</p>
                </div>
                <span class="status-badge status-${a.status}">${cap(a.status)}</span>
            </div>
            <div class="card-detail">
                <span class="service-dot dot-${a.color || 'blue'}"></span>
                <span>${a.service_name}</span>
                <span style="color:#9ca3af;">· ${a.duration} min</span>
            </div>
            <div class="card-detail">
                <svg style="width:16px;height:16px;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <span>${formatDate(a.appointment_date)} at ${formatTime(a.appointment_time)}</span>
            </div>
            <div class="card-detail">
                <svg style="width:16px;height:16px;flex-shrink:0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>£${parseFloat(a.price || 0).toFixed(2)}</span>
            </div>
            <div class="card-actions">
                ${a.status === 'scheduled' ? `<button onclick="updateStatus(${a.id},'completed')" class="btn-sm btn-success">Complete</button>` : ''}
                ${a.status !== 'cancelled' ? `<button onclick="showConfirmModal('Cancel Appointment','Are you sure you want to cancel this appointment?',()=>updateStatus(${a.id},'cancelled'))" class="btn-sm btn-cancel">Cancel</button>` : ''}
            </div>
        </div>
    `).join('');
}

window.updateStatus = async function(id, status) {
    try {
        const res = await fetch('/api/appointments/' + id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (res.ok) { await loadAppointments(); updateStats(); hideConfirmModal(); }
    } catch (err) { console.error('Error:', err); }
};

// ==========================================
// SERVICES LIST
// ==========================================
function renderServicesList() {
    const container = document.getElementById('services-list');
    if (!container) return;
    
    if (services.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z"></path>
                </svg>
                <p class="empty-state-title">No services yet</p>
                <p class="empty-state-text">Add your first service to start accepting bookings</p>
            </div>`;
        return;
    }
    
    container.innerHTML = services.map(s => {
        const color = s.color || 'blue';
        return `
            <div class="service-card color-${color}">
                <div class="card-top">
                    <span class="service-name">${s.name}</span>
                    <span class="service-price">£${parseFloat(s.price).toFixed(2)}</span>
                </div>
                <p class="service-desc">${s.description || 'No description'}</p>
                <div class="service-duration">
                    <svg style="width:16px;height:16px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    ${s.duration} minutes
                </div>
                <div class="card-actions">
                    <button onclick="editService(${s.id})" class="btn-sm btn-secondary">Edit</button>
                    <button onclick="showConfirmModal('Delete Service','Are you sure you want to delete this service?',()=>deleteService(${s.id}))" class="btn-sm btn-cancel">Delete</button>
                </div>
            </div>`;
    }).join('');
}

// ==========================================
// CLIENTS LIST
// ==========================================
function renderClientsList() {
    const container = document.getElementById('clients-list');
    if (!container) return;
    
    const search = (document.getElementById('search-clients')?.value || '').toLowerCase();
    
    let filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search) ||
        c.phone.includes(search) ||
        (c.email && c.email.toLowerCase().includes(search))
    );
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg class="empty-state-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
                <p class="empty-state-title">No clients yet</p>
                <p class="empty-state-text">Add your first client or create a booking</p>
            </div>`;
        return;
    }
    
    container.innerHTML = filtered.map(c => {
        const initials = c.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const cAppts = appointments.filter(a => a.customer_phone === c.phone);
        const lastVisit = cAppts.length > 0
            ? formatDate(cAppts.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date))[0].appointment_date)
            : 'No visits yet';
        
        return `
            <div class="client-card">
                <div class="card-top">
                    <div class="client-avatar">${initials}</div>
                    <div>
                        <p class="client-name">${c.name}</p>
                        <p class="client-contact">${c.phone}</p>
                        ${c.email ? `<p class="client-contact">${c.email}</p>` : ''}
                    </div>
                </div>
                <div class="client-meta">
                    <span>${cAppts.length} visit${cAppts.length !== 1 ? 's' : ''}</span>
                    <span>Last: ${lastVisit}</span>
                </div>
                <div class="card-actions">
                    <button onclick="editClient(${c.id})" class="btn-sm btn-secondary">Edit</button>
                    <button onclick="showConfirmModal('Delete Client','Are you sure?',()=>deleteClient(${c.id}))" class="btn-sm btn-cancel">Delete</button>
                </div>
            </div>`;
    }).join('');
}

// ==========================================
// BOOKING MODAL
// ==========================================
window.showNewBookingModal = function() {
    document.getElementById('booking-form').reset();
    document.getElementById('booking-modal').classList.remove('hidden');
    document.getElementById('new-client-fields').style.display = '';
    const clientSelect = document.getElementById('booking-client');
    if (clientSelect) clientSelect.value = '';
    
    const dateInput = document.getElementById('booking-date');
    if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];
    
    populateClientDropdown();
};

window.hideBookingModal = function() {
    document.getElementById('booking-modal').classList.add('hidden');
};

window.handleClientSelect = function(select) {
    const fields = document.getElementById('new-client-fields');
    if (select.value === '') {
        fields.style.display = '';
        document.getElementById('booking-name').value = '';
        document.getElementById('booking-phone').value = '';
        document.getElementById('booking-email').value = '';
    } else {
        fields.style.display = 'none';
        const client = clients.find(c => c.id === parseInt(select.value));
        if (client) {
            document.getElementById('booking-name').value = client.name;
            document.getElementById('booking-phone').value = client.phone;
            document.getElementById('booking-email').value = client.email || '';
        }
    }
};

function populateClientDropdown() {
    const select = document.getElementById('booking-client');
    if (!select) return;
    select.innerHTML = '<option value="">+ New Client</option>' +
        clients.map(c => `<option value="${c.id}">${c.name} — ${c.phone}</option>`).join('');
}

function populateServiceDropdown() {
    const select = document.getElementById('booking-service');
    if (!select) return;
    select.innerHTML = '<option value="">Select a service</option>' +
        services.map(s => `<option value="${s.id}">${s.name} — £${parseFloat(s.price).toFixed(2)} (${s.duration} min)</option>`).join('');
}

function generateTimeOptions() {
    const select = document.getElementById('booking-time');
    if (!select) return;
    let html = '<option value="">Select time</option>';
    for (let h = 9; h <= 17; h++) {
        for (let m = 0; m < 60; m += 30) {
            const t = pad(h) + ':' + pad(m);
            html += `<option value="${t}">${formatTime(t)}</option>`;
        }
    }
    select.innerHTML = html;
}

async function handleBookingSubmit(e) {
    e.preventDefault();
    
    const clientSelect = document.getElementById('booking-client');
    const isExisting = clientSelect && clientSelect.value !== '';
    
    let name, phone, email;
    
    if (isExisting) {
        const client = clients.find(c => c.id === parseInt(clientSelect.value));
        name = client.name;
        phone = client.phone;
        email = client.email || '';
    } else {
        name = document.getElementById('booking-name').value.trim();
        phone = document.getElementById('booking-phone').value.trim();
        email = document.getElementById('booking-email').value.trim();
        if (!name || !phone) { alert('Please enter client name and phone number'); return; }
    }
    
    const data = {
        customer_name: name,
        customer_phone: phone,
        customer_email: email,
        service_id: document.getElementById('booking-service').value,
        appointment_date: document.getElementById('booking-date').value,
        appointment_time: document.getElementById('booking-time').value
    };
    
    try {
        const res = await fetch('/api/appointments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            hideBookingModal();
            await loadAllData();
        } else {
            const err = await res.json();
            alert(err.error || 'Failed to create booking');
        }
    } catch (err) {
        console.error('Error:', err);
        alert('Failed to create booking');
    }
}

// ==========================================
// SERVICE MODAL
// ==========================================
window.showServiceModal = function() {
    editingServiceId = null;
    selectedServiceColor = 'blue';
    document.getElementById('service-modal-title').textContent = 'Add Service';
    document.getElementById('service-form').reset();
    updateColorSelection();
    document.getElementById('service-modal').classList.remove('hidden');
};
window.hideServiceModal = function() { document.getElementById('service-modal').classList.add('hidden'); };

window.editService = function(id) {
    const s = services.find(x => x.id === id);
    if (!s) return;
    editingServiceId = id;
    selectedServiceColor = s.color || 'blue';
    document.getElementById('service-modal-title').textContent = 'Edit Service';
    document.getElementById('service-name').value = s.name;
    document.getElementById('service-description').value = s.description || '';
    document.getElementById('service-duration').value = s.duration;
    document.getElementById('service-price').value = s.price;
    updateColorSelection();
    document.getElementById('service-modal').classList.remove('hidden');
};

window.selectColor = function(color) { selectedServiceColor = color; updateColorSelection(); };

function updateColorSelection() {
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.color === selectedServiceColor);
    });
}

async function handleServiceSubmit(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('service-name').value,
        description: document.getElementById('service-description').value,
        duration: parseInt(document.getElementById('service-duration').value),
        price: parseFloat(document.getElementById('service-price').value),
        color: selectedServiceColor
    };
    const url = editingServiceId ? '/api/services/' + editingServiceId : '/api/services';
    const method = editingServiceId ? 'PUT' : 'POST';
    try {
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) { hideServiceModal(); await loadServices(); }
        else alert('Failed to save service');
    } catch (err) { console.error('Error:', err); alert('Failed to save service'); }
}

window.deleteService = async function(id) {
    try {
        const res = await fetch('/api/services/' + id, { method: 'DELETE' });
        if (res.ok) { hideConfirmModal(); await loadServices(); }
        else alert('Failed to delete service. It may have associated appointments.');
    } catch (err) { console.error('Error:', err); }
};

// ==========================================
// CLIENT MODAL
// ==========================================
window.showClientModal = function() {
    editingClientId = null;
    document.getElementById('client-modal-title').textContent = 'Add Client';
    document.getElementById('client-form').reset();
    document.getElementById('client-modal').classList.remove('hidden');
};
window.hideClientModal = function() { document.getElementById('client-modal').classList.add('hidden'); };

window.editClient = function(id) {
    const c = clients.find(x => x.id === id);
    if (!c) return;
    editingClientId = id;
    document.getElementById('client-modal-title').textContent = 'Edit Client';
    document.getElementById('client-name').value = c.name;
    document.getElementById('client-email').value = c.email || '';
    document.getElementById('client-phone').value = c.phone;
    document.getElementById('client-modal').classList.remove('hidden');
};

async function handleClientSubmit(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('client-name').value,
        email: document.getElementById('client-email').value,
        phone: document.getElementById('client-phone').value
    };
    const url = editingClientId ? '/api/clients/' + editingClientId : '/api/clients';
    const method = editingClientId ? 'PUT' : 'POST';
    try {
        const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) { hideClientModal(); await loadClients(); updateStats(); }
        else { const err = await res.json(); alert(err.error || 'Failed to save client'); }
    } catch (err) { console.error('Error:', err); alert('Failed to save client'); }
}

window.deleteClient = async function(id) {
    try {
        const res = await fetch('/api/clients/' + id, { method: 'DELETE' });
        if (res.ok) { hideConfirmModal(); await loadClients(); updateStats(); }
        else alert('Failed to delete client');
    } catch (err) { console.error('Error:', err); }
};

// ==========================================
// CONFIRM MODAL
// ==========================================
window.showConfirmModal = function(title, msg, cb) {
    document.getElementById('confirm-title').textContent = title;
    document.getElementById('confirm-message').textContent = msg;
    confirmCallback = cb;
    document.getElementById('confirm-modal').classList.remove('hidden');
};
window.hideConfirmModal = function() {
    document.getElementById('confirm-modal').classList.add('hidden');
    confirmCallback = null;
};

// ==========================================
// EVENT LISTENERS
// ==========================================
function setupEventListeners() {
    document.getElementById('booking-form')?.addEventListener('submit', handleBookingSubmit);
    document.getElementById('service-form')?.addEventListener('submit', handleServiceSubmit);
    document.getElementById('client-form')?.addEventListener('submit', handleClientSubmit);
    document.getElementById('search-appointments')?.addEventListener('input', renderAppointmentsList);
    document.getElementById('filter-status')?.addEventListener('change', renderAppointmentsList);
    document.getElementById('search-clients')?.addEventListener('input', renderClientsList);
    document.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => selectColor(btn.dataset.color));
    });
    document.getElementById('confirm-action')?.addEventListener('click', () => { if (confirmCallback) confirmCallback(); });
}

// ==========================================
// UTILITIES
// ==========================================
function getWeekStart(d) {
    const date = new Date(d);
    const day = date.getDay();
    date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
    date.setHours(0, 0, 0, 0);
    return date;
}

function getWeekEnd(d) {
    const date = getWeekStart(d);
    date.setDate(date.getDate() + 6);
    date.setHours(23, 59, 59, 999);
    return date;
}

function formatDate(s) {
    var dateStr = String(s).split('T')[0];
    var y = parseInt(dateStr.split('-')[0]);
    var m = parseInt(dateStr.split('-')[1]) - 1;
    var d = parseInt(dateStr.split('-')[2]);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return d + ' ' + months[m] + ' ' + y;
}

function formatShortDate(d) {
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function formatTime(t) {
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    return (hour % 12 || 12) + ':' + m + ' ' + (hour >= 12 ? 'PM' : 'AM');
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function pad(n) { return String(n).padStart(2, '0'); }
