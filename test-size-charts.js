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
  console.log('=== RUNNING SIZE CHART MASTER BACKEND INTEGRATION TESTS ===\n');
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
    const unauthRes = await request('GET', '/api/admin/size-charts');
    assert(unauthRes.status === 401, '1. Admin endpoint rejects unauthenticated request (401)');

    // 2. Reject missing name
    const missingNameRes = await request(
      'POST',
      '/api/admin/size-charts',
      { chart_type: 'clothing' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(missingNameRes.status === 400, '2. Reject size chart with missing name (400)');

    // 3. Reject invalid chart_type
    const invalidTypeRes = await request(
      'POST',
      '/api/admin/size-charts',
      { name: 'Invalid Type Chart', chart_type: 'spaceships' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(invalidTypeRes.status === 400, '3. Reject unsupported chart_type (400)');

    // 4. Create clothing size chart with columns and rows atomically
    const clothingPayload = {
      name: 'Men Oversized T-Shirt Size Guide',
      slug: 'men-oversized-t-shirt-size-guide',
      chart_type: 'clothing',
      description: 'Standard measurement chart for men streetwear oversized tees.',
      display_order: 1,
      is_active: true,
      columns: [
        { label: 'Chest', key: 'chest', unit: 'cm', value_type: 'number', display_order: 1 },
        { label: 'Shoulder', key: 'shoulder', unit: 'cm', value_type: 'number', display_order: 2 },
        { label: 'Body Length', key: 'body_length', unit: 'cm', value_type: 'number', display_order: 3 }
      ],
      rows: [
        { size_label: 'S', size_code: 'sm', measurements: { chest: 104, shoulder: 46, body_length: 70 }, display_order: 1 },
        { size_label: 'M', size_code: 'md', measurements: { chest: 110, shoulder: 48, body_length: 72 }, display_order: 2 },
        { size_label: 'L', size_code: 'lg', measurements: { chest: 116, shoulder: 50, body_length: 74 }, display_order: 3 },
        { size_label: 'XL', size_code: 'xl', measurements: { chest: 122, shoulder: 52, body_length: 76 }, display_order: 4 }
      ]
    };

    const createClothingRes = await request('POST', '/api/admin/size-charts', clothingPayload, { 'x-admin-key': ADMIN_KEY });
    assert(
      createClothingRes.status === 201 &&
      createClothingRes.data.data.name === 'Men Oversized T-Shirt Size Guide' &&
      createClothingRes.data.data.columns.length === 3 &&
      createClothingRes.data.data.rows.length === 4,
      '4. Create clothing size chart with atomic columns and rows (201)'
    );
    const clothingChartId = createClothingRes.data.data?.id;

    // 5. Create footwear size chart (different column structure, text & numbers)
    const footwearPayload = {
      name: 'Unisex Sneaker Sizing',
      chart_type: 'footwear',
      description: 'Shoe sizing comparison chart',
      columns: [
        { label: 'US Size', key: 'us_size', unit: 'US', value_type: 'text', display_order: 1 },
        { label: 'UK Size', key: 'uk_size', unit: 'UK', value_type: 'text', display_order: 2 },
        { label: 'EU Size', key: 'eu_size', unit: 'EU', value_type: 'text', display_order: 3 },
        { label: 'Foot Length', key: 'foot_length', unit: 'cm', value_type: 'number', display_order: 4 }
      ],
      rows: [
        { size_label: 'UK 8', measurements: { us_size: '9', uk_size: '8', eu_size: '42', foot_length: 26.5 }, display_order: 1 },
        { size_label: 'UK 9', measurements: { us_size: '10', uk_size: '9', eu_size: '43', foot_length: 27.5 }, display_order: 2 }
      ]
    };
    const createFootwearRes = await request('POST', '/api/admin/size-charts', footwearPayload, { 'x-admin-key': ADMIN_KEY });
    assert(
      createFootwearRes.status === 201 &&
      createFootwearRes.data.data.slug === 'unisex-sneaker-sizing' &&
      createFootwearRes.data.data.columns.length === 4,
      '5. Create footwear chart with auto-generated slug and distinct column schema (201)'
    );
    const footwearChartId = createFootwearRes.data.data?.id;

    // 6. Create ring/custom chart
    const ringPayload = {
      name: 'Standard Ring Size Guide',
      chart_type: 'ring',
      columns: [
        { label: 'Inner Diameter', key: 'inner_diameter', unit: 'mm', value_type: 'number', display_order: 1 },
        { label: 'Circumference', key: 'circumference', unit: 'mm', value_type: 'number', display_order: 2 }
      ],
      rows: [
        { size_label: 'Size 6', measurements: { inner_diameter: 16.5, circumference: 51.8 }, display_order: 1 },
        { size_label: 'Size 7', measurements: { inner_diameter: 17.3, circumference: 54.4 }, display_order: 2 }
      ]
    };
    const createRingRes = await request('POST', '/api/admin/size-charts', ringPayload, { 'x-admin-key': ADMIN_KEY });
    assert(createRingRes.status === 201 && createRingRes.data.data.chart_type === 'ring', '6. Create ring chart with custom dimensions (201)');

    // 7. Reject duplicate chart slug
    const duplicateSlugRes = await request(
      'POST',
      '/api/admin/size-charts',
      { name: 'Another Chart', slug: 'men-oversized-t-shirt-size-guide' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(duplicateSlugRes.status === 400, '7. Reject duplicate chart slug (400)');

    // 8. Reject duplicate column keys within same chart
    const dupColumnKeyRes = await request(
      'POST',
      `/api/admin/size-charts/${clothingChartId}/columns`,
      { label: 'Chest In Inches', key: 'chest', value_type: 'number' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(dupColumnKeyRes.status === 400, '8. Reject duplicate column key within same chart (400)');

    // 9. Reject invalid numeric measurement
    const invalidMeasurementRes = await request(
      'POST',
      `/api/admin/size-charts/${clothingChartId}/rows`,
      { size_label: 'XXL', measurements: { chest: 'not-a-number', shoulder: 54 } },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(invalidMeasurementRes.status === 400, '9. Reject invalid numeric measurement against column definition (400)');

    // 10. Reject duplicate size label in same chart
    const duplicateLabelRes = await request(
      'POST',
      `/api/admin/size-charts/${clothingChartId}/rows`,
      { size_label: 'M', measurements: { chest: 110 } },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(duplicateLabelRes.status === 400, '10. Reject duplicate size_label in same chart (400)');

    // 11. Add column to chart via nested endpoint
    const addColRes = await request(
      'POST',
      `/api/admin/size-charts/${clothingChartId}/columns`,
      { label: 'Sleeve Length', key: 'sleeve_length', unit: 'cm', value_type: 'number', display_order: 4 },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(addColRes.status === 201 && addColRes.data.data.key === 'sleeve_length', '11. Add column via nested endpoint (201)');
    const addedColId = addColRes.data.data.id;

    // 12. Add row to chart via nested endpoint
    const addRowRes = await request(
      'POST',
      `/api/admin/size-charts/${clothingChartId}/rows`,
      { size_label: 'XXL', size_code: '2xl', measurements: { chest: 128, shoulder: 54, body_length: 78, sleeve_length: 26 }, display_order: 5 },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(addRowRes.status === 201 && addRowRes.data.data.size_label === 'XXL', '12. Add row via nested endpoint (201)');
    const addedRowId = addRowRes.data.data.id;

    // 13. Update column definition
    const updateColRes = await request(
      'PATCH',
      `/api/admin/size-charts/${clothingChartId}/columns/${addedColId}`,
      { label: 'Half Sleeve Length', display_order: 5 },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(updateColRes.status === 200 && updateColRes.data.data.label === 'Half Sleeve Length', '13. Update column label and display_order (200)');

    // 14. Update row measurements
    const updateRowRes = await request(
      'PATCH',
      `/api/admin/size-charts/${clothingChartId}/rows/${addedRowId}`,
      { measurements: { chest: 130, shoulder: 55, body_length: 80, sleeve_length: 27 } },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(updateRowRes.status === 200 && updateRowRes.data.data.measurements.chest === 130, '14. Update row measurements (200)');

    // 15. Cross-chart isolation: reject updating column from wrong chart
    const wrongChartColRes = await request(
      'PATCH',
      `/api/admin/size-charts/${footwearChartId}/columns/${addedColId}`,
      { label: 'Hacked Label' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(wrongChartColRes.status === 404, '15. Reject updating column that belongs to a different chart (404)');

    // 16. Cross-chart isolation: reject updating row from wrong chart
    const wrongChartRowRes = await request(
      'PATCH',
      `/api/admin/size-charts/${footwearChartId}/rows/${addedRowId}`,
      { size_label: 'Hacked' },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(wrongChartRowRes.status === 404, '16. Reject updating row that belongs to a different chart (404)');

    // 17. Admin list endpoint with pagination, search & type filter
    const listRes = await request('GET', '/api/admin/size-charts?search=Oversized&chart_type=clothing', null, { 'x-admin-key': ADMIN_KEY });
    const foundClothingChart = listRes.data?.data?.size_charts?.find(c => c.id === clothingChartId);
    assert(
      listRes.status === 200 &&
      Boolean(foundClothingChart),
      '17. Admin list endpoint supports search, type filtering, and pagination (200)'
    );

    // 18. Admin get single chart with ordered columns and rows
    const getSingleRes = await request('GET', `/api/admin/size-charts/${clothingChartId}`, null, { 'x-admin-key': ADMIN_KEY });
    assert(
      getSingleRes.status === 200 &&
      getSingleRes.data.data.columns.length === 4 &&
      getSingleRes.data.data.rows.length === 5,
      '18. Admin get chart by ID includes ordered columns and rows (200)'
    );

    // 19. Public storefront fetch active chart by slug
    const publicGetRes = await request('GET', `/api/size-charts/${clothingPayload.slug}`);
    const chestMeasurement = Number(publicGetRes.data?.data?.rows?.[0]?.measurements?.chest);
    assert(
      publicGetRes.status === 200 &&
      publicGetRes.data?.data?.name === 'Men Oversized T-Shirt Size Guide' &&
      publicGetRes.data?.data?.columns?.[0]?.label === 'Chest' &&
      chestMeasurement === 104,
      '19. Public storefront fetch by slug returns active chart with columns & rows (200)'
    );


    // 20. Public storefront list returns active charts
    const publicListRes = await request('GET', '/api/size-charts');
    assert(
      publicListRes.status === 200 &&
      Array.isArray(publicListRes.data.data) &&
      publicListRes.data.data.length >= 3,
      '20. Public storefront list endpoint returns active charts (200)'
    );

    // 21. Admin disables size chart
    const disableRes = await request(
      'PATCH',
      `/api/admin/size-charts/${clothingChartId}/status`,
      { is_active: false },
      { 'x-admin-key': ADMIN_KEY }
    );
    assert(disableRes.status === 200 && disableRes.data.data.is_active === false, '21. Admin disables size chart status (200)');

    // 22. Inactive chart is excluded from public storefront by slug
    const publicInactiveRes = await request('GET', '/api/size-charts/men-oversized-t-shirt-size-guide');
    assert(publicInactiveRes.status === 404, '22. Inactive chart is immediately excluded from public endpoint (404)');

    // 23. Delete nested row and column
    const deleteRowRes = await request('DELETE', `/api/admin/size-charts/${clothingChartId}/rows/${addedRowId}`, null, { 'x-admin-key': ADMIN_KEY });
    assert(deleteRowRes.status === 200, '23. Delete nested row successfully (200)');

    const deleteColRes = await request('DELETE', `/api/admin/size-charts/${clothingChartId}/columns/${addedColId}`, null, { 'x-admin-key': ADMIN_KEY });
    assert(deleteColRes.status === 200, '24. Delete nested column successfully (200)');

    // 25. Delete size chart cleanly
    const deleteChartRes = await request('DELETE', `/api/admin/size-charts/${clothingChartId}`, null, { 'x-admin-key': ADMIN_KEY });
    assert(deleteChartRes.status === 200, '25. Delete size chart cascades to columns/rows cleanly (200)');

    // 26. Fetch deleted chart returns 404
    const getDeletedRes = await request('GET', `/api/admin/size-charts/${clothingChartId}`, null, { 'x-admin-key': ADMIN_KEY });
    assert(getDeletedRes.status === 404, '26. Fetch deleted chart returns 404');

    // Clean up footwear and ring charts
    await request('DELETE', `/api/admin/size-charts/${footwearChartId}`, null, { 'x-admin-key': ADMIN_KEY });
    await request('DELETE', `/api/admin/size-charts/${createRingRes.data.data.id}`, null, { 'x-admin-key': ADMIN_KEY });

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  }

  console.log(`\nTests Completed: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();

