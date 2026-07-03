//frontend/src/pages/Tickets/TimeCounter.jsx
import { useState, useEffect } from 'react';
import './TimeCounter.scss';

const TimeCounter = ({ start, end, status }) => {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!start) return;
    const calculateTime = () => {
      const startTime = new Date(start).getTime();
      const endTime =
        (status === 'Resuelto' || status === 'Rechazado') && end
          ? new Date(end).getTime()
          : new Date().getTime();
      const diff = endTime - startTime;

      if (diff < 0) return setElapsed('0m');

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setElapsed(hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`);
    };

    calculateTime();
    let interval;
    if (status === 'En Proceso') interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [start, end, status]);

  if (!start) return <span className='dash'>-</span>;

  return (
    <span
      className={`timer-badge ${status === 'En Proceso' ? 'live' : ''} ${status === 'Resuelto' ? 'stopped' : ''}`}
    >
      {status === 'En Proceso' && <span className='live-dot'></span>}
      {elapsed}
    </span>
  );
};

export default TimeCounter;
