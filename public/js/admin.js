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

// Tab switching
function showTab(tabName) {
    // Hide all panels
    document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.add('hidden'));
    // Remove active from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    // Show selected panel
    document.getElementById(`panel-${tabName}`).classList.remove('hidden');
    document.getElementById(`tab-${tabName}`).classList.add('active');

    // Refresh data when switching tabs
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

// Get week start (Sunday)
function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
    return d;
}

// Get week end (Saturday)
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

// Weekly bookings chart
function renderWeeklyChart() {
    const canvas = document.getElementById('weeklyChart');
    const ctx = canvas.getContext('2d');
    
    // Fix canvas size
    canvas.style.height = '250px';
    canvas.style.width = '100%';
    
    // Get last 7 days
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

    if (weeklyChart) {
        weeklyChart.destroy();
    }

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
                borderRadius: 8,
                borderSkipped: false,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        color: 'rgba(148, 163, 184, 0.8)'
                    },
                    grid: {
                        color: 'rgba(51, 65, 85, 0.5)'
                    }
                },
                x: {
                    ticks: {
                        color: 'rgba(148, 163, 184, 0.8)'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

// Services popularity chart
function renderServicesChart() {
    const canvas = document.getElementById('servicesChart');
    const ctx = canvas.getContext('2d');
    
    // Fix canvas size
    canvas.style.height = '250px';
    canvas.style.width = '100%';
    
    // Count bookings per service
    const serviceCounts = {};
    appointments.filter(apt => apt.status !== 'cancelled').forEach(apt => {
        const name = apt.service_name;
        serviceCounts[name] = (serviceCounts[name] || 0) + 1;
    });

    const labels = Object.keys(serviceCounts);
    const data = Object.values(serviceCounts);
    
    if (servicesChart) {
        servicesChart.destroy();
    }

    if (labels.length === 0) {
        return;
    }

    servicesChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    'rgba(6, 182, 212, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(139, 92, 246, 0.8)'
                ],
                borderColor: 'rgba(15, 23, 42, 1)',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: 'rgba(148, 163, 184, 0.8)',
                        padding: 20,
                        font: {
                            size: 12
                        }
                    }
                }
            }
        }
    });
}

