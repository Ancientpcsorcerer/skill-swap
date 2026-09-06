import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

const NotFound = () => (
  <div className={styles.page}>
    <span className={styles.eyebrow}>404</span>
    <h1 className={styles.title}>
      That page is<br />
      <em>not in the network.</em>
    </h1>
    <p className={styles.copy}>
      The page you asked for doesn't exist — or has been retired. Try the homepage, or browse the people in the network.
    </p>
    <div className={styles.actions}>
      <Link to="/">Go home →</Link>
      <Link to="/discover">Browse the network →</Link>
    </div>
  </div>
);

export default NotFound;
export { NotFound };
