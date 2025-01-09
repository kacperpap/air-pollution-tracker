import './auth-commands'

Cypress.Cookies.debug(true);

// kontenery podczas testu uruchamiane są z czasem UTC, aby poprawnie obliczano expirationDate tokenu,
// konieczne jest zachowanie analogicznej strefy czasowej dla testów cypressa
process.env.TZ = 'UTC';
Cypress.env('TZ', 'UTC');