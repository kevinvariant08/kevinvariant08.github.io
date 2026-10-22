/* Problems written in the Problem editor live in Supabase (table marker_problems, see marker-problems.sql).
   This merges them with the built-in problems in marking/library.js:
     - an editor problem with the same id as a built-in one replaces it;
     - status "hidden" removes a problem from the Proof marker;
     - status "draft" is visible only to admins. */
(function () {
  'use strict';
  function whenAuth(ms) {
    return new Promise(function (res) {
      if (window.HU_AUTH) return res(window.HU_AUTH);
      var done = false;
      function fin() { if (done) return; done = true; res(window.HU_AUTH || null); }
      window.addEventListener('hu-auth-ready', fin, { once: true });
      setTimeout(fin, ms || 8000);
    });
  }
  function client() { var A = window.HU_AUTH; return A && A.configured && A.client ? A.client : null; }
  /* account.js announces itself before the saved session has loaded, so ask Supabase directly */
  function sessionUser() {
    var c = client(); if (!c) return Promise.resolve(null);
    return c.auth.getSession().then(function (r) { return (r && r.data && r.data.session && r.data.session.user) || null; }, function () { return null; });
  }
  function isAdmin() {
    var c = client(); if (!c) return Promise.resolve(false);
    return sessionUser().then(function (u) {
      if (!u) return false;
      return c.rpc('hu_is_admin').then(function (r) { return !r.error && r.data === true; }, function () { return false; });
    });
  }
  function fetchRows() {
    var c = client(); if (!c) return Promise.resolve({ rows: [], error: 'not-configured' });
    return c.from('marker_problems').select('id,status,data,source_md,updated_at').then(function (r) {
      if (r.error) return { rows: [], error: r.error.code === '42P01' || r.error.code === 'PGRST205' || /does not exist|could not find/i.test(r.error.message || '') ? 'no-table' : (r.error.message || 'error') };
      return { rows: r.data || [], error: null };
    }, function (e) { return { rows: [], error: String(e && e.message || e) }; });
  }
  function merge(builtins, rows, admin) {
    var byId = {}, out = [];
    (rows || []).forEach(function (r) { byId[r.id] = r; });
    (builtins || []).forEach(function (p) {
      var r = byId[p.id];
      if (r && r.status === 'hidden') return;
      if (r && r.data && (r.status === 'published' || (r.status === 'draft' && admin))) return; /* replaced below */
      out.push(Object.assign({}, p, { origin: 'site' }));
    });
    (rows || []).forEach(function (r) {
      if (!r.data) return;
      if (r.status === 'published' || (r.status === 'draft' && admin)) out.push(Object.assign({}, r.data, { origin: 'editor', status: r.status, reviewed: r.status === 'published' ? r.data.reviewed !== false : false }));
    });
    return out;
  }
  function save(id, status, data, md) {
    var c = client(); if (!c) return Promise.reject(new Error('Not connected to the database.'));
    return c.from('marker_problems').upsert({ id: id, status: status, data: data, source_md: md || null }).then(function (r) { if (r.error) throw new Error(r.error.message); return true; });
  }
  function remove(id) {
    var c = client(); if (!c) return Promise.reject(new Error('Not connected to the database.'));
    return c.from('marker_problems').delete().eq('id', id).then(function (r) { if (r.error) throw new Error(r.error.message); return true; });
  }
  window.HU_MARKER_DB = { whenAuth: whenAuth, sessionUser: sessionUser, isAdmin: isAdmin, fetchRows: fetchRows, merge: merge, save: save, remove: remove };
})();
