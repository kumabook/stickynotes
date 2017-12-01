import test from 'ava';
import '../src/popup';

test('popup succeeds in rendering html', (t) => {
  const { document } = window;
  const home = document.querySelector('div.home');
  t.truthy(home !== null);
});
