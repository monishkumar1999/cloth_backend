const http = require('http');

const PORT = 5000;
const ADMIN_KEY = 'admin-secret-key';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: reqHeaders
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }
        resolve({ status: res.statusCode, data: json });
      });
    });

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('=== RUNNING ANNOUNCEMENT API INTEGRATION TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  try {
    // 1. Admin Unauthorized Test (Missing auth)
    const unauthRes = await request('GET', '/api/admin/announcements');
    assert(unauthRes.status === 401, '1. Admin endpoint rejects request without credentials (401)');

    // 2. Validation: Empty message
    const emptyMsgRes = await request(
      'POST',
      '/api/admin/announcements',
      { message: '   ' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(emptyMsgRes.status === 400, '2. Reject announcement with empty message (400)');

    // 3. Validation: Invalid hex color
    const invalidColorRes = await request(
      'POST',
      '/api/admin/announcements',
      { message: 'Sale!', background_color: 'invalid-color' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(invalidColorRes.status === 400, '3. Reject invalid hexadecimal color (400)');

    // 4. Validation: Invalid URL
    const invalidUrlRes = await request(
      'POST',
      '/api/admin/announcements',
      { message: 'Sale!', link_url: 'not-a-url' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(invalidUrlRes.status === 400, '4. Reject invalid link_url (400)');

    // 5. Validation: ends_at <= starts_at
    const invalidDatesRes = await request(
      'POST',
      '/api/admin/announcements',
      {
        message: 'Sale!',
        starts_at: '2026-10-15T10:00:00Z',
        ends_at: '2026-10-14T10:00:00Z'
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(invalidDatesRes.status === 400, '5. Reject when ends_at is before starts_at (400)');

    // 6. Admin Create Active Announcement (Priority 10)
    const createRes1 = await request(
      'POST',
      '/api/admin/announcements',
      {
        message: '🔥 Huge Summer Sale - Up to 50% Off!',
        link_text: 'Shop Now',
        link_url: 'https://example.com/summer-sale',
        background_color: '#FF5733',
        text_color: '#FFFFFF',
        priority: 10,
        is_active: true
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(createRes1.status === 201 && createRes1.data.data.announcement.id, '6. Create active announcement 1 (201)');
    const id1 = createRes1.data.data.announcement.id;

    // 7. Admin Create Future Announcement (Starts tomorrow)
    const tomorrow = new Date(Date.now() + 86400000).toISOString();
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
    const createRes2 = await request(
      'POST',
      '/api/admin/announcements',
      {
        message: '🚀 Upcoming Black Friday Preview',
        priority: 20,
        starts_at: tomorrow,
        ends_at: nextWeek,
        is_active: true
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(createRes2.status === 201, '7. Create future scheduled announcement (201)');
    const id2 = createRes2.data.data.announcement.id;

    // 8. Admin Create Expired Announcement (Ended yesterday)
    const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const createRes3 = await request(
      'POST',
      '/api/admin/announcements',
      {
        message: '⏰ Yesterday Deal (Expired)',
        priority: 5,
        starts_at: lastWeek,
        ends_at: yesterday,
        is_active: true
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(createRes3.status === 201, '8. Create expired scheduled announcement (201)');
    const id3 = createRes3.data.data.announcement.id;

    // 9. Admin Create Inactive Announcement
    const createRes4 = await request(
      'POST',
      '/api/admin/announcements',
      {
        message: 'Draft Announcement (Disabled)',
        priority: 15,
        is_active: false
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(createRes4.status === 201, '9. Create disabled announcement (201)');
    const id4 = createRes4.data.data.announcement.id;

    // 10. Public Endpoint: Should ONLY return active and currently valid announcement (id1)
    const publicRes = await request('GET', '/api/announcements');
    assert(
      publicRes.status === 200 &&
      publicRes.data.data.announcements.some(a => a.id == id1) &&
      !publicRes.data.data.announcements.some(a => a.id == id2) &&
      !publicRes.data.data.announcements.some(a => a.id == id3) &&
      !publicRes.data.data.announcements.some(a => a.id == id4),
      '10. Public endpoint returns only currently active, non-expired announcements'
    );

    // 11. Admin List Endpoint (with pagination)
    const listRes = await request('GET', '/api/admin/announcements?page=1&limit=10', null, {
      'x-admin-key': ADMIN_KEY
    });
    assert(
      listRes.status === 200 &&
      listRes.data.data.total >= 4 &&
      listRes.data.data.page === 1,
      '11. Admin list returns paginated announcements'
    );

    // 12. Admin Get by ID
    const getByIdRes = await request('GET', `/api/admin/announcements/${id1}`, null, {
      'x-admin-key': ADMIN_KEY
    });
    assert(
      getByIdRes.status === 200 && getByIdRes.data.data.announcement.id == id1,
      '12. Admin get announcement by ID (200)'
    );

    // 13. Admin Update Announcement (PATCH)
    const updateRes = await request(
      'PATCH',
      `/api/admin/announcements/${id1}`,
      { message: '🔥 Updated Summer Sale - Now 60% Off!', priority: 99 },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      updateRes.status === 200 &&
      updateRes.data.data.announcement.priority === 99,
      '13. Admin update announcement (200)'
    );

    // 14. Admin Disable Status
    const disableRes = await request(
      'PATCH',
      `/api/admin/announcements/${id1}/status`,
      { is_active: false },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      disableRes.status === 200 && disableRes.data.data.announcement.is_active === false,
      '14. Admin disable announcement status (200)'
    );

    // 15. Verify disabled announcement is no longer returned in Public API
    const publicAfterDisable = await request('GET', '/api/announcements');
    assert(
      !publicAfterDisable.data.data.announcements.some(a => a.id == id1),
      '15. Disabled announcement removed from public endpoint'
    );

    // 16. Admin Re-enable Status
    const enableRes = await request(
      'PATCH',
      `/api/admin/announcements/${id1}/status`,
      { is_active: true },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      enableRes.status === 200 && enableRes.data.data.announcement.is_active === true,
      '16. Admin re-enable announcement status (200)'
    );

    // 17. Admin Delete Announcement
    const deleteRes = await request('DELETE', `/api/admin/announcements/${id1}`, null, {
      'x-admin-key': ADMIN_KEY
    });
    assert(deleteRes.status === 200, '17. Admin delete announcement (200)');

    // 18. Missing record (404) after delete
    const getDeletedRes = await request('GET', `/api/admin/announcements/${id1}`, null, {
      'x-admin-key': ADMIN_KEY
    });
    assert(getDeletedRes.status === 404, '18. Get non-existent announcement returns 404');

    // Clean up temporary test items
    await request('DELETE', `/api/admin/announcements/${id2}`, null, { 'x-admin-key': ADMIN_KEY });
    await request('DELETE', `/api/admin/announcements/${id3}`, null, { 'x-admin-key': ADMIN_KEY });
    await request('DELETE', `/api/admin/announcements/${id4}`, null, { 'x-admin-key': ADMIN_KEY });

    console.log(`\nTests Completed: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
}

runTests();
