import axios from 'axios';

/**
 * We'll load the axios HTTP library which allows us to easily issue requests
 * to our back-end. This library automatically handles sending the
 * CSRF token as a header based on the value of the "XSRF" token cookie.
 */

axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.withCredentials = true;

/**
 * Configure axios to automatically handle CSRF token from cookies
 */
const token = document.head.querySelector('meta[name="csrf-token"]');
if (token instanceof HTMLMetaElement) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
}

export default axios;

