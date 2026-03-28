// State
let appointments = [];
let services = [];
let deleteTargetId = null;
let editingServiceId = null;
let currentMonth = new Date();
let weeklyChart = null;
let servicesChart = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAppointments();
    loadServices();
    setupEventListeners();
});

// Tab switching - make it global
window.showTab = function(tabName) {
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(`panel-${tabName}`).classList.remove('hidden');
    document.getElementById(`tab-${tabName}`).classList.add('active');

    if (tabName === 'calendar') {
        renderCalendar();
    }
}

// Load appointments from API
async function loadAppointments() {
    try {
        const response = await fetch('/api/appointments');
        appointments = await response.json();
        updateStats();
        renderAppointments();
        renderTodaySchedule();
        renderCharts();
        renderCalendar();
    } catch (error) {
        console.error('Error loading appointments:', error);
    }
}

// Load services from API
async function loadServices() {
    try {
        const response = await fetch('/api/services');
        services = await response.json();
        renderServices();
    } catch (error) {
        console.error('Error loading services:', error);
    }
}

// Update statistics
function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const weekStart = getWeekStart(new Date());
    const weekEnd = getWeekEnd(new Date());
    
    const activeAppointments = appointments.filter(apt => apt.status !== 'cancelled');
    
    const todayCount = activeAppointments.filter(apt => 
        apt.appointment_date.split('T')[0] === today
    ).length;
    
    const weekCount = activeAppointments.filter(apt => {
        const aptDate = new Date(apt.appointment_date.split('T')[0]);
        return aptDate >= weekStart && aptDate <= weekEnd;
    }).length;
    
    const totalCount = activeAppointments.length;
    
    const totalRevenue = activeAppointments.reduce((sum, apt) => {
        return sum + parseFloat(apt.price || 0);
    }, 0);

    document.getElementById('stat-today').textContent = todayCount;
    document.getElementById('stat-week').textContent = weekCount;
    document.getElementById('stat-total').textContent = totalCount;
    document.getElementById('stat-revenue').textContent = `£${totalRevenue.toFixed(2)}`;
}

function getWeekStart(date) {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
}

function getWeekEnd(date) {
    const d = getWeekStart(date);
    d.setDate(d.getDate() + 6);
    d.setHours(23, 59, 59, 999);
    return d;
}

// Render charts
function renderCharts() {
    renderWeeklyChart();
    renderServicesChart();
}

function renderWeeklyChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;
    
    const days = [];
    const counts = [];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        days.push(date.toLocaleDateString('en-GB', { weekday: 'short' }));
        
        const count = appointments.filter(apt => 
            apt.appointment_date.split('T')[0] === dateStr && apt.status !== 'cancelled'
        ).length;
        counts.push(count);
    }

    if (weeklyChart) weeklyChart.destroy();

    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: days,
            datasets: [{
                label: 'Bookings',
                data: counts,
                backgroundColor: 'rgba(6, 182, 212, 0.5)',
                borderColor: 'rgba(6, 182, 212, 1)',
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, color: '#94a3b8' }, grid: { color: '#334155' } },
                x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
            }
        }
    });
}

function renderServicesChart() {
    const ctx = document.getElementById('servicesChart');
    if (!ctx) return;
    
    const serviceCounts = {};
    appointments.filter(apt => apt.status !== 'cancelled').forEach(apt => {
        serviceCounts[apt.service_name] = (serviceCounts[apt.service_name] || 0) + 1;
    });

    const labels = Object.keys(serviceCounts);
    const data = Object.values(serviceCounts);
    
    if (servicesChart) servicesChart.destroy();
    if (labels.length === 0) return;

    servicesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: ['#06b6d4', '#3b82f6', '#10b981', '#f97316', '#8b5cf6'],
                borderColor: '#0f172a',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right', labels: { color: '#94a3b8', padding: 15 } }
            }
        }
    });
}

function renderTodaySchedule() {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments
        .filter(apt => apt.appointment_date.split('T')[0] === today && apt.status !== 'cancelled')
        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

    const container = document.getElementById('today-schedule');
    if (!container) return;

    if (todayAppointments.length === 0) {
        container.innerHTML = '<div class="text-center py-8 text-slate-400"><p>No appointments today</p></div>';
        return;
    }

    container.innerHTML = todayAppointments.map(apt => `
        <div class="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl">
            <div class="text-cyan-400 font-semibold min-w-[70px]">${formatTime(apt.appointment_time)}</div>
            <div class="flex-1">
                <p class="font-medium text-white">${apt.customer_name}</p>
                <p class="text-sm text-slate-400">${apt.service_name}</p>
            </div>
            ${getStatusBadge(apt.status)}
        </div>
    `).join('');
}

