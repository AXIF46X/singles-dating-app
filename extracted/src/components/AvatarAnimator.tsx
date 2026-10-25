"use client";

import { useEffect, useRef } from "react";

export default function AvatarAnimator({
  photoUrl,
  name,
  talking = false,
  className = "",
}: {
  photoUrl: string;
  name: string;
  talking?: boolean;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = photoUrl;

    let raf = 0;
    let phase = 0;

    const draw = () => {
      phase += 0.035;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // ambient gradient
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#fb7185");
      grad.addColorStop(1, "#a21caf");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      if (img.complete && img.naturalHeight !== 0) {
        const baseSize = w * 0.56;
        const pulse = Math.sin(phase) * (talking ? 4 : 1.6);
        const size = baseSize + pulse;
        const cx = w / 2;
        const cy = h / 2 - 8;

        // soft glow ring
        ctx.beginPath();
        ctx.arc(cx, cy, size / 2 + 6 + pulse, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.25)";
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
        ctx.clip();
        const scale = size / Math.max(img.width, img.height);
        const dw = img.width * scale * (talking ? 1.02 : 1);
        const dh = img.height * scale * (talking ? 1.02 : 1);
        ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(cx, cy, size / 2, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, [photoUrl, name, talking]);

  return <canvas ref={canvasRef} width={420} height={420} className={className} />;
}
