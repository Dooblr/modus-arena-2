import { motion } from 'framer-motion';
import '../styles/HUD.scss';

interface HUDProps {
  health: number;
  maxHealth: number;
  xp: number;
  level: number;
  xpToNextLevel: number;
  isLocked: boolean;
}

const HUD = ({ health, maxHealth, xp, level, xpToNextLevel, isLocked }: HUDProps) => {
  if (!isLocked) return null;

  const healthPercentage = (health / maxHealth) * 100;
  const xpPercentage = (xp / xpToNextLevel) * 100;
  
  // Calculate health bar color: red -> yellow -> green
  const hue = (healthPercentage * 1.2); // Multiply by 1.2 to reach green (120) at ~83% health
  const healthColor = `hsl(${hue}, 100%, 45%)`; // Use HSL for smooth color transition

  return (
    <div className="hud">
      <div className="bars-container">
        <div className="health-bar-container">
          <motion.div 
            className="health-bar"
            initial={{ width: '100%' }}
            animate={{ 
              width: `${healthPercentage}%`,
              backgroundColor: healthColor
            }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          />
          <div className="bar-text">
            HP: {Math.ceil(health)} / {maxHealth}
          </div>
        </div>
        
        <div className="xp-bar-container">
          <motion.div 
            className="xp-bar"
            initial={{ width: '0%' }}
            animate={{ width: `${xpPercentage}%` }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          />
          <div className="bar-text">
            Level {level} - XP: {xp} / {xpToNextLevel}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HUD; 