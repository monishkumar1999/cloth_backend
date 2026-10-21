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
  console.log('=== RUNNING PRODUCT ATTRIBUTES & VALUES MASTER INTEGRATION TESTS ===\n');
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
    const unauthRes = await request('GET', '/api/admin/attributes');
    assert(unauthRes.status === 401, '1. Admin endpoint rejects unauthenticated request (401)');

    // 2. Reject attribute creation with missing name
    const missingNameRes = await request(
      'POST',
      '/api/admin/attributes',
      { input_type: 'select' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(missingNameRes.status === 400, '2. Reject attribute with missing name (400)');

    // 3. Reject invalid input_type
    const invalidTypeRes = await request(
      'POST',
      '/api/admin/attributes',
      { name: 'Invalid Type Attr', input_type: 'date_time_picker' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(invalidTypeRes.status === 400, '3. Reject unsupported input_type (400)');

    // 4. Create Color attribute (Select type, variant defining)
    const createColorRes = await request(
      'POST',
      '/api/admin/attributes',
      {
        name: 'Color',
        slug: 'color',
        description: 'Product color variations',
        input_type: 'select',
        is_variant_attribute: true,
        is_filterable: true,
        display_order: 1
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      createColorRes.status === 201 &&
      createColorRes.data.data.slug === 'color' &&
      createColorRes.data.data.input_type === 'select',
      '4. Create Color attribute of type select (201)'
    );
    const colorAttrId = createColorRes.data.data.id;

    // 5. Create Storage attribute with auto-slug and unit
    const createStorageRes = await request(
      'POST',
      '/api/admin/attributes',
      {
        name: 'Internal Storage',
        input_type: 'select',
        unit: 'GB',
        is_variant_attribute: true,
        is_filterable: true,
        display_order: 2
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      createStorageRes.status === 201 &&
      createStorageRes.data.data.slug === 'internal-storage' &&
      createStorageRes.data.data.unit === 'GB',
      '5. Create Storage attribute with auto-generated slug and unit (201)'
    );
    const storageAttrId = createStorageRes.data.data.id;

    // 6. Create Non-option attribute types (text, number, boolean)
    const createWeightRes = await request(
      'POST',
      '/api/admin/attributes',
      {
        name: 'Item Weight',
        input_type: 'number',
        unit: 'grams',
        is_variant_attribute: false,
        is_filterable: true
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      createWeightRes.status === 201 && createWeightRes.data.data.input_type === 'number',
      '6. Create Number attribute (Weight) without requiring predefined options (201)'
    );
    const weightAttrId = createWeightRes.data.data.id;

    const createWaterproofRes = await request(
      'POST',
      '/api/admin/attributes',
      {
        name: 'Waterproof',
        input_type: 'boolean'
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      createWaterproofRes.status === 201 && createWaterproofRes.data.data.input_type === 'boolean',
      '7. Create Boolean attribute (Waterproof) (201)'
    );
    const waterproofAttrId = createWaterproofRes.data.data.id;

    // 8. Reject duplicate attribute slug
    const duplicateAttrSlugRes = await request(
      'POST',
      '/api/admin/attributes',
      {
        name: 'Duplicate Color',
        slug: 'color',
        input_type: 'select'
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(duplicateAttrSlugRes.status === 400, '8. Reject duplicate attribute slug (400)');

    // 9. Reject defining predefined values for text/number/boolean types
    const invalidValueOnNumberRes = await request(
      'POST',
      `/api/admin/attributes/${weightAttrId}/values`,
      { label: '500g', value: '500g' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      invalidValueOnNumberRes.status === 400,
      '9. Reject adding predefined values to number/text/boolean attributes (400)'
    );

    // 10. Create valid Color values with label, value, and color_code
    const createBlackValRes = await request(
      'POST',
      `/api/admin/attributes/${colorAttrId}/values`,
      {
        label: 'Obsidian Black',
        value: 'black',
        color_code: '#000000',
        display_order: 1
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      createBlackValRes.status === 201 &&
      createBlackValRes.data.data.color_code === '#000000',
      '10. Create attribute value with valid color_code swatch (201)'
    );
    const blackValId = createBlackValRes.data.data.id;

    // 11. Reject invalid color_code format
    const invalidColorCodeRes = await request(
      'POST',
      `/api/admin/attributes/${colorAttrId}/values`,
      {
        label: 'Blue',
        value: 'blue',
        color_code: 'blue-color-rgb'
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(invalidColorCodeRes.status === 400, '11. Reject invalid hexadecimal color_code (400)');

    // 12. Reject duplicate value under the SAME attribute
    const duplicateValueSameAttr = await request(
      'POST',
      `/api/admin/attributes/${colorAttrId}/values`,
      {
        label: 'Black duplicate',
        value: 'black'
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(duplicateValueSameAttr.status === 400, '12. Reject duplicate value within same attribute (400)');

    // 13. Create Storage values (unit in attribute, option label in value)
    const create128GbRes = await request(
      'POST',
      `/api/admin/attributes/${storageAttrId}/values`,
      {
        label: '128 GB',
        value: '128-gb',
        display_order: 1
      },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(create128GbRes.status === 201, '13. Create Storage option without color_code (201)');
    const storageValId = create128GbRes.data.data.id;

    // 14. Scoped values: allow the SAME value under DIFFERENT attributes
    // Create a "Medium" value in both Size and Packaging
    const createSizeAttrRes = await request(
      'POST',
      '/api/admin/attributes',
      { name: 'Apparel Size', slug: 'apparel-size', input_type: 'select' },
      { 'x-admin-key': ADMIN_KEY }
    );
    const sizeAttrId = createSizeAttrRes.data.data.id;

    const sizeMValRes = await request(
      'POST',
      `/api/admin/attributes/${sizeAttrId}/values`,
      { label: 'Medium', value: 'medium' },
      { 'x-admin-key': ADMIN_KEY }
    );

    const createPackageAttrRes = await request(
      'POST',
      '/api/admin/attributes',
      { name: 'Package Dimensions', slug: 'package-dimensions', input_type: 'select' },
      { 'x-admin-key': ADMIN_KEY }
    );
    const packageAttrId = createPackageAttrRes.data.data.id;

    const packageMValRes = await request(
      'POST',
      `/api/admin/attributes/${packageAttrId}/values`,
      { label: 'Medium Box', value: 'medium' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      sizeMValRes.status === 201 && packageMValRes.status === 201,
      '14. Successfully allows the same normalized value under DIFFERENT attributes'
    );

    // 15. Reject access to a value belonging to a different attribute
    const crossAttributeAccessRes = await request(
      'PATCH',
      `/api/admin/attributes/${colorAttrId}/values/${storageValId}`,
      { label: 'Sneaky Cross Update' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      crossAttributeAccessRes.status === 404,
      '15. Reject updating value that belongs to a different attribute (404)'
    );

    // 16. Update attribute definition (PATCH)
    const updateAttrRes = await request(
      'PATCH',
      `/api/admin/attributes/${colorAttrId}`,
      { description: 'Updated Color Description', display_order: 5 },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      updateAttrRes.status === 200 && updateAttrRes.data.data.display_order === 5,
      '16. Update attribute definition (200)'
    );

    // 17. Safe Type Change: Reject changing select attribute to number when values exist
    const unsafeTypeChangeRes = await request(
      'PATCH',
      `/api/admin/attributes/${colorAttrId}`,
      { input_type: 'number' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      unsafeTypeChangeRes.status === 409,
      '17. Prevent unsafe type change to non-option type when values already exist (409 Conflict)'
    );

    // 18. Update attribute value (PATCH)
    const updateValRes = await request(
      'PATCH',
      `/api/admin/attributes/${colorAttrId}/values/${blackValId}`,
      { label: 'Jet Black', color_code: '#111111' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      updateValRes.status === 200 && updateValRes.data.data.label === 'Jet Black',
      '18. Update attribute value details (200)'
    );

    // 19. Enable/disable attribute value (PATCH /:attrId/values/:valId/status)
    const toggleValStatusRes = await request(
      'PATCH',
      `/api/admin/attributes/${colorAttrId}/values/${blackValId}/status`,
      { is_active: false },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      toggleValStatusRes.status === 200 && toggleValStatusRes.data.data.is_active === false,
      '19. Disable attribute value status (200)'
    );

    // 20. List attributes with includeValues=true
    const listWithValuesRes = await request(
      'GET',
      '/api/admin/attributes?includeValues=true&search=Color',
      null,
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      listWithValuesRes.status === 200 &&
      listWithValuesRes.data.data.attributes[0].values?.length >= 1,
      '20. List attributes with includeValues=true eager-loads option values'
    );

    // 21. Safe Deletion: Reject deleting attribute while values exist
    const deleteAttrWithValuesRes = await request(
      'DELETE',
      `/api/admin/attributes/${colorAttrId}`,
      null,
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(
      deleteAttrWithValuesRes.status === 409,
      '21. Reject deleting attribute with dependent values (409 Conflict)'
    );

    // 22. Delete value first, then delete attribute cleanly
    const deleteValRes = await request(
      'DELETE',
      `/api/admin/attributes/${colorAttrId}/values/${blackValId}`,
      null,
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(deleteValRes.status === 200, '22. Delete attribute value successfully (200)');

    const deleteAttrRes = await request(
      'DELETE',
      `/api/admin/attributes/${colorAttrId}`,
      null,
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(deleteAttrRes.status === 200, '23. Delete attribute cleanly after values removed (200)');

    // 24. Non-existent attribute ID returns 404
    const notFoundAttrRes = await request(
      'GET',
      `/api/admin/attributes/${colorAttrId}`,
      null,
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(notFoundAttrRes.status === 404, '24. Fetch deleted attribute returns 404');

    // Clean up temporary testing attributes
    await request('DELETE', `/api/admin/attributes/${storageAttrId}/values/${storageValId}`, null, { 'x-admin-key': ADMIN_KEY });
    await request('DELETE', `/api/admin/attributes/${storageAttrId}`, null, { 'x-admin-key': ADMIN_KEY });
    await request('DELETE', `/api/admin/attributes/${weightAttrId}`, null, { 'x-admin-key': ADMIN_KEY });
    await request('DELETE', `/api/admin/attributes/${waterproofAttrId}`, null, { 'x-admin-key': ADMIN_KEY });
    await request('DELETE', `/api/admin/attributes/${sizeAttrId}/values/${sizeMValRes.data.data.id}`, null, { 'x-admin-key': ADMIN_KEY });
    await request('DELETE', `/api/admin/attributes/${sizeAttrId}`, null, { 'x-admin-key': ADMIN_KEY });
    await request('DELETE', `/api/admin/attributes/${packageAttrId}/values/${packageMValRes.data.data.id}`, null, { 'x-admin-key': ADMIN_KEY });
    await request('DELETE', `/api/admin/attributes/${packageAttrId}`, null, { 'x-admin-key': ADMIN_KEY });

    console.log(`\nTests Completed: ${passed} passed, ${failed} failed`);
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Attribute test suite error:', err);
    process.exit(1);
  }
}

runTests();
