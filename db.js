// ════════════════════════════════════════
//  FuelTrack Pro — LocalDB (localStorage wrapper)
//  Барлық деректер осы арқылы сақталады
// ════════════════════════════════════════

const DB = {

    // ─── USERS ───────────────────────────────
    getUsers() {
        return JSON.parse(localStorage.getItem("ft_users") || "[]");
    },
    saveUsers(users) {
        localStorage.setItem("ft_users", JSON.stringify(users));
    },
    findUser(login) {
        return this.getUsers().find(u => u.login === login || u.email === login);
    },
    findUserByEmail(email) {
        return this.getUsers().find(u => u.email === email);
    },
    registerUser(login, email, password) {
        const users = this.getUsers();
        if (users.find(u => u.login === login)) return { ok: false, msg: "Бұл логин бос емес" };
        if (users.find(u => u.email === email)) return { ok: false, msg: "Бұл email тіркелген" };
        const user = {
            id: Date.now().toString(),
            login,
            email,
            password,
            createdAt: new Date().toISOString(),
            resetCode: null
        };
        users.push(user);
        this.saveUsers(users);
        return { ok: true, user };
    },
    updatePassword(email, newPassword) {
        const users = this.getUsers();
        const idx = users.findIndex(u => u.email === email);
        if (idx === -1) return false;
        users[idx].password = newPassword;
        users[idx].resetCode = null;
        this.saveUsers(users);
        return true;
    },
    setResetCode(email, code) {
        const users = this.getUsers();
        const idx = users.findIndex(u => u.email === email);
        if (idx === -1) return false;
        users[idx].resetCode = { code, expires: Date.now() + 5 * 60 * 1000 };
        this.saveUsers(users);
        return true;
    },
    verifyResetCode(email, code) {
        const user = this.findUserByEmail(email);
        if (!user || !user.resetCode) return false;
        if (Date.now() > user.resetCode.expires) return false;
        return user.resetCode.code === code;
    },

    // ─── SESSION ──────────────────────────────
    setSession(userId) {
        localStorage.setItem("ft_session", JSON.stringify({ userId, time: Date.now() }));
    },
    getSession() {
        const s = localStorage.getItem("ft_session");
        return s ? JSON.parse(s) : null;
    },
    clearSession() {
        localStorage.removeItem("ft_session");
    },
    getCurrentUser() {
        const s = this.getSession();
        if (!s) return null;
        return this.getUsers().find(u => u.id === s.userId) || null;
    },

    // ─── FUEL RECORDS ─────────────────────────
    getRecords(userId) {
        const all = JSON.parse(localStorage.getItem("ft_records") || "{}");
        return all[userId] || [];
    },
    addRecord(userId, record) {
        const all = JSON.parse(localStorage.getItem("ft_records") || "{}");
        if (!all[userId]) all[userId] = [];
        all[userId].unshift({ ...record, id: Date.now().toString(), date: new Date().toLocaleString("kk-KZ") });
        localStorage.setItem("ft_records", JSON.stringify(all));
    },
    deleteRecord(userId, recordId) {
        const all = JSON.parse(localStorage.getItem("ft_records") || "{}");
        if (!all[userId]) return;
        all[userId] = all[userId].filter(r => r.id !== recordId);
        localStorage.setItem("ft_records", JSON.stringify(all));
    },
    getStats(userId) {
        const records = this.getRecords(userId);
        if (!records.length) return { count: 0, totalFuel: 0, totalDist: 0, avgConsumption: 0, lastResult: null };
        const totalFuel = records.reduce((s, r) => s + Number(r.fuel), 0);
        const totalDist = records.reduce((s, r) => s + Number(r.distance), 0);
        const avgConsumption = totalDist > 0 ? (totalFuel / totalDist) * 100 : 0;
        return {
            count: records.length,
            totalFuel: totalFuel.toFixed(1),
            totalDist: totalDist.toFixed(0),
            avgConsumption: avgConsumption.toFixed(2),
            lastResult: records[0] ? ((records[0].fuel / records[0].distance) * 100).toFixed(2) : null
        };
    },

    // ─── SEED default user ────────────────────
    seed() {
        if (!this.findUser("061126551294")) {
            this.registerUser("061126551294", "admin@fueltrack.kz", "Aa_121212");
        }
    }
};

DB.seed();
