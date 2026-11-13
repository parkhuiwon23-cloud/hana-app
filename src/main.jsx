import { createRoot } from 'react-dom/client';
import Prototype from './Prototype.jsx';
import './styles.css';

const MODE = document.body.dataset.mode; // 'app' | 'web'
createRoot(document.getElementById('root')).render(<Prototype mode={MODE} />);
