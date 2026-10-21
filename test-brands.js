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
  console.log('=== RUNNING BRAND MASTER BACKEND INTEGRATION TESTS ===\n');
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
    // 1. Auth check
    const unauthRes = await request('GET', '/api/admin/brands');
    assert(unauthRes.status === 401, '1. Admin endpoint rejects unauthenticated request (401)');

    // 2. Reject missing name
    const missingNameRes = await request(
      'POST',
      '/api/admin/brands',
      { description: 'No name' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(missingNameRes.status === 400, '2. Reject brand with missing name (400)');

    // 3. Reject dangerous website URL (javascript: scheme)
    const dangerousUrlRes = await request(
      'POST',
      '/api/admin/brands',
      { name: 'XSS Brand', website_url: 'javascript:alert(1)' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(dangerousUrlRes.status === 400, '3. Reject dangerous website_url with javascript: scheme (400)');

    // 4. Reject data: URI scheme
    const dataUrlRes = await request(
      'POST',
      '/api/admin/brands',
      { name: 'Data Scheme Brand', website_url: 'data:text/html;base64,PHNjcmlwdD4=' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(dataUrlRes.status === 400, '4. Reject dangerous website_url with data: scheme (400)');

    // 5. Create valid brand with auto-generated slug
    const createBrand1Res = await request(
      'POST',
      '/api/admin/brands',
      {
        name: 'Alpha Athletic',
        description: 'Performance streetwear and activewear brand.',
        website_url: 'https://alphaathletic.example.com',
        logo_url: '/uploads/brands/alpha-logo.webp',
        display_order: 1,
        is_active: true
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      createBrand1Res.status === 201 &&
      createBrand1Res.data.data.name === 'Alpha Athletic' &&
      createBrand1Res.data.data.slug === 'alpha-athletic' &&
      createBrand1Res.data.data.website_url === 'https://alphaathletic.example.com',
      '5. Create valid brand with auto-generated slug (201)'
    );
    const brand1Id = createBrand1Res.data.data?.id;

    // 6. Create second brand with custom slug
    const createBrand2Res = await request(
      'POST',
      '/api/admin/brands',
      {
        name: 'URBANDRIP Studio',
        slug: 'urbandrip-original',
        description: 'In-house designer label.',
        website_url: 'https://urbandrip.example.com',
        display_order: 2,
        is_active: true
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      createBrand2Res.status === 201 &&
      createBrand2Res.data.data.slug === 'urbandrip-original',
      '6. Create brand with custom slug (201)'
    );
    const brand2Id = createBrand2Res.data.data?.id;

    // 7. Create third inactive/draft brand
    const createBrand3Res = await request(
      'POST',
      '/api/admin/brands',
      {
        name: 'Beta Footwear',
        is_active: false,
        display_order: 3
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      createBrand3Res.status === 201 &&
      createBrand3Res.data.data.is_active === false,
      '7. Create inactive/draft brand (201)'
    );
    const brand3Id = createBrand3Res.data.data?.id;

    // 8. Reject duplicate slug
    const duplicateSlugRes = await request(
      'POST',
      '/api/admin/brands',
      {
        name: 'Another Alpha Brand',
        slug: 'alpha-athletic'
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(duplicateSlugRes.status === 400, '8. Reject duplicate slug on creation (400)');

    // 9. Fetch brand by ID
    const getByIdRes = await request(
      'GET',
      `/api/admin/brands/${brand1Id}`,
      null,
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      getByIdRes.status === 200 &&
      getByIdRes.data.data.name === 'Alpha Athletic',
      '9. Fetch brand by ID (200)'
    );

    // 10. Update brand details
    const updateRes = await request(
      'PATCH',
      `/api/admin/brands/${brand1Id}`,
      {
        description: 'Updated streetwear description.',
        website_url: 'https://alpha-new.example.com'
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      updateRes.status === 200 &&
      updateRes.data.data.description === 'Updated streetwear description.' &&
      updateRes.data.data.website_url === 'https://alpha-new.example.com',
      '10. Update brand details (200)'
    );

    // 11. Update display order
    const updateOrderRes = await request(
      'PATCH',
      `/api/admin/brands/${brand2Id}/order`,
      { display_order: 0 },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      updateOrderRes.status === 200 &&
      updateOrderRes.data.data.display_order === 0,
      '11. Update brand display order (200)'
    );

    // 12. Admin list endpoint with pagination and search
    const adminListRes = await request(
      'GET',
      '/api/admin/brands?search=Alpha',
      null,
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      adminListRes.status === 200 &&
      adminListRes.data.data.brands.length === 1 &&
      adminListRes.data.data.brands[0].id === brand1Id,
      '12. Admin list endpoint supports search and pagination (200)'
    );

    // 13. Public storefront active brands list
    const publicListRes = await request('GET', '/api/brands');
    const brand2InList = publicListRes.data.data.find(b => b.id === brand2Id);
    const brand1InList = publicListRes.data.data.find(b => b.id === brand1Id);
    const brand3InList = publicListRes.data.data.find(b => b.id === brand3Id);
    assert(
      publicListRes.status === 200 &&
      Array.isArray(publicListRes.data.data) &&
      brand2InList &&
      brand1InList &&
      !brand3InList && // Inactive brand3 must be excluded
      publicListRes.data.data.indexOf(brand2InList) < publicListRes.data.data.indexOf(brand1InList), // display_order 0 is before 1
      '13. Public storefront returns only active brands sorted deterministically (200)'
    );


    // 14. Public storefront fetch active brand by slug
    const publicSlugRes = await request('GET', '/api/brands/alpha-athletic');
    assert(
      publicSlugRes.status === 200 &&
      publicSlugRes.data.data.name === 'Alpha Athletic' &&
      publicSlugRes.data.data.website_url === 'https://alpha-new.example.com',
      '14. Public storefront fetch active brand by slug (200)'
    );

    // 15. Inactive brand returns 404 on public by-slug endpoint
    const publicInactiveRes = await request('GET', '/api/brands/beta-footwear');
    assert(
      publicInactiveRes.status === 404,
      '15. Inactive brand is excluded and returns 404 on public endpoint (404)'
    );

    // 16. Admin disable brand status
    const disableRes = await request(
      'PATCH',
      `/api/admin/brands/${brand1Id}/status`,
      { is_active: false },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      disableRes.status === 200 &&
      disableRes.data.data.is_active === false,
      '16. Admin disables brand status (200)'
    );

    // 17. Disabled brand is immediately excluded from public endpoint
    const publicAfterDisableRes = await request('GET', '/api/brands/alpha-athletic');
    assert(
      publicAfterDisableRes.status === 404,
      '17. Disabled brand is immediately excluded from public by-slug endpoint (404)'
    );

    // 18. Admin re-enables brand
    const enableRes = await request(
      'PATCH',
      `/api/admin/brands/${brand1Id}/status`,
      { is_active: true },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      enableRes.status === 200 &&
      enableRes.data.data.is_active === true,
      '18. Admin re-enables brand status (200)'
    );

    // 19. Non-existent brand ID returns 404
    const notFoundIdRes = await request(
      'GET',
      '/api/admin/brands/999999',
      null,
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(notFoundIdRes.status === 404, '19. Non-existent brand ID returns 404 (404)');

    // 20. Delete brand safely
    const deleteRes = await request(
      'DELETE',
      `/api/admin/brands/${brand3Id}`,
      null,
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(deleteRes.status === 200, '20. Delete brand safely (200)');

    // 21. Fetch deleted brand returns 404
    const getDeletedRes = await request(
      'GET',
      `/api/admin/brands/${brand3Id}`,
      null,
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(getDeletedRes.status === 404, '21. Fetch deleted brand returns 404');

    // Clean up temporary testing brands
    await request('DELETE', `/api/admin/brands/${brand1Id}`, null, { 'x-admin-key': ADMIN_KEY });
    await request('DELETE', `/api/admin/brands/${brand2Id}`, null, { 'x-admin-key': ADMIN_KEY });

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\nTests Completed: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