// Calendar
function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    document.getElementById('calendar-month').textContent = currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date().toISOString().split('T')[0];
    
    const grid = document.getElementById('calendar-grid');
    if (!grid) return;
    
    let html = '';
    for (let i = 0; i < firstDay; i++) html += '<div class="p-2"></div>';
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const count = appointments.filter(apt => apt.appointment_date.split('T')[0] === dateStr && apt.status !== 'cancelled').length;
        const isToday = dateStr === today;
        
        html += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${count > 0 ? 'has-appointments' : ''}" onclick="selectCalendarDay('${dateStr}')">
                <span class="day-number">${day}</span>
                ${count > 0 ? `<span class="appointment-count">${count}</span>` : ''}
            </div>
        `;
    }
    grid.innerHTML = html;
}

window.selectCalendarDay = function(dateStr) {
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
    document.querySelector(`.calendar-day[onclick*="${dateStr}"]`)?.classList.add('selected');
    
    const dayAppointments = appointments
        .filter(apt => apt.appointment_date.split('T')[0] === dateStr && apt.status !== 'cancelled')
        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
    
    const container = document.getElementById('day-appointments');
    document.getElementById('selected-day-title').textContent = new Date(dateStr).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    
    document.getElementById('selected-day-list').innerHTML = dayAppointments.length === 0 
        ? '<p class="text-slate-400 text-center py-4">No appointments</p>'
        : dayAppointments.map(apt => `
            <div class="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl">
                <div class="text-cyan-400 font-semibold">${formatTime(apt.appointment_time)}</div>
                <div class="flex-1"><p class="text-white">${apt.customer_name}</p><p class="text-sm text-slate-400">${apt.service_name}</p></div>
            </div>
        `).join('');
    
    container.classList.remove('hidden');
}

function prevMonth() { currentMonth.setMonth(currentMonth.getMonth() - 1); renderCalendar(); }
function nextMonth() { currentMonth.setMonth(currentMonth.getMonth() + 1); renderCalendar(); }

// Appointments table and cards
function renderAppointments() {
    const filter = document.getElementById('filter-status')?.value || 'all';
    let filtered = filter === 'all' ? appointments : appointments.filter(apt => apt.status === filter);
    filtered.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date));

    const table = document.getElementById('appointments-table');
    const cards = document.getElementById('appointments-cards');
    const empty = document.getElementById('empty-state');
    
    if (!table || !cards) return;

    if (filtered.length === 0) {
        table.innerHTML = '';
        cards.innerHTML = '';
        empty?.classList.remove('hidden');
        return;
    }
    empty?.classList.add('hidden');
    
    // Desktop table
    table.innerHTML = filtered.map(apt => `
        <tr class="border-t border-slate-800 hover:bg-slate-800/30">
            <td class="p-4"><p class="font-medium text-white">${apt.customer_name}</p><p class="text-sm text-slate-400">${apt.customer_phone}</p></td>
            <td class="p-4"><p class="text-white">${apt.service_name}</p><p class="text-sm text-slate-400">${apt.duration} min • £${parseFloat(apt.price).toFixed(2)}</p></td>
            <td class="p-4"><p class="text-white">${formatDate(apt.appointment_date)}</p><p class="text-sm text-slate-400">${formatTime(apt.appointment_time)}</p></td>
            <td class="p-4">${getStatusBadge(apt.status)}</td>
            <td class="p-4">
                ${apt.status === 'pending' ? `<button onclick="updateStatus(${apt.id}, 'confirmed')" class="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-sm mr-2">Confirm</button>` : ''}
                ${apt.status !== 'cancelled' ? `<button onclick="showDeleteModal(${apt.id})" class="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-sm">Cancel</button>` : ''}
            </td>
        </tr>
    `).join('');

    // Mobile cards
    cards.innerHTML = filtered.map(apt => `
        <div class="glass-card p-4">
            <div class="flex justify-between items-start mb-3">
                <div>
                    <p class="font-semibold text-white">${apt.customer_name}</p>
                    <p class="text-sm text-slate-400">${apt.customer_phone}</p>
                </div>
                ${getStatusBadge(apt.status)}
            </div>
            <div class="flex justify-between items-center mb-3">
                <div>
                    <p class="text-cyan-400 font-medium">${apt.service_name}</p>
                    <p class="text-sm text-slate-400">${apt.duration} min • £${parseFloat(apt.price).toFixed(2)}</p>
                </div>
                <div class="text-right">
                    <p class="text-white">${formatDate(apt.appointment_date)}</p>
                    <p class="text-sm text-slate-400">${formatTime(apt.appointment_time)}</p>
                </div>
            </div>
            <div class="flex gap-2 pt-3 border-t border-slate-700">
                ${apt.status === 'pending' ? `<button onclick="updateStatus(${apt.id}, 'confirmed')" class="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm">Confirm</button>` : ''}
                ${apt.status !== 'cancelled' ? `<button onclick="showDeleteModal(${apt.id})" class="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm">Cancel</button>` : ''}
                ${apt.status === 'cancelled' ? `<p class="flex-1 py-2 text-center text-slate-500 text-sm">Cancelled</p>` : ''}
            </div>
        </div>
    `).join('');
}

// Services
function renderServices() {
    const container = document.getElementById('services-grid');
    if (!container) return;
    
    container.innerHTML = services.map(s => `
        <div class="glass-card p-6">
            <div class="flex justify-between mb-4">
                <h3 class="text-xl font-semibold text-white">${s.name}</h3>
                <span class="text-cyan-400 font-bold">£${parseFloat(s.price).toFixed(2)}</span>
            </div>
            <p class="text-slate-400 mb-4">${s.duration} minutes</p>
            <div class="flex gap-2">
                <button onclick="editService(${s.id})" class="flex-1 py-2 rounded-lg bg-slate-700/50 text-slate-300 text-sm">Edit</button>
                <button onclick="deleteService(${s.id})" class="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm">Delete</button>
            </div>
        </div>
    `).join('');
}

// Helpers
function getStatusBadge(status) {
    const badges = {
        pending: '<span class="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">Pending</span>',
        confirmed: '<span class="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">Confirmed</span>',
        cancelled: '<span class="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">Cancelled</span>'
    };
    return badges[status] || badges.pending;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(timeString) {
    const [h, m] = timeString.split(':');
    const hour = parseInt(h);
    return `${hour % 12 || 12}:${m} ${hour >= 12 ? 'PM' : 'AM'}`;
}

// Actions
window.updateStatus = async function(id, status) {
    const response = await fetch(`/api/appointments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
    });
    if (response.ok) loadAppointments();
}

