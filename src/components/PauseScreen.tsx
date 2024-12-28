import { motion, AnimatePresence } from 'framer-motion';
import '../styles/PauseScreen.scss';
import { useEffect } from 'react';

interface PauseScreenProps {
  isVisible: boolean;
  onResume: () => void;
}

const PauseScreen = ({ isVisible, onResume }: PauseScreenProps) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (isVisible && (e.code === 'KeyZ' || e.code === 'Escape')) {
      onResume();
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div 
          className="pause-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div 
            className="pause-menu"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <h1>PAUSED</h1>
            <motion.button
              onClick={onResume}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Resume (ESC/Z)
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PauseScreen; 