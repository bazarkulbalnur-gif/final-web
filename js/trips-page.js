function formatMoney(value) { return '$' + value.toLocaleString('en-US'); }

function sortTrips(trips, mode) {
    const list = trips.slice();
    if (mode === 'cost-desc') { return list.sort((a, b) => b.getTotal() - a.getTotal()); }
    if (mode === 'start-asc') { return list.sort((a, b) => a.startDate.localeCompare(b.startDate)); }
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function computeStats(trips) {
    const totalCost = trips.reduce((sum, t) => sum + t.getTotal(), 0);
    const travelers = trips.reduce((sum, t) => sum + t.travelers, 0);
    const days = trips.reduce((sum, t) => sum + t.duration.days, 0);
    const counts = {};
    trips.forEach(function (t) {
        t.getActivityLabels().forEach(function (label) { counts[label] = (counts[label] || 0) + 1; });
    });
    const top = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || '—';
    return {
        count: trips.length,
        totalCost: totalCost,
        travelers: travelers,
        days: days,
        average: trips.length ? Math.round(totalCost / trips.length) : 0,
        topActivity: top
    };
}

function createStatCard(value, label) {
    const col = document.createElement('div');
    col.className = 'col-6 col-lg-3';
    const card = document.createElement('div');
    card.className = 'wl-card wl-card-sm text-center h-100';
    const number = document.createElement('div');
    number.className = 'dash-number';
    number.textContent = value;
    const text = document.createElement('div');
    text.className = 'stat-label';
    text.textContent = label;
    card.appendChild(number);
    card.appendChild(text);
    col.appendChild(card);
    return col;
}

function renderDashboard(trips) {
    const stats = computeStats(trips);
    const row = document.getElementById('stats-row');
    row.innerHTML = '';
    row.appendChild(createStatCard(stats.count, 'Saved trips'));
    row.appendChild(createStatCard(formatMoney(stats.totalCost), 'Total cost'));
    row.appendChild(createStatCard(formatMoney(stats.average), 'Average per trip'));
    row.appendChild(createStatCard(stats.days, 'Days planned'));

    const chart = document.getElementById('cost-chart');
    chart.innerHTML = '';
    const max = trips.reduce((m, t) => Math.max(m, t.getTotal()), 0);
    sortTrips(trips, 'start-asc').forEach(function (trip) {
        const line = document.createElement('div');
        line.className = 'bar-row';
        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = trip.fullName + ' · ' + trip.startDate;
        const track = document.createElement('div');
        track.className = 'bar-track';
        const bar = document.createElement('div');
        bar.className = 'bar-fill';
        bar.style.width = Math.max(4, Math.round((trip.getTotal() / max) * 100)) + '%';
        bar.setAttribute('role', 'img');
        bar.setAttribute('aria-label', trip.fullName + ' ' + formatMoney(trip.getTotal()));
        const value = document.createElement('span');
        value.className = 'bar-value';
        value.textContent = formatMoney(trip.getTotal());
        track.appendChild(bar);
        line.appendChild(label);
        line.appendChild(track);
        line.appendChild(value);
        chart.appendChild(line);
    });
    document.getElementById('top-activity').textContent = stats.topActivity;
    document.getElementById('travelers-total').textContent = stats.travelers;
}

function createTripCard(trip) {
    const col = document.createElement('div');
    col.className = 'col-12 col-md-6 col-lg-4';
    const card = document.createElement('div');
    card.className = 'wl-card wl-card-sm h-100 d-flex flex-column';

    const tag = document.createElement('span');
    tag.className = 'tag-soft align-self-start';
    tag.textContent = trip.duration.label;
    const title = document.createElement('h3');
    title.className = 'h5 mt-2 mb-1';
    title.textContent = trip.fullName;
    const dates = document.createElement('p');
    dates.className = 'card-text-sm mb-1';
    dates.textContent = trip.startDate + ' → ' + trip.getEndDate();
    const info = document.createElement('p');
    info.className = 'card-text-sm mb-1';
    info.textContent = trip.travelers + ' traveler(s) · ' + trip.getActivityLabels().join(', ');
    const mail = document.createElement('p');
    mail.className = 'card-text-sm mb-2';
    mail.textContent = trip.email;
    const total = document.createElement('div');
    total.className = 'price mb-2';
    total.textContent = formatMoney(trip.getTotal());
    const body = document.createElement('div');
    body.className = 'flex-grow-1';
    body.appendChild(tag);
    body.appendChild(title);
    body.appendChild(dates);
    body.appendChild(info);
    body.appendChild(mail);
    if (trip.notes) {
        const note = document.createElement('p');
        note.className = 'card-text-sm fst-italic';
        note.textContent = trip.notes;
        body.appendChild(note);
    }
    body.appendChild(total);

    const actions = document.createElement('div');
    actions.className = 'd-flex gap-2';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'btn btn-sm btn-outline-secondary flex-fill';
    edit.dataset.action = 'edit';
    edit.dataset.id = trip.id;
    edit.innerHTML = '<i class="fa-solid fa-pen me-1"></i>Edit';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn btn-sm btn-outline-danger flex-fill';
    remove.dataset.action = 'delete';
    remove.dataset.id = trip.id;
    remove.innerHTML = '<i class="fa-solid fa-trash me-1"></i>Delete';
    actions.appendChild(edit);
    actions.appendChild(remove);

    card.appendChild(body);
    card.appendChild(actions);
    col.appendChild(card);
    return col;
}

function initTripsPage() {
    const grid = document.getElementById('trips-grid');
    const empty = document.getElementById('trips-empty');
    const dashboard = document.getElementById('dashboard');
    const toolbar = document.getElementById('trips-toolbar');
    const sortSelect = document.getElementById('trip-sort');
    const formModalEl = document.getElementById('tripModal');
    const deleteModalEl = document.getElementById('deleteModal');
    const clearModalEl = document.getElementById('clearModal');
    const formModal = new bootstrap.Modal(formModalEl);
    const deleteModal = new bootstrap.Modal(deleteModalEl);
    const clearModal = new bootstrap.Modal(clearModalEl);
    const form = document.getElementById('trip-form');
    const durationSelect = document.getElementById('tf-duration');
    const activityBox = document.getElementById('tf-activities');
    let editingId = null;
    let deletingId = null;

    durations.forEach(function (d) {
        const option = document.createElement('option');
        option.value = d.id;
        option.textContent = d.label;
        durationSelect.appendChild(option);
    });
    activities.forEach(function (a) {
        const wrap = document.createElement('div');
        wrap.className = 'col-6';
        wrap.innerHTML = '<div class="form-check"><input class="form-check-input tf-activity" type="checkbox" id="tf-act-' + a.id + '" value="' + a.id + '">' +
            '<label class="form-check-label small" for="tf-act-' + a.id + '">' + a.label + '</label></div>';
        activityBox.appendChild(wrap);
    });

    const rules = {
        'tf-fullName': function () { return checkRequired(val('tf-fullName'), 'Full name') || checkMinLength(val('tf-fullName'), 'Full name', 3); },
        'tf-email': function () { return checkRequired(val('tf-email'), 'Email') || checkEmail(val('tf-email')); },
        'tf-startDate': function () { return editingId ? checkRequired(val('tf-startDate'), 'Start date') : checkFutureDate(val('tf-startDate')); },
        'tf-duration': function () { return val('tf-duration') === '' ? 'Please choose a duration.' : ''; },
        'tf-travelers': function () { return checkRange(val('tf-travelers'), 'Travelers count', 1, 10); },
        'tf-activities': function () { return form.querySelectorAll('.tf-activity:checked').length === 0 ? 'Select at least one activity.' : ''; },
        'tf-notes': function () { return val('tf-notes').length > 200 ? 'Notes can contain at most 200 characters.' : ''; }
    };
    Object.keys(rules).forEach(function (id) {
        if (id === 'tf-activities') { return; }
        const sub = {}; sub[id] = rules[id]; attachLiveValidation(sub);
    });
    activityBox.addEventListener('change', function () { setError('tf-activities', rules['tf-activities']()); });

    function clearErrors() {
        Object.keys(rules).forEach(function (id) {
            const field = document.getElementById(id);
            field.classList.remove('is-invalid', 'is-valid');
            field.removeAttribute('aria-invalid');
            const box = document.getElementById(id + '-error');
            box.textContent = '';
            box.classList.remove('d-block');
        });
    }

    function fillForm(trip) {
        document.getElementById('tripModalTitle').textContent = trip ? 'Edit trip' : 'New trip';
        document.getElementById('trip-submit').textContent = trip ? 'Save changes' : 'Create trip';
        document.getElementById('tf-fullName').value = trip ? trip.fullName : '';
        document.getElementById('tf-email').value = trip ? trip.email : '';
        document.getElementById('tf-startDate').value = trip ? trip.startDate : '';
        document.getElementById('tf-startDate').min = trip ? '' : new Date().toISOString().split('T')[0];
        durationSelect.value = trip ? trip.durationId : '';
        document.getElementById('tf-travelers').value = trip ? trip.travelers : 2;
        document.getElementById('tf-notes').value = trip ? trip.notes : '';
        form.querySelectorAll('.tf-activity').forEach(function (box) {
            box.checked = trip ? trip.activityIds.includes(box.value) : false;
        });
        clearErrors();
    }

    function render() {
        const trips = tripStorage.load();
        const has = trips.length > 0;
        empty.classList.toggle('d-none', has);
        dashboard.classList.toggle('d-none', !has);
        toolbar.classList.toggle('d-none', !has);
        grid.innerHTML = '';
        sortTrips(trips, sortSelect.value).forEach(function (trip) { grid.appendChild(createTripCard(trip)); });
        if (has) { renderDashboard(trips); }
    }

    function openCreate() {
        editingId = null;
        fillForm(null);
        formModal.show();
    }

    document.querySelectorAll('.open-create').forEach(function (btn) { btn.addEventListener('click', openCreate); });
    sortSelect.addEventListener('change', render);

    grid.addEventListener('click', function (event) {
        const btn = event.target.closest('[data-action]');
        if (!btn) { return; }
        const trip = tripStorage.load().find((t) => t.id === btn.dataset.id);
        if (!trip) { render(); return; }
        if (btn.dataset.action === 'edit') {
            editingId = trip.id;
            fillForm(trip);
            formModal.show();
        } else {
            deletingId = trip.id;
            document.getElementById('delete-name').textContent = trip.fullName;
            deleteModal.show();
        }
    });

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (!validateForm(rules)) { return; }
        const data = {
            fullName: val('tf-fullName'),
            email: val('tf-email'),
            startDate: val('tf-startDate'),
            durationId: val('tf-duration'),
            travelers: val('tf-travelers'),
            activityIds: Array.from(form.querySelectorAll('.tf-activity:checked')).map((box) => box.value),
            notes: val('tf-notes')
        };
        if (editingId) {
            tripStorage.update(editingId, data);
            showToast('Trip updated', 'success');
        } else {
            tripStorage.add(new Trip(data));
            showToast('Trip created', 'success');
        }
        formModal.hide();
        render();
    });

    document.getElementById('delete-confirm').addEventListener('click', function () {
        if (deletingId) { tripStorage.remove(deletingId); showToast('Trip deleted', 'secondary'); }
        deletingId = null;
        deleteModal.hide();
        render();
    });

    document.getElementById('clear-confirm').addEventListener('click', function () {
        tripStorage.clear();
        clearModal.hide();
        showToast('All trips removed', 'secondary');
        render();
    });

    render();
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('trips-grid')) { initTripsPage(); }
});