window.showDeleteModal = function(id) {
    deleteTargetId = id;
    document.getElementById('delete-modal').classList.remove('hidden');
    document.getElementById('delete-modal').classList.add('flex');
}

function hideDeleteModal() {
    deleteTargetId = null;
    document.getElementById('delete-modal').classList.add('hidden');
    document.getElementById('delete-modal').classList.remove('flex');
}

window.editService = function(id) {
    editingServiceId = id;
    const service = services.find(s => s.id === id);
    document.getElementById('service-modal-title').textContent = 'Edit Service';
    document.getElementById('service-name').value = service.name;
    document.getElementById('service-duration').value = service.duration;
    document.getElementById('service-price').value = service.price;
    document.getElementById('service-modal').classList.remove('hidden');
    document.getElementById('service-modal').classList.add('flex');
}

window.deleteService = async function(id) {
    if (!confirm('Delete this service?')) return;
    try {
        const response = await fetch(`/api/services/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadServices();
        } else {
            alert('Failed to delete service. It may have associated appointments.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to delete service');
    }
}

function showServiceModal() {
    editingServiceId = null;
    document.getElementById('service-modal-title').textContent = 'Add Service';
    document.getElementById('service-name').value = '';
    document.getElementById('service-duration').value = '';
    document.getElementById('service-price').value = '';
    document.getElementById('service-modal').classList.remove('hidden');
    document.getElementById('service-modal').classList.add('flex');
}

function hideServiceModal() {
    document.getElementById('service-modal').classList.add('hidden');
    document.getElementById('service-modal').classList.remove('flex');
}

async function saveService() {
    const data = {
        name: document.getElementById('service-name').value,
        duration: parseInt(document.getElementById('service-duration').value),
        price: parseFloat(document.getElementById('service-price').value)
    };
    
    const url = editingServiceId ? `/api/services/${editingServiceId}` : '/api/services';
    const method = editingServiceId ? 'PUT' : 'POST';
    
    const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    if (response.ok) {
        hideServiceModal();
        loadServices();
    }
}

// Event listeners
function setupEventListeners() {
    document.getElementById('filter-status')?.addEventListener('change', renderAppointments);
    document.getElementById('modal-cancel')?.addEventListener('click', hideDeleteModal);
    document.getElementById('modal-confirm')?.addEventListener('click', async () => { await updateStatus(deleteTargetId, 'cancelled'); hideDeleteModal(); });
    document.getElementById('btn-add-service')?.addEventListener('click', showServiceModal);
    document.getElementById('service-modal-cancel')?.addEventListener('click', hideServiceModal);
    document.getElementById('service-modal-save')?.addEventListener('click', saveService);
    document.getElementById('prev-month')?.addEventListener('click', prevMonth);
    document.getElementById('next-month')?.addEventListener('click', nextMonth);
}