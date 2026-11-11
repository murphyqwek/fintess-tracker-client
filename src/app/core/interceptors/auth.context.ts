import { HttpContextToken } from '@angular/common/http';

// Route guards decide where to navigate after checking the session.
export const SKIP_AUTH_REDIRECT = new HttpContextToken<boolean>(() => false);
