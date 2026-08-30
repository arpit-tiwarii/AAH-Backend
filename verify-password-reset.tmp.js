/* Throwaway verification harness: exercises the real password-reset service and
 * the authMiddleware session check against stubbed repositories, so no data is
 * written to the live Atlas cluster. Not part of the app. */
require('dotenv').config({ quiet: true });
const path = require('path');
const Module = require('module');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SRC = path.join(__dirname, 'src');
let pass = 0, fail = 0;
const ok = (cond, label, extra = '') => {
    if (cond) { pass++; console.log('  PASS', label); }
    else { fail++; console.log('  FAIL', label, extra); }
};

function stub(rel, exports) {
    const full = require.resolve(path.join(SRC, rel));
    const m = new Module(full, null);
    m.filename = full; m.loaded = true; m.exports = exports;
    require.cache[full] = m;
}

// ---- stub state -------------------------------------------------------------
const calls = { created: [], queued: [], updates: [], increments: [], softDeletes: [], lookups: [] };
let userRow = null;
let otpRow = null;
let updateReturnsNull = false;
let queueThrows = false;

const makeOtpRow = (over = {}) => ({
    id: '507f1f77bcf86cd799439011',
    otp: '123456',
    attempts: 0,
    purpose: 'PASSWORD_RESET',
    softDelete: async function () { calls.softDeletes.push(this.id); },
    ...over,
});

stub('repositories/User.repository', {
    findUserByEmail: async (email) => (userRow && userRow.email === email ? userRow : null),
    updateUserById: async (id, updates) => {
        calls.updates.push({ id, updates });
        return updateReturnsNull ? null : { ...userRow, ...updates };
    },
    findUserById: async () => userRow,
});

stub('repositories/Otp.repository', {
    createOtpRepository: async (otp, uid, options, purpose) => {
        calls.created.push({ otp, uid, purpose });
        return makeOtpRow({ otp, purpose });
    },
    findActiveOtpByUser: async (uid, purpose) => {
        calls.lookups.push({ uid, purpose });
        return otpRow;
    },
    incrementOtpAttempts: async (id) => { calls.increments.push(id); return null; },
    OTP_TTL_SECONDS: 600,
});

stub('queues/email.queue', {
    emailQueue: {
        add: async (name, data, opts) => {
            if (queueThrows) throw new Error('redis down');
            calls.queued.push({ name, data, opts });
        },
    },
});

const { requestPasswordResetService, resetPasswordService } = require('./src/services/password.service');
const { protect } = require('./src/middleware/authMiddleware');

const reset = () => {
    calls.created.length = 0; calls.queued.length = 0; calls.updates.length = 0;
    calls.increments.length = 0; calls.softDeletes.length = 0; calls.lookups.length = 0;
    updateReturnsNull = false; queueThrows = false;
};

const CURRENT_HASH = bcrypt.hashSync('oldpass123', 10);
const KNOWN = { id: '507f1f77bcf86cd799439022', email: 'athlete@example.com', name: 'Asha', password: CURRENT_HASH };

const grab = async (fn) => { try { return { value: await fn() }; } catch (e) { return { err: e }; } };