// Render today's schedule
function renderTodaySchedule() {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointments
        .filter(apt => apt.appointment_date.split('T')[0] === today && apt.status !== 'cancelled')
        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));

    const container = document.getElementById('today-schedule');

    if (todayAppointments.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-slate-400">
                <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p>No appointments scheduled for today</p>
            </div>
        `;
        return;
    }

    container.innerHTML = todayAppointments.map(apt => `
        <div class="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl">
            <div class="text-center min-w-[60px]">
                <p class="text-cyan-400 font-semibold">${formatTime(apt.appointment_time)}</p>
            </div>
            <div class="flex-1">
                <p class="font-medium text-white">${apt.customer_name}</p>
                <p class="text-sm text-slate-400">${apt.service_name} • ${apt.duration} min</p>
            </div>
            <div>
                ${getStatusBadge(apt.status)}
            </div>
        </div>
    `).join('');
}

// Calendar rendering
function renderCalendar() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // Update header
    const monthName = currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    document.getElementById('calendar-month').textContent = monthName;
    
    // Get first day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Create calendar grid
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    
    // Empty cells for days before first day of month
    for (let i = 0; i < firstDay; i++) {
        grid.innerHTML += '<div class="p-2"></div>';
    }
    
    // Days of the month
    const today = new Date().toISOString().split('T')[0];
    
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayAppointments = appointments.filter(apt => 
            apt.appointment_date.split('T')[0] === dateStr && apt.status !== 'cancelled'
        );
        const count = dayAppointments.length;
        const isToday = dateStr === today;
        
        grid.innerHTML += `
            <div class="calendar-day ${isToday ? 'today' : ''} ${count > 0 ? 'has-appointments' : ''}" 
                 onclick="selectCalendarDay('${dateStr}')"
                 data-date="${dateStr}">
                <span class="day-number">${day}</span>
                ${count > 0 ? `<span class="appointment-count">${count}</span>` : ''}
            </div>
        `;
    }
}

// Select a calendar day
function selectCalendarDay(dateStr) {
    // Remove previous selection
    document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
    
    // Add selection to clicked day
    const dayEl = document.querySelector(`.calendar-day[data-date="${dateStr}"]`);
    if (dayEl) {
        dayEl.classList.add('selected');
    }
    
    // Show appointments for this day
    const dayAppointments = appointments
        .filter(apt => apt.appointment_date.split('T')[0] === dateStr && apt.status !== 'cancelled')
        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
    
    const container = document.getElementById('day-appointments');
    const title = document.getElementById('selected-day-title');
    const list = document.getElementById('selected-day-list');
    
    const dateFormatted = new Date(dateStr).toLocaleDateString('en-GB', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long',
        year: 'numeric'
    });
    
    title.textContent = dateFormatted;
    
    if (dayAppointments.length === 0) {
        list.innerHTML = '<p class="text-slate-400 text-center py-4">No appointments on this day</p>';
    } else {
        list.innerHTML = dayAppointments.map(apt => `
            <div class="flex items-center gap-4 p-4 bg-slate-800/30 rounded-xl">
                <div class="text-center min-w-[60px]">
                    <p class="text-cyan-400 font-semibold">${formatTime(apt.appointment_time)}</p>
                </div>
                <div class="flex-1">
                    <p class="font-medium text-white">${apt.customer_name}</p>
                    <p class="text-sm text-slate-400">${apt.service_name} • ${apt.duration} min</p>
                </div>
                <div>
                    ${getStatusBadge(apt.status)}
                </div>
            </div>
        `).join('');
    }
    
    container.classList.remove('hidden');
}

// Navigate calendar months
function prevMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar();
}

// Render appointments table
function renderAppointments() {
    const statusFilter = document.getElementById('filter-status').value;
    
    let filtered = appointments;
    if (statusFilter !== 'all') {
        filtered = appointments.filter(apt => apt.status === statusFilter);
    }

    // Sort by date descending (newest first)
    filtered.sort((a, b) => {
        const dateA = new Date(`${a.appointment_date.split('T')[0]}T${a.appointment_time}`);
        const dateB = new Date(`${b.appointment_date.split('T')[0]}T${b.appointment_time}`);
        return dateB - dateA;
    });

    const table = document.getElementById('appointments-table');
    const emptyState = document.getElementById('empty-state');

    if (filtered.length === 0) {
        table.innerHTML = '';
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    
    table.innerHTML = filtered.map(apt => `
        <tr class="border-t border-slate-800 hover:bg-slate-800/30 transition-colors">
            <td class="p-4">
                <p class="font-medium text-white">${apt.customer_name}</p>
                <p class="text-sm text-slate-400">${apt.customer_phone}</p>
            </td>
            <td class="p-4">
                <p class="text-white">${apt.service_name}</p>
                <p class="text-sm text-slate-400">${apt.duration} min • £${parseFloat(apt.price).toFixed(2)}</p>
            </td>
            <td class="p-4">
                <p class="text-white">${formatDate(apt.appointment_date)}</p>
                <p class="text-sm text-slate-400">${formatTime(apt.appointment_time)}</p>
            </td>
            <td class="p-4">
                ${getStatusBadge(apt.status)}
            </td>
            <td class="p-4">
                <div class="flex gap-2">
                    ${apt.status === 'pending' ? `
                        <button onclick="updateStatus(${apt.id}, 'confirmed')" class="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition-colors">
                            Confirm
                        </button>
                    ` : ''}
                    ${apt.status !== 'cancelled' ? `
                        <button onclick="showDeleteModal(${apt.id})" class="px-3 py-1 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors">
                            Cancel
                        </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `).join('');
}

