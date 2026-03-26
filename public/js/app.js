// State management
let selectedService = null;
let selectedDate = null;
let selectedTime = null;

// DOM Elements
const servicesList = document.getElementById('services-list');
const timeSlotsContainer = document.getElementById('time-slots');
const dateInput = document.getElementById('date');

// Sections
const stepService = document.getElementById('step-service');
const stepDatetime = document.getElementById('step-datetime');
const stepDetails = document.getElementById('step-details');
const stepSuccess = document.getElementById('step-success');

// Progress indicators
const progress1 = document.getElementById('progress-1');
const progress2 = document.getElementById('progress-2');
const progress3 = document.getElementById('progress-3');

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadServices();
    setupEventListeners();
    setMinDate();
});

// Set minimum date to today
function setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    dateInput.setAttribute('min', today);
}

// Load services from API
async function loadServices() {
    try {
        const response = await fetch('/api/services');
        const services = await response.json();
        renderServices(services);
    } catch (error) {
        console.error('Error loading services:', error);
        servicesList.innerHTML = '<p class="text-red-400 col-span-full text-center">Failed to load services. Please refresh the page.</p>';
    }
}

// Render service cards
function renderServices(services) {
    servicesList.innerHTML = services.map(service => `
        <div class="service-card" data-id="${service.id}" data-name="${service.name}" data-duration="${service.duration}" data-price="${service.price}">
            <div class="flex justify-between items-start mb-4">
                <h3 class="text-xl font-semibold text-white">${service.name}</h3>
                <span class="text-cyan-400 font-bold text-lg">£${parseFloat(service.price).toFixed(2)}</span>
            </div>
            <div class="flex items-center text-slate-400 text-sm">
                <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                ${service.duration} minutes
            </div>
        </div>
    `).join('');

    // Add click handlers to service cards
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', () => selectService(card));
    });
}

// Select a service
function selectService(card) {
    // Remove selection from other cards
    document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
    
    // Select this card
    card.classList.add('selected');
    
    // Store selected service
    selectedService = {
        id: card.dataset.id,
        name: card.dataset.name,
        duration: card.dataset.duration,
        price: card.dataset.price
    };

    // Move to next step after short delay
    setTimeout(() => {
        showStep('datetime');
    }, 300);
}

// Generate time slots
function generateTimeSlots() {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    
    return slots;
}

// Load available time slots for selected date
async function loadTimeSlots(date) {
    const slots = generateTimeSlots();
    
    try {
        // Fetch existing appointments for this date
        const response = await fetch('/api/appointments');
        const appointments = await response.json();
        
        // Filter appointments for selected date
        const bookedTimes = appointments
            .filter(apt => apt.appointment_date.split('T')[0] === date && apt.status !== 'cancelled')
            .map(apt => apt.appointment_time.substring(0, 5));

        renderTimeSlots(slots, bookedTimes);
    } catch (error) {
        console.error('Error loading appointments:', error);
        renderTimeSlots(slots, []);
    }
}

// Render time slots
function renderTimeSlots(slots, bookedTimes) {
    timeSlotsContainer.innerHTML = slots.map(slot => {
        const isBooked = bookedTimes.includes(slot);
        const isPast = isTimeInPast(selectedDate, slot);
        const isUnavailable = isBooked || isPast;
        
        return `
            <button 
                class="time-slot ${isUnavailable ? 'unavailable' : ''}" 
                data-time="${slot}"
                ${isUnavailable ? 'disabled' : ''}
            >
                ${formatTime(slot)}
            </button>
        `;
    }).join('');

    // Add click handlers to available time slots
    document.querySelectorAll('.time-slot:not(.unavailable)').forEach(slot => {
        slot.addEventListener('click', () => selectTimeSlot(slot));
    });
}

// Check if time is in the past
function isTimeInPast(date, time) {
    const now = new Date();
    const slotDate = new Date(`${date}T${time}`);
    return slotDate < now;
}

// Format time for display (24h to 12h)
function formatTime(time) {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
}

// Select a time slot
function selectTimeSlot(slot) {
    // Remove selection from other slots
    document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
    
    // Select this slot
    slot.classList.add('selected');
    
    // Store selected time
    selectedTime = slot.dataset.time;

    // Move to next step after short delay
    setTimeout(() => {
        showStep('details');
        updateSummary();
    }, 300);
}

// Update booking summary
function updateSummary() {
    document.getElementById('summary-service').textContent = selectedService.name;
    document.getElementById('summary-date').textContent = formatDate(selectedDate);
    document.getElementById('summary-time').textContent = formatTime(selectedTime);
    document.getElementById('summary-price').textContent = `£${parseFloat(selectedService.price).toFixed(2)}`;
}

// Format date for display
function formatDate(dateString) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
}

// Show specific step
function showStep(step) {
    // Hide all sections
    stepService.classList.add('hidden');
    stepDatetime.classList.add('hidden');
    stepDetails.classList.add('hidden');
    stepSuccess.classList.add('hidden');

    // Reset progress
    progress1.classList.remove('active', 'completed');
    progress2.classList.remove('active', 'completed');
    progress3.classList.remove('active', 'completed');

    // Show selected section and update progress
    switch(step) {
        case 'service':
            stepService.classList.remove('hidden');
            progress1.classList.add('active');
            break;
        case 'datetime':
            stepDatetime.classList.remove('hidden');
            progress1.classList.add('completed');
            progress2.classList.add('active');
            break;
        case 'details':
            stepDetails.classList.remove('hidden');
            progress1.classList.add('completed');
            progress2.classList.add('completed');
            progress3.classList.add('active');
            break;
        case 'success':
            stepSuccess.classList.remove('hidden');
            progress1.classList.add('completed');
            progress2.classList.add('completed');
            progress3.classList.add('completed');
            break;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Date change
    dateInput.addEventListener('change', (e) => {
        selectedDate = e.target.value;
        loadTimeSlots(selectedDate);
    });

    // Back buttons
    document.getElementById('btn-back-service').addEventListener('click', () => {
        showStep('service');
    });

    document.getElementById('btn-back-datetime').addEventListener('click', () => {
        showStep('datetime');
    });

    // Confirm booking
    document.getElementById('confirm-booking').addEventListener('click', submitBooking);

    // New booking button
    document.getElementById('btn-new-booking').addEventListener('click', () => {
        // Reset state
        selectedService = null;
        selectedDate = null;
        selectedTime = null;
        document.getElementById('name').value = '';
        document.getElementById('phone').value = '';
        dateInput.value = '';
        
        // Clear selections
        document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
        
        showStep('service');
    });
}

// Submit booking
async function submitBooking() {
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();

    // Validation
    if (!name || !phone) {
        alert('Please fill in all fields');
        return;
    }

    const bookingData = {
        customer_name: name,
        customer_phone: phone,
        service_id: parseInt(selectedService.id),
        appointment_date: selectedDate,
        appointment_time: selectedTime
    };

    try {
        const response = await fetch('/api/appointments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });

        const result = await response.json();

        if (response.ok) {
            // Update confirmation of the details
            document.getElementById('confirm-service').textContent = selectedService.name;
            document.getElementById('confirm-date').textContent = formatDate(selectedDate);
            document.getElementById('confirm-time').textContent = formatTime(selectedTime);
            
            showStep('success');
        } else {
            alert(result.error || 'Failed to create booking. Please try again.');
        }
    } catch (error) {
        console.error('Error creating booking:', error);
        alert('Failed to create booking. Please try again.');
    }
}