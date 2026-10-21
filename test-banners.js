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
  console.log('=== RUNNING HERO BANNER API INTEGRATION TESTS ===\n');
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
    // 1. Admin Unauthorized check
    const unauthRes = await request('GET', '/api/admin/banners');
    assert(unauthRes.status === 401, '1. Admin endpoint rejects unauthenticated request (401)');

    // 2. Fetch public homepage banners
    const publicBannerRes = await request('GET', '/api/banners/homepage');
    assert(
      publicBannerRes.status === 200 &&
      publicBannerRes.data.success === true &&
      Array.isArray(publicBannerRes.data.data),
      '2. Public endpoint returns active homepage banners (200)'
    );

    // Verify projection does not leak internal/administrative fields
    const banner0 = publicBannerRes.data.data[0];
    const leaksAdminFields = banner0
      ? 'name' in banner0 || 'is_active' in banner0 || 'created_at' in banner0 || 'updated_at' in banner0
      : false;
    assert(!leaksAdminFields, '3. Public banners exclude internal admin & auditing fields');

    // 4. Validation: Reject missing name
    const missingNameRes = await request(
      'POST',
      '/api/admin/banners',
      { title: 'Test', image_url: '/uploads/banners/test.webp' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(missingNameRes.status === 400, '4. Reject banner with missing name (400)');

    // 5. Validation: Reject missing title
    const missingTitleRes = await request(
      'POST',
      '/api/admin/banners',
      { name: 'Banner 1', image_url: '/uploads/banners/test.webp' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(missingTitleRes.status === 400, '5. Reject banner with missing title (400)');

    // 6. Validation: Reject missing image_url
    const missingImageRes = await request(
      'POST',
      '/api/admin/banners',
      { name: 'Banner 1', title: 'Test' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(missingImageRes.status === 400, '6. Reject banner with missing image_url (400)');

    // 7. Validation: Reject dangerous CTA URL scheme (javascript:)
    const dangerousCtaRes = await request(
      'POST',
      '/api/admin/banners',
      {
        name: 'Malicious Banner',
        title: 'Click Here',
        image_url: '/uploads/banners/test.webp',
        cta_url: 'javascript:alert(1)'
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(dangerousCtaRes.status === 400, '7. Reject dangerous javascript: scheme in cta_url (400)');

    // 8. Validation: Reject invalid schedule (ends_at <= starts_at)
    const invalidScheduleRes = await request(
      'POST',
      '/api/admin/banners',
      {
        name: 'Invalid Schedule',
        title: 'Sale',
        image_url: '/uploads/banners/test.webp',
        starts_at: '2026-12-01T00:00:00Z',
        ends_at: '2026-11-01T00:00:00Z'
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(invalidScheduleRes.status === 400, '8. Reject ends_at before starts_at (400)');

    // 9. Admin Create Valid Banner 1 (Active, priority 2)
    const createRes1 = await request(
      'POST',
      '/api/admin/banners',
      {
        name: 'Winter Hoodies Collection',
        eyebrow: 'WINTER DROP',
        title: 'HEAVYWEIGHT HOODIES',
        subtitle: 'PREMIUM 450 GSM FLEECE',
        image_url: '/uploads/banners/hoodies-desktop.webp',
        mobile_image_url: '/uploads/banners/hoodies-mobile.webp',
        image_alt_text: 'Heavyweight hoodies hero',
        cta_text: 'EXPLORE DROP',
        cta_url: '/collections/hoodies',
        display_order: 2,
        is_active: true
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(createRes1.status === 201 && createRes1.data.data.id, '9. Admin creates active banner (201)');
    const bannerId1 = createRes1.data.data.id;

    // 10. Admin Create Future Scheduled Banner (Starts next week)
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString();
    const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString();
    const createRes2 = await request(
      'POST',
      '/api/admin/banners',
      {
        name: 'Upcoming Black Friday Hero',
        title: 'BLACK FRIDAY TEASER',
        image_url: '/uploads/banners/bf-desktop.webp',
        starts_at: nextWeek,
        ends_at: nextMonth,
        display_order: 0,
        is_active: true
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(createRes2.status === 201, '10. Admin creates future scheduled banner (201)');
    const bannerId2 = createRes2.data.data.id;

    // 11. Admin Create Expired Banner (Ended yesterday)
    const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    const createRes3 = await request(
      'POST',
      '/api/admin/banners',
      {
        name: 'Past Flash Sale',
        title: 'FLASH SALE EXPIRED',
        image_url: '/uploads/banners/flash-desktop.webp',
        starts_at: lastWeek,
        ends_at: yesterday,
        display_order: 0,
        is_active: true
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(createRes3.status === 201, '11. Admin creates past expired banner (201)');
    const bannerId3 = createRes3.data.data.id;

    // 12. Admin Create Inactive Banner
    const createRes4 = await request(
      'POST',
      '/api/admin/banners',
      {
        name: 'Draft Concept Banner',
        title: 'DRAFT TITLE',
        image_url: '/uploads/banners/draft.webp',
        is_active: false
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(createRes4.status === 201, '12. Admin creates inactive/draft banner (201)');
    const bannerId4 = createRes4.data.data.id;

    // 13. Public Homepage Check: Should include banner 1, but exclude future (2), expired (3), and inactive (4)
    const publicCarouselRes = await request('GET', '/api/banners/homepage');
    const returnedIds = publicCarouselRes.data.data.map(b => b.id);
    assert(
      returnedIds.includes(bannerId1) &&
      !returnedIds.includes(bannerId2) &&
      !returnedIds.includes(bannerId3) &&
      !returnedIds.includes(bannerId4),
      '13. Public endpoint includes active banners and excludes future, expired, and inactive banners'
    );

    // 14. Admin List Banners (with pagination and search)
    const listRes = await request('GET', '/api/admin/banners?page=1&limit=10&search=Winter', null, {
      'x-admin-key': ADMIN_KEY
    });
    assert(
      listRes.status === 200 &&
      listRes.data.data.banners.some(b => b.id === bannerId1),
      '14. Admin list endpoint returns paginated results with search filter'
    );

    // 15. Admin Get Single Banner by ID
    const getByIdRes = await request('GET', `/api/admin/banners/${bannerId1}`, null, {
      'x-admin-key': ADMIN_KEY
    });
    assert(
      getByIdRes.status === 200 &&
      getByIdRes.data.data.name === 'Winter Hoodies Collection',
      '15. Admin fetch single banner by ID (200)'
    );

    // 16. Admin Update Banner Content (PATCH)
    const updateRes = await request(
      'PATCH',
      `/api/admin/banners/${bannerId1}`,
      {
        title: 'UPDATED HEAVYWEIGHT HOODIES',
        subtitle: 'NOW IN 5 NEW COLORWAYS'
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      updateRes.status === 200 &&
      updateRes.data.data.title === 'UPDATED HEAVYWEIGHT HOODIES',
      '16. Admin update banner content (200)'
    );

    // 17. Admin Reorder Banner (PATCH /:id/order)
    const reorderRes = await request(
      'PATCH',
      `/api/admin/banners/${bannerId1}/order`,
      { display_order: 0 },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      reorderRes.status === 200 &&
      reorderRes.data.data.display_order === 0,
      '17. Admin update banner display order (200)'
    );

    // Verify it is now first in public homepage
    const publicAfterReorder = await request('GET', '/api/banners/homepage');
    assert(
      publicAfterReorder.data.data[0].id === bannerId1,
      '18. Public carousel immediately reflects updated display order'
    );

    // 19. Admin Toggle Status (PATCH /:id/status)
    const disableRes = await request(
      'PATCH',
      `/api/admin/banners/${bannerId1}/status`,
      { is_active: false },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      disableRes.status === 200 &&
      disableRes.data.data.is_active === false,
      '19. Admin disable banner status (200)'
    );

    // Verify disabled banner is excluded from public endpoint
    const publicAfterDisable = await request('GET', '/api/banners/homepage');
    assert(
      !publicAfterDisable.data.data.some(b => b.id === bannerId1),
      '20. Disabled banner is immediately excluded from public homepage'
    );

    // 21. Admin Delete Banner
    const deleteRes = await request('DELETE', `/api/admin/banners/${bannerId1}`, null, {
      'x-admin-key': ADMIN_KEY
    });
    assert(deleteRes.status === 200 && deleteRes.data.success === true, '21. Admin delete banner (200)');

    // 22. Non-existent banner returns 404
    const notFoundRes = await request('GET', `/api/admin/banners/${bannerId1}`, null, {
      'x-admin-key': ADMIN_KEY
    });
    assert(notFoundRes.status === 404, '22. Fetching deleted banner returns 404');

    // Clean up temporary banners
    await request('DELETE', `/api/admin/banners/${bannerId2}`, null, { 'x-admin-key': ADMIN_KEY });
    await request('DELETE', `/api/admin/banners/${bannerId3}`, null, { 'x-admin-key': ADMIN_KEY });
    await request('DELETE', `/api/admin/banners/${bannerId4}`, null, { 'x-admin-key': ADMIN_KEY });

    console.log(`\nTests Completed: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Integration test failed with error:', err);
    process.exit(1);
  }
}

runTests();
