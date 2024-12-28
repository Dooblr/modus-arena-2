import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import '../styles/StartMenu.scss';

interface StartMenuProps {
  onStartGame: () => void;
}

type MenuScreen = 'main' | 'options';

const StartMenu = ({ onStartGame }: StartMenuProps) => {
  const [currentScreen, setCurrentScreen] = useState<MenuScreen>('main');
  const setIsPaused = useGameStore(state => state.setIsPaused);

  // Force pointer unlock when menu is shown
  useEffect(() => {
    const unlockPointer = () => {
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    };
    
    unlockPointer();
    // Add event listener to ensure pointer stays unlocked
    document.addEventListener('pointerlockchange', unlockPointer);
    return () => document.removeEventListener('pointerlockchange', unlockPointer);
  }, []);

  const handleStartGame = () => {
    setIsPaused(false);
    onStartGame();
  };

  const menuVariants = {
    enter: {
      opacity: 0,
      x: 100,
    },
    center: {
      opacity: 1,
      x: 0,
    },
    exit: {
      opacity: 0,
      x: -100,
    },
  };

  return (
    <div className="start-menu-container">
      <AnimatePresence mode="wait">
        {currentScreen === 'main' && (
          <motion.div
            key="main"
            className="menu-screen"
            variants={menuVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <h1>Polybius 3D</h1>
            <div className="button-container">
              <motion.button
                onClick={handleStartGame}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Game
              </motion.button>
              <motion.button
                onClick={() => setCurrentScreen('options')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Options
              </motion.button>
            </div>
          </motion.div>
        )}

        {currentScreen === 'options' && (
          <motion.div
            key="options"
            className="menu-screen"
            variants={menuVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <h2>Options</h2>
            <div className="button-container">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sound
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Controls
              </motion.button>
              <motion.button
                onClick={() => setCurrentScreen('main')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="back-button"
              >
                Back
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StartMenu; 