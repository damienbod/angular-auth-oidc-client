import {
  collectRequests,
  expect,
  isAuthorizeRequest,
  isTokenRequest,
  test,
} from './helpers';

test('should allow navigating both public routes without logging in', async ({
  page,
}) => {
  // Arrange
  const authorizeRequests = collectRequests(page, isAuthorizeRequest());

  // Act
  await page.goto('/');

  // Assert
  await expect(
    page.getByRole('heading', { name: 'Route one', exact: true })
  ).toBeVisible();
  await expect(page.getByText('Is Authenticated: false')).toBeVisible();

  // Act
  await page.getByRole('link', { name: 'Route two' }).click();

  // Assert
  await expect(page).toHaveURL(/\/two$/);
  await expect(
    page.getByRole('heading', { name: 'Route two', exact: true })
  ).toBeVisible();
  await expect(page.getByText('Is Authenticated: false')).toBeVisible();
  expect(authorizeRequests).toEqual([]);
});

for (const route of ['one', 'two']) {
  test(`should return to public route ${route} with query and fragment after manual login via the app initializer`, async ({
    page,
  }) => {
    // Arrange
    const path = `/${route}?tab=details&returnTo=%2Forders%2F42#items`;
    const authorizeRequests = collectRequests(page, isAuthorizeRequest());

    await page.goto(path);
    await expect(page.getByText('Is Authenticated: false')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: `Route ${route}`, exact: true })
    ).toBeVisible();
    const originalUrl = page.url();
    const tokenRequest = page.waitForRequest(
      isTokenRequest('authorization_code')
    );

    // Act
    await page.getByRole('button', { name: 'Login and return here' }).click();
    await tokenRequest;

    // Assert
    await expect(page).toHaveURL(originalUrl);
    await expect(
      page.getByRole('heading', { name: `Route ${route}`, exact: true })
    ).toBeVisible();
    await expect(page.getByText('Is Authenticated: true')).toBeVisible();
    await expect(page.getByText('Test User IDP1')).toBeVisible();
    expect(authorizeRequests).toHaveLength(1);
    expect(
      new URL(authorizeRequests[0].url()).searchParams.get('redirect_uri')
    ).toBe(new URL(originalUrl).origin);

    // Arrange
    const otherRoute = route === 'one' ? 'two' : 'one';

    // Act
    await page.getByRole('link', { name: `Route ${otherRoute}` }).click();
    await page.reload();

    // Assert
    await expect(page).toHaveURL(new URL(`/${otherRoute}`, originalUrl).href);
    await expect(
      page.getByRole('heading', { name: `Route ${otherRoute}`, exact: true })
    ).toBeVisible();
    await expect(page.getByText('Is Authenticated: true')).toBeVisible();
    expect(authorizeRequests).toHaveLength(1);
  });
}

test('should discard the saved route from a cancelled login before a later plain login', async ({
  page,
}) => {
  // Arrange
  await page.goto('/two?tab=cancelled#items');
  await page.route(
    'http://localhost:8081/idp1/authorize?**',
    (route) =>
      route.fulfill({
        contentType: 'text/html',
        body: '<h1>Login cancelled</h1>',
      }),
    { times: 1 }
  );
  await page.getByRole('button', { name: 'Login and return here' }).click();
  await expect(
    page.getByRole('heading', { name: 'Login cancelled' })
  ).toBeVisible();
  await page.goto('/two?tab=retry');
  await expect(page.getByText('Is Authenticated: false')).toBeVisible();

  // Act
  await page
    .getByRole('button', { name: 'Login without restoring route' })
    .click();

  // Assert
  await expect(page.getByText('Is Authenticated: true')).toBeVisible();
  await expect(page).toHaveURL(/\/one$/);
  await expect(
    page.getByRole('heading', { name: 'Route one', exact: true })
  ).toBeVisible();
});
