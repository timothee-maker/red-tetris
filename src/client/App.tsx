import { Provider } from 'react-redux';
import { Route, Routes } from 'react-router-dom';
import { Landing } from './components/Landing';
import { NotFound } from './components/NotFound';
import { createStore } from './store';

const store = createStore();

/** The router (`BrowserRouter` / `MemoryRouter`) is provided by the caller. */
export const App = () => (
  <Provider store={store}>
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/:room/:player" element={<Landing direct />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Provider>
);
