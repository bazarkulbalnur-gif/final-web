const TRIPS_KEY = 'wanderlens:trips';

class Trip {
    constructor(data) {
        this.id = data.id || 'trip-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
        this.fullName = String(data.fullName).trim();
        this.email = String(data.email).trim();
        this.startDate = data.startDate;
        this.durationId = String(data.durationId);
        this.travelers = Number(data.travelers);
        this.activityIds = Array.from(data.activityIds);
        this.notes = data.notes ? String(data.notes).trim() : '';
        this.createdAt = data.createdAt || new Date().toISOString();
    }

    get duration() {
        return durations.find((d) => d.id === this.durationId);
    }

    getExtrasPerPerson() {
        return this.activityIds.reduce((sum, id) => {
            const activity = activities.find((a) => a.id === id);
            return sum + (activity ? activity.extra : 0);
        }, 0);
    }

    getTotal() {
        return calculateTotal(this.duration.price, this.travelers, this.getExtrasPerPerson());
    }

    getEndDate() {
        const end = new Date(this.startDate + 'T00:00:00');
        end.setDate(end.getDate() + this.duration.days - 1);
        return end.toISOString().split('T')[0];
    }

    getActivityLabels() {
        return this.activityIds.map((id) => activities.find((a) => a.id === id)).filter(Boolean).map((a) => a.label);
    }

    getItinerary() {
        return buildItinerary(this.duration.days, this.getActivityLabels());
    }

    update(changes) {
        Object.assign(this, new Trip(Object.assign({}, this.toJSON(), changes)).toJSON());
        return this;
    }

    toJSON() {
        return {
            id: this.id,
            fullName: this.fullName,
            email: this.email,
            startDate: this.startDate,
            durationId: this.durationId,
            travelers: this.travelers,
            activityIds: this.activityIds,
            notes: this.notes,
            createdAt: this.createdAt
        };
    }

    static isValid(raw) {
        if (!raw || typeof raw !== 'object') { return false; }
        if (typeof raw.fullName !== 'string' || typeof raw.email !== 'string') { return false; }
        if (typeof raw.startDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(raw.startDate)) { return false; }
        if (!durations.some((d) => d.id === String(raw.durationId))) { return false; }
        const travelers = Number(raw.travelers);
        if (!Number.isInteger(travelers) || travelers < 1 || travelers > 10) { return false; }
        if (!Array.isArray(raw.activityIds) || raw.activityIds.length === 0) { return false; }
        return raw.activityIds.every((id) => activities.some((a) => a.id === id));
    }

    static fromObject(raw) {
        return Trip.isValid(raw) ? new Trip(raw) : null;
    }
}

class TripStorage {
    constructor(key) {
        this.key = key;
    }

    load() {
        const stored = readStorage(this.key, []);
        if (!Array.isArray(stored)) { return []; }
        return stored.map((raw) => Trip.fromObject(raw)).filter(Boolean);
    }

    save(trips) {
        writeStorage(this.key, trips.map((trip) => trip.toJSON()));
    }

    add(trip) {
        const trips = this.load();
        trips.push(trip);
        this.save(trips);
        return trip;
    }

    update(id, changes) {
        const trips = this.load();
        const trip = trips.find((t) => t.id === id);
        if (!trip) { return null; }
        trip.update(changes);
        this.save(trips);
        return trip;
    }

    remove(id) {
        const trips = this.load();
        const left = trips.filter((t) => t.id !== id);
        this.save(left);
        return left.length !== trips.length;
    }

    clear() {
        this.save([]);
    }
}

const tripStorage = new TripStorage(TRIPS_KEY);