(async () => {
    // ================= requestPasswordResetService =================
    console.log('\n== forgot-password: enumeration safety ==');
    reset(); userRow = null;
    const unknown = await grab(() => requestPasswordResetService({ email: 'nobody@example.com' }));
    ok(!unknown.err, 'unknown email does not error');
    ok(calls.created.length === 0, 'unknown email creates no OTP');
    ok(calls.queued.length === 0, 'unknown email sends no mail');

    reset(); userRow = KNOWN;
    const known = await grab(() => requestPasswordResetService({ email: KNOWN.email }));
    ok(!known.err, 'known email does not error');
    ok(known.value.message === unknown.value.message,
        'response message is byte-identical for known vs unknown email',
        `\n     known:   ${JSON.stringify(known.value?.message)}\n     unknown: ${JSON.stringify(unknown.value?.message)}`);
    ok(calls.created.length === 1 && calls.created[0].purpose === 'PASSWORD_RESET',
        'OTP created with purpose PASSWORD_RESET', JSON.stringify(calls.created));
    ok(calls.queued.length === 1 && calls.queued[0].name === 'password-reset-otp-email',
        'queues the password-reset-otp-email job', JSON.stringify(calls.queued.map(q => q.name)));
    ok(!JSON.stringify(known.value).match(/\d{6}/), 'OTP is not leaked in the response body', JSON.stringify(known.value));
    ok(calls.queued[0].data.email === KNOWN.email, 'recipient is resolved from the DB row, not the request');

    reset(); userRow = KNOWN;
    const uppercased = await grab(() => requestPasswordResetService({ email: '  ATHLETE@Example.com ' }));
    ok(calls.created.length === 1, 'email is trimmed + lowercased before lookup', uppercased.err?.message || '');

    // ================= resetPasswordService =================
    console.log('\n== reset-password: weak password ==');
    reset(); userRow = KNOWN; otpRow = makeOtpRow();
    const weak = await grab(() => resetPasswordService({ email: KNOWN.email, otp: '123456', password: 'short' }));
    ok(weak.err && /8 characters/.test(weak.err.message), 'weak password rejected', weak.err?.message);
    ok(weak.err?.statusCode === 400, 'weak password is a 400');
    ok(calls.lookups.length === 0, 'weak password does not consume an OTP attempt');

    console.log('\n== reset-password: failure paths are indistinguishable ==');
    reset(); userRow = null; otpRow = null;
    const noUser = await grab(() => resetPasswordService({ email: 'nobody@example.com', otp: '123456', password: 'newpass123' }));
    reset(); userRow = KNOWN; otpRow = null;
    const noOtp = await grab(() => resetPasswordService({ email: KNOWN.email, otp: '123456', password: 'newpass123' }));
    reset(); userRow = KNOWN; otpRow = makeOtpRow({ otp: '999999' });
    const wrongOtp = await grab(() => resetPasswordService({ email: KNOWN.email, otp: '123456', password: 'newpass123' }));
    ok(noUser.err.message === noOtp.err.message && noOtp.err.message === wrongOtp.err.message,
        'unknown-email / no-code / wrong-code all return one message',
        `\n     ${noUser.err.message}\n     ${noOtp.err.message}\n     ${wrongOtp.err.message}`);
    ok(calls.increments.length === 1, 'a wrong code increments the attempt counter');
    ok(calls.updates.length === 0, 'a wrong code does not change the password');

    console.log('\n== reset-password: attempt cap ==');
    reset(); userRow = KNOWN; otpRow = makeOtpRow({ attempts: 5 });
    const capped = await grab(() => resetPasswordService({ email: KNOWN.email, otp: '123456', password: 'newpass123' }));
    ok(capped.err && /Too many/.test(capped.err.message), 'capped after 5 attempts even with the right code', capped.err?.message);
    ok(calls.softDeletes.length === 1, 'the exhausted code is burned');
    ok(calls.updates.length === 0, 'the password is not changed once capped');

    console.log('\n== reset-password: purpose isolation ==');
    reset(); userRow = KNOWN; otpRow = makeOtpRow();
    await grab(() => resetPasswordService({ email: KNOWN.email, otp: '123456', password: 'newpass123' }));
    ok(calls.lookups.length === 1 && calls.lookups[0].purpose === 'PASSWORD_RESET',
        'the OTP lookup is scoped to PASSWORD_RESET', JSON.stringify(calls.lookups));

    console.log('\n== reset-password: reuse of the current password ==');
    reset(); userRow = KNOWN; otpRow = makeOtpRow();
    const reuse = await grab(() => resetPasswordService({ email: KNOWN.email, otp: '123456', password: 'oldpass123' }));
    ok(reuse.err && /different from your current/.test(reuse.err.message), 'reusing the current password is rejected', reuse.err?.message);
    ok(calls.updates.length === 0, 'no write happens on reuse');
    ok(calls.softDeletes.length === 0, 'the code is not burned on reuse, so the user can retry');

    console.log('\n== reset-password: happy path ==');
    reset(); userRow = KNOWN; otpRow = makeOtpRow();
    const good = await grab(() => resetPasswordService({ email: KNOWN.email, otp: '123456', password: 'newpass123' }));
    ok(!good.err, 'succeeds', good.err?.message);
    ok(calls.updates.length === 1, 'exactly one update');
    const written = calls.updates[0]?.updates || {};
    ok(written.password && written.password !== 'newpass123', 'the plaintext password is never stored');
    ok(written.password && bcrypt.compareSync('newpass123', written.password), 'the stored hash verifies against the new password');
    ok(written.passwordChangedAt instanceof Date, 'passwordChangedAt is stamped');
    ok(calls.softDeletes.length === 1, 'the code is consumed after a successful reset');
    ok(calls.queued.some((q) => q.name === 'password-changed-email'), 'a change-confirmation email is queued',
        JSON.stringify(calls.queued.map(q => q.name)));
    ok(!JSON.stringify(good.value).match(/\$2[aby]\$/), 'no hash is leaked in the response');

    console.log('\n== reset-password: numeric otp coercion ==');
    reset(); userRow = KNOWN; otpRow = makeOtpRow({ otp: '000123' });
    const coerced = await grab(() => resetPasswordService({ email: KNOWN.email, otp: 123, password: 'newpass123' }));
    ok(!!coerced.err, 'otp 123 does not satisfy a stored "000123" (no loose coercion)', coerced.err?.message);

    console.log('\n== reset-password: write failure ==');
    reset(); userRow = KNOWN; otpRow = makeOtpRow(); updateReturnsNull = true;
    const failed = await grab(() => resetPasswordService({ email: KNOWN.email, otp: '123456', password: 'newpass123' }));
    ok(!!failed.err, 'a failed write surfaces as an error', 'no error thrown');
    ok(calls.softDeletes.length === 0, 'the code survives a failed write so the user can retry');

    console.log('\n== reset-password: mail outage after a successful write ==');
    reset(); userRow = KNOWN; otpRow = makeOtpRow(); queueThrows = true;
    const mailDown = await grab(() => resetPasswordService({ email: KNOWN.email, otp: '123456', password: 'newpass123' }));
    ok(!mailDown.err, 'the reset still succeeds when the notification cannot be queued', mailDown.err?.message);
    ok(calls.updates.length === 1 && calls.softDeletes.length === 1, 'the password change is still committed and the code consumed');

    // ================= authMiddleware session invalidation =================
    console.log('\n== authMiddleware: passwordChangedAt kills old sessions ==');
    const secret = process.env.JWT_SECRET;
    const run = async (user, iatOffsetSeconds) => {
        userRow = user;
        const nowSec = Math.floor(Date.now() / 1000);
        const token = jwt.sign({ id: user.id, iat: nowSec + iatOffsetSeconds }, secret, { expiresIn: '1h' });
        const req = { headers: { authorization: `Bearer ${token}` } };
        let status = null, body = null, nexted = false;
        const res = { status: (s) => { status = s; return res; }, json: (b) => { body = b; return res; } };
        await protect(req, res, () => { nexted = true; });
        return { status, body, nexted };
    };

    const changedAt = new Date();
    const staleToken = await run({ ...KNOWN, role: 'ATHLETE', status: 'APPROVED', passwordChangedAt: changedAt }, -60);
    ok(staleToken.status === 401, 'a token minted before the reset is rejected', JSON.stringify(staleToken));
    ok(/Password was changed/.test(staleToken.body?.message || ''), 'the rejection explains why', staleToken.body?.message);

    const freshToken = await run({ ...KNOWN, role: 'ATHLETE', status: 'APPROVED', passwordChangedAt: changedAt }, +60);
    ok(freshToken.nexted === true, 'a token minted after the reset is accepted', JSON.stringify(freshToken));

    const legacy = await run({ ...KNOWN, role: 'ATHLETE', status: 'APPROVED', passwordChangedAt: null }, -60);
    ok(legacy.nexted === true, 'accounts that never reset (passwordChangedAt null) are unaffected', JSON.stringify(legacy));

    console.log(`\n===== ${pass} passed, ${fail} failed =====`);
    process.exit(fail ? 1 : 0);
})();
