"use client"

import { useEffect, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, X, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { type BadgeData, iconMap, rarityConfig } from "./badge/badge-config"
import { triggerBadgeConfetti } from "./badge/badge-confetti"
import { Award } from "lucide-react"

export type { BadgeData }

interface BadgeEarnedPopupProps {
  badge: BadgeData | null
  onClose: () => void
  autoClose?: boolean
  autoCloseDelay?: number
}

export function BadgeEarnedPopup({ badge, onClose, autoClose = false, autoCloseDelay = 10000 }: BadgeEarnedPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showContent, setShowContent] = useState(false)

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(onClose, 600)
  }, [onClose])

  useEffect(() => {
    if (badge) {
      setIsVisible(true)
      setTimeout(() => setShowContent(true), 200)
      setTimeout(() => triggerBadgeConfetti(badge.color, badge.rarity), 400)

      if (autoClose) {
        const timer = setTimeout(handleClose, autoCloseDelay)
        return () => clearTimeout(timer)
      }
    }
  }, [badge, autoClose, autoCloseDelay, handleClose])

  if (!badge) return null

  const IconComponent = iconMap[badge.icon_name] || Award
  const rarity = rarityConfig[badge.rarity] || rarityConfig.common

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.2, opacity: 0, rotateY: -180, y: 100 }}
            animate={{
              scale: 1,
              opacity: 1,
              rotateY: 0,
              y: 0,
              x: rarity.shakeIntensity > 0
                ? [0, -rarity.shakeIntensity, rarity.shakeIntensity, -rarity.shakeIntensity, 0]
                : 0,
            }}
            exit={{ scale: 0.2, opacity: 0, y: 50 }}
            transition={{
              type: "spring",
              duration: 1,
              bounce: 0.5,
              x: { delay: 0.5, duration: 0.5 },
            }}
            className="relative max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Glow rings */}
            {[...Array(rarity.ringCount)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${rarity.gradient}`}
                style={{
                  transform: `scale(${1.05 + i * 0.03})`,
                  opacity: 0.15 - i * 0.02,
                  filter: `blur(${20 + i * 10}px)`,
                }}
                animate={{
                  scale: [1.05 + i * 0.03, 1.1 + i * 0.03, 1.05 + i * 0.03],
                  opacity: [0.15 - i * 0.02, 0.25 - i * 0.02, 0.15 - i * 0.02],
                }}
                transition={{
                  duration: 2 + i * 0.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                  delay: i * 0.2,
                }}
              />
            ))}

            {/* Main card */}
            <div className="relative bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950 rounded-3xl p-10 border border-white/20 overflow-hidden shadow-2xl">
              {/* Floating particles */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(40)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full"
                    style={{
                      backgroundColor: i % 3 === 0 ? badge.color : i % 3 === 1 ? "#FFD700" : "#ffffff",
                      width: `${2 + Math.random() * 4}px`,
                      height: `${2 + Math.random() * 4}px`,
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                    }}
                    animate={{
                      y: [-30, 30],
                      x: [-20, 20],
                      opacity: [0.1, 0.6, 0.1],
                      scale: [0.5, 1.5, 0.5],
                    }}
                    transition={{
                      duration: 3 + Math.random() * 3,
                      repeat: Number.POSITIVE_INFINITY,
                      delay: Math.random() * 3,
                      ease: "easeInOut",
                    }}
                  />
                ))}
              </div>

              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors z-10 p-2 hover:bg-white/10 rounded-full"
              >
                <X className="h-7 w-7" />
              </button>

              {/* Content */}
              <AnimatePresence>
                {showContent && (
                  <div className="relative z-10 text-center">
                    {/* Header */}
                    <motion.div
                      initial={{ y: -30, opacity: 0, scale: 0.8 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1, type: "spring" }}
                      className="flex items-center justify-center gap-3 mb-8"
                    >
                      <motion.div
                        animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
                      >
                        <Sparkles className="h-7 w-7 text-yellow-400" />
                      </motion.div>
                      <span className="text-yellow-400 font-bold tracking-wider uppercase text-lg">
                        Neues Abzeichen freigeschaltet!
                      </span>
                      <motion.div
                        animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY, delay: 0.5 }}
                      >
                        <Sparkles className="h-7 w-7 text-yellow-400" />
                      </motion.div>
                    </motion.div>

                    {/* Badge icon with rotating rings */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: "spring", duration: 1, bounce: 0.4 }}
                      className="relative mx-auto mb-8"
                    >
                      {[...Array(3)].map((_, i) => (
                        <motion.div
                          key={i}
                          className={`absolute rounded-full bg-gradient-to-r ${rarity.gradient}`}
                          style={{ inset: `${-8 - i * 8}px`, padding: "2px", opacity: 0.6 - i * 0.15 }}
                          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                          transition={{ duration: 10 + i * 5, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        >
                          <div className="w-full h-full rounded-full bg-gray-900" />
                        </motion.div>
                      ))}

                      <motion.div
                        className={`relative w-44 h-44 rounded-full flex items-center justify-center shadow-2xl ${rarity.glow}`}
                        style={{
                          backgroundColor: `${badge.color}25`,
                          boxShadow: `0 0 60px ${badge.color}40, 0 0 100px ${badge.color}20`,
                        }}
                        animate={{
                          scale: [1, rarity.pulseIntensity, 1],
                          boxShadow: [
                            `0 0 60px ${badge.color}40, 0 0 100px ${badge.color}20`,
                            `0 0 80px ${badge.color}60, 0 0 120px ${badge.color}30`,
                            `0 0 60px ${badge.color}40, 0 0 100px ${badge.color}20`,
                          ],
                        }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                      >
                        <div
                          className="absolute inset-4 rounded-full"
                          style={{ background: `radial-gradient(circle, ${badge.color}30 0%, transparent 70%)` }}
                        />
                        <motion.div
                          animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
                          transition={{ duration: 2.5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        >
                          <IconComponent
                            className="h-24 w-24 drop-shadow-lg"
                            style={{ color: badge.color, filter: `drop-shadow(0 0 20px ${badge.color})` }}
                          />
                        </motion.div>
                      </motion.div>

                      {/* Orbiting stars */}
                      {[...Array(12)].map((_, i) => {
                        const angle = (i / 12) * Math.PI * 2
                        const radius = 100
                        return (
                          <motion.div
                            key={i}
                            className="absolute"
                            style={{
                              left: `calc(50% + ${Math.cos(angle) * radius}px - 8px)`,
                              top: `calc(50% + ${Math.sin(angle) * radius}px - 8px)`,
                            }}
                            animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0], rotate: [0, 180] }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, delay: i * 0.15, ease: "easeInOut" }}
                          >
                            <Star className="h-4 w-4 text-yellow-300" fill="currentColor" />
                          </motion.div>
                        )
                      })}
                    </motion.div>

                    {/* Badge name */}
                    <motion.h2
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4, type: "spring" }}
                      className="text-4xl font-bold text-white mb-3"
                      style={{ textShadow: `0 0 30px ${badge.color}80` }}
                    >
                      {badge.name}
                    </motion.h2>

                    {/* Rarity label */}
                    <motion.div
                      initial={{ scale: 0, rotate: -10 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.5, type: "spring", bounce: 0.5 }}
                      className="inline-block mb-5"
                    >
                      <span
                        className={`px-5 py-2 rounded-full text-sm font-bold bg-gradient-to-r ${rarity.gradient} text-white shadow-lg`}
                        style={{ boxShadow: `0 4px 20px ${badge.color}50` }}
                      >
                        {rarity.label}
                      </span>
                    </motion.div>

                    {/* Description */}
                    <motion.p
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="text-gray-300 mb-8 text-xl leading-relaxed max-w-sm mx-auto"
                    >
                      {badge.description}
                    </motion.p>

                    {/* Points */}
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.7, type: "spring", bounce: 0.6 }}
                      className="inline-flex items-center gap-3 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 px-6 py-3 rounded-full mb-8 border border-yellow-500/30"
                    >
                      <motion.div
                        animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                        transition={{
                          rotate: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                          scale: { duration: 1, repeat: Number.POSITIVE_INFINITY },
                        }}
                      >
                        <Star className="h-7 w-7 text-yellow-400" fill="currentColor" />
                      </motion.div>
                      <span className="text-yellow-400 font-bold text-2xl">+{badge.points || 0} Punkte</span>
                      <motion.div
                        animate={{ rotate: -360, scale: [1, 1.2, 1] }}
                        transition={{
                          rotate: { duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" },
                          scale: { duration: 1, repeat: Number.POSITIVE_INFINITY, delay: 0.5 },
                        }}
                      >
                        <Star className="h-7 w-7 text-yellow-400" fill="currentColor" />
                      </motion.div>
                    </motion.div>

                    {/* Action button */}
                    <motion.div
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                          onClick={handleClose}
                          className={`w-full bg-gradient-to-r ${rarity.gradient} hover:opacity-90 text-white font-bold py-4 text-lg rounded-xl shadow-xl transition-all`}
                          style={{ boxShadow: `0 8px 30px ${badge.color}40` }}
                        >
                          <Sparkles className="h-5 w-5 mr-2" />
                          Grossartig!
                          <Sparkles className="h-5 w-5 ml-2" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook to manage badge popup state globally
export function useBadgePopup() {
  const [badge, setBadge] = useState<BadgeData | null>(null)

  const showBadge = useCallback((badgeData: BadgeData) => {
    setBadge(badgeData)
  }, [])

  const hideBadge = useCallback(() => {
    setBadge(null)
  }, [])

  return { badge, showBadge, hideBadge }
}
