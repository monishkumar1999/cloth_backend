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
      reqHeaders['Content-Length'] = Buffer.byteLength(payload, 'utf8');
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
  console.log('=== RUNNING HEADER NAVIGATION API INTEGRATION TESTS ===\n');
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
    // 1. Unauthorized admin access check
    const unauthRes = await request('GET', '/api/admin/navigation-items');
    assert(unauthRes.status === 401, '1. Admin endpoint rejects unauthenticated request (401)');

    // 2. Fetch public header items
    const publicHeaderRes = await request('GET', '/api/navigation/header');
    assert(
      publicHeaderRes.status === 200 &&
      publicHeaderRes.data.success === true &&
      Array.isArray(publicHeaderRes.data.data),
      '2. Public endpoint returns active navigation items array (200)'
    );

    // Verify ordering in public endpoint
    const items = publicHeaderRes.data.data;
    const isSorted = items.every((item, i) => i === 0 || item.display_order >= items[i - 1].display_order);
    assert(isSorted, '3. Public items are sorted by display_order ascending');

    // Verify public items do NOT expose sensitive administrative or audit columns
    const hasAdminFields = items.some(item => 'created_at' in item || 'updated_at' in item || 'is_active' in item);
    assert(!hasAdminFields, '4. Public items only expose customer-facing fields');

    // 5. Validation: Reject empty label
    const emptyLabelRes = await request(
      'POST',
      '/api/admin/navigation-items',
      { label: '   ', href: '/test' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(emptyLabelRes.status === 400, '5. Reject empty label (400)');

    // 6. Validation: Reject dangerous scheme (javascript:)
    const xssRes = await request(
      'POST',
      '/api/admin/navigation-items',
      { label: 'Attack', href: 'javascript:alert(1)' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(xssRes.status === 400, '6. Reject dangerous javascript: scheme in href (400)');

    // 7. Validation: Reject data: URI scheme
    const dataSchemeRes = await request(
      'POST',
      '/api/admin/navigation-items',
      { label: 'Data', href: 'data:text/html,<script>alert(1)</script>' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(dataSchemeRes.status === 400, '7. Reject dangerous data: URI scheme in href (400)');

    // 8. Validation: Reject invalid display_order (non-integer)
    const invalidOrderRes = await request(
      'POST',
      '/api/admin/navigation-items',
      { label: 'Test', href: '/test', display_order: 'abc' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(invalidOrderRes.status === 400, '8. Reject non-integer display_order (400)');

    // 9. Admin Create new item: "Lookbook" at order 8
    const createRes = await request(
      'POST',
      '/api/admin/navigation-items',
      {
        label: 'Lookbook',
        href: '/lookbook',
        display_order: 8,
        open_in_new_tab: false
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      createRes.status === 201 &&
      createRes.data.success === true &&
      createRes.data.data.id,
      '9. Admin creates navigation item successfully (201)'
    );
    const createdId = createRes.data.data.id;

    // 10. Admin Get Item by ID
    const getByIdRes = await request('GET', `/api/admin/navigation-items/${createdId}`, null, {
      'x-admin-key': ADMIN_KEY
    });
    assert(
      getByIdRes.status === 200 &&
      getByIdRes.data.data.label === 'Lookbook',
      '10. Admin fetches single item by ID (200)'
    );

    // 11. Admin Rename Item and Change Destination
    const updateRes = await request(
      'PATCH',
      `/api/admin/navigation-items/${createdId}`,
      {
        label: 'Winter Lookbook',
        href: '/lookbook/winter-2026'
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      updateRes.status === 200 &&
      updateRes.data.data.label === 'Winter Lookbook' &&
      updateRes.data.data.href === '/lookbook/winter-2026',
      '11. Admin updates item label and destination (200)'
    );

    // 12. Reordering menu: Change display_order to 0 so it becomes first
    const reorderRes = await request(
      'PATCH',
      `/api/admin/navigation-items/${createdId}`,
      { display_order: 0 },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      reorderRes.status === 200 &&
      reorderRes.data.data.display_order === 0,
      '12. Admin reorders item (display_order: 0)'
    );

    // Verify it is now first in public header
    const publicAfterReorder = await request('GET', '/api/navigation/header');
    assert(
      publicAfterReorder.data.data[0].id == createdId &&
      publicAfterReorder.data.data[0].label === 'Winter Lookbook',
      '13. Public header immediately reflects reordered items'
    );

    // 14. Admin Disable status
    const disableRes = await request(
      'PATCH',
      `/api/admin/navigation-items/${createdId}/status`,
      { is_active: false },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      disableRes.status === 200 &&
      disableRes.data.data.is_active === false,
      '14. Admin disables navigation item (200)'
    );

    // 15. Verify disabled item is absent in public header but present in admin list
    const publicAfterDisable = await request('GET', '/api/navigation/header');
    const adminListRes = await request('GET', '/api/admin/navigation-items', null, {
      'x-admin-key': ADMIN_KEY
    });
    assert(
      !publicAfterDisable.data.data.some(item => item.id == createdId) &&
      adminListRes.data.data.some(item => item.id == createdId && item.is_active === false),
      '15. Disabled item is excluded from public header but retained in admin listing'
    );

    // 16. Admin Delete item
    const deleteRes = await request('DELETE', `/api/admin/navigation-items/${createdId}`, null, {
      'x-admin-key': ADMIN_KEY
    });
    assert(deleteRes.status === 200 && deleteRes.data.success === true, '16. Admin deletes item (200)');

    // 17. Non-existent ID returns 404
    const getNotFound = await request('GET', `/api/admin/navigation-items/${createdId}`, null, {
      'x-admin-key': ADMIN_KEY
    });
    assert(getNotFound.status === 404, '17. Fetching non-existent item returns 404');

    // 18. Invalid parameter ID returns 400
    const invalidIdRes = await request('GET', '/api/admin/navigation-items/invalid-id', null, {
      'x-admin-key': ADMIN_KEY
    });
    assert(invalidIdRes.status === 400, '18. Malformed item ID returns 400');

    console.log(`\nTests Completed: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Integration test failed with error:', err);
    process.exit(1);
  }
}

runTests();
