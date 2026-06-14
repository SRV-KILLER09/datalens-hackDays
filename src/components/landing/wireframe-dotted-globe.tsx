"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"

export default function RotatingEarth({
  width = 800,
  height = 800,
  isDark = true,
}: {
  width?: number
  height?: number
  isDark?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    context.scale(dpr, dpr)

    const projection = d3.geoOrthographic()
      .scale(width / 2.2)
      .translate([width / 2, height / 2])
      .clipAngle(90)

    const dots: { lng: number; lat: number }[] = []
    for (let lat = -90; lat <= 90; lat += 4) {
      const step = 4 / Math.cos((lat * Math.PI) / 180) || 4
      for (let lng = -180; lng <= 180; lng += step) {
        dots.push({ lng, lat })
      }
    }

    let rotation: [number, number] = [0, -15]
    const strokeColor = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)"
    const dotBase = isDark ? "255, 255, 255" : "0, 0, 0"

    const render = () => {
      context.clearRect(0, 0, width, height)

      const currRot = projection.rotate()

      context.beginPath()
      context.arc(width / 2, height / 2, projection.scale(), 0, 2 * Math.PI)
      context.strokeStyle = strokeColor
      context.lineWidth = 1
      context.stroke()

      dots.forEach(dot => {
        const distance = d3.geoDistance([dot.lng, dot.lat], [-currRot[0], -currRot[1]])

        if (distance < Math.PI / 2) {
          const p = projection([dot.lng, dot.lat])
          if (p) {
            const opacity = Math.max(0, (isDark ? 0.6 : 0.35) * (1 - distance / (Math.PI / 2)))
            context.beginPath()
            context.arc(p[0], p[1], 0.8, 0, 2 * Math.PI)
            context.fillStyle = `rgba(${dotBase}, ${opacity})`
            context.fill()
          }
        }
      })
    }

    const timer = d3.timer(() => {
      rotation[0] += 0.3
      projection.rotate(rotation)
      render()
    })

    return () => timer.stop()
  }, [width, height, isDark])

  return <canvas ref={canvasRef} className="opacity-60" />
}
