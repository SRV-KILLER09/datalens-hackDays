"use client"

import { useEffect, useRef } from "react"
import * as d3 from "d3"

export default function RotatingEarth({ width = 800, height = 800 }: { width?: number; height?: number }) {
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

    // Mathematically generate dots (no external fetch needed)
    const dots: { lng: number; lat: number }[] = []
    for (let lat = -90; lat <= 90; lat += 4) {
      // Adjust density based on latitude to keep dots evenly spaced
      const step = 4 / Math.cos((lat * Math.PI) / 180) || 4
      for (let lng = -180; lng <= 180; lng += step) {
        dots.push({ lng, lat })
      }
    }

    let rotation: [number, number] = [0, -15]

    const render = () => {
      context.clearRect(0, 0, width, height)
      
      const currRot = projection.rotate()
      
      // Globe Boundary
      context.beginPath()
      context.arc(width / 2, height / 2, projection.scale(), 0, 2 * Math.PI)
      context.strokeStyle = "rgba(255, 255, 255, 0.1)"
      context.lineWidth = 1
      context.stroke()

      // Draw Grid Dots
      dots.forEach(dot => {
        const distance = d3.geoDistance([dot.lng, dot.lat], [-currRot[0], -currRot[1]])
        
        // Only draw dots on the front half
        if (distance < Math.PI / 2) {
          const p = projection([dot.lng, dot.lat])
          if (p) {
            // Fade dots at the edges for a spherical 3D effect
            const opacity = Math.max(0, 0.6 * (1 - distance / (Math.PI / 2)))
            context.beginPath()
            context.arc(p[0], p[1], 0.8, 0, 2 * Math.PI)
            context.fillStyle = `rgba(255, 255, 255, ${opacity})`
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
  }, [width, height])

  return <canvas ref={canvasRef} className="opacity-60" />
}