// Render services
function renderServices() {
    const container = document.getElementById('services-grid');
    
    container.innerHTML = services.map(service => `
        <div class="glass-card p-6">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-semibold text-white">${service.name}</h3>
                <span class="text-cyan-400 font-bold text-lg">£${parseFloat(service.price).toFixed(2)}</span>
            </div>
            <div class="flex items-center text-slate-400 text-sm mb-4">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                ${service.duration} minutes
            </div>
            <div class="flex gap-2">
                <button onclick="editService(${service.id})" class="flex-1 py-2 rounded-lg bg-slate-700/50 text-slate-300 text-sm hover:bg-slate-700 transition-colors">
                    Edit
                </button>
                <button onclick="deleteService(${service.id})" class="flex-1 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

// Get status badge HTML
function getStatusBadge(status) {
    const badges = {
        pending: '<span class="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm">Pending</span>',
        confirmed: '<span class="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">Confirmed</span>',
        cancelled: '<span class="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">Cancelled</span>'
    };
    return badges[status] || badges.pending;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short',
        year: 'numeric'
    });
}

// Format time
function formatTime(timeString) {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Update appointment status
async function updateStatus(id, status) {
    try {
        const response = await fetch(`/api/appointments/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });

        if (response.ok) {
            loadAppointments();
        } else {
            alert('Failed to update appointment');
        }
    } catch (error) {
        console.error('Error updating appointment:', error);
        alert('Failed to update appointment');
    }
}

// Show delete confirmation modal
function showDeleteModal(id) {
    deleteTargetId = id;
    const modal = document.getElementById('delete-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

// Hide delete modal
function hideDeleteModal() {
    deleteTargetId = null;
    const modal = document.getElementById('delete-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

// Confirm delete (actually cancels the appointment)
async function confirmDelete() {
    if (!deleteTargetId) return;
    await updateStatus(deleteTargetId, 'cancelled');
    hideDeleteModal();
}

// Service Modal Functions
function showServiceModal(serviceId = null) {
    editingServiceId = serviceId;
    const modal = document.getElementById('service-modal');
    const title = document.getElementById('service-modal-title');
    
    if (serviceId) {
        const service = services.find(s => s.id === serviceId);
        title.textContent = 'Edit Service';
        document.getElementById('service-name').value = service.name;
        document.getElementById('service-duration').value = service.duration;
        document.getElementById('service-price').value = service.price;
    } else {
        title.textContent = 'Add Service';
        document.getElementById('service-name').value = '';
        document.getElementById('service-duration').value = '';
        document.getElementById('service-price').value = '';
    }
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function hideServiceModal() {
    editingServiceId = null;
    const modal = document.getElementById('service-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
}

async function saveService() {
    const name = document.getElementById('service-name').value.trim();
    const duration = parseInt(document.getElementById('service-duration').value);
    const price = parseFloat(document.getElementById('service-price').value);

    if (!name || !duration || !price) {
        alert('Please fill in all fields');
        return;
    }

    const serviceData = { name, duration, price };

    try {
        let response;
        if (editingServiceId) {
            response = await fetch(`/api/services/${editingServiceId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serviceData)
            });
        } else {
            response = await fetch('/api/services', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serviceData)
            });
        }

        if (response.ok) {
            hideServiceModal();
            loadServices();
        } else {
            alert('Failed to save service');
        }
    } catch (error) {
        console.error('Error saving service:', error);
        alert('Failed to save service');
    }
}

function editService(id) {
    showServiceModal(id);
}

async function deleteService(id) {
    if (!confirm('Are you sure you want to delete this service? This cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`/api/services/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadServices();
        } else {
            alert('Failed to delete service. It may have associated appointments.');
        }
    } catch (error) {
        console.error('Error deleting service:', error);
        alert('Failed to delete service');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Filter change
    document.getElementById('filter-status').addEventListener('change', renderAppointments);
    
    // Delete modal
    document.getElementById('modal-cancel').addEventListener('click', hideDeleteModal);
    document.getElementById('modal-confirm').addEventListener('click', confirmDelete);
    document.getElementById('delete-modal').addEventListener('click', (e) => {
        if (e.target.id === 'delete-modal') hideDeleteModal();
    });
    
    // Service modal
    document.getElementById('btn-add-service').addEventListener('click', () => showServiceModal());
    document.getElementById('service-modal-cancel').addEventListener('click', hideServiceModal);
    document.getElementById('service-modal-save').addEventListener('click', saveService);
    document.getElementById('service-modal').addEventListener('click', (e) => {
        if (e.target.id === 'service-modal') hideServiceModal();
    });
    
    // Calendar navigation
    document.getElementById('prev-month').addEventListener('click', prevMonth);
    document.getElementById('next-month').addEventListener('click', nextMonth);
}