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
  console.log('=== RUNNING CATEGORY MANAGEMENT API INTEGRATION TESTS ===\n');
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
    const unauthRes = await request('GET', '/api/admin/categories');
    assert(unauthRes.status === 401, '1. Admin endpoint rejects unauthenticated request (401)');

    // 2. Public categories list
    const publicCatRes = await request('GET', '/api/categories');
    assert(
      publicCatRes.status === 200 &&
      publicCatRes.data.success === true &&
      Array.isArray(publicCatRes.data.data) &&
      publicCatRes.data.data.length >= 3,
      '2. Public endpoint returns active categories array (200)'
    );

    // Verify ordering
    const cats = publicCatRes.data.data;
    const isSorted = cats.every((item, i) => i === 0 || item.display_order >= cats[i - 1].display_order);
    assert(isSorted, '3. Public categories are sorted by display_order ascending');

    // 4. Fetch single public category by slug
    const menCatRes = await request('GET', '/api/categories/men');
    assert(
      menCatRes.status === 200 &&
      menCatRes.data.data.slug === 'men' &&
      menCatRes.data.data.name === 'Men',
      '4. Fetch public category by slug (200)'
    );

    // 5. Non-existent slug returns 404
    const notFoundSlug = await request('GET', '/api/categories/non-existent-category-slug-xyz');
    assert(notFoundSlug.status === 404, '5. Non-existent category slug returns 404');

    // 6. Validation: Reject missing category name
    const missingNameRes = await request(
      'POST',
      '/api/admin/categories',
      { description: 'No name' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(missingNameRes.status === 400, '6. Reject category creation with missing name (400)');

    // 7. Auto-slug generation from name
    const createParentRes = await request(
      'POST',
      '/api/admin/categories',
      {
        name: 'Oversized Streetwear',
        description: 'Heavyweight baggy silhouettes',
        display_order: 4
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      createParentRes.status === 201 &&
      createParentRes.data.data.slug === 'oversized-streetwear',
      '7. Create category with auto-generated slug (201)'
    );
    const parentCatId = createParentRes.data.data.id;

    // 8. Reject duplicate slug conflict
    const duplicateSlugRes = await request(
      'POST',
      '/api/admin/categories',
      {
        name: 'Oversized Streetwear Duplicate',
        slug: 'oversized-streetwear'
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(duplicateSlugRes.status === 400, '8. Reject creation with duplicate slug (400)');

    // 9. Create child subcategory (hierarchical parent-child relationship)
    const createChildRes = await request(
      'POST',
      '/api/admin/categories',
      {
        name: 'Boxy Tees',
        slug: 'boxy-tees',
        parent_id: parentCatId,
        display_order: 1
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      createChildRes.status === 201 &&
      createChildRes.data.data.parent_id == parentCatId,
      '9. Create child subcategory referencing parent (201)'
    );
    const childCatId = createChildRes.data.data.id;

    // 10. Prevent category from being its own parent
    const selfParentRes = await request(
      'PATCH',
      `/api/admin/categories/${parentCatId}`,
      { parent_id: parentCatId },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(selfParentRes.status === 400, '10. Prevent category from being its own parent (400)');

    // 11. Prevent circular hierarchy (parent cannot have its child as its parent)
    const circularRes = await request(
      'PATCH',
      `/api/admin/categories/${parentCatId}`,
      { parent_id: childCatId },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(circularRes.status === 400, '11. Prevent circular category hierarchy loop (400)');

    // 12. Safe Deletion Rule: Reject deleting parent category while child categories exist
    const deleteParentWithChildRes = await request(
      'DELETE',
      `/api/admin/categories/${parentCatId}`,
      null,
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      deleteParentWithChildRes.status === 409,
      '12. Reject deleting parent category with dependent children (409 Conflict)'
    );

    // 13. Admin update category details (PATCH)
    const updateRes = await request(
      'PATCH',
      `/api/admin/categories/${childCatId}`,
      {
        name: 'Boxy Heavyweight Tees',
        description: '280 GSM luxury cotton'
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      updateRes.status === 200 &&
      updateRes.data.data.name === 'Boxy Heavyweight Tees',
      '13. Update category details successfully (200)'
    );

    // 14. Admin reorder category (PATCH /:id/order)
    const reorderRes = await request(
      'PATCH',
      `/api/admin/categories/${childCatId}/order`,
      { display_order: 99 },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      reorderRes.status === 200 &&
      reorderRes.data.data.display_order === 99,
      '14. Update category display order (200)'
    );

    // 15. Admin disable category (PATCH /:id/status)
    const disableRes = await request(
      'PATCH',
      `/api/admin/categories/${childCatId}/status`,
      { is_active: false },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      disableRes.status === 200 &&
      disableRes.data.data.is_active === false,
      '15. Disable category status (200)'
    );

    // 16. Verify disabled category is excluded from public by-slug endpoint
    const disabledSlugRes = await request('GET', '/api/categories/boxy-tees');
    assert(disabledSlugRes.status === 404, '16. Disabled category excluded from public by-slug query (404)');

    // 17. Admin list categories with search & pagination
    const listRes = await request(
      'GET',
      '/api/admin/categories?page=1&limit=10&search=Streetwear',
      null,
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      listRes.status === 200 &&
      listRes.data.data.categories.some(c => c.id == parentCatId),
      '17. Admin list endpoint returns categories with search filter'
    );

    // 18. Admin get single category by ID
    const getByIdRes = await request(
      'GET',
      `/api/admin/categories/${parentCatId}`,
      null,
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      getByIdRes.status === 200 &&
      getByIdRes.data.data.id == parentCatId,
      '18. Admin fetch single category by ID (200)'
    );

    // 19. Delete child category first, then delete parent category cleanly
    const deleteChildRes = await request(
      'DELETE',
      `/api/admin/categories/${childCatId}`,
      null,
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(deleteChildRes.status === 200, '19. Delete child category safely (200)');

    const deleteParentRes = await request(
      'DELETE',
      `/api/admin/categories/${parentCatId}`,
      null,
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(deleteParentRes.status === 200, '20. Delete parent category after children removed (200)');

    // 21. Non-existent category ID returns 404
    const notFoundIdRes = await request(
      'GET',
      `/api/admin/categories/${parentCatId}`,
      null,
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(notFoundIdRes.status === 404, '21. Get deleted category by ID returns 404');

    console.log(`\nTests Completed: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Category test suite error:', err);
    process.exit(1);
  }
}

runTests();
