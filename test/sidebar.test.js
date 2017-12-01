import test from 'ava';
import '../src/sidebar';

test('sidebar succeeds in rendering html', (t) => {
  const { document } = window;
  const header = document.querySelector('div.header');
  t.truthy(header !== null);
});